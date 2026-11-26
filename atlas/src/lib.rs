//! The Scattered Atlas: shupp.dev as a sprite game.
//!
//! Three walkable scenes from the art pack (Bridge, Dockyard, Archive), an
//! atlas map for travel, NPC dialogue with talking portraits, in-game
//! terminals that open the real site pages, and a character sheet.
//!
//! Coordinates: every scene is a 640 × 360 painting. Game logic works in
//! "scene pixels" (top-left origin, y down, as in the art pack's JSON) and
//! converts to world space only when placing sprites.

use bevy::asset::AssetMetaCheck;
use bevy::camera::ScalingMode;
use bevy::image::{CompressedImageFormats, ImageLoaderSettings, ImageSampler, ImageType};
use bevy::asset::RenderAssetUsages;
use bevy::prelude::*;
use bevy::sprite::Anchor;
use bevy::window::PrimaryWindow;

mod bridge;
mod content;
mod fx;
mod ui;

pub use bridge::*;
pub use content::Registry;

pub const VW: f32 = 640.0;
pub const VH: f32 = 360.0;

const SPEED: f32 = 96.0; // scene px per second
const RUN: f32 = 1.85; // run speed multiplier
const RUN_TAP: f32 = 170.0; // taps farther than this run
const REACH: f32 = 26.0; // interaction radius, a little over the art pack's 22 for touch

