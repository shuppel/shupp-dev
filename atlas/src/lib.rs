//! The Scattered Atlas: the walkable ship that sits behind shupp.dev's atlas.
//!
//! The HTML shell owns every piece of content (destination list, panels,
//! character sheet). This crate only renders the ship deck, lets the player
//! walk to a station, and tells the shell which station they used. The shell
//! talks back through `travel` and `set_input_enabled`.

use bevy::camera::ScalingMode;
use bevy::prelude::*;
use bevy::window::PrimaryWindow;

mod bridge;
pub use bridge::*;

// Brand palette from design-spec/shupp.spec.json.
const PLUM: Color = Color::srgb(0.078, 0.031, 0.055); // #14080E
const SLATE: Color = Color::srgb(0.286, 0.278, 0.357); // #49475B
const SAGE: Color = Color::srgb(0.475, 0.580, 0.588); // #799496
const OLIVE: Color = Color::srgb(0.675, 0.757, 0.588); // #ACC196
const CITRON: Color = Color::srgb(0.914, 0.922, 0.620); // #E9EB9E

const DECK_W: f32 = 880.0;
const DECK_H: f32 = 500.0;
const PLAYER_SPEED: f32 = 260.0;
const PLAYER_RADIUS: f32 = 16.0;
const REACH: f32 = 78.0;

/// A place on the deck the player can use. `id` is what the shell receives.
#[derive(Component, Clone, Copy)]
struct Station {
    id: &'static str,
    label: &'static str,
}

const STATIONS: [(Station, Vec2); 4] = [
    (Station { id: "chart", label: "Star Chart" }, Vec2::new(0.0, 165.0)),
    (Station { id: "sheet", label: "Mirror" }, Vec2::new(-310.0, -40.0)),
    (Station { id: "comms", label: "Comms" }, Vec2::new(310.0, -40.0)),
    (Station { id: "hatch", label: "Dockyard Hatch" }, Vec2::new(0.0, -195.0)),
];

#[derive(Component)]
struct Player {
    target: Option<Vec2>,
    facing: Vec2,
    /// Set when the visitor tapped a station: use it on arrival.
    use_on_arrival: Option<&'static str>,
}

#[derive(Component)]
struct Facing;

#[derive(Component)]
struct Prompt;

#[derive(Component)]
struct Star {
    speed: f32,
}

#[derive(Resource, Default)]
struct Nearby(Option<Station>);

#[derive(Resource)]
struct InputEnabled(bool);

/// Seconds left on the warp streak that plays when the visitor travels.
#[derive(Resource, Default)]
struct Warp(f32);

pub fn app(canvas: Option<String>) -> App {
    let mut app = App::new();
    app.add_plugins(DefaultPlugins.set(WindowPlugin {
        primary_window: Some(Window {
            title: "The Scattered Atlas".into(),
            canvas,
            fit_canvas_to_parent: true,
            // Let the page keep scrolling and keyboard shortcuts.
            prevent_default_event_handling: false,
            ..default()
        }),
        ..default()
    }))
    .insert_resource(ClearColor(PLUM))
    .insert_resource(InputEnabled(true))
    .init_resource::<Nearby>()
    .init_resource::<Warp>()
    .add_systems(Startup, setup)
    .add_systems(
        Update,
        (
            read_shell,
            (keyboard_move, pointer_target, follow_target)
                .chain()
                .run_if(|e: Res<InputEnabled>| e.0),
            detect_nearby,
            use_station.run_if(|e: Res<InputEnabled>| e.0),
            drift_stars,
            draw_deck,
        )
            .chain(),
    );
    app
}

