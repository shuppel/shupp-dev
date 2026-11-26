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
    /// The Atlier's engine room, below the bridge: Dave the Mechanic's deck.
    Engine,
    /// Erikk's cabin in the treehouse off the concourse: the About page.
    Quarters,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Npc {
    Technician,
    Archivist,
    Mechanic,
}

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Action {
    OpenAtlas,
    Goto(SceneId),
    Talk(Npc),
    Terminal(&'static str),
    /// Ride the dockyard crane lift to the other deck.
    Lift,
    /// Open the menu (the engine room's console and ship status board).
    Menu,
    /// Pry open the engine room's maintenance hatch.
    Hatch,
    /// Look over the Crescent (planet runs come in a later build).
    Crescent,
    /// The quarters mirror: Erikk explains himself to his reflection (About).
    Mirror,
    /// Open the menu on this tab (the desk has the quest log, the chest the items).
    MenuTab(usize),
    /// Send Pongo to his bed.
    PetBed,
    /// The quarters desk: the About readout.
    Desk,
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
    /// How big Erikk and Pongo draw, by depth: (y at the back, scale there,
    /// y at the front, scale there). The concourse is a deep shot, so he
    /// shrinks toward the treehouse; the quarters are a close-up.
    pub depth_scale: (f32, f32, f32, f32),
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
/// The dockyard stairs between the decks, as the quad Erikk's feet can use
/// (bottom-left, bottom-right, top-right, top-left). It overlaps both deck masks.
const STAIRS: [Vec2; 4] = [p(520.0, 307.0), p(556.0, 307.0), p(588.0, 190.0), p(564.0, 190.0)];
const STAIRS_TOP_Y: f32 = 200.0;
const STAIRS_FOOT_Y: f32 = 298.0;
/// The gangway at the left end of the lower deck: the way back to the Atlier.
const GANGWAY: Vec2 = p(66.0, 312.0);
const DOCK_ARRIVAL: Vec2 = p(92.0, 316.0);

fn on_stairs(at: Vec2) -> bool {
    let mut odd = false;
    let mut j = STAIRS.len() - 1;
    for i in 0..STAIRS.len() {
        let (a, b) = (STAIRS[i], STAIRS[j]);
        if (a.y > at.y) != (b.y > at.y) && at.x < (b.x - a.x) * (at.y - a.y) / (b.y - a.y) + a.x {
            odd = !odd;
        }
        j = i;
    }
    odd
}
/// Bridge exits and the spots Erikk arrives at from each one.
const STAR_CONSOLE: Vec2 = p(500.0, 192.0);
/// The quarters door, on the landing at the top of the treehouse stairs.
const TREEHOUSE: Vec2 = p(192.0, 132.0);
const ARCHIVE_PATH: Vec2 = p(366.0, 136.0);
const STAIRWELL: Vec2 = p(590.0, 210.0);
const BRIDGE_GANGWAY: Vec2 = p(300.0, 350.0);
const QUARTERS_DOOR_IN: Vec2 = p(70.0, 236.0);
/// Pongo's bed in the quarters (bottom centre). Its footprint is carved out
/// of quarters_walkable.png by make_atlier_rooms.py.
const PET_BED: Vec2 = p(451.0, 212.0);

/// How big an actor standing at depth `y` draws in this scene.
pub fn actor_scale(scene: SceneId, y: f32) -> f32 {
    let (y0, s0, y1, s1) = scene_def(scene).depth_scale;
    let t = ((y - y0) / (y1 - y0)).clamp(0.0, 1.0);
    s0 + (s1 - s0) * t
}

/// Where Erikk lands when he walks into `to` from `from`.
fn arrival(to: SceneId, from: SceneId) -> Option<Vec2> {
    Some(match (to, from) {
        (SceneId::Bridge, SceneId::Engine) => STAIRWELL + p(-14.0, 14.0),
        (SceneId::Bridge, SceneId::Quarters) => p(214.0, 160.0),
        (SceneId::Bridge, SceneId::Archive) => ARCHIVE_PATH + p(0.0, 18.0),
        (SceneId::Bridge, SceneId::Port) => BRIDGE_GANGWAY + p(0.0, -18.0),
        (SceneId::Quarters, _) => QUARTERS_DOOR_IN,
        _ => return None,
    })
}

/// Furniture placed in a room: image, foot (bottom centre), drawn size, and
/// whether it always draws over actors (foreground pots).
const ROOM_PROPS: &[(SceneId, &str, Vec2, Vec2, bool)] = &[
    (SceneId::Quarters, "props/quarters/pet_bed.png", PET_BED, p(56.0, 33.0), false),
    (SceneId::Quarters, "props/quarters/fern.png", p(26.0, 362.0), p(52.0, 46.0), true),
    (SceneId::Quarters, "props/quarters/fern.png", p(616.0, 362.0), p(52.0, 46.0), true),
];
const ENGINE_ARRIVAL: Vec2 = p(52.0, 254.0);
const CRESCENT_CENTER: Vec2 = p(420.0, 156.0);
const CRESCENT_SIZE: Vec2 = p(148.0, 82.0);

pub fn scene_def(id: SceneId) -> &'static SceneDef {
    // The garden concourse: the treehouse up to the quarters, the path aft to
    // the archive, the stairwell down to the engine room, the gangway to the
    // dockyard, and the star console on its dais.
    static BRIDGE: SceneDef = SceneDef {
        name: "The Atlier",
        label: "Bridge",
        bg: "scenes/bridge.png",
        fg: None,
        hd: true,
        fg_threshold: 0.0,
        depth_scale: (128.0, 0.7, 340.0, 1.06),
        spawn: p(320.0, 262.0),
        points: &[
            Point { pos: STAR_CONSOLE, label: "Star console", action: Action::OpenAtlas, deck: Deck::Any },
            Point { pos: TREEHOUSE, label: "Captain's Quarters", action: Action::Goto(SceneId::Quarters), deck: Deck::Any },
            Point { pos: ARCHIVE_PATH, label: "Path to the Archive", action: Action::Goto(SceneId::Archive), deck: Deck::Any },
            Point { pos: STAIRWELL, label: "Stairs down to the engine room", action: Action::Goto(SceneId::Engine), deck: Deck::Any },
            Point { pos: BRIDGE_GANGWAY, label: "Gangway to the Dockyard", action: Action::Goto(SceneId::Port), deck: Deck::Any },
        ],
        npc: None,
        mask: include_bytes!("../masks/bridge_walkable.png"),
    };
    static QUARTERS: SceneDef = SceneDef {
        name: "Captain's Quarters",
        label: "About",
        bg: "scenes/quarters.png",
        fg: None,
        hd: true,
        fg_threshold: 0.0,
        depth_scale: (175.0, 1.3, 350.0, 1.55),
        spawn: QUARTERS_DOOR_IN,
        points: &[
            Point { pos: p(112.0, 182.0), label: "Look in the mirror", action: Action::Mirror, deck: Deck::Any },
            Point { pos: p(250.0, 186.0), label: "Desk", action: Action::Desk, deck: Deck::Any },
            Point { pos: p(451.0, 232.0), label: "Pongo's bed", action: Action::PetBed, deck: Deck::Any },
            Point { pos: p(508.0, 180.0), label: "Sea chest: keepsakes", action: Action::MenuTab(1), deck: Deck::Any },
            Point { pos: p(40.0, 244.0), label: "Back to the concourse", action: Action::Goto(SceneId::Bridge), deck: Deck::Any },
        ],
        npc: None,
        mask: include_bytes!("../masks/quarters_walkable.png"),
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
        depth_scale: (0.0, 1.0, 360.0, 1.0),
        spawn: p(232.0, 312.0),
        points: &[
            Point { pos: LIFT_LOWER_EXIT, label: "Ride the lift up", action: Action::Lift, deck: Deck::Lower },
            Point { pos: p(320.0, 304.0), label: "Workbench", action: Action::Terminal("work"), deck: Deck::Lower },
            Point { pos: LIFT_UPPER_EXIT, label: "Ride the lift down", action: Action::Lift, deck: Deck::Upper },
            Point { pos: p(545.0, 174.0), label: "Talk to Terri", action: Action::Talk(Npc::Technician), deck: Deck::Upper },
            Point { pos: p(420.0, 192.0), label: "Inspect the Crescent", action: Action::Crescent, deck: Deck::Upper },
            Point { pos: GANGWAY, label: "Gangway to the Atlier", action: Action::Goto(SceneId::Bridge), deck: Deck::Lower },
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
        depth_scale: (0.0, 1.0, 360.0, 1.0),
        spawn: p(323.0, 301.0),
        points: &[
            Point { pos: p(323.0, 168.0), label: "Records", action: Action::Terminal("writing"), deck: Deck::Any },
            Point { pos: p(385.0, 182.0), label: "Talk to Astro", action: Action::Talk(Npc::Archivist), deck: Deck::Any },
            Point { pos: p(323.0, 328.0), label: "Back to the Atlier", action: Action::Goto(SceneId::Bridge), deck: Deck::Any },
        ],
        npc: Some((Npc::Archivist, p(385.0, 182.0))),
        mask: include_bytes!("../masks/archive_walkable.png"),
    };
    static ENGINE: SceneDef = SceneDef {
        name: "Engine Room",
        label: "Atlier",
        bg: "scenes/engine_room.png",
        fg: None,
        hd: true,
        fg_threshold: 0.0,
        depth_scale: (0.0, 1.0, 360.0, 1.0),
        spawn: ENGINE_ARRIVAL,
        points: &[
            Point { pos: p(36.0, 246.0), label: "Doorway back to the concourse", action: Action::Goto(SceneId::Bridge), deck: Deck::Any },
            Point { pos: p(400.0, 270.0), label: "Reactor console", action: Action::Menu, deck: Deck::Any },
            Point { pos: p(470.0, 182.0), label: "Ship status board", action: Action::Menu, deck: Deck::Any },
            Point { pos: p(572.0, 272.0), label: "Talk to Dave", action: Action::Talk(Npc::Mechanic), deck: Deck::Any },
            Point { pos: p(300.0, 322.0), label: "Maintenance hatch", action: Action::Hatch, deck: Deck::Any },
        ],
        npc: None,
        mask: include_bytes!("../masks/engine_room_walkable.png"),
    };
    match id {
        SceneId::Engine => &ENGINE,
        SceneId::Bridge => &BRIDGE,
        SceneId::Port => &PORT,
        SceneId::Archive => &ARCHIVE,
        SceneId::Quarters => &QUARTERS,
    }
}

/// Walkability for the current scene, decoded from the art pack's white masks.
#[derive(Resource)]
pub struct Masks {
    bridge: Vec<bool>,
    port: Vec<bool>,
    port_upper: Vec<bool>,
    archive: Vec<bool>,
    engine: Vec<bool>,
    quarters: Vec<bool>,
}

/// Shrink the walkable area by the body's half-width, so Erikk's shoulders
/// stop at walls and furniture instead of only his feet.
fn erode(m: &[bool], rx: usize, ry: usize) -> Vec<bool> {
    let (w, h) = (VW as usize, VH as usize);
    let mut out = vec![false; m.len()];
    for y in ry..h.saturating_sub(ry) {
        'px: for x in rx..w.saturating_sub(rx) {
            for dy in [0, ry] {
                for (yy, xx) in [(y - dy, x - rx), (y - dy, x + rx), (y + dy, x - rx), (y + dy, x + rx), (y - dy, x), (y + dy, x)] {
                    if !m[yy * w + xx] {
                        continue 'px;
                    }
                }
            }
            out[y * w + x] = true;
        }
    }
    out
}

fn decode_mask(bytes: &[u8]) -> Vec<bool> {
    erode(&decode_mask_raw(bytes), 6, 3)
}

fn decode_mask_raw(bytes: &[u8]) -> Vec<bool> {
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
            quarters: decode_mask(scene_def(SceneId::Quarters).mask),
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
            archive: {
                // Keep a step back from the records desk so Erikk stands in front of it.
                let mut m = decode_mask(scene_def(SceneId::Archive).mask);
                for y in 0..166 {
                    for x in 228..418 {
                        m[y * VW as usize + x] = false;
                    }
                }
                m
            },
            engine: {
                // Machines are solid: carve each prop's footprint out of the floor.
                let mut m = decode_mask(scene_def(SceneId::Engine).mask);
                for prop in ENGINE_PROPS.iter().filter(|p| p.solid) {
                    let (x0, x1) = ((prop.at.x - prop.size.x * 0.4) as usize, (prop.at.x + prop.size.x * 0.4) as usize);
                    let (y0, y1) = ((prop.at.y - 10.0).max(0.0) as usize, prop.at.y as usize + 2);
                    for y in y0..y1.min(VH as usize) {
                        for x in x0..x1.min(VW as usize) {
                            m[y * VW as usize + x] = false;
                        }
                    }
                }
                m
            },
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
            SceneId::Engine => &self.engine,
            SceneId::Quarters => &self.quarters,
        };
        let floor = m[(at.y as usize) * (VW as usize) + at.x as usize] || (scene == SceneId::Port && on_stairs(at));
        floor && !npc_blocks(scene, deck, at)
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
    /// The planet star map (bridge star console).
    Atlas,
    /// The ship map: fast travel between rooms.
    Ship,
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
    /// Search text from the page's input, waiting for the terminal.
    pub search: Option<String>,
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
    /// The engine room's maintenance hatch has been opened (relic found).
    pub hatch_open: bool,
    /// Pongo has been sent to his bed in the quarters.
    pub pongo_bed: bool,
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
    /// Crew drawn from 2x art (Terri), shown smooth at 48 x 64.
    pub npc_hd_layout: Handle<TextureAtlasLayout>,
    pub technician_npc: Handle<Image>,
    pub mechanic_work: Handle<Image>,
    pub work_layout: Handle<TextureAtlasLayout>,
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
        search: None,
        nearby: None,
        pending: None,
        visited,
        paused: false,
        request: None,
        mana_dialogue: false,
        hatch_open: false,
        pongo_bed: false,
    })
    .add_message::<EnterScene>()
    .init_resource::<PageTap>()
    .init_resource::<Ride>()
    .add_systems(Startup, setup)
    .add_systems(PreUpdate, read_page)
    .add_systems(Last, boot_progress)
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
            animate_engine_room,
            depth_sort,
            fx::animate,
            fx::markers,
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
        npc_hd_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(96, 128), 4, 1, None, None)),
        technician_npc: load_smooth(&assets, "cast/technician/npc_hd.png"),
        mechanic_work: load_smooth(&assets, "cast/mechanic/work.png"),
        work_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(128, 128), 6, 1, None, None)),
        archivist_npc: load_t(&assets, "cast/archivist/npc_outlined.png"),
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
        "engine" => SceneId::Engine,
        "about" => SceneId::Quarters,
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
        SceneId::Bridge | SceneId::Engine | SceneId::Quarters => {}
    }
    bridge::emit("scene", def.label);

    let hd = |path: &'static str| {
        // 2× art drawn at logical size: filter it so it stays smooth when scaled.
        load_smooth(&assets, path)
    };
    let bg = if def.hd {
        Sprite { image: hd(def.bg), custom_size: Some(Vec2::new(VW, VH)), ..default() }
    } else {
        Sprite::from_image(load_t(&assets, def.bg))
    };
    commands.spawn((SceneEntity, bg, Transform::from_xyz(0.0, 0.0, 0.0)));
    if let Some(fg) = def.fg {
        commands.spawn((SceneEntity, Foreground, Sprite::from_image(load_t(&assets, fg)), Transform::from_xyz(0.0, 0.0, 0.5)));
    }
    let mut spawn = if from != id { arrival(id, from).unwrap_or(def.spawn) } else { def.spawn };
    for (_, path, at, size, front) in ROOM_PROPS.iter().filter(|r| r.0 == id) {
        commands.spawn((
            SceneEntity,
            Sprite { image: hd(path), custom_size: Some(*size), ..default() },
            Anchor::BOTTOM_CENTER,
            Transform::from_translation(to_world(*at).extend(if *front { 6.0 } else { 1.0 + at.y / 1000.0 })),
        ));
    }
    if id == SceneId::Engine {
        for (i, prop) in ENGINE_PROPS.iter().enumerate() {
            let path = if i == HATCH && game.hatch_open { "props/engine_room/hatch_open.png" } else { prop.image };
            let mut e = commands.spawn((
                SceneEntity,
                Sprite { image: hd(path), custom_size: Some(prop.size), ..default() },
                Anchor::BOTTOM_CENTER,
                // Flat floor pieces sit under everyone; the rest sort by baseline.
                Transform::from_translation(to_world(prop.at).extend(if prop.flat { 0.2 } else { 1.0 + prop.at.y / 1000.0 })),
            ));
            if i == HATCH {
                e.insert(HatchSprite);
            }
            if prop.image.ends_with("flywheel.png") {
                e.insert((Spin, Anchor::CENTER, Transform::from_translation(to_world(prop.at - Vec2::new(0.0, prop.size.y / 2.0)).extend(1.0 + prop.at.y / 1000.0))));
            }
            if prop.image.ends_with("warning_lamp.png") || prop.image.ends_with("reactor_core.png") {
                e.insert(Pulse);
            }
        }
        // Dave, wrenching at the piston bank with his back to us.
        commands.spawn((
            SceneEntity,
            Worker::default(),
            Sprite {
                custom_size: Some(Vec2::new(64.0, 64.0)),
                ..Sprite::from_atlas_image(art.mechanic_work.clone(), TextureAtlas { layout: art.work_layout.clone(), index: 0 })
            },
            Anchor(Vec2::new(0.0, (64.0 - 124.0) / 128.0)),
            Transform::from_translation(to_world(DAVE).extend(1.0 + DAVE.y / 1000.0)),
        ));
    }
    game.deck = Deck::Any;
    if id == SceneId::Port {
        // Everyone comes in by the gangway on the service deck; the stairs and
        // the lift both lead up to the Crescent's bay.
        game.deck = Deck::Lower;
        if from != id {
            spawn = DOCK_ARRIVAL;
        }
        let stop = if game.deck == Deck::Upper { LIFT_UPPER } else { LIFT_LOWER };
        commands.spawn((
            SceneEntity,
            LiftPlatform,
            Sprite { image: hd("props/crane_elevator.png"), custom_size: Some(LIFT_SIZE), ..default() },
            Transform::from_translation(to_world(stop).extend(lift_z(stop))),
        ));
        // The workbench: a console against the service deck wall (its white
        // halo is in fx.rs, built by tools/make_workbench.py).
        commands.spawn((
            SceneEntity,
            Sprite { image: hd("props/engine_room/console.png"), custom_size: Some(Vec2::new(56.0, 48.0)), ..default() },
            Anchor::BOTTOM_CENTER,
            Transform::from_translation(to_world(p(320.0, 298.0)).extend(1.0 + 298.0 / 1000.0)),
        ));
        let base = CRESCENT_CENTER.y + CRESCENT_SIZE.y / 2.0 - 4.0;
        commands.spawn((
            SceneEntity,
            Sprite { image: hd("ships/crescent/exterior.png"), custom_size: Some(CRESCENT_SIZE), ..default() },
            Transform::from_translation(to_world(CRESCENT_CENTER).extend(1.0 + base / 1000.0)),
        ));
    }
    if let Some((npc, foot)) = def.npc {
        let (image, layout) = match npc {
            Npc::Technician => (art.technician_npc.clone(), art.npc_hd_layout.clone()),
            Npc::Archivist | Npc::Mechanic => (art.archivist_npc.clone(), art.npc_layout.clone()),
        };
        commands.spawn((
            SceneEntity,
            NpcSprite { foot },
            Sprite { custom_size: Some(Vec2::new(48.0, 64.0)), ..Sprite::from_atlas_image(image, TextureAtlas { layout, index: 0 }) },
            Anchor(Vec2::new(0.0, (32.0 - 62.0) / 64.0)),
            Transform::from_translation(to_world(foot).extend(1.0)),
        ));
    }

    player.foot = spawn;
    player.target = None;
    player.facing = if spawn == DOCK_ARRIVAL { Facing::Right } else { Facing::Up };
}