pub fn to_world(p: Vec2) -> Vec2 {
    Vec2::new(p.x - VW / 2.0, VH / 2.0 - p.y)
}

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum SceneId {
    Bridge,
    Port,
    Archive,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Npc {
    Technician,
    Archivist,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Action {
    OpenAtlas,
    Goto(SceneId),
    Talk(Npc),
    Terminal(&'static str),
    /// Ride the dockyard crane lift to the other deck.
    Lift,
}

/// Which deck of a two-level room a point or the player is on.
#[derive(Clone, Copy, PartialEq, Eq, Debug, Default)]
pub enum Deck {
    #[default]
    Any,
    Lower,
    Upper,
}

#[derive(Clone, Copy)]
pub struct Point {
    pub pos: Vec2,
    pub label: &'static str,
    pub action: Action,
    pub deck: Deck,
}

pub struct SceneDef {
    pub name: &'static str,
    pub label: &'static str,
    pub bg: &'static str,
    /// Foreground cutout drawn over actors standing behind it, if the room has one.
    pub fg: Option<&'static str>,
    /// The backdrop is 2× source art (1280 × 720) shown at 640 × 360.
    pub hd: bool,
    pub fg_threshold: f32,
    pub spawn: Vec2,
    pub points: &'static [Point],
    pub npc: Option<(Npc, Vec2)>,
    mask: &'static [u8],
}

const fn p(x: f32, y: f32) -> Vec2 {
    Vec2::new(x, y)
}

// Crane lift sockets from the art pack's elevator.json (logical pixels).
const LIFT_LOWER: Vec2 = p(171.0, 298.0);
const LIFT_UPPER: Vec2 = p(171.0, 181.0);
const LIFT_LOWER_EXIT: Vec2 = p(170.0, 308.0);
const LIFT_UPPER_EXIT: Vec2 = p(216.0, 183.0);
const LIFT_SIZE: Vec2 = p(83.0, 36.0);
const RIDER_OFFSET: Vec2 = p(0.0, 2.0);
const LIFT_TRAVEL: f32 = 2.1;
const LIFT_STEP: f32 = 0.4; // walking on or off the platform
/// Where Erikk lands when he walks down the Crescent's ramp.
const BAY_ARRIVAL: Vec2 = p(360.0, 190.0);
const CRESCENT_CENTER: Vec2 = p(420.0, 156.0);
const CRESCENT_SIZE: Vec2 = p(148.0, 82.0);

pub fn scene_def(id: SceneId) -> &'static SceneDef {
    static BRIDGE: SceneDef = SceneDef {
        name: "The Atlier",
        label: "Bridge",
        bg: "scenes/bridge.png",
        fg: Some("maps/bridge_foreground.png"),
        hd: false,
        fg_threshold: 265.0,
        spawn: p(310.0, 298.0),
        points: &[
            Point { pos: p(470.0, 180.0), label: "Star console", action: Action::OpenAtlas, deck: Deck::Any },
            Point { pos: p(250.0, 330.0), label: "Gangway to the Dockyard", action: Action::Goto(SceneId::Port), deck: Deck::Any },
        ],
        npc: None,
        mask: include_bytes!("../masks/bridge_walkable.png"),
    };
    // The glasshouse dockyard: a service deck below, the Crescent's fighter
    // bay above, and a crane lift between them (art pack elevator.json).
    static PORT: SceneDef = SceneDef {
        name: "The Dockyard",
        label: "Work",
        bg: "scenes/glasshouse.png",
        fg: None,
        hd: true,
        fg_threshold: 0.0,
        spawn: p(232.0, 312.0),
        points: &[
            Point { pos: LIFT_LOWER_EXIT, label: "Ride the lift up", action: Action::Lift, deck: Deck::Lower },
            Point { pos: p(320.0, 300.0), label: "Workbench", action: Action::Terminal("work"), deck: Deck::Lower },
            Point { pos: LIFT_UPPER_EXIT, label: "Ride the lift down", action: Action::Lift, deck: Deck::Upper },
            Point { pos: p(545.0, 174.0), label: "Talk to the technician", action: Action::Talk(Npc::Technician), deck: Deck::Upper },
            Point { pos: p(420.0, 192.0), label: "Back to the Atlier", action: Action::Goto(SceneId::Bridge), deck: Deck::Upper },
        ],
        npc: Some((Npc::Technician, p(545.0, 174.0))),
        mask: include_bytes!("../masks/glasshouse_lower.png"),
    };
    static ARCHIVE: SceneDef = SceneDef {
        name: "The Archive",
        label: "Writing",
        bg: "scenes/archive.png",
        fg: Some("maps/archive_foreground.png"),
        hd: false,
        fg_threshold: 341.0,
        spawn: p(323.0, 301.0),
        points: &[
            Point { pos: p(323.0, 151.0), label: "Records", action: Action::Terminal("writing"), deck: Deck::Any },
            Point { pos: p(385.0, 182.0), label: "Talk to Astro", action: Action::Talk(Npc::Archivist), deck: Deck::Any },
            Point { pos: p(323.0, 328.0), label: "Back to the Atlier", action: Action::Goto(SceneId::Bridge), deck: Deck::Any },
        ],
        npc: Some((Npc::Archivist, p(385.0, 182.0))),
        mask: include_bytes!("../masks/archive_walkable.png"),
    };
    match id {
        SceneId::Bridge => &BRIDGE,
        SceneId::Port => &PORT,
        SceneId::Archive => &ARCHIVE,
    }
}

/// Walkability for the current scene, decoded from the art pack's white masks.
#[derive(Resource)]
pub struct Masks {
    bridge: Vec<bool>,
    port: Vec<bool>,
    port_upper: Vec<bool>,
    archive: Vec<bool>,
}

fn decode_mask(bytes: &[u8]) -> Vec<bool> {
    let img = Image::from_buffer(
        bytes,
        ImageType::Extension("png"),
        CompressedImageFormats::NONE,
        false,
        ImageSampler::Default,
        RenderAssetUsages::MAIN_WORLD,
    )
    .expect("walk mask decodes");
    let (w, h) = (img.width(), img.height());
    let mut out = vec![false; (VW as usize) * (VH as usize)];
    for y in 0..h.min(VH as u32) {
        for x in 0..w.min(VW as u32) {
            if let Ok(c) = img.get_color_at(x, y) {
                out[(y as usize) * (VW as usize) + x as usize] = c.to_srgba().red > 0.5;
            }
        }
    }
    out
}

impl Masks {
    fn new() -> Self {
        Self {
            bridge: decode_mask(scene_def(SceneId::Bridge).mask),
            port: decode_mask(scene_def(SceneId::Port).mask),
            port_upper: {
                // The parked Crescent is solid: carve its hull out of the bay floor.
                let mut m = decode_mask(include_bytes!("../masks/glasshouse_upper.png"));
                for y in 0..VH as usize {
                    for x in 0..VW as usize {
                        let d = (Vec2::new(x as f32, y as f32) - (CRESCENT_CENTER + Vec2::new(0.0, 2.0))) / Vec2::new(72.0, 28.0);
                        if d.length_squared() < 1.0 {
                            m[y * VW as usize + x] = false;
                        }
                    }
                }
                m
            },
            archive: decode_mask(scene_def(SceneId::Archive).mask),
        }
    }
    pub fn walkable(&self, scene: SceneId, deck: Deck, at: Vec2) -> bool {
        if at.x < 0.0 || at.y < 0.0 || at.x >= VW || at.y >= VH {
            return false;
        }
        let m = match scene {
            SceneId::Bridge => &self.bridge,
            SceneId::Port if deck == Deck::Upper => &self.port_upper,
            SceneId::Port => &self.port,
            SceneId::Archive => &self.archive,
        };
        m[(at.y as usize) * (VW as usize) + at.x as usize]
    }
}

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

#[derive(Clone, Copy, PartialEq, Eq, Debug, Default)]
pub enum Mode {
    #[default]
    Explore,
    Dialogue,
    Terminal,
    Atlas,
    Sheet,
    Travel,
    /// Riding the dockyard lift: input and exits are off until it stops.
    Lift,
}

#[derive(Resource)]
pub struct Game {
    pub scene: SceneId,
    /// Which deck the player is on, in rooms that have two.
    pub deck: Deck,
    pub mode: Mode,
    /// The interaction point the player is standing at, if any.
    pub nearby: Option<Point>,
    /// The visitor tapped this point: use it when the player gets there.
    pub pending: Option<Point>,
    pub visited: Vec<String>,
    /// Pause everything while the page has an overlay up.
    pub paused: bool,
    /// Something the UI should open next (set by interactions and the page).
    pub request: Option<ui::Request>,
    /// Dialogue in Manaspace instead of the sans (`?font=mana` on the page).
    pub mana_dialogue: bool,
}

impl Game {
    pub fn mark_visited(&mut self, id: &str) {
        if !self.visited.iter().any(|v| v == id) {
            self.visited.push(id.to_owned());
            bridge::emit("visited", id);
        }
    }
}

/// Startup options from the page.
#[derive(Resource, Clone, Default)]
pub struct Boot {
    pub start: String,
    /// The page's devicePixelRatio, so high-DPI screens render sharp.
    pub dpr: f32,
}

#[derive(Resource)]
pub struct Art {
    pub idle: Handle<Image>,
    pub walk: Handle<Image>,
    pub run: Handle<Image>,
    pub idle_layout: Handle<TextureAtlasLayout>,
    pub walk_layout: Handle<TextureAtlasLayout>,
    pub run_layout: Handle<TextureAtlasLayout>,
    pub pongo_walk: Handle<Image>,
    pub pongo_run: Handle<Image>,
    pub pongo_idle: Handle<Image>,
    /// Pongo's walk and run sheets: 4 frames × down, up, left, right.
    pub pongo_layout: Handle<TextureAtlasLayout>,
    /// Pongo's idle sheet: stand and sniff, sit down, lie down (facing right).
    pub pongo_idle_layout: Handle<TextureAtlasLayout>,
    pub npc_layout: Handle<TextureAtlasLayout>,
    pub technician_npc: Handle<Image>,
    pub archivist_npc: Handle<Image>,
}

#[derive(Component)]
pub struct SceneEntity;

#[derive(Component)]
struct Foreground;

#[derive(Clone, Copy, PartialEq, Eq, Default)]
enum Facing {
    #[default]
    Down,
    Up,
    Left,
    Right,
}

impl Facing {
    fn row(self) -> usize {
        match self {
            Facing::Down => 0,
            Facing::Up => 1,
            Facing::Left => 2,
            Facing::Right => 3,
        }
    }
    fn from_dir(d: Vec2) -> Self {
        if d.x.abs() > d.y.abs() {
            if d.x > 0.0 { Facing::Right } else { Facing::Left }
        } else if d.y > 0.0 {
            Facing::Down
        } else {
            Facing::Up
        }
    }
}

#[derive(Component, Default)]
pub struct Player {
    /// Foot position in scene pixels.
    pub foot: Vec2,
    pub target: Option<Vec2>,
    facing: Facing,
    walking: bool,
    /// Shift held (or a long tap): move at run speed with the run cycle.
    running: bool,
    frame: usize,
    clock: f32,
}

#[derive(Component)]
struct NpcSprite {
    foot: Vec2,
}

/// Sent to change scenes (after travel or through a door).
#[derive(Message, Clone, Copy)]
pub struct EnterScene(pub SceneId);

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

pub fn app(canvas: Option<String>, registry: Registry, boot: Boot, visited: Vec<String>) -> App {
    let mut app = App::new();
    let boot_res = boot.clone();
    let asset_root = if cfg!(target_arch = "wasm32") { "/atlas/assets" } else { "../public/atlas/assets" };
    app.add_plugins(
        DefaultPlugins
            .set(WindowPlugin {
                primary_window: Some(Window {
                    title: "The Scattered Atlas".into(),
                    canvas,
                    fit_canvas_to_parent: true,
                    prevent_default_event_handling: true,
                    ..default()
                }),
                ..default()
            })
            .set(AssetPlugin {
                file_path: asset_root.into(),
                meta_check: AssetMetaCheck::Never,
                ..default()
            })
            .set(ImagePlugin::default_nearest()),
    )
    .insert_resource(ClearColor(Color::BLACK))
    .insert_resource(registry)
    .insert_resource(boot_res)
    .insert_resource(Masks::new())
    .insert_resource(Game {
        scene: SceneId::Bridge,
        deck: Deck::Any,
        mode: Mode::Explore,
        nearby: None,
        pending: None,
        visited,
        paused: false,
        request: None,
        mana_dialogue: false,
    })
    .add_message::<EnterScene>()
    .init_resource::<PageTap>()
    .init_resource::<Ride>()
    .add_systems(Startup, setup)
    .add_systems(PreUpdate, read_page)
    .add_systems(
        Update,
        (
            enter_scene,
            (keyboard_walk, pointer_walk, follow_target)
                .chain()
                .run_if(|g: Res<Game>| g.mode == Mode::Explore && !g.paused),
            find_nearby,
            use_point.run_if(|g: Res<Game>| g.mode == Mode::Explore && !g.paused),
            ride_lift,
            animate_player,
            follow_pongo,
            depth_sort,
            fx::animate,
        )
            .chain(),
    )
    .add_plugins((ui::UiPlugin, fx::FxPlugin));
    app
}

pub(crate) fn setup(
    mut commands: Commands,
    assets: Res<AssetServer>,
    mut layouts: ResMut<Assets<TextureAtlasLayout>>,
    boot: Res<Boot>,
    mut game: ResMut<Game>,
    mut enter: MessageWriter<EnterScene>,
) {
    commands.spawn((
        Camera2d,
        Projection::Orthographic(OrthographicProjection {
            scaling_mode: ScalingMode::AutoMin { min_width: VW, min_height: VH },
            ..OrthographicProjection::default_2d()
        }),
    ));

    let art = Art {
        // HD sheets: 128 × 128 cells (2× a 64 × 64 logical cell), foot at (64, 124).
        idle: load_smooth(&assets, "player/erikk_idle.png"),
        walk: load_smooth(&assets, "player/erikk_walk.png"),
        run: load_smooth(&assets, "player/erikk_run.png"),
        run_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(128, 128), 4, 4, None, None)),
        pongo_walk: load_smooth(&assets, "cast/pongo/walk.png"),
        pongo_run: load_smooth(&assets, "cast/pongo/run.png"),
        pongo_idle: load_smooth(&assets, "cast/pongo/idle.png"),
        pongo_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(128, 96), 4, 4, None, None)),
        pongo_idle_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(128, 96), 4, 3, None, None)),
        idle_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(128, 128), 8, 4, None, None)),
        walk_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(128, 128), 6, 4, None, None)),
        npc_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(48, 64), 4, 1, None, None)),
        technician_npc: assets.load("cast/technician/npc_outlined.png"),
        archivist_npc: assets.load("cast/archivist/npc_outlined.png"),
    };

    // Erikk. The art pack's pivot is (24, 62) in a 48 × 64 cell.
    commands.spawn((
        Player::default(),
        Sprite {
            custom_size: Some(Vec2::new(64.0, 64.0)),
            ..Sprite::from_atlas_image(art.idle.clone(), TextureAtlas { layout: art.idle_layout.clone(), index: 0 })
        },
        Anchor(Vec2::new(0.0, (64.0 - 124.0) / 128.0)),
        Transform::from_xyz(0.0, 0.0, 1.0),
    ));
    // Pongo, Erikk's dog, trots after him everywhere. Foot at (64, 92) of a 128 × 96 cell.
    commands.spawn((
        Pongo::default(),
        Sprite {
            custom_size: Some(Vec2::new(64.0, 48.0)),
            ..Sprite::from_atlas_image(art.pongo_idle.clone(), TextureAtlas { layout: art.pongo_idle_layout.clone(), index: 4 })
        },
        Anchor(Vec2::new(0.0, (48.0 - 92.0) / 96.0)),
        Transform::from_xyz(0.0, 0.0, 1.0),
    ));
    commands.init_resource::<Trail>();
    commands.insert_resource(art);

    let scene = match boot.start.as_str() {
        "work" => SceneId::Port,
        "writing" => SceneId::Archive,
        _ => SceneId::Bridge,
    };
    // Starting here (not arriving from the Crescent) puts Erikk at the lower lift.
    game.scene = scene;
    enter.write(EnterScene(scene));
}

