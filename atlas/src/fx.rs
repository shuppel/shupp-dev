//! Interaction feedback: when the player is close enough to use something,
//! the console lights up white with sparks rising off it, and a thought cloud
//! pops in above it (or above the crew member) with three bouncing dots.
//!
//! The glow sprites are built from the scene art by `atlas/tools/make_fx.py`.

use bevy::prelude::*;
use bevy::sprite::Anchor;

use crate::{to_world, Action, Game, Mode, Player, SceneId, SceneEntity};

/// Console boxes in scene pixels (x0, y0, x1, y1). Keep in sync with make_fx.py.
const GLOWS: [(&str, [f32; 4]); 5] = [
    ("fx/glow_star_console.png", [506.0, 116.0, 592.0, 162.0]),
    ("fx/glow_workbench.png", [292.0, 250.0, 348.0, 298.0]),
    ("fx/glow_records.png", [254.0, 70.0, 388.0, 142.0]),
    ("fx/glow_treehouse_door.png", [170.0, 84.0, 212.0, 136.0]),
    ("fx/glow_engine_door.png", [7.0, 85.0, 54.0, 239.0]),
];

/// Where the cloud's tail tip sits in its 40 × 34 image.
const TIP: Vec2 = Vec2::new(4.0, 33.0);

pub struct FxPlugin;

impl Plugin for FxPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<FxState>().add_systems(Startup, setup);
    }
}

#[derive(Resource)]
pub(crate) struct FxArt {
    glows: [Handle<Image>; 5],
    spark: Handle<Image>,
    ring: Handle<Image>,
}

/// A soft gold ring on the floor at something you can use, breathing so the
/// room shows what's interactive before you walk up to it.
#[derive(Component)]
pub(crate) struct Marker {
    idx: usize,
    phase: f32,
}

/// The ring: an ellipse outline with a soft falloff, white so it can be tinted.
fn ring_image() -> Image {
    use bevy::asset::RenderAssetUsages;
    use bevy::render::render_resource::{Extent3d, TextureDimension, TextureFormat};
    let (w, h) = (64u32, 24u32);
    let mut img = Image::new_fill(Extent3d { width: w, height: h, depth_or_array_layers: 1 }, TextureDimension::D2, &[0, 0, 0, 0], TextureFormat::Rgba8UnormSrgb, RenderAssetUsages::default());
    for y in 0..h {
        for x in 0..w {
            let d = Vec2::new((x as f32 + 0.5 - w as f32 / 2.0) / (w as f32 / 2.0), (y as f32 + 0.5 - h as f32 / 2.0) / (h as f32 / 2.0)).length();
            let rim = (1.0 - ((d - 0.78).abs() / 0.16)).clamp(0.0, 1.0);
            let fill = (1.0 - d).clamp(0.0, 1.0) * 0.35;
            let a = rim.max(fill);
            if a > 0.0 {
                let _ = img.set_color_at(x, y, Color::srgba(1.0, 1.0, 1.0, a));
            }
        }
    }
    img
}

/// Keep a ring under every interaction point in the room, pulsing; the one
/// Erikk is standing at glows brighter.
pub(crate) fn markers(
    mut commands: Commands,
    time: Res<Time>,
    game: Res<Game>,
    art: Res<FxArt>,
    mut st: ResMut<FxState>,
    mut q: Query<(&Marker, &mut Sprite, &mut Transform, &mut Visibility)>,
) {
    let def = crate::scene_def(game.scene);
    if q.is_empty() || st.marker_scene != Some(game.scene) {
        st.marker_scene = Some(game.scene);
        if q.is_empty() {
            for (i, pt) in def.points.iter().enumerate() {
                commands.spawn((
                    SceneEntity,
                    Marker { idx: i, phase: i as f32 * 1.3 },
                    Sprite { image: art.ring.clone(), custom_size: Some(Vec2::new(30.0, 11.0)), color: Color::NONE, ..default() },
                    Transform::from_translation(to_world(pt.pos + Vec2::new(0.0, 2.0)).extend(0.25)),
                ));
            }
        }
        return;
    }
    let t = time.elapsed_secs();
    let explore = game.mode == Mode::Explore && !game.paused;
    for (m, mut sprite, mut tf, mut vis) in &mut q {
        let Some(pt) = def.points.get(m.idx) else { continue };
        let on_deck = pt.deck == crate::Deck::Any || game.deck == crate::Deck::Any || pt.deck == game.deck;
        *vis = if on_deck && explore { Visibility::Visible } else { Visibility::Hidden };
        let near = game.nearby.is_some_and(|n| n.pos == pt.pos);
        let wave = 0.5 + 0.5 * (t * 2.6 + m.phase).sin();
        let (a, k) = if near { (0.95, 1.18 + 0.06 * wave) } else { (0.28 + 0.32 * wave, 0.92 + 0.12 * wave) };
        sprite.color = Color::srgba(1.0, 0.84, 0.45, a);
        tf.scale = Vec3::new(k, k, 1.0);
    }
}