/// Load 2× (or larger) source art with linear filtering, so it stays smooth
/// when drawn at its smaller logical size.
pub fn load_smooth(assets: &AssetServer, path: impl Into<bevy::asset::AssetPath<'static>>) -> Handle<Image> {
    track(
        assets
            .load_builder()
            .with_settings(|s: &mut ImageLoaderSettings| s.sampler = ImageSampler::linear())
            .load(path),
    )
}

/// Load an asset and count it toward the loading screen.
pub fn load_t<A: Asset>(assets: &AssetServer, path: impl Into<bevy::asset::AssetPath<'static>>) -> Handle<A> {
    track(assets.load(path))
}

/// Handles the loading screen waits on. `None` once the game is revealed, so
/// later loads (other rooms) don't count.
static PRELOAD: std::sync::Mutex<Option<Vec<UntypedHandle>>> = std::sync::Mutex::new(Some(Vec::new()));

fn track<A: Asset>(h: Handle<A>) -> Handle<A> {
    if let Ok(mut g) = PRELOAD.lock() {
        if let Some(v) = g.as_mut() {
            v.push(h.clone().untyped());
        }
    }
    h
}

/// Report loading progress to the page, then say "ready" once everything
/// requested during boot (the first room, the cast, the menus) is decoded,
/// so the game appears whole instead of stuttering while art streams in.
fn boot_progress(assets: Res<AssetServer>, mut last: Local<(usize, u32)>) {
    let Ok(mut g) = PRELOAD.lock() else { return };
    let Some(v) = g.as_ref() else { return };
    let total = v.len();
    let done = v
        .iter()
        .filter(|h| {
            assets.is_loaded_with_dependencies(h.id())
                || matches!(assets.get_load_state(h.id()), Some(bevy::asset::LoadState::Failed(_)))
        })
        .count();
    if done != last.0 {
        last.0 = done;
        bridge::emit("loading", &format!("{done}/{total}"));
    }
    // Wait two frames after the last asset so its sprite has been drawn.
    if total > 0 && done == total {
        last.1 += 1;
        if last.1 >= 2 {
            *g = None;
            bridge::emit("ready", "");
        }
    }
}