fn enter_scene(
    mut commands: Commands,
    mut msgs: MessageReader<EnterScene>,
    assets: Res<AssetServer>,
    art: Res<Art>,
    old: Query<Entity, With<SceneEntity>>,
    mut game: ResMut<Game>,
    mut player: Single<&mut Player>,
) {
    let Some(EnterScene(id)) = msgs.read().last().copied() else { return };
    for e in &old {
        commands.entity(e).despawn();
    }
    let def = scene_def(id);
    let from = game.scene;
    game.scene = id;
    game.nearby = None;
    game.pending = None;
    match id {
        SceneId::Port => game.mark_visited("work"),
        SceneId::Archive => game.mark_visited("writing"),
        SceneId::Bridge => {}
    }
    bridge::emit("scene", def.label);

    let hd = |path: &'static str| {
        // 2× art drawn at logical size: filter it so it stays smooth when scaled.
        load_smooth(&assets, path)
    };
    let bg = if def.hd {
        Sprite { image: hd(def.bg), custom_size: Some(Vec2::new(VW, VH)), ..default() }
    } else {
        Sprite::from_image(assets.load(def.bg))
    };
    commands.spawn((SceneEntity, bg, Transform::from_xyz(0.0, 0.0, 0.0)));
    if let Some(fg) = def.fg {
        commands.spawn((SceneEntity, Foreground, Sprite::from_image(assets.load(fg)), Transform::from_xyz(0.0, 0.0, 0.5)));
    }
    let mut spawn = def.spawn;
    game.deck = Deck::Any;
    if id == SceneId::Port {
        // Walking down the Crescent's ramp lands in the fighter bay; any
        // other arrival starts at the foot of the lift.
        game.deck = if from == SceneId::Bridge { Deck::Upper } else { Deck::Lower };
        if game.deck == Deck::Upper {
            spawn = BAY_ARRIVAL;
        }
        let stop = if game.deck == Deck::Upper { LIFT_UPPER } else { LIFT_LOWER };
        commands.spawn((
            SceneEntity,
            LiftPlatform,
            Sprite { image: hd("props/crane_elevator.png"), custom_size: Some(LIFT_SIZE), ..default() },
            Transform::from_translation(to_world(stop).extend(lift_z(stop))),
        ));
        let base = CRESCENT_CENTER.y + CRESCENT_SIZE.y / 2.0 - 4.0;
        commands.spawn((
            SceneEntity,
            Sprite { image: hd("ships/crescent/exterior.png"), custom_size: Some(CRESCENT_SIZE), ..default() },
            Transform::from_translation(to_world(CRESCENT_CENTER).extend(1.0 + base / 1000.0)),
        ));
    }
    if let Some((npc, foot)) = def.npc {
        let image = match npc {
            Npc::Technician => art.technician_npc.clone(),
            Npc::Archivist => art.archivist_npc.clone(),
        };
        commands.spawn((
            SceneEntity,
            NpcSprite { foot },
            Sprite::from_atlas_image(image, TextureAtlas { layout: art.npc_layout.clone(), index: 0 }),
            Anchor(Vec2::new(0.0, (32.0 - 62.0) / 64.0)),
            Transform::from_translation(to_world(foot).extend(1.0)),
        ));
    }

    player.foot = spawn;
    player.target = None;
    player.facing = if spawn == BAY_ARRIVAL { Facing::Down } else { Facing::Up };
}