#[derive(Resource, Default)]
pub(crate) struct FxState {
    key: Option<(SceneId, Vec2)>,
    t: f32,
    spark_clock: f32,
    marker_scene: Option<SceneId>,
    seed: u32,
}

impl FxState {
    fn rand(&mut self) -> f32 {
        self.seed = self.seed.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
        (self.seed >> 8) as f32 / (1u32 << 24) as f32
    }
}

#[derive(Component)]
pub(crate) struct Glow;
#[derive(Component)]
pub(crate) struct Cloud;
#[derive(Component)]
pub(crate) struct Dot(usize);
#[derive(Component)]
pub(crate) struct Spark {
    age: f32,
    life: f32,
    base: Vec2,
}

fn setup(mut commands: Commands, assets: Res<AssetServer>, mut images: ResMut<Assets<Image>>) {
    let art = FxArt {
        glows: GLOWS.map(|(path, _)| crate::load_t(&assets, path)),
        spark: crate::load_t(&assets, "fx/spark.png"),
        ring: images.add(ring_image()),
    };
    commands.spawn((Glow, Sprite::from_image(art.glows[0].clone()), Transform::from_xyz(0.0, 0.0, 0.3), Visibility::Hidden));
    commands
        .spawn((
            Cloud,
            Sprite::from_image(crate::load_t(&assets, "fx/cloud.png")),
            Anchor(Vec2::new(TIP.x / 40.0 - 0.5, 0.5 - TIP.y / 34.0)),
            Transform::from_xyz(0.0, 0.0, 9.0),
            Visibility::Hidden,
        ))
        .with_children(|c| {
            for i in 0..3 {
                c.spawn((Dot(i), Sprite::from_image(crate::load_t(&assets, "fx/dot.png")), Transform::from_xyz(0.0, 0.0, 0.1)));
            }
        });
    commands.insert_resource(art);
}

/// The doorway glow that pulses in a room while nothing is in reach.
fn idle_glow(scene: SceneId) -> Option<usize> {
    match scene {
        SceneId::Bridge => Some(3),
        SceneId::Engine => Some(4),
        _ => None,
    }
}

/// Which glow (if any) belongs to this point, and the console box.
fn glow_for(scene: SceneId, action: Action) -> Option<(usize, [f32; 4])> {
    let i = match (scene, action) {
        (SceneId::Bridge, Action::OpenAtlas) => 0,
        (SceneId::Port, Action::Terminal(_)) => 1,
        (SceneId::Archive, Action::Terminal(_)) => 2,
        (SceneId::Bridge, Action::Goto(SceneId::Quarters)) => 3,
        (SceneId::Engine, Action::Goto(SceneId::Bridge)) => 4,
        _ => return None,
    };
    Some((i, GLOWS[i].1))
}

/// Where the thought cloud's tail points for this interaction, in scene
/// pixels. `None` for doors, whose cloud follows the player instead.
pub(crate) fn cloud_tip(scene: SceneId, pt: &crate::Point) -> Option<Vec2> {
    match (glow_for(scene, pt.action), pt.action) {
        (Some((_, b)), _) => Some(Vec2::new((b[0] + b[2]) / 2.0 + 4.0, b[1] - 2.0)),
        (None, Action::Talk(_)) => Some(pt.pos + Vec2::new(6.0, -60.0)),
        _ => None,
    }
}

fn ease_out_back(u: f32) -> f32 {
    let u = u.clamp(0.0, 1.0) - 1.0;
    1.0 + 2.70158 * u * u * u + 1.70158 * u * u
}