/// Crew are solid: a small oval around each NPC's feet.
fn npc_blocks(scene: SceneId, deck: Deck, at: Vec2) -> bool {
    let foot = match (scene, deck) {
        (SceneId::Engine, _) => Some(DAVE),
        (SceneId::Port, Deck::Lower) => None,
        _ => scene_def(scene).npc.map(|(_, f)| f),
    };
    foot.is_some_and(|f| ((at - f) / Vec2::new(12.0, 6.0)).length_squared() < 1.0)
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
            bridge::Inbound::Search(q) => game.search = Some(q),
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
            // The dockyard stairs: stepping off the top puts Erikk on the upper
            // deck, off the bottom back on the lower one.
            if game.scene == SceneId::Port {
                if n.y < STAIRS_TOP_Y && game.deck != Deck::Upper {
                    game.deck = Deck::Upper;
                } else if n.y > STAIRS_FOOT_Y && game.deck != Deck::Lower {
                    game.deck = Deck::Lower;
                }
            }
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
    tf.scale = Vec3::splat(actor_scale(game.scene, p.foot.y));
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
    /// How long Erikk has stood still.
    still: f32,
}

const PONGO_GAP: f32 = 30.0;

fn follow_pongo(
    time: Res<Time>,
    mut game: ResMut<Game>,
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
        dog.still = 0.0;
        if game.pongo_bed {
            game.pongo_bed = false;
        }
    } else {
        dog.still += dt;
    }
    // In the quarters, Pongo goes and curls up in his bed if Erikk lingers.
    let in_quarters = game.scene == SceneId::Quarters;
    if in_quarters && dog.still > 6.0 && !game.pongo_bed {
        game.pongo_bed = true;
    }
    let bedtime = in_quarters && game.pongo_bed;
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

    if bedtime {
        target = PET_BED + Vec2::new(0.0, -9.0);
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
        // In his bed he settles straight down.
        let t = if bedtime { dog.idle + 13.0 } else { dog.idle };
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
    // In bed he draws over the bed, whose baseline is lower on screen.
    let z = if bedtime && !moving { 1.0 + PET_BED.y / 1000.0 + 0.0005 } else { 1.0 + dog.foot.y / 1000.0 };
    tf.translation = to_world(dog.foot.round()).extend(z);
    tf.scale = Vec3::splat(actor_scale(game.scene, dog.foot.y));
}