/// Load 2× (or larger) source art with linear filtering, so it stays smooth
/// when drawn at its smaller logical size.
pub fn load_smooth(assets: &AssetServer, path: impl Into<bevy::asset::AssetPath<'static>>) -> Handle<Image> {
    assets
        .load_builder()
        .with_settings(|s: &mut ImageLoaderSettings| s.sampler = ImageSampler::linear())
        .load(path)
}

/// Points that belong to the deck the player is on.
pub fn points_here(game: &Game) -> impl Iterator<Item = &'static Point> + '_ {
    scene_def(game.scene).points.iter().filter(move |pt| pt.deck == Deck::Any || game.deck == Deck::Any || pt.deck == game.deck)
}

// ---------------------------------------------------------------------------
// Dockyard crane lift
// ---------------------------------------------------------------------------

#[derive(Component)]
struct LiftPlatform;

/// A lift ride in progress: step on, travel (smoothstep), step off.
#[derive(Resource, Default)]
struct Ride {
    active: bool,
    t: f32,
    from: Vec2,
    up: bool,
}

fn lift_z(center: Vec2) -> f32 {
    // Just behind whoever stands on it.
    1.0 + center.y / 1000.0
}

fn smoothstep(u: f32) -> f32 {
    let u = u.clamp(0.0, 1.0);
    u * u * (3.0 - 2.0 * u)
}