fn setup(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<ColorMaterial>>,
) {
    commands.spawn((
        Camera2d,
        Projection::Orthographic(OrthographicProjection {
            scaling_mode: ScalingMode::AutoMin { min_width: DECK_W + 80.0, min_height: DECK_H + 80.0 },
            ..OrthographicProjection::default_2d()
        }),
    ));

    // Starfield behind the hull. A tiny LCG keeps it deterministic without a rand dependency.
    let star = meshes.add(Circle::new(1.4));
    let star_mat = materials.add(CITRON.with_alpha(0.55));
    let mut seed: u32 = 0x5eed_a71a;
    let mut next = || {
        seed = seed.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
        (seed >> 8) as f32 / (1u32 << 24) as f32
    };
    for _ in 0..140 {
        let pos = Vec3::new((next() - 0.5) * 2400.0, (next() - 0.5) * 1400.0, -10.0);
        let scale = 0.5 + next() * 1.3;
        commands.spawn((
            Mesh2d(star.clone()),
            MeshMaterial2d(star_mat.clone()),
            Transform::from_translation(pos).with_scale(Vec3::splat(scale)),
            Star { speed: 6.0 + next() * 18.0 },
        ));
    }

    // Hull.
    commands.spawn((
        Mesh2d(meshes.add(Rectangle::new(DECK_W + 24.0, DECK_H + 24.0))),
        MeshMaterial2d(materials.add(SLATE)),
        Transform::from_xyz(0.0, 0.0, -2.0),
    ));
    commands.spawn((
        Mesh2d(meshes.add(Rectangle::new(DECK_W, DECK_H))),
        MeshMaterial2d(materials.add(Color::srgb(0.12, 0.07, 0.10))),
        Transform::from_xyz(0.0, 0.0, -1.0),
    ));

    let font = TextFont { font_size: FontSize::Px(15.0), ..default() };
    let pad = meshes.add(Circle::new(30.0));
    let core = meshes.add(Circle::new(14.0));
    for (station, pos) in STATIONS {
        commands.spawn((
            station,
            Mesh2d(pad.clone()),
            MeshMaterial2d(materials.add(SAGE.with_alpha(0.35))),
            Transform::from_translation(pos.extend(0.0)),
            children![
                (
                    Mesh2d(core.clone()),
                    MeshMaterial2d(materials.add(OLIVE)),
                    Transform::from_xyz(0.0, 0.0, 0.1),
                ),
                (
                    Text2d::new(station.label.to_uppercase()),
                    font.clone(),
                    TextColor(SAGE),
                    Transform::from_xyz(0.0, -48.0, 0.2),
                ),
            ],
        ));
    }

    commands.spawn((
        Player { target: None, facing: Vec2::Y, use_on_arrival: None },
        Mesh2d(meshes.add(Circle::new(PLAYER_RADIUS))),
        MeshMaterial2d(materials.add(OLIVE)),
        Transform::from_xyz(0.0, 0.0, 1.0),
        children![(
            Facing,
            Mesh2d(meshes.add(Circle::new(5.0))),
            MeshMaterial2d(materials.add(CITRON)),
            Transform::from_xyz(0.0, 9.0, 0.1),
        )],
    ));

    commands.spawn((
        Prompt,
        Text2d::new(""),
        TextFont { font_size: FontSize::Px(17.0), ..default() },
        TextColor(CITRON),
        Transform::from_xyz(0.0, DECK_H / 2.0 - 26.0, 5.0),
    ));
}

fn keyboard_move(
    keys: Res<ButtonInput<KeyCode>>,
    time: Res<Time>,
    mut player: Single<(&mut Player, &mut Transform)>,
) {
    let mut dir = Vec2::ZERO;
    if keys.any_pressed([KeyCode::KeyW, KeyCode::ArrowUp]) {
        dir.y += 1.0;
    }
    if keys.any_pressed([KeyCode::KeyS, KeyCode::ArrowDown]) {
        dir.y -= 1.0;
    }
    if keys.any_pressed([KeyCode::KeyA, KeyCode::ArrowLeft]) {
        dir.x -= 1.0;
    }
    if keys.any_pressed([KeyCode::KeyD, KeyCode::ArrowRight]) {
        dir.x += 1.0;
    }
    if dir == Vec2::ZERO {
        return;
    }
    let (ref mut p, ref mut tf) = *player;
    p.target = None;
    p.use_on_arrival = None;
    p.facing = dir.normalize();
    let step = p.facing * PLAYER_SPEED * time.delta_secs();
    tf.translation = clamp_to_deck(tf.translation.truncate() + step).extend(tf.translation.z);
}

/// Click or tap somewhere on the deck to walk there. Tapping a station walks to it and uses it.
fn pointer_target(
    mouse: Res<ButtonInput<MouseButton>>,
    touches: Res<Touches>,
    window: Single<&Window, With<PrimaryWindow>>,
    camera: Single<(&Camera, &GlobalTransform)>,
    stations: Query<(&Station, &Transform)>,
    mut player: Single<(&mut Player, &Transform), Without<Station>>,
) {
    let screen = if mouse.just_pressed(MouseButton::Left) {
        window.cursor_position()
    } else {
        touches.iter_just_pressed().next().map(|t| t.position())
    };
    let Some(screen) = screen else { return };
    let (cam, cam_tf) = *camera;
    let Ok(world) = cam.viewport_to_world_2d(cam_tf, screen) else { return };
    let (ref mut p, tf) = *player;
    let here = tf.translation.truncate();
    let hit = stations.iter().find(|(_, t)| t.translation.truncate().distance(world) < 40.0);
    if let Some((station, t)) = hit {
        // Stop just short of the pad, on the side the player is coming from.
        let pad = t.translation.truncate();
        let stand = pad + (here - pad).normalize_or(Vec2::NEG_Y) * (REACH * 0.6);
        p.target = Some(clamp_to_deck(stand));
        p.use_on_arrival = Some(station.id);
    } else {
        p.target = Some(clamp_to_deck(world));
        p.use_on_arrival = None;
    }
}