// ---------------------------------------------------------------------------
// Engine room
// ---------------------------------------------------------------------------

/// A placed prop: image, foot (bottom centre) in scene pixels, drawn size.
struct Prop {
    image: &'static str,
    at: Vec2,
    size: Vec2,
    /// Blocks walking across its footprint.
    solid: bool,
    /// Lies on the floor under every actor.
    flat: bool,
}

const fn prop(image: &'static str, x: f32, y: f32, w: f32, h: f32, solid: bool, flat: bool) -> Prop {
    Prop { image, at: Vec2::new(x, y), size: Vec2::new(w, h), solid, flat }
}

const DAVE: Vec2 = p(566.0, 262.0);
const HATCH: usize = 0;

static ENGINE_PROPS: [Prop; 12] = [
    prop("props/engine_room/hatch_closed.png", 300.0, 334.0, 50.0, 31.0, false, true),
    // The doorway back up to the concourse (stand-in art, make_engine_door.py).
    prop("props/engine_room/doorway.png", 30.0, 246.0, 46.0, 68.0, false, false),
    prop("props/engine_room/coolant_tank.png", 82.0, 176.0, 34.0, 66.0, true, false),
    prop("props/engine_room/flywheel.png", 140.0, 176.0, 56.0, 62.0, true, false),
    prop("props/engine_room/reactor_core.png", 236.0, 178.0, 84.0, 106.0, true, false),
    prop("props/engine_room/status_board.png", 470.0, 176.0, 66.0, 68.0, true, false),
    prop("props/engine_room/grow_tube.png", 556.0, 176.0, 50.0, 65.0, true, false),
    prop("props/engine_room/coolant_tank.png", 608.0, 176.0, 34.0, 66.0, true, false),
    prop("props/engine_room/gauge_cluster.png", 140.0, 252.0, 58.0, 43.0, true, false),
    prop("props/engine_room/console.png", 400.0, 262.0, 62.0, 53.0, true, false),
    prop("props/engine_room/warning_lamp.png", 444.0, 258.0, 22.0, 27.0, true, false),
    prop("props/engine_room/piston_bank.png", 566.0, 244.0, 72.0, 69.0, true, false),
];