fn ride_lift(
    time: Res<Time>,
    mut game: ResMut<Game>,
    mut ride: ResMut<Ride>,
    mut player: Single<&mut Player>,
    mut platform: Query<&mut Transform, With<LiftPlatform>>,
) {
    let Ok(mut tf) = platform.single_mut() else {
        ride.active = false;
        return;
    };
    if game.mode == Mode::Lift && !ride.active {
        *ride = Ride { active: true, t: 0.0, from: player.foot, up: game.deck != Deck::Upper };
        player.target = None;
    }
    if !ride.active {
        return;
    }
    if !game.paused {
        ride.t += time.delta_secs().min(0.1);
    }
    let (start, end, exit) = if ride.up {
        (LIFT_LOWER, LIFT_UPPER, LIFT_UPPER_EXIT)
    } else {
        (LIFT_UPPER, LIFT_LOWER, LIFT_LOWER_EXIT)
    };
    let travel = ((ride.t - LIFT_STEP) / LIFT_TRAVEL).clamp(0.0, 1.0);
    let center = start.lerp(end, smoothstep(travel));
    tf.translation = to_world(center.round()).extend(lift_z(center));
    let rider = center + RIDER_OFFSET;
    let (foot, walking) = if ride.t < LIFT_STEP {
        (ride.from.lerp(rider, ride.t / LIFT_STEP), true)
    } else if ride.t < LIFT_STEP + LIFT_TRAVEL {
        (rider, false)
    } else {
        (rider.lerp(exit, ((ride.t - LIFT_STEP - LIFT_TRAVEL) / LIFT_STEP).min(1.0)), true)
    };
    let d = foot - player.foot;
    if d.length() > 0.01 && walking {
        player.facing = Facing::from_dir(d);
    }
    player.foot = foot;
    player.walking = walking;
    if ride.t >= LIFT_STEP * 2.0 + LIFT_TRAVEL {
        ride.active = false;
        game.deck = if ride.up { Deck::Upper } else { Deck::Lower };
        game.mode = Mode::Explore;
        player.walking = false;
        player.facing = if ride.up { Facing::Right } else { Facing::Down };
    }
}