#[allow(clippy::type_complexity, clippy::too_many_arguments)]
pub(crate) fn animate(
    mut commands: Commands,
    time: Res<Time>,
    game: Res<Game>,
    art: Res<FxArt>,
    mut st: ResMut<FxState>,
    player: Single<&Player>,
    mut glow: Single<(&mut Sprite, &mut Transform, &mut Visibility), (With<Glow>, Without<Cloud>, Without<Dot>, Without<Spark>)>,
    mut cloud: Single<(&mut Transform, &mut Visibility), (With<Cloud>, Without<Glow>, Without<Dot>, Without<Spark>)>,
    mut dots: Query<(&Dot, &mut Transform), (Without<Glow>, Without<Cloud>, Without<Spark>)>,
    mut sparks: Query<(Entity, &mut Spark, &mut Transform, &mut Sprite), (Without<Glow>, Without<Cloud>, Without<Dot>)>,
) {
    let dt = time.delta_secs().min(0.1);
    let near = game.nearby.filter(|_| game.mode == Mode::Explore && !game.paused);
    let key = near.map(|p| (game.scene, p.pos));
    if key != st.key {
        st.key = key;
        st.t = 0.0;
    }
    st.t += dt;
    let t = st.t;

    // Console glow: fade in, then a slow pulse.
    let lit = near.and_then(|p| glow_for(game.scene, p.action));
    let (gs, gt, gv) = &mut *glow;
    if let Some((i, b)) = lit {
        if gs.image != art.glows[i] {
            gs.image = art.glows[i].clone();
        }
        let c = Vec2::new((b[0] + b[2]) / 2.0, (b[1] + b[3]) / 2.0);
        // The workbench is a standing prop, so its halo sits just behind it;
        // the other consoles are painted into the backdrop.
        let z = if game.scene == SceneId::Port { 1.0 + b[3] / 1000.0 - 0.001 } else { 0.3 };
        gt.translation = to_world(c).round().extend(z);
        let a = (t / 0.2).min(1.0) * (0.8 + 0.2 * (t * 4.0).sin());
        gs.color = Color::srgba(1.0, 1.0, 1.0, a);
        **gv = Visibility::Visible;

        st.spark_clock += dt;
        while st.spark_clock > 0.09 {
            st.spark_clock -= 0.09;
            let x = b[0] + 6.0 + st.rand() * (b[2] - b[0] - 12.0);
            let y = b[1] + (b[3] - b[1]) * (0.3 + 0.5 * st.rand());
            let life = 0.7 + 0.5 * st.rand();
            commands.spawn((
                SceneEntity,
                Spark { age: 0.0, life, base: Vec2::new(x, y) },
                Sprite { image: art.spark.clone(), color: Color::srgba(1.0, 1.0, 1.0, 0.0), ..default() },
                Transform::from_translation(to_world(Vec2::new(x, y)).extend(0.35)),
            ));
        }
    } else if let Some(i) = idle_glow(game.scene).filter(|_| game.mode == Mode::Explore) {
        // Doorways breathe softly even from across the room, so the way out reads.
        let b = GLOWS[i].1;
        if gs.image != art.glows[i] {
            gs.image = art.glows[i].clone();
        }
        gt.translation = to_world(Vec2::new((b[0] + b[2]) / 2.0, (b[1] + b[3]) / 2.0)).round().extend(0.3);
        let a = 0.35 + 0.25 * (time.elapsed_secs() * 2.4).sin();
        gs.color = Color::srgba(1.0, 1.0, 1.0, a);
        **gv = Visibility::Visible;
        st.spark_clock = 0.0;
    } else {
        **gv = Visibility::Hidden;
        st.spark_clock = 0.0;
    }
    for (e, mut s, mut tf, mut sprite) in &mut sparks {
        s.age += dt;
        if s.age >= s.life || lit.is_none() {
            commands.entity(e).despawn();
            continue;
        }
        let k = s.age / s.life;
        let p = s.base + Vec2::new((s.age * 7.0 + s.base.x).sin() * 1.5, -22.0 * s.age);
        tf.translation = to_world(p).round().extend(0.35);
        tf.scale = Vec3::splat(if k < 0.5 { 1.0 } else { 0.6 });
        sprite.color = Color::srgba(1.0, 1.0, 1.0, (1.0 - k) * (k * 6.0).min(1.0));
    }

    // Thought cloud: pops in with an overshoot, then floats.
    let (ct, cv) = &mut *cloud;
    let Some(pt) = near else {
        **cv = Visibility::Hidden;
        return;
    };
    let k = crate::actor_scale(game.scene, player.foot.y);
    let tip = cloud_tip(game.scene, &pt).unwrap_or(player.foot + Vec2::new(6.0, -62.0) * k);
    let bob = ((t * 2.6).sin() * 1.5).round();
    ct.translation = (to_world(tip) + Vec2::new(0.0, bob)).round().extend(9.0);
    ct.scale = Vec3::splat(ease_out_back(t / 0.28).max(0.01));
    **cv = Visibility::Visible;
    for (d, mut tf) in &mut dots {
        let phase = t * 7.0 - d.0 as f32 * 0.8;
        let hop = if t > 0.25 { (phase.sin().max(0.0) * 2.5).round() } else { 0.0 };
        tf.translation = Vec3::new(10.0 + 6.0 * d.0 as f32, 20.0 + hop, 0.1);
    }
}