#[derive(Component)]
struct HatchSprite;

/// The flywheel turns.
#[derive(Component)]
struct Spin;

/// Glowing machines breathe a little.
#[derive(Component)]
struct Pulse;

#[derive(Component, Default)]
struct Worker {
    clock: f32,
    frame: usize,
}

fn animate_engine_room(
    time: Res<Time>,
    game: Res<Game>,
    assets: Res<AssetServer>,
    mut spin: Query<&mut Transform, (With<Spin>, Without<Worker>)>,
    mut pulse: Query<&mut Sprite, (With<Pulse>, Without<Worker>, Without<HatchSprite>)>,
    mut worker: Query<(&mut Worker, &mut Sprite), (Without<Pulse>, Without<HatchSprite>)>,
    mut hatch: Query<&mut Sprite, (With<HatchSprite>, Without<Pulse>, Without<Worker>)>,
) {
    if game.scene != SceneId::Engine {
        return;
    }
    let t = time.elapsed_secs();
    for mut tf in &mut spin {
        tf.rotation = Quat::from_rotation_z(-t * 0.9);
    }
    for mut s in &mut pulse {
        let k = 0.9 + 0.1 * (t * 3.0).sin();
        s.color = Color::srgb(k + 0.1, k + 0.1, k);
    }
    for (mut w, mut s) in &mut worker {
        w.clock += time.delta_secs();
        if w.clock >= 0.16 {
            w.clock = 0.0;
            w.frame = (w.frame + 1) % 6;
        }
        if let Some(a) = s.texture_atlas.as_mut() {
            a.index = w.frame;
        }
    }
    if game.hatch_open {
        for mut s in &mut hatch {
            // The open hatch art is taller (the lid stands up): keep its foot.
            s.image = load_smooth(&assets, "props/engine_room/hatch_open.png");
            s.custom_size = Some(Vec2::new(50.0, 50.0));
        }
    }
}