/// A touch or pen tap the page caught on the canvas this frame, as a
/// fraction of the canvas size. Touch goes through the page instead of
/// winit, which drops taps on mobile browsers.
#[derive(Resource, Default)]
pub struct PageTap {
    pub at: Option<Vec2>,
    /// The last pointer the page saw was a finger or pen, not a mouse.
    pub touch: bool,
}

fn read_page(mut game: ResMut<Game>, mut tap: ResMut<PageTap>) {
    tap.at = None;
    for msg in bridge::drain() {
        match msg {
            bridge::Inbound::Tap(at, touch) => {
                tap.at = Some(at);
                tap.touch = touch;
            }
            bridge::Inbound::Paused(p) => game.paused = p,
            bridge::Inbound::DialogueFont(mana) => game.mana_dialogue = mana,
            bridge::Inbound::Go(id) => game.request = Some(ui::Request::Destination(id)),
        }
    }
}

/// Where the pointer is in scene pixels, if it was just pressed this frame.
pub fn pointer_press(
    mouse: &ButtonInput<MouseButton>,
    touches: &Touches,
    page_tap: &PageTap,
    window: &Window,
    frame: &ui::Frame,
) -> Option<Vec2> {
    // On the web every pointer (mouse, touch, pen) comes through the page,
    // which is more reliable than winit's canvas events.
    let screen = if !cfg!(target_arch = "wasm32") && mouse.just_pressed(MouseButton::Left) {
        window.cursor_position()
    } else if let Some(f) = page_tap.at {
        Some(f * Vec2::new(window.width(), window.height()))
    } else {
        // Taps fire on release, so a quick tap inside one frame still counts.
        touches.iter_just_released().next().map(|t| t.position())
    }?;
    Some(frame.to_scene(screen))
}

fn keyboard_walk(keys: Res<ButtonInput<KeyCode>>, mut player: Single<&mut Player>) {
    let mut dir = Vec2::ZERO;
    if keys.any_pressed([KeyCode::KeyW, KeyCode::ArrowUp]) {
        dir.y -= 1.0;
    }
    if keys.any_pressed([KeyCode::KeyS, KeyCode::ArrowDown]) {
        dir.y += 1.0;
    }
    if keys.any_pressed([KeyCode::KeyA, KeyCode::ArrowLeft]) {
        dir.x -= 1.0;
    }
    if keys.any_pressed([KeyCode::KeyD, KeyCode::ArrowRight]) {
        dir.x += 1.0;
    }
    if dir != Vec2::ZERO {
        // Keyboard steps one frame ahead; follow_target does the moving.
        let foot = player.foot;
        player.target = Some(foot + dir.normalize() * 6.0);
        player.running = keys.any_pressed([KeyCode::ShiftLeft, KeyCode::ShiftRight]);
    }
}

fn pointer_walk(
    mouse: Res<ButtonInput<MouseButton>>,
    touches: Res<Touches>,
    page_tap: Res<PageTap>,
    window: Single<&Window, With<PrimaryWindow>>,
    frame: Res<ui::Frame>,
    mut game: ResMut<Game>,
    mut player: Single<&mut Player>,
) {
    let Some(at) = pointer_press(&mouse, &touches, &page_tap, &window, &frame) else { return };
    if ui::hud_hit(at) || !(0.0..VW).contains(&at.x) || !(0.0..VH).contains(&at.y) {
        return;
    }
    let hit = points_here(&game).find(|pt| pt.pos.distance(at) < 30.0).copied();
    if let Some(pt) = hit {
        game.pending = Some(pt);
        player.target = Some(pt.pos);
    } else {
        game.pending = None;
        player.target = Some(at);
    }
    // No Shift key on a phone: a tap far across the room breaks into a run.
    player.running = player.target.is_some_and(|t| t.distance(player.foot) > RUN_TAP);
}