fn follow_target(time: Res<Time>, mut player: Single<(&mut Player, &mut Transform)>) {
    let (ref mut p, ref mut tf) = *player;
    let Some(target) = p.target else { return };
    let here = tf.translation.truncate();
    let to = target - here;
    let step = PLAYER_SPEED * time.delta_secs();
    if to.length() <= step {
        tf.translation = target.extend(tf.translation.z);
        p.target = None;
        if let Some(id) = p.use_on_arrival.take() {
            bridge::emit("station", id);
        }
    } else {
        p.facing = to.normalize();
        tf.translation += (p.facing * step).extend(0.0);
    }
}

fn detect_nearby(
    player: Single<(&Player, &Transform), Without<Facing>>,
    mut facing: Single<&mut Transform, With<Facing>>,
    stations: Query<(&Station, &Transform), (Without<Player>, Without<Facing>)>,
    mut nearby: ResMut<Nearby>,
    mut prompt: Single<&mut Text2d, With<Prompt>>,
) {
    let (p, tf) = *player;
    facing.translation = (p.facing * 9.0).extend(0.1);
    let here = tf.translation.truncate();
    let found = stations
        .iter()
        .map(|(s, t)| (*s, t.translation.truncate().distance(here)))
        .filter(|(_, d)| *d < REACH)
        .min_by(|a, b| a.1.total_cmp(&b.1))
        .map(|(s, _)| s);
    let changed = found.map(|s| s.id) != nearby.0.map(|s| s.id);
    if changed {
        prompt.0 = match found {
            Some(s) => format!("Press E or tap to use the {}", s.label),
            None => String::new(),
        };
        bridge::emit("nearby", found.map(|s| s.id).unwrap_or(""));
    }
    nearby.0 = found;
}

fn use_station(keys: Res<ButtonInput<KeyCode>>, nearby: Res<Nearby>) {
    let Some(station) = nearby.0 else { return };
    if keys.any_just_pressed([KeyCode::KeyE, KeyCode::Enter, KeyCode::Space]) {
        bridge::emit("station", station.id);
    }
}

fn read_shell(mut enabled: ResMut<InputEnabled>, mut warp: ResMut<Warp>) {
    for msg in bridge::drain() {
        match msg {
            bridge::Inbound::Input(on) => enabled.0 = on,
            bridge::Inbound::Travel(_) => warp.0 = 1.2,
        }
    }
}

fn drift_stars(time: Res<Time>, mut warp: ResMut<Warp>, mut stars: Query<(&Star, &mut Transform)>) {
    let dt = time.delta_secs();
    warp.0 = (warp.0 - dt).max(0.0);
    let boost = 1.0 + warp.0 * 40.0;
    for (star, mut tf) in &mut stars {
        tf.translation.x -= star.speed * boost * dt;
        if tf.translation.x < -1200.0 {
            tf.translation.x += 2400.0;
        }
        tf.scale.x = tf.scale.y * (1.0 + warp.0 * 12.0);
    }
}

fn draw_deck(mut gizmos: Gizmos, nearby: Res<Nearby>, stations: Query<(&Station, &Transform)>, time: Res<Time>) {
    let grid = SAGE.with_alpha(0.05);
    let mut x = -DECK_W / 2.0 + 40.0;
    while x < DECK_W / 2.0 {
        gizmos.line_2d(Vec2::new(x, -DECK_H / 2.0), Vec2::new(x, DECK_H / 2.0), grid);
        x += 40.0;
    }
    let mut y = -DECK_H / 2.0 + 40.0;
    while y < DECK_H / 2.0 {
        gizmos.line_2d(Vec2::new(-DECK_W / 2.0, y), Vec2::new(DECK_W / 2.0, y), grid);
        y += 40.0;
    }
    if let Some(near) = nearby.0 {
        for (s, tf) in &stations {
            if s.id == near.id {
                let pulse = 36.0 + (time.elapsed_secs() * 4.0).sin() * 3.0;
                gizmos.circle_2d(tf.translation.truncate(), pulse, CITRON);
            }
        }
    }
}

fn clamp_to_deck(p: Vec2) -> Vec2 {
    let half = Vec2::new(DECK_W, DECK_H) / 2.0 - Vec2::splat(PLAYER_RADIUS + 4.0);
    p.clamp(-half, half)
}