fn follow_target(time: Res<Time>, masks: Res<Masks>, mut game: ResMut<Game>, mut player: Single<&mut Player>) {
    let Some(target) = player.target else {
        player.walking = false;
        return;
    };
    let to = target - player.foot;
    let speed = if player.running { SPEED * RUN } else { SPEED };
    let step = speed * time.delta_secs().min(0.1);
    // Tapped a point: arriving within reach is enough (consoles sit off the walkable floor).
    if let Some(pt) = game.pending {
        if player.foot.distance(pt.pos) <= REACH {
            player.target = None;
            player.walking = false;
            game.pending = None;
            ui::trigger(&mut game, pt);
            return;
        }
    }
    if to.length() < 0.5 {
        player.target = None;
        player.walking = false;
        return;
    }
    let dir = to.normalize();
    player.facing = Facing::from_dir(dir);
    let mv = dir * step.min(to.length());
    let here = player.foot;
    let next = if masks.walkable(game.scene, game.deck, here + mv) {
        Some(here + mv)
    } else if masks.walkable(game.scene, game.deck, here + Vec2::new(mv.x, 0.0)) && mv.x.abs() > 0.05 {
        Some(here + Vec2::new(mv.x, 0.0))
    } else if masks.walkable(game.scene, game.deck, here + Vec2::new(0.0, mv.y)) && mv.y.abs() > 0.05 {
        Some(here + Vec2::new(0.0, mv.y))
    } else {
        None
    };
    match next {
        Some(n) => {
            player.foot = n;
            player.walking = true;
        }
        None => {
            // Blocked. If we were heading for a point and got close, use it anyway.
            if let Some(pt) = game.pending.take() {
                if player.foot.distance(pt.pos) < REACH * 2.2 {
                    ui::trigger(&mut game, pt);
                }
            }
            player.target = None;
            player.walking = false;
        }
    }
}

fn find_nearby(mut game: ResMut<Game>, player: Single<&Player>) {
    if game.mode == Mode::Lift {
        game.nearby = None;
        return;
    }
    game.nearby = points_here(&game)
        .filter(|pt| pt.pos.distance(player.foot) <= REACH + 10.0)
        .min_by(|a, b| a.pos.distance(player.foot).total_cmp(&b.pos.distance(player.foot)))
        .copied();
}

fn use_point(keys: Res<ButtonInput<KeyCode>>, mut game: ResMut<Game>) {
    if keys.any_just_pressed([KeyCode::KeyE, KeyCode::Enter, KeyCode::Space]) {
        if let Some(pt) = game.nearby {
            ui::trigger(&mut game, pt);
        }
    }
}

fn animate_player(time: Res<Time>, art: Res<Art>, mut q: Query<(&mut Player, &mut Sprite)>) {
    for (mut p, mut sprite) in &mut q {
        let (cols, ms, image, layout) = if p.walking && p.running {
            (4, 0.085, &art.run, &art.run_layout)
        } else if p.walking {
            (6, 0.105, &art.walk, &art.walk_layout)
        } else {
            (8, 0.150, &art.idle, &art.idle_layout)
        };
        p.clock += time.delta_secs();
        if p.clock >= ms {
            p.clock = 0.0;
            p.frame = (p.frame + 1) % cols;
        }
        if p.frame >= cols {
            p.frame = 0;
        }
        if !p.walking && p.target.is_none() {
            p.running = false;
        }
        if sprite.image != *image {
            sprite.image = image.clone();
            p.frame = 0;
        }
        let index = p.facing.row() * cols + p.frame;
        sprite.texture_atlas = Some(TextureAtlas { layout: layout.clone(), index });
    }
}

/// Lower on screen draws in front; the foreground cutout covers actors standing behind it.
pub(crate) fn depth_sort(
    game: Res<Game>,
    mut player: Query<(&Player, &mut Transform), (Without<Foreground>, Without<NpcSprite>)>,
    mut npcs: Query<(&NpcSprite, &mut Transform, &mut Sprite), (Without<Foreground>, Without<Player>)>,
    mut fg: Query<&mut Transform, (With<Foreground>, Without<Player>, Without<NpcSprite>)>,
) {
    let def = scene_def(game.scene);
    let Ok((p, mut tf)) = player.single_mut() else { return };
    // Whole scene pixels only: a sub-pixel position makes nearest sampling
    // double or drop columns, which reads as a smeared, low-res sprite.
    tf.translation = to_world(p.foot.round()).extend(1.0 + p.foot.y / 1000.0);
    for (npc, mut ntf, mut sprite) in &mut npcs {
        ntf.translation.z = 1.0 + npc.foot.y / 1000.0;
        // NPCs turn to face Erikk when he is close.
        if let Some(atlas) = sprite.texture_atlas.as_mut() {
            let d = p.foot - npc.foot;
            atlas.index = if d.length() < 70.0 { Facing::from_dir(d).row() } else { 0 };
        }
    }
    for mut f in &mut fg {
        f.translation.z = if p.foot.y < def.fg_threshold { 5.0 } else { 0.5 };
    }
}

// ---------------------------------------------------------------------------
// Pongo
// ---------------------------------------------------------------------------

/// Erikk's recent footsteps, newest last. Pongo walks this path a few
/// steps behind him, so he stays on the floor without his own pathfinding.
#[derive(Resource, Default)]
struct Trail(Vec<Vec2>);

#[derive(Component, Default)]
struct Pongo {
    foot: Vec2,
    scene: Option<SceneId>,
    facing: Facing,
    /// Last sideways direction, for the side-only idle poses.
    left: bool,
    idle: f32,
    clock: f32,
    frame: usize,
}

const PONGO_GAP: f32 = 30.0;

fn follow_pongo(
    time: Res<Time>,
    game: Res<Game>,
    art: Res<Art>,
    mut trail: ResMut<Trail>,
    player: Single<&Player>,
    mut q: Query<(&mut Pongo, &mut Sprite, &mut Transform), Without<Player>>,
) {
    let Ok((mut dog, mut sprite, mut tf)) = q.single_mut() else { return };
    let dt = if game.paused { 0.0 } else { time.delta_secs().min(0.1) };
    let behind = Vec2::new(-22.0, 2.0);

    // New room (or the lift): start beside Erikk with a fresh trail.
    if dog.scene != Some(game.scene) || game.mode == Mode::Lift {
        dog.scene = Some(game.scene);
        dog.foot = player.foot + behind;
        trail.0.clear();
        if game.mode == Mode::Lift {
            dog.facing = Facing::Right;
            dog.left = false;
        }
    }

    if trail.0.last().is_none_or(|l| l.distance(player.foot) > 3.0) {
        trail.0.push(player.foot);
        if trail.0.len() > 96 {
            trail.0.remove(0);
        }
    }
    // The point on the trail PONGO_GAP behind Erikk.
    let mut target = dog.foot;
    let mut acc = 0.0;
    for w in trail.0.windows(2).rev() {
        acc += w[0].distance(w[1]);
        if acc >= PONGO_GAP {
            target = w[0];
            break;
        }
    }

    let to = target - dog.foot;
    let far = to.length();
    let moving = far > 1.5 && game.mode != Mode::Lift;
    let running = moving && (player.running || far > 40.0);
    if moving {
        let speed = if running { SPEED * RUN * 1.05 } else { SPEED * 1.05 };
        let dir = to / far;
        dog.foot += dir * (speed * dt).min(far);
        dog.facing = if dir.x.abs() > dir.y.abs() * 0.7 {
            if dir.x > 0.0 { Facing::Right } else { Facing::Left }
        } else if dir.y > 0.0 {
            Facing::Down
        } else {
            Facing::Up
        };
        if dir.x.abs() > 0.2 {
            dog.left = dir.x < 0.0;
        }
        dog.idle = 0.0;
    } else {
        dog.idle += dt;
    }

    dog.clock += dt;
    let (image, layout, index, flip) = if moving {
        let ms = if running { 0.075 } else { 0.12 };
        if dog.clock >= ms {
            dog.clock = 0.0;
            dog.frame = (dog.frame + 1) % 4;
        }
        let image = if running { &art.pongo_run } else { &art.pongo_walk };
        (image, &art.pongo_layout, dog.facing.row() * 4 + dog.frame % 4, false)
    } else {
        // Stand, then sit after a moment, then lie down if Erikk lingers.
        let t = dog.idle;
        let index = if t < 1.2 {
            4
        } else if t < 1.8 {
            4 + ((t - 1.2) / 0.15) as usize
        } else if t < 14.0 {
            7
        } else if t < 14.6 {
            8 + ((t - 14.0) / 0.15) as usize
        } else {
            11
        };
        (&art.pongo_idle, &art.pongo_idle_layout, index.min(11), dog.left)
    };
    if sprite.image != *image {
        sprite.image = image.clone();
    }
    sprite.texture_atlas = Some(TextureAtlas { layout: layout.clone(), index });
    sprite.flip_x = flip;
    tf.translation = to_world(dog.foot.round()).extend(1.0 + dog.foot.y / 1000.0);
}
