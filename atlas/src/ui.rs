//! Everything drawn over the scenes: HUD, dialogue with talking portraits,
//! terminals, the star atlas, travel, and the JRPG pause menu (Status with a
//! radar chart, Items, Quests/resume).
//!
//! The UI is laid out in the same 640 × 360 virtual frame as the scenes and
//! scaled with `UiScale`, so text renders crisp at any window size. Pointer
//! input is hit-tested against the same rectangles the layout uses.

use bevy::asset::RenderAssetUsages;
use bevy::image::ImageSampler;
use bevy::prelude::*;
use bevy::render::render_resource::{Extent3d, TextureDimension, TextureFormat};
use bevy::window::PrimaryWindow;

use crate::content::{Destination, Registry};
use crate::{Action, EnterScene, Game, Mode, Npc, Point, SceneId, VH, VW, bridge, scene_def};

mod sound;

// Palette: shupp.dev brand colours plus the warm lamp orange from the art pack.
const INK: Color = Color::srgba(0.078, 0.031, 0.055, 0.94);
const INK_SOLID: Color = Color::srgb(0.078, 0.031, 0.055);
const LINE: Color = Color::srgb(0.80, 0.55, 0.30);
const TEXT: Color = Color::srgb(0.945, 0.933, 0.902);
const MUTED: Color = Color::srgb(0.72, 0.70, 0.66);
const SAGE: Color = Color::srgb(0.475, 0.580, 0.588);
const CITRON: Color = Color::srgb(0.914, 0.922, 0.620);
const LAMP: Color = Color::srgb(0.93, 0.55, 0.25);
const SELECT: Color = Color::srgba(0.93, 0.55, 0.25, 0.22);

pub struct UiPlugin;

impl Plugin for UiPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(Frame { scale: 1.0, offset: Vec2::ZERO, window: Vec2::ZERO, view_x0: 0.0, view_w: VW, portrait: false })
            .insert_resource(Ui::default())
            .add_systems(Startup, setup_ui.after(crate::setup))
            .add_systems(
                Update,
                (layout_frame, handle_request, input, tick, render, hud, animate_map, sound::cues)
                    .chain()
                    .after(crate::depth_sort),
            );
    }
}

// ---------------------------------------------------------------------------
// Public surface used by the world systems
// ---------------------------------------------------------------------------

#[derive(Clone, Debug)]
pub enum Request {
    Atlas,
    /// The ship map: fast travel between rooms.
    Ship,
    Door(SceneId),
    Talk(Npc),
    Terminal(String),
    /// A destination id: work, about, writing, contact.
    Destination(String),
    Menu,
    /// Ride the dockyard lift.
    Lift,
    /// Open the engine room hatch and find the relic.
    Hatch,
    Crescent,
    /// Open the menu on a given tab.
    MenuTab(usize),
    /// Erikk talks to his reflection.
    Mirror,
}

pub fn trigger(game: &mut Game, pt: Point) {
    game.request = Some(match pt.action {
        Action::PetBed => {
            game.pongo_bed = true;
            return;
        }
        Action::Mirror => Request::Mirror,
        Action::Desk => Request::Terminal("writing".into()),
        Action::MenuTab(t) => Request::MenuTab(t),
        Action::OpenAtlas => Request::Atlas,
        Action::Goto(s) => Request::Door(s),
        Action::Talk(n) => Request::Talk(n),
        Action::Terminal(id) => Request::Terminal(id.to_owned()),
        Action::Lift => Request::Lift,
        Action::Menu => Request::Menu,
        Action::Hatch => Request::Hatch,
        Action::Crescent => Request::Crescent,
    });
}

/// Maps between window pixels and the 640 × 360 virtual frame.
#[derive(Resource)]
pub struct Frame {
    pub scale: f32,
    /// Letterbox offset, in virtual pixels.
    pub offset: Vec2,
    window: Vec2,
    /// The part of the 640-wide scene on screen: all of it in landscape; in
    /// portrait a full-height slice that follows Erikk.
    pub view_x0: f32,
    pub view_w: f32,
    pub portrait: bool,
}

/// A UI node that stays on screen while the portrait camera pans: its left
/// edge tracks the view and its width is the view's.
#[derive(Component)]
struct Pinned;

impl Frame {
    pub fn to_scene(&self, screen: Vec2) -> Vec2 {
        screen / self.scale - self.offset
    }
}

// The menus hide in a sliver tab at the bottom-left edge (this is a website
// first; the game chrome stays out of the way). Tap the sliver to slide out
// the tray with the Menu, Map and Sound icons.
const SLIVER: Rect = Rect { min: Vec2::new(0.0, 312.0), max: Vec2::new(22.0, 356.0) };
const TRAY: Rect = Rect { min: Vec2::new(0.0, 312.0), max: Vec2::new(136.0, 356.0) };
const MENU_BTN: Rect = Rect { min: Vec2::new(6.0, 316.0), max: Vec2::new(44.0, 352.0) };
const MAP_BTN: Rect = Rect { min: Vec2::new(46.0, 316.0), max: Vec2::new(84.0, 352.0) };
/// Sound on/off, saved by the page between visits.
const SOUND_BTN: Rect = Rect { min: Vec2::new(86.0, 316.0), max: Vec2::new(124.0, 352.0) };

pub fn hud_hit(at: Vec2) -> bool {
    TRAY.contains(at)
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

#[derive(Clone, Copy, PartialEq, Eq)]
enum Who {
    Erikk,
    Technician,
    Archivist,
    Mechanic,
}

struct Line {
    speaker: String,
    who: Who,
    /// faces: 0 listen, 1 greet, 2 think, 3 serious
    pose: usize,
    /// Hologram call (animated mouth) instead of an in-person portrait.
    call: bool,
    text: String,
}

struct Dialogue {
    lines: Vec<Line>,
    idx: usize,
    shown: f32,
    after: Option<Request>,
}

struct Terminal {
    dest: Destination,
    /// Index into `hits`, not into `dest.items`.
    sel: usize,
    query: String,
    /// The items that match `query`, in order.
    hits: Vec<usize>,
}

impl Terminal {
    fn new(dest: Destination) -> Self {
        let mut t = Terminal { dest, sel: 0, query: String::new(), hits: Vec::new() };
        t.refilter();
        t
    }

    fn refilter(&mut self) {
        let q = self.query.trim().to_lowercase();
        let words: Vec<&str> = q.split_whitespace().collect();
        self.hits = (0..self.dest.items.len())
            .filter(|&i| {
                let it = &self.dest.items[i];
                let hay = format!(
                    "{} {} {}",
                    it.title,
                    it.meta.as_deref().unwrap_or(""),
                    it.description.as_deref().unwrap_or("")
                )
                .to_lowercase();
                words.iter().all(|w| hay.contains(w))
            })
            .collect();
        self.sel = 0;
    }

    fn current(&self) -> Option<&crate::content::Item> {
        self.hits.get(self.sel).map(|&i| &self.dest.items[i])
    }
}

/// Tell the page which page to preview beside the list ("" hides it).
fn emit_preview(term: Option<&Terminal>) {
    let href = term.and_then(|t| t.current()).map(|it| it.href.as_str()).unwrap_or("");
    bridge::emit("preview", href);
}

struct Travel {
    t: f32,
    len: f32,
    to: SceneId,
    swapped: bool,
    flight: bool,
}

// The star map lives on the bridge console (and the MAP tray button), not in the player menu.
const TABS: [&str; 4] = ["Status", "Items", "Skills", "Quests"];
/// ui_icons index for each tab.
const TAB_ICONS: [usize; 4] = [0, 1, 8, 2];
const SUITS: [(&str, &str); 4] = [("skill", "PROFICIENCIES"), ("discipline", "DISCIPLINES"), ("special", "PHILOSOPHIES"), ("equipment", "SKILLS")];

#[derive(Resource, Default)]
struct Ui {
    dirty: bool,
    /// A screen opened this frame: ignore this frame's input.
    fresh: bool,
    dialogue: Option<Dialogue>,
    terminal: Option<Terminal>,
    atlas_sel: usize,
    tab: usize,
    sel: usize,
    travel: Option<Travel>,
    hint: f32,
    touch: bool,
    mouth: f32,
    // Entities updated every frame without a rebuild.
    overlay: Option<Entity>,
    hud: Option<Entity>,
    hud_key: String,
    /// The bottom-left menu tray is slid out.
    tray: bool,
    typed: Option<Entity>,
    more: Option<Entity>,
    portrait: Option<Entity>,
    fade: Option<Entity>,
    flight: Option<Entity>,
    /// Which suit the Skills tab shows.
    suit: usize,
    ship_sel: usize,
    /// The Quests tab is showing one quest in full.
    quest_full: bool,
    /// Last pointer position seen over the ship map.
    hover_at: Option<Vec2>,
}

#[derive(Resource)]
struct Fonts {
    body: Handle<Font>,
    bold: Handle<Font>,
    label: Handle<Font>,
    mana: Handle<Font>,
    display: Handle<Font>,
}

#[derive(Resource)]
struct UiArt {
    erikk_faces: Handle<Image>,
    erikk_call: Handle<Image>,
    tech_faces: Handle<Image>,
    tech_call: Handle<Image>,
    arch_faces: Handle<Image>,
    arch_call: Handle<Image>,
    mech_faces: Handle<Image>,
    mech_call: Handle<Image>,
    faces_layout: Handle<TextureAtlasLayout>,
    call_layout: Handle<TextureAtlasLayout>,
    atlas_bg: Handle<Image>,
    /// Star map layers: far and near stars scroll at different speeds under the chart.
    stars_far: Handle<Image>,
    stars_near: Handle<Image>,
    // The planet chart, kept for when the Crescent flies to planets.
    #[allow(dead_code)]
    chart: Handle<Image>,
    pulse: Handle<Image>,
    pulse_layout: Handle<TextureAtlasLayout>,
    /// Erikk's tiered icons: columns scroll, wrench, armillary, compass; rows
    /// common, uncommon, rare, unique, legendary, ornate.
    tier_icons: Handle<Image>,
    tier_layout: Handle<TextureAtlasLayout>,
    #[allow(dead_code)]
    icons: Vec<(String, [Handle<Image>; 3])>,
    /// 16-frame spinning planet for each destination.
    #[allow(dead_code)]
    orbits: Vec<Handle<Image>>,
    #[allow(dead_code)]
    orbit_layout: Handle<TextureAtlasLayout>,
    ship_cursor: Handle<Image>,
    flight: Handle<Image>,
    flight_layout: Handle<TextureAtlasLayout>,
    cutaway: Handle<Image>,
    glow_dot: Handle<Image>,
    streaks: Handle<Image>,
    room_glow: Vec<Handle<Image>>,
    /// The Status radar, one per menu theme.
    radar: [Handle<Image>; 3],
    full_body: Handle<Image>,
    /// status, items, quests, map, credential, degree, quest_active, quest_done,
    /// character, ship, settings
    ui_icons: [Handle<Image>; 13],
    key_e: Handle<Image>,
    key_tap: Handle<Image>,
}

#[derive(Resource)]
struct UiRoot(Entity);

/// Where a ship map room takes you: a room you walk into, or a destination
/// (About is a conversation, Contact is a terminal).
#[derive(Clone, Copy)]
enum RoomGo {
    Scene(SceneId),
    /// For rooms that are a page rather than a place (Comms, later).
    #[allow(dead_code)]
    Dest(&'static str),
}

/// Rooms on the ship map, a cutaway of the Atlier: name, site label, where
/// it goes, blurb, the room's outline and its label spot, both in cutaway
/// source pixels (see `cw`). Smaller rooms come first so they win the hover
/// over the garden around them.
type RoomDef = (&'static str, &'static str, RoomGo, &'static str, &'static [(f32, f32)], (f32, f32));
const ROOMS: [RoomDef; 5] = [
    ("Engine Room", "SKILLS", RoomGo::Scene(SceneId::Engine), "Dave keeps the reactor humming. Ask him about the tools that keep the ship flying.",
        &[(196.0, 394.0), (640.0, 394.0), (658.0, 440.0), (660.0, 504.0), (632.0, 512.0), (632.0, 656.0), (250.0, 656.0), (200.0, 600.0)], (430.0, 410.0)),
    ("Captain's Quarters", "ABOUT", RoomGo::Scene(SceneId::Quarters), "A bunk, a desk, and a mirror up in the treehouse. Stand in front of the mirror and you end up explaining yourself.",
        &[(1150.0, 296.0), (1302.0, 296.0), (1302.0, 470.0), (1150.0, 470.0)], (1226.0, 300.0)),
    ("The Archive", "WRITING", RoomGo::Scene(SceneId::Archive), "",
        &[(205.0, 252.0), (250.0, 234.0), (420.0, 238.0), (436.0, 300.0), (432.0, 386.0), (240.0, 388.0), (205.0, 384.0)], (318.0, 268.0)),
    ("The Dockyard", "WORK", RoomGo::Scene(SceneId::Port), "",
        &[(640.0, 508.0), (986.0, 510.0), (990.0, 666.0), (640.0, 666.0)], (812.0, 524.0)),
    ("The Bridge", "HOME", RoomGo::Scene(SceneId::Bridge), "The garden concourse at the heart of the ship, with the star console up in the nose.",
        &[(440.0, 186.0), (650.0, 160.0), (1000.0, 166.0), (1400.0, 214.0), (1700.0, 384.0), (1756.0, 416.0), (1600.0, 470.0), (1300.0, 560.0),
          (1000.0, 600.0), (990.0, 504.0), (660.0, 500.0), (656.0, 392.0), (436.0, 388.0)], (1560.0, 330.0)),
];
/// Where the cutaway sits on screen (logical), and the source crop it was cut
/// from (make_atlier_rooms.py writes ships/atlier/cutaway.png from CUT_SRC).
const CUT: Rect = Rect { min: Vec2::new(20.0, 60.0), max: Vec2::new(620.0, 278.0) };
const CUT_SRC: (f32, f32, f32) = (10.0, 85.0, 1750.0);

/// Cutaway source pixels to the logical frame.
fn cw(p: (f32, f32)) -> Vec2 {
    let k = CUT.width() / CUT_SRC.2;
    Vec2::new(CUT.min.x + (p.0 - CUT_SRC.0) * k, CUT.min.y + (p.1 - CUT_SRC.1) * k)
}

/// Lights on the cutaway, in source pixels: position, radius (logical px),
/// colour, pulse speed, pulse depth. Engines throb, the lab tubes and the
/// tube hall breathe, the star dais pulses, lanterns twinkle.
const MAP_LIGHTS: &[((f32, f32), f32, (f32, f32, f32), f32, f32)] = &[
    ((40.0, 290.0), 26.0, (1.0, 0.62, 0.22), 3.1, 0.45),
    ((40.0, 425.0), 26.0, (1.0, 0.62, 0.22), 3.3, 0.45),
    ((40.0, 560.0), 26.0, (1.0, 0.62, 0.22), 2.9, 0.45),
    ((34.0, 290.0), 10.0, (1.0, 0.92, 0.7), 17.0, 0.35),
    ((34.0, 425.0), 10.0, (1.0, 0.92, 0.7), 19.0, 0.35),
    ((34.0, 560.0), 10.0, (1.0, 0.92, 0.7), 15.0, 0.35),
    ((318.0, 300.0), 30.0, (1.0, 0.72, 0.3), 1.3, 0.35),
    ((430.0, 480.0), 48.0, (0.45, 0.72, 1.0), 0.9, 0.55),
    ((1600.0, 398.0), 40.0, (0.72, 0.5, 1.0), 1.6, 0.55),
    ((1160.0, 330.0), 5.0, (1.0, 0.82, 0.45), 2.3, 0.8),
    ((1192.0, 302.0), 5.0, (1.0, 0.82, 0.45), 3.1, 0.8),
    ((1262.0, 306.0), 5.0, (1.0, 0.82, 0.45), 2.7, 0.8),
    ((1302.0, 340.0), 5.0, (1.0, 0.82, 0.45), 3.6, 0.8),
    ((1332.0, 318.0), 5.0, (1.0, 0.82, 0.45), 2.1, 0.8),
    ((1140.0, 372.0), 5.0, (1.0, 0.82, 0.45), 3.3, 0.8),
    ((520.0, 330.0), 4.0, (1.0, 0.85, 0.5), 2.6, 0.7),
    ((700.0, 420.0), 4.0, (1.0, 0.85, 0.5), 3.4, 0.7),
    ((860.0, 300.0), 4.0, (1.0, 0.85, 0.5), 2.2, 0.7),
    ((1400.0, 440.0), 4.0, (1.0, 0.85, 0.5), 3.0, 0.7),
    ((1500.0, 330.0), 4.0, (1.0, 0.85, 0.5), 2.8, 0.7),
    ((950.0, 470.0), 4.0, (1.0, 0.85, 0.5), 3.7, 0.7),
    ((700.0, 545.0), 4.0, (1.0, 0.7, 0.2), 6.0, 1.0),
];
/// The waterfall by the treehouse (source px): falling light streaks.
const WATERFALL: ((f32, f32), (f32, f32)) = ((1082.0, 424.0), (1146.0, 498.0));

fn room_poly(i: usize) -> Vec<Vec2> {
    ROOMS[i].4.iter().map(|p| cw(*p)).collect()
}

fn room_label_at(i: usize) -> Vec2 {
    cw(ROOMS[i].5)
}

fn poly_contains(poly: &[Vec2], at: Vec2) -> bool {
    let mut odd = false;
    let mut j = poly.len() - 1;
    for i in 0..poly.len() {
        let (a, b) = (poly[i], poly[j]);
        if (a.y > at.y) != (b.y > at.y) && at.x < (b.x - a.x) * (at.y - a.y) / (b.y - a.y) + a.x {
            odd = !odd;
        }
        j = i;
    }
    odd
}

fn room_at(at: Vec2) -> Option<usize> {
    (0..ROOMS.len()).find(|i| poly_contains(&room_poly(*i), at))
}

fn room_dest(go: RoomGo) -> Option<&'static str> {
    match go {
        RoomGo::Scene(SceneId::Port) => Some("work"),
        RoomGo::Scene(SceneId::Archive) => Some("writing"),
        RoomGo::Scene(SceneId::Quarters) => Some("about"),
        RoomGo::Dest(d) => Some(d),
        _ => None,
    }
}

/// Destinations on the atlas, positions from the art pack's destinations.json.
const DESTS: [(&str, Vec2); 4] = [
    ("work", Vec2::new(140.0, 137.0)),
    ("about", Vec2::new(326.0, 85.0)),
    ("writing", Vec2::new(473.0, 180.0)),
    ("contact", Vec2::new(270.0, 256.0)),
];

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

fn setup_ui(
    mut commands: Commands,
    assets: Res<AssetServer>,
    mut layouts: ResMut<Assets<TextureAtlasLayout>>,
    mut images: ResMut<Assets<Image>>,
    registry: Res<Registry>,
    mut ui: ResMut<Ui>,
) {
    commands.insert_resource(Fonts {
        body: crate::load_t(&assets, "fonts/Hind_400Regular.ttf"),
        bold: crate::load_t(&assets, "fonts/Hind_600SemiBold.ttf"),
        // Manaspace for the game chrome: labels, tabs, prompts, stats.
        // Small caps labels: a vector face, so they stay crisp at any scale
        // (the pixel font smeared at fractional sizes).
        label: crate::load_t(&assets, "fonts/Cairo_700Bold.ttf"),
        mana: crate::load_t(&assets, "fonts/Manaspace.ttf"),
        display: crate::load_t(&assets, "fonts/Shupp.otf"),
    });
    let icons = DESTS
        .iter()
        .map(|(id, _)| {
            (
                id.to_string(),
                [
                    crate::load_smooth(&assets, format!("ui/star_map/{id}_normal.png")),
                    crate::load_smooth(&assets, format!("ui/star_map/{id}_selected.png")),
                    crate::load_smooth(&assets, format!("ui/star_map/{id}_visited.png")),
                ],
            )
        })
        .collect();
    let values: Vec<f32> = registry.player.stats.radar.iter().map(|a| a.value).collect();
    let radar = THEMES.map(|t| images.add(radar_image(&values, t.radar)));
    commands.insert_resource(UiArt {
        erikk_faces: crate::load_t(&assets, "portraits/live.png"),
        erikk_call: crate::load_t(&assets, "portraits/call.png"),
        tech_faces: crate::load_t(&assets, "cast/technician/faces.png"),
        tech_call: crate::load_t(&assets, "cast/technician/calls.png"),
        arch_faces: crate::load_t(&assets, "cast/archivist/faces.png"),
        arch_call: crate::load_t(&assets, "cast/archivist/calls.png"),
        mech_faces: crate::load_t(&assets, "cast/mechanic/faces.png"),
        mech_call: crate::load_t(&assets, "cast/mechanic/calls.png"),
        faces_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(256, 352), 4, 1, None, None)),
        call_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(192, 256), 4, 1, None, None)),
        atlas_bg: crate::load_t(&assets, "scenes/atlas.png"),
        stars_far: crate::load_t(&assets, "parallax/stars_far.png"),
        stars_near: crate::load_t(&assets, "parallax/stars_near.png"),
        chart: crate::load_t(&assets, "ui/star_map/chart.png"),
        pulse: crate::load_t(&assets, "ui/star_map/selection_pulse.png"),
        pulse_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(112, 112), 12, 1, None, None)),
        tier_icons: crate::load_smooth(&assets, "ui/tier_icons.png"),
        tier_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(96, 96), 4, 6, None, None)),
        icons,
        orbits: DESTS.iter().map(|(id, _)| crate::load_smooth(&assets, format!("ui/star_map/{id}_orbit.png"))).collect(),
        orbit_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(96, 96), 16, 1, None, None)),
        ship_cursor: crate::load_t(&assets, "ui/star_map/ship_cursor.png"),
        // The Atlier, the big terrarium ship, is what travels between stars.
        flight: crate::load_smooth(&assets, "ships/atlier/flight.png"),
        flight_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(768, 448), 4, 1, None, None)),
        cutaway: crate::load_smooth(&assets, "ships/atlier/cutaway.png"),
        glow_dot: images.add(glow_dot_image()),
        streaks: images.add(streak_image()),
        room_glow: (0..ROOMS.len()).map(|i| images.add(room_glow_image(i))).collect(),
        radar,
        full_body: crate::load_smooth(&assets, "portraits/full_body.png"),
        ui_icons: [
            "ui/menu/status.png",
            "ui/menu/items.png",
            "ui/menu/quests.png",
            "ui/menu/map.png",
            "ui/icon_credential.png",
            "ui/icon_degree.png",
            "ui/menu/active_quest_star.png",
            "ui/icon_quest_done.png",
            "ui/menu/character.png",
            "ui/menu/ship.png",
            "ui/menu/settings.png",
            "ui/menu/sound_on.png",
            "ui/menu/sound_off.png",
        ]
        .map(|p| crate::load_smooth(&assets, p)),
        key_e: crate::load_t(&assets, "ui/key_e.png"),
        key_tap: crate::load_t(&assets, "ui/key_tap.png"),
    });
    let root = commands
        .spawn(Node {
            position_type: PositionType::Absolute,
            width: Val::Px(VW),
            height: Val::Px(VH),
            overflow: Overflow::clip(),
            ..default()
        })
        .id();
    commands.insert_resource(UiRoot(root));
    ui.hint = 9.0;
    ui.dirty = true;
}

#[allow(clippy::too_many_arguments)]
fn layout_frame(
    window: Single<&Window, With<PrimaryWindow>>,
    time: Res<Time>,
    game: Res<Game>,
    player: Single<&crate::Player>,
    mut ui: ResMut<Ui>,
    mut frame: ResMut<Frame>,
    mut scale: ResMut<UiScale>,
    root: Res<UiRoot>,
    mut camera: Single<(&mut Transform, &mut Projection), With<Camera2d>>,
    mut nodes: Query<&mut Node, Without<Pinned>>,
    mut pinned: Query<&mut Node, With<Pinned>>,
) {
    let size = Vec2::new(window.width(), window.height());
    if size.x < 1.0 {
        return;
    }
    // Tall screens (phones held upright) fill the height and follow Erikk
    // while exploring and talking; maps, menus and travel show the whole frame.
    let portrait = size.y > size.x * 1.05 && matches!(game.mode, Mode::Explore | Mode::Dialogue);
    let switched = portrait != frame.portrait || size != frame.window;
    let (s, x0, vw) = if portrait {
        let s = size.y / VH;
        let vw = (size.x / s).min(VW);
        let target = (player.foot.x - vw / 2.0).clamp(0.0, VW - vw);
        let x0 = if switched { target } else { frame.view_x0 + (target - frame.view_x0) * (1.0 - (-6.0 * time.delta_secs()).exp()) };
        (s, x0, vw)
    } else {
        ((size.x / VW).min(size.y / VH), 0.0, VW)
    };
    if !switched && (x0 - frame.view_x0).abs() < 0.01 {
        return;
    }
    if portrait != frame.portrait || (vw - frame.view_w).abs() > 0.5 {
        // The HUD and dialogue lay out for the new width.
        ui.hud_key.clear();
        ui.dirty = true;
    }
    frame.window = size;
    frame.portrait = portrait;
    frame.scale = s;
    frame.view_x0 = x0;
    frame.view_w = vw;
    frame.offset = if portrait { Vec2::new(-x0, 0.0) } else { (size / s - Vec2::new(VW, VH)) / 2.0 };
    scale.0 = s;
    let (tf, proj) = &mut *camera;
    tf.translation.x = if portrait { x0 + vw / 2.0 - VW / 2.0 } else { 0.0 };
    if let Projection::Orthographic(o) = &mut **proj {
        o.scaling_mode = if portrait {
            bevy::camera::ScalingMode::FixedVertical { viewport_height: VH }
        } else {
            bevy::camera::ScalingMode::AutoMin { min_width: VW, min_height: VH }
        };
    }
    if let Ok(mut node) = nodes.get_mut(root.0) {
        node.left = Val::Px(frame.offset.x);
        node.top = Val::Px(frame.offset.y);
    }
    for mut node in &mut pinned {
        node.left = Val::Px(x0);
        node.width = Val::Px(vw);
    }
}

// ---------------------------------------------------------------------------
// Requests: interactions, menu, page links
// ---------------------------------------------------------------------------

/// The About readout (the quarters desk), or the same story as Erikk and his
/// reflection trading lines (the mirror).
fn about_lines(registry: &Registry, mirror: bool) -> Vec<Line> {
    let dest = registry.dest("about");
    let name = registry.player.stats.name.clone();
    let mut lines = Vec::new();
    for (i, chunk) in std::iter::once(dest.preview.clone())
        .chain(dest.intro.iter().cloned())
        .flat_map(|p| paginate(&p))
        .enumerate()
    {
        let speaker = if mirror && i % 2 == 1 { format!("{name} · in the mirror") } else { name.clone() };
        lines.push(Line { speaker, who: Who::Erikk, pose: [1, 2, 0, 3][i % 4], call: false, text: chunk });
    }
    lines.push(Line {
        speaker: if mirror { format!("{name} · in the mirror") } else { name },
        who: Who::Erikk,
        pose: 1,
        call: false,
        text: "Open the menu for the full character sheet: stats, items and the quest log.".into(),
    });
    lines
}

fn handle_request(mut game: ResMut<Game>, mut ui: ResMut<Ui>, registry: Res<Registry>) {
    let Some(req) = game.request.take() else { return };
    if game.mode == Mode::Travel {
        return;
    }
    ui.dirty = true;
    // The key press that opened this (E at a console) must not also act on
    // it in the same frame, e.g. confirming the star map's default planet.
    ui.fresh = true;
    match req {
        Request::Atlas => {
            let here = match game.scene {
                SceneId::Archive => 2,
                // Never preselect the Mirror Moon (About): an extra E at the
                // console would read as "the star map opens the mirror".
                _ => 0,
            };
            ui.atlas_sel = here;
            game.mode = Mode::Atlas;
        }
        Request::Ship => {
            let here = ROOMS.iter().position(|r| matches!(r.2, RoomGo::Scene(s) if s == game.scene)).unwrap_or(0);
            ui.ship_sel = here;
            game.mode = Mode::Ship;
        }
        Request::Menu if game.html_menus => open_sheet(&mut game, "0"),
        Request::MenuTab(t) if game.html_menus => open_sheet(&mut game, &t.to_string()),
        Request::Terminal(id) if game.html_menus => {
            game.mark_visited(&id);
            open_sheet(&mut game, &format!("terminal:{id}"));
        }
        Request::Menu => {
            ui.tab = 0;
            ui.sel = 0;
            game.mode = Mode::Sheet;
        }
        Request::Mirror => {
            game.mark_visited("about");
            ui.dialogue = Some(Dialogue { lines: about_lines(&registry, true), idx: 0, shown: 0.0, after: None });
            game.mode = Mode::Dialogue;
        }
        Request::MenuTab(t) => {
            ui.tab = t.min(TABS.len() - 1);
            ui.sel = 0;
            game.mode = Mode::Sheet;
        }
        Request::Door(to) => start_travel(&mut game, &mut ui, to, false),
        Request::Lift => game.mode = Mode::Lift,
        Request::Terminal(id) => {
            game.mark_visited(&id);
            ui.terminal = Some(Terminal::new(registry.dest(&id)));
            game.mode = Mode::Terminal;
            bridge::emit("terminal", "open");
            emit_preview(ui.terminal.as_ref());
        }
        Request::Hatch => {
            let first = !game.hatch_open;
            game.hatch_open = true;
            let text = if first {
                "Under the grating: a brass socket wrench, worn smooth, with \"D.\" scratched in the handle. Relic found."
            } else {
                "Just pipes and the hum of the reactor down there now."
            };
            let name = registry.player.stats.name.clone();
            let lines = vec![Line { speaker: name, who: Who::Erikk, pose: if first { 2 } else { 0 }, call: false, text: text.into() }];
            ui.dialogue = Some(Dialogue { lines, idx: 0, shown: 0.0, after: None });
            game.mode = Mode::Dialogue;
        }
        Request::Crescent => {
            let name = registry.player.stats.name.clone();
            let lines = vec![
                Line { speaker: name.clone(), who: Who::Erikk, pose: 0, call: false, text: "The Crescent. Fast, nimble, and built for the long jumps between stars.".into() },
                Line { speaker: name, who: Who::Erikk, pose: 2, call: false, text: "Her flight systems are still being tuned. Once they're ready, she'll take us out to the planets.".into() },
            ];
            ui.dialogue = Some(Dialogue { lines, idx: 0, shown: 0.0, after: None });
            game.mode = Mode::Dialogue;
        }
        Request::Talk(Npc::Mechanic) => {
            // Dave tells the stack as gear: the "weapons" half of the skills tab.
            let name = "Dave the Mechanic";
            let skills = &registry.player.stats.skills;
            let mut lines = vec![Line {
                speaker: name.into(),
                who: Who::Mechanic,
                pose: 1,
                call: false,
                text: "Captain. Mind the pistons, they bite. Want the rundown on what keeps this tub flying?".into(),
            }];
            for (i, chunk) in skills.chunks(3).enumerate() {
                let kit = chunk.join(", ");
                let text = match i {
                    0 => format!("Main drive's built on {kit}. Never once let us down."),
                    1 => format!("Then there's the auxiliary kit: {kit}."),
                    _ => format!("And in the back of the toolbox: {kit}."),
                };
                lines.push(Line { speaker: name.into(), who: Who::Mechanic, pose: if i % 2 == 0 { 2 } else { 0 }, call: false, text });
            }
            lines.push(Line {
                speaker: name.into(),
                who: Who::Mechanic,
                pose: 3,
                call: false,
                text: "The console tunes the engines, and the board up top has the full ship's log. And if you find my wrench, it's mine.".into(),
            });
            ui.dialogue = Some(Dialogue { lines, idx: 0, shown: 0.0, after: None });
            game.mode = Mode::Dialogue;
        }
        Request::Talk(npc) => {
            let (who, name, dest, closing) = match npc {
                Npc::Technician => (
                    Who::Technician,
                    "Terri the Technician",
                    registry.dest("work"),
                    "The workbench has the full manifest. Every entry opens the real write-up.",
                ),
                Npc::Archivist | Npc::Mechanic => (
                    Who::Archivist,
                    "Astro the Archivist",
                    registry.dest("writing"),
                    "The records console holds the catalog. Pick an entry and I'll pull the full text.",
                ),
            };
            let place = if who == Who::Technician { "the Dockyard" } else { "the Archive" };
            let mut lines = vec![Line {
                speaker: name.into(),
                who,
                pose: 1,
                call: false,
                text: format!("Welcome to {place}, Captain."),
            }];
            for (i, chunk) in dest.intro.iter().flat_map(|p| paginate(p)).enumerate() {
                lines.push(Line { speaker: name.into(), who, pose: if i % 2 == 0 { 2 } else { 0 }, call: false, text: chunk });
            }
            lines.push(Line { speaker: name.into(), who, pose: 0, call: false, text: dest.preview.clone() });
            // Terri's fourth face is "surprised", which doesn't fit a sign-off.
            let last = if who == Who::Technician { 1 } else { 3 };
            lines.push(Line { speaker: name.into(), who, pose: last, call: false, text: closing.into() });
            ui.dialogue = Some(Dialogue { lines, idx: 0, shown: 0.0, after: None });
            game.mode = Mode::Dialogue;
        }
        Request::Destination(id) => match id.as_str() {
            "work" => start_travel(&mut game, &mut ui, SceneId::Port, true),
            "writing" => start_travel(&mut game, &mut ui, SceneId::Archive, true),
            "about" => {
                game.mark_visited("about");
                ui.dialogue = Some(Dialogue { lines: about_lines(&registry, false), idx: 0, shown: 0.0, after: None });
                game.mode = Mode::Dialogue;
            }
            "contact" => {
                game.mark_visited("contact");
                let dest = registry.dest("contact");
                let name = registry.player.stats.name.clone();
                let mut lines = vec![Line {
                    speaker: name.clone(),
                    who: Who::Erikk,
                    pose: 0,
                    call: true,
                    text: "Transmission open. You've reached the comms beacon.".into(),
                }];
                for chunk in dest.intro.iter().flat_map(|p| paginate(p)) {
                    lines.push(Line { speaker: name.clone(), who: Who::Erikk, pose: 0, call: true, text: chunk });
                }
                ui.dialogue = Some(Dialogue { lines, idx: 0, shown: 0.0, after: Some(Request::Terminal("contact".into())) });
                game.mode = Mode::Dialogue;
            }
            _ => game.mode = Mode::Explore,
        },
    }
}

/// Phones: the page shows the menu or a terminal as a scrolling sheet over
/// the paused game, and unpauses it when the sheet closes.
fn open_sheet(game: &mut Game, what: &str) {
    let what = if game.hatch_open { format!("{what}|hatch") } else { what.to_owned() };
    bridge::emit("sheet", &what);
    game.paused = true;
    game.mode = Mode::Explore;
}

fn start_travel(game: &mut Game, ui: &mut Ui, to: SceneId, flight: bool) {
    if !flight && to == game.scene {
        game.mode = Mode::Explore;
        return;
    }
    ui.travel = Some(Travel { t: 0.0, len: if flight { 2.2 } else { 0.6 }, to, swapped: false, flight });
    game.mode = Mode::Travel;
}

/// Split a paragraph into dialogue pages of about two lines each.
fn paginate(text: &str) -> Vec<String> {
    const MAX: usize = 190;
    let mut pages = Vec::new();
    let mut cur = String::new();
    for sentence in text.split_inclusive(['.', '!', '?']) {
        let s = sentence.trim();
        if s.is_empty() {
            continue;
        }
        if !cur.is_empty() && cur.len() + s.len() + 1 > MAX {
            pages.push(std::mem::take(&mut cur));
        }
        if !cur.is_empty() {
            cur.push(' ');
        }
        cur.push_str(s);
    }
    if !cur.is_empty() {
        pages.push(cur);
    }
    pages
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

fn input(
    keys: Res<ButtonInput<KeyCode>>,
    mouse: Res<ButtonInput<MouseButton>>,
    touches: Res<Touches>,
    page_tap: Res<crate::PageTap>,
    window: Single<&Window, With<PrimaryWindow>>,
    frame: Res<Frame>,
    registry: Res<Registry>,
    mut typed_keys: MessageReader<bevy::input::keyboard::KeyboardInput>,
    mut game: ResMut<Game>,
    mut ui: ResMut<Ui>,
) {
    let typed_keys: Vec<_> = typed_keys.read().filter(|k| k.state.is_pressed()).map(|k| k.logical_key.clone()).collect();
    if ui.fresh {
        ui.fresh = false;
        return;
    }
    if std::mem::take(&mut game.touch_hint) {
        ui.touch = true;
        ui.dirty = true;
    }
    if page_tap.at.is_some() {
        ui.touch = page_tap.touch;
    } else if touches.any_just_pressed() {
        ui.touch = true;
    } else if keys.get_just_pressed().next().is_some() {
        ui.touch = false;
    }
    if game.paused {
        return;
    }
    let tap = crate::pointer_press(&mouse, &touches, &page_tap, &window, &frame);
    let ok = keys.any_just_pressed([KeyCode::KeyE, KeyCode::Enter, KeyCode::Space]);
    let back = keys.any_just_pressed([KeyCode::Escape, KeyCode::Backspace]);
    let up = keys.any_just_pressed([KeyCode::ArrowUp, KeyCode::KeyW]);
    let down = keys.any_just_pressed([KeyCode::ArrowDown, KeyCode::KeyS]);
    let left = keys.any_just_pressed([KeyCode::ArrowLeft, KeyCode::KeyA]);
    let right = keys.any_just_pressed([KeyCode::ArrowRight, KeyCode::KeyD]);
    let close_hit = |at: Vec2| CLOSE.contains(at);

    match game.mode {
        Mode::Explore => {
            // The tray is pinned to the view, which pans in portrait.
            let tap = tap.map(|t| t - Vec2::new(frame.view_x0, 0.0));
            let tray_tap = |r: Rect| ui.tray && tap.is_some_and(|t| r.contains(t));
            if keys.any_just_pressed([KeyCode::Escape, KeyCode::KeyC, KeyCode::Tab]) || tray_tap(MENU_BTN) {
                ui.tray = false;
                game.request = Some(Request::Menu);
            } else if keys.just_pressed(KeyCode::KeyM) || tray_tap(MAP_BTN) {
                // M and the tray's map button open the ship map; the bridge's star console has the planets.
                ui.tray = false;
                game.request = Some(Request::Ship);
            } else if tray_tap(SOUND_BTN) {
                // The tray stays open so the icon visibly flips.
                game.sound = !game.sound;
                bridge::emit("sound", if game.sound { "on" } else { "off" });
            } else if let Some(t) = tap {
                // The sliver opens the tray; its chevron, or any tap elsewhere, closes it.
                ui.tray = if ui.tray { false } else { SLIVER.contains(t) };
            }
        }
        Mode::Dialogue => {
            if ok || tap.is_some() || back {
                let Some(d) = ui.dialogue.as_mut() else { return };
                let len = d.lines[d.idx].text.chars().count() as f32;
                if d.shown < len && !back {
                    d.shown = len;
                } else if d.idx + 1 < d.lines.len() && !back {
                    d.idx += 1;
                    d.shown = 0.0;
                    ui.dirty = true;
                } else {
                    let after = d.after.take();
                    ui.dialogue = None;
                    game.mode = Mode::Explore;
                    game.request = after;
                    ui.dirty = true;
                }
            }
        }
        Mode::Terminal => {
            let Some(term) = ui.terminal.as_mut() else { return };
            let before = (term.sel, term.query.clone());
            // Letters type into the search box, so only the arrows move the cursor here.
            let mut close = keys.just_pressed(KeyCode::Escape) && term.query.is_empty();
            if keys.just_pressed(KeyCode::Escape) && !term.query.is_empty() {
                term.query.clear();
                term.refilter();
            }
            if let Some(q) = game.search.take() {
                term.query = q;
                term.refilter();
            }
            for key in &typed_keys {
                use bevy::input::keyboard::Key;
                match key {
                    Key::Character(c) if c.chars().all(|ch| !ch.is_control()) && term.query.chars().count() < 28 => {
                        term.query.push_str(c);
                        term.refilter();
                    }
                    Key::Space if !term.query.is_empty() => {
                        term.query.push(' ');
                        term.refilter();
                    }
                    Key::Backspace => {
                        term.query.pop();
                        term.refilter();
                    }
                    _ => {}
                }
            }
            let n = term.hits.len();
            let up = keys.just_pressed(KeyCode::ArrowUp);
            let down = keys.just_pressed(KeyCode::ArrowDown);
            if up && term.sel > 0 {
                term.sel -= 1;
            }
            if down && term.sel + 1 < n {
                term.sel += 1;
            }
            if keys.just_pressed(KeyCode::PageUp) {
                term.sel = term.sel.saturating_sub(T_ROWS);
            }
            if keys.just_pressed(KeyCode::PageDown) && n > 0 {
                term.sel = (term.sel + T_ROWS).min(n - 1);
            }
            if keys.just_pressed(KeyCode::Home) {
                term.sel = 0;
            }
            if keys.just_pressed(KeyCode::End) && n > 0 {
                term.sel = n - 1;
            }
            let mut open = keys.just_pressed(KeyCode::Enter) && n > 0;
            if let Some(at) = tap {
                if close_hit(at) {
                    close = true;
                } else if let Some(i) = terminal_row_at(at, term.sel, n) {
                    // A tap only selects and previews; opening the page is the button's job.
                    term.sel = i;
                } else if OPEN_BTN.contains(at) && n > 0 {
                    open = true;
                }
            }
            if open {
                if let Some(it) = term.current() {
                    bridge::emit("open", &it.href);
                }
            }
            let changed = term.sel != before.0 || term.query != before.1;
            if changed {
                emit_preview(Some(term));
            }
            if changed || close {
                ui.dirty = true;
            }
            if close {
                game.mode = Mode::Explore;
                ui.dirty = true;
                bridge::emit("terminal", "");
                emit_preview(None);
            }
        }
        Mode::Ship => {
            // The ship map: fast travel between the Atlier's rooms. Hovering a
            // room highlights it.
            let n = ROOMS.len();
            if let Some(c) = window.cursor_position() {
                let at = frame.to_scene(c);
                if let Some(i) = room_at(at) && i != ui.ship_sel && ui.hover_at != Some(at) {
                    ui.ship_sel = i;
                    ui.dirty = true;
                }
                ui.hover_at = Some(at);
            }
            if left || up {
                ui.ship_sel = (ui.ship_sel + n - 1) % n;
                ui.dirty = true;
            }
            if right || down {
                ui.ship_sel = (ui.ship_sel + 1) % n;
                ui.dirty = true;
            }
            let mut go = ok;
            if let Some(at) = tap {
                if close_hit(at) {
                    game.mode = Mode::Explore;
                    ui.dirty = true;
                    return;
                }
                if let Some(i) = room_at(at) {
                    if i == ui.ship_sel {
                        go = true;
                    } else {
                        ui.ship_sel = i;
                        ui.dirty = true;
                    }
                } else if TRAVEL_BTN.contains(at) {
                    go = true;
                }
            }
            if go {
                game.mode = Mode::Explore;
                game.request = Some(match ROOMS[ui.ship_sel].2 {
                    RoomGo::Scene(s) if s == game.scene => {
                        ui.dirty = true;
                        return;
                    }
                    RoomGo::Scene(s) => Request::Door(s),
                    RoomGo::Dest(d) => Request::Destination(d.to_owned()),
                });
                ui.dirty = true;
            } else if back || keys.just_pressed(KeyCode::KeyM) {
                game.mode = Mode::Explore;
                ui.dirty = true;
            }
        }
        Mode::Atlas => {
            let n = DESTS.len();
            if left || up {
                ui.atlas_sel = (ui.atlas_sel + n - 1) % n;
                ui.dirty = true;
            }
            if right || down {
                ui.atlas_sel = (ui.atlas_sel + 1) % n;
                ui.dirty = true;
            }
            let mut go = ok;
            if let Some(at) = tap {
                if close_hit(at) {
                    game.mode = Mode::Explore;
                    ui.dirty = true;
                    return;
                }
                if let Some(i) = DESTS.iter().position(|(_, p)| p.distance(at) < 24.0) {
                    if i == ui.atlas_sel {
                        go = true;
                    } else {
                        ui.atlas_sel = i;
                        ui.dirty = true;
                    }
                } else if TRAVEL_BTN.contains(at) {
                    go = true;
                }
            }
            if go {
                let id = DESTS[ui.atlas_sel].0.to_owned();
                game.mode = Mode::Explore;
                game.request = Some(Request::Destination(id));
                ui.dirty = true;
            } else if back || keys.just_pressed(KeyCode::KeyM) {
                game.mode = Mode::Explore;
                ui.dirty = true;
            }
        }
        Mode::Sheet => {
            let stats = &registry.player.stats;
            let suit = SUITS[ui.suit].0;
            let (list_len, cols) = match ui.tab {
                1 => (stats.inventory.key_items.len() + usize::from(game.hatch_open), ITEM_COLS),
                2 => (stats.cards.iter().filter(|c| c.suit == suit).count(), CARD_COLS),
                3 => (stats.quest_log.len() + stats.training.len(), 1),
                _ => (0, 1),
            };
            let mut changed = false;
            // F opens the full resume from the quest log.
            if ui.tab == 3 && keys.just_pressed(KeyCode::KeyF) {
                bridge::emit("open", "/resume");
                return;
            }
            // A quest opened in full: any key or tap closes it, except the resume hint.
            if ui.quest_full {
                if ui.touch && tap.is_some_and(|at| RESUME_BTN.contains(at)) {
                    bridge::emit("open", "/resume");
                } else if back || ok || tap.is_some() || left || right || up || down {
                    ui.quest_full = false;
                    ui.dirty = true;
                }
                return;
            }
            let set_tab = |ui: &mut Ui, t: usize| {
                ui.tab = t;
                ui.sel = 0;
                ui.quest_full = false;
            };
            let shift = keys.any_pressed([KeyCode::ShiftLeft, KeyCode::ShiftRight]);
            let tab_key = keys.just_pressed(KeyCode::Tab);
            let next = (tab_key && !shift) || keys.just_pressed(KeyCode::KeyQ);
            // In the grids the arrows move the cursor; elsewhere left/right flip tabs.
            let grid = cols > 1;
            if tab_key && shift {
                // Shift+Tab: in Skills, the next suit; elsewhere, the previous tab.
                if ui.tab == 2 {
                    ui.suit = (ui.suit + 1) % SUITS.len();
                    ui.sel = 0;
                } else {
                    let t = (ui.tab + TABS.len() - 1) % TABS.len();
                    set_tab(&mut ui, t);
                }
                changed = true;
            } else if next || (!grid && right) {
                let t = (ui.tab + 1) % TABS.len();
                set_tab(&mut ui, t);
                changed = true;
            } else if !grid && left {
                let t = (ui.tab + TABS.len() - 1) % TABS.len();
                set_tab(&mut ui, t);
                changed = true;
            } else {
                let sel = ui.sel;
                let to = if up && sel >= cols {
                    sel - cols
                } else if down && sel + cols < list_len {
                    sel + cols
                } else if down && cols == 1 && sel + 1 < list_len {
                    sel + 1
                } else if grid && left && sel > 0 {
                    sel - 1
                } else if grid && right && sel + 1 < list_len {
                    sel + 1
                } else {
                    sel
                };
                if to != sel {
                    ui.sel = to;
                    changed = true;
                }
            }
            if ui.tab == 2 {
                for (i, k) in [KeyCode::Digit1, KeyCode::Digit2, KeyCode::Digit3, KeyCode::Digit4].iter().enumerate() {
                    if keys.just_pressed(*k) {
                        ui.suit = i;
                        ui.sel = 0;
                        changed = true;
                    }
                }
            }
            // T, or a footer chip, picks the menu theme; the page remembers it.
            let theme_pick = if keys.just_pressed(KeyCode::KeyT) {
                Some((game.menu_theme + 1) % THEMES.len())
            } else {
                tap.and_then(|at| (0..THEMES.len()).find(|i| theme_rect(*i).contains(at)))
            };
            if let Some(i) = theme_pick {
                game.menu_theme = i;
                bridge::emit("theme", &THEMES[i].name.to_lowercase());
                ui.dirty = true;
                return;
            }
            if let Some(at) = tap {
                if SHEET_CLOSE.contains(at) {
                    game.mode = Mode::Explore;
                    changed = true;
                } else if let Some(t) = (0..TABS.len()).find(|t| tab_rect(*t).contains(at)) {
                    set_tab(&mut ui, t);
                    changed = true;
                } else if ui.tab == 2 && let Some(i) = (0..SUITS.len()).find(|i| suit_rect(*i).contains(at)) {
                    ui.suit = i;
                    ui.sel = 0;
                    changed = true;
                } else if grid && let Some(i) = (0..list_len).find(|i| grid_rect(ui.tab, *i).contains(at)) {
                    ui.sel = i;
                    changed = true;
                } else if ui.tab == 3 && let Some(i) = sheet_row_at(at, ui.sel, list_len) {
                    // First tap selects (summary on the right); a second tap opens it in full.
                    if i == ui.sel {
                        ui.quest_full = true;
                    }
                    ui.sel = i;
                    changed = true;
                } else if ui.tab == 3 && ui.touch && RESUME_BTN.contains(at) {
                    bridge::emit("open", "/resume");
                } else if ui.tab == 3 && QUEST_CARD.contains(at) {
                    ui.quest_full = true;
                    changed = true;
                }
            }
            if ok && ui.tab == 3 {
                ui.quest_full = true;
                changed = true;
            }
            if back || keys.just_pressed(KeyCode::KeyC) {
                game.mode = Mode::Explore;
                changed = true;
            }
            if changed {
                ui.dirty = true;
            }
        }
        Mode::Travel | Mode::Lift => {}
    }
}

// Shared geometry between layout and hit tests.
const TERM: Rect = Rect { min: Vec2::new(28.0, 14.0), max: Vec2::new(612.0, 346.0) };
const LIST_X: f32 = 44.0;
const LIST_W: f32 = 300.0;
const T_TOP: f32 = 86.0;
const ROW_H: f32 = 28.0;
const T_ROWS: usize = 8;
const OPEN_BTN: Rect = Rect { min: Vec2::new(470.0, 312.0), max: Vec2::new(596.0, 334.0) };
/// The close X, tucked inside the top-right corner of the 28..612 panel.
const CLOSE: Rect = Rect { min: Vec2::new(578.0, 22.0), max: Vec2::new(602.0, 44.0) };
/// Search box above the terminal list; the page lays a real input over it on phones.
const SEARCH: Rect = Rect { min: Vec2::new(44.0, 62.0), max: Vec2::new(344.0, 80.0) };
/// The page lays an iframe of the selected page over this box.
const PREVIEW: Rect = Rect { min: Vec2::new(364.0, 62.0), max: Vec2::new(596.0, 210.0) };
const TRAVEL_BTN: Rect = Rect { min: Vec2::new(488.0, 304.0), max: Vec2::new(620.0, 334.0) };

fn term_start(sel: usize, n: usize) -> usize {
    if n <= T_ROWS { 0 } else { sel.saturating_sub(T_ROWS / 2).min(n - T_ROWS) }
}

fn terminal_row_at(at: Vec2, sel: usize, n: usize) -> Option<usize> {
    if at.x < LIST_X || at.x > LIST_X + LIST_W || at.y < T_TOP {
        return None;
    }
    let row = ((at.y - T_TOP) / ROW_H) as usize;
    let i = term_start(sel, n) + row;
    (row < T_ROWS && i < n).then_some(i)
}

fn rarity_color(r: &str) -> Color {
    match r {
        "legendary" => Color::srgb(0.91, 0.73, 0.29),
        "unique" => Color::srgb(0.69, 0.42, 0.85),
        "rare" => Color::srgb(0.31, 0.62, 0.85),
        "uncommon" => Color::srgb(0.55, 0.74, 0.47),
        _ => Color::srgb(0.62, 0.62, 0.62),
    }
}

fn suit_color(s: &str) -> Color {
    match s {
        "skill" => Color::srgb(0.36, 0.55, 0.78),
        "discipline" => Color::srgb(0.38, 0.66, 0.52),
        "special" => Color::srgb(0.91, 0.73, 0.29),
        "profile" => Color::srgb(0.80, 0.45, 0.62),
        _ => Color::srgb(0.72, 0.50, 0.32),
    }
}

fn title_case(s: &str) -> String {
    let mut c = s.chars();
    c.next().map(|f| f.to_uppercase().collect::<String>() + c.as_str()).unwrap_or_default()
}

// ---------------------------------------------------------------------------
// Per-frame animation
// ---------------------------------------------------------------------------

fn tick(
    time: Res<Time>,
    mut game: ResMut<Game>,
    mut ui: ResMut<Ui>,
    art: Res<UiArt>,
    mut enter: MessageWriter<EnterScene>,
    mut texts: Query<&mut Text>,
    mut images: Query<&mut ImageNode>,
    mut nodes: Query<&mut Node>,
    mut bgs: Query<&mut BackgroundColor>,
    mut vis: Query<&mut Visibility>,
) {
    let dt = time.delta_secs();
    ui.hint = (ui.hint - dt).max(0.0);
    ui.mouth += dt;

    if let Some(d) = ui.dialogue.as_mut() {
        let line = &d.lines[d.idx];
        let len = line.text.chars().count() as f32;
        d.shown = (d.shown + dt * 70.0).min(len);
        let typing = d.shown < len;
        let shown: String = line.text.chars().take(d.shown as usize).collect();
        let call = line.call;
        let pose = line.pose;
        let (typed, more, portrait) = (ui.typed, ui.more, ui.portrait);
        if let Some(e) = typed {
            if let Ok(mut t) = texts.get_mut(e) {
                if t.0 != shown {
                    t.0 = shown;
                }
            }
        }
        if let Some(e) = more {
            if let Ok(mut v) = vis.get_mut(e) {
                let blink = (time.elapsed_secs() * 3.0).sin() > -0.3;
                *v = if !typing && blink { Visibility::Inherited } else { Visibility::Hidden };
            }
        }
        if let Some(e) = portrait {
            if let Ok(mut img) = images.get_mut(e) {
                if let Some(atlas) = img.texture_atlas.as_mut() {
                    atlas.index = if call {
                        if typing { [1, 2, 3, 2][((ui.mouth / 0.09) as usize) % 4] } else { 0 }
                    } else {
                        pose
                    };
                }
            }
        }
    }

    if let Some(tr) = ui.travel.as_mut() {
        tr.t += dt;
        let (t, len) = (tr.t, tr.len);
        if !tr.swapped && t >= len * 0.4 {
            tr.swapped = true;
            enter.write(EnterScene(tr.to));
        }
        // Fade: in over the first 0.25 s, out over the last 0.25 s.
        let fade = if t < 0.25 { t / 0.25 } else if t > len - 0.25 { ((len - t) / 0.25).max(0.0) } else { 1.0 };
        let flight = tr.flight;
        if let Some(e) = ui.fade {
            if let Ok(mut bg) = bgs.get_mut(e) {
                bg.0 = INK_SOLID.with_alpha(if flight { fade } else { fade });
            }
            if let Ok(mut img) = images.get_mut(e) {
                img.color = Color::WHITE.with_alpha(fade);
            }
        }
        if let Some(e) = ui.flight {
            let k = (t / len).clamp(0.0, 1.0);
            if let Ok(mut n) = nodes.get_mut(e) {
                n.left = Val::Px(-200.0 + k * (VW + 220.0));
                n.top = Val::Px(124.0 - (k * 6.0).sin() * 6.0);
            }
            if let Ok(mut img) = images.get_mut(e) {
                img.color = Color::WHITE.with_alpha(fade);
                if let Some(a) = img.texture_atlas.as_mut() {
                    a.index = ((t / 0.11) as usize) % 4;
                }
            }
        }
        let _ = &art;
        if t >= len {
            ui.travel = None;
            game.mode = Mode::Explore;
            ui.dirty = true;
        }
    }
}

// ---------------------------------------------------------------------------
// Star map motion
// ---------------------------------------------------------------------------

/// Width of one parallax star strip, in UI pixels.
const PARALLAX_W: f32 = 1280.0;

/// A star strip that scrolls left at this many UI pixels per second.
#[derive(Component)]
struct Parallax(f32);

/// The selection ring around the chosen destination.
#[derive(Component)]
struct Pulse;

/// The light sweep across the selected menu tab; holds the bar width.
#[derive(Component)]
struct Shimmer(f32);

/// The hologram head in a transmission: flickers and bobs.
#[derive(Component)]
struct Holo;

/// The light running along the character menu's scan track; holds the track width.
#[derive(Component)]
struct Scan(f32);

/// Spins a UI node at this many radians a second (the menu's orbit ring).
#[derive(Component)]
struct Cog(f32);

/// A destination planet turning in place.
#[derive(Component)]
struct Orbit(usize);

/// A light on the ship map cutaway, pulsing.
#[derive(Component)]
struct MapLight {
    rgb: Vec3,
    speed: f32,
    depth: f32,
    phase: f32,
}

/// The ship map waterfall's falling streaks.
#[derive(Component)]
struct Streak;

/// The ship map's "you are here" marker, bobbing.
#[derive(Component)]
struct MapBob;

#[allow(clippy::type_complexity, clippy::too_many_arguments)]
fn animate_map(
    time: Res<Time>,
    mut lights: Query<(&MapLight, &mut ImageNode), (Without<Pulse>, Without<Orbit>, Without<Holo>)>,
    mut streaks: Query<&mut Node, (With<Streak>, Without<Parallax>, Without<Shimmer>)>,
    mut bobs: Query<&mut UiTransform, (With<MapBob>, Without<Cog>, Without<Holo>)>,
    mut strips: Query<(&Parallax, &mut Node)>,
    mut pulse: Query<&mut ImageNode, (With<Pulse>, Without<Orbit>)>,
    mut planets: Query<(&Orbit, &mut ImageNode), Without<Pulse>>,
    mut sweeps: Query<(&Shimmer, &mut Node), Without<Parallax>>,
    mut cogs: Query<(&Cog, &mut UiTransform), Without<Holo>>,
    mut holo: Query<(&mut ImageNode, &mut UiTransform), (With<Holo>, Without<Pulse>, Without<Orbit>, Without<Cog>)>,
    mut scans: Query<(&Scan, &mut Node), (Without<Parallax>, Without<Shimmer>, Without<Streak>)>,
) {
    let tt = time.elapsed_secs();
    for (l, mut img) in &mut lights {
        let wave = 0.5 + 0.5 * (tt * l.speed + l.phase).sin();
        // Fast lights flicker; the hazard lamp (depth 1) blinks on and off.
        let a = if l.depth >= 1.0 { if wave > 0.5 { 0.95 } else { 0.0 } } else { 0.9 * (1.0 - l.depth + l.depth * wave) };
        img.color = Color::srgba(l.rgb.x, l.rgb.y, l.rgb.z, a);
    }
    for mut node in &mut streaks {
        node.top = Val::Px(-32.0 + (tt * 26.0) % 32.0);
    }
    for mut tf in &mut bobs {
        tf.translation = Val2::px(0.0, ((tt * 3.2).sin() * 2.0).round());
    }
    for (mut img, mut tf) in &mut holo {
        // Mostly steady, with a quick dip now and then like a weak signal.
        let dip = if (tt * 0.9).fract() < 0.04 { 0.45 } else { 0.0 };
        let a = 0.78 + 0.08 * (tt * 23.0).sin() + 0.04 * (tt * 7.0).sin() - dip;
        img.color = Color::srgba(0.62, 1.0, 1.0, a.clamp(0.2, 1.0));
        tf.translation = Val2::px(if dip > 0.0 { 2.0 } else { 0.0 }, (tt * 1.6).sin() * 2.0);
    }
    for (cog, mut tf) in &mut cogs {
        tf.rotation = Rot2::radians(time.elapsed_secs() * cog.0);
    }
    // Sweep for 0.5 s, rest for 1.3 s, like a light catching a blade.
    let u = (time.elapsed_secs() % 1.8) / 0.5;
    for (sh, mut node) in &mut sweeps {
        let x = if u < 1.0 { -30.0 + (sh.0 + 40.0) * (u * u * (3.0 - 2.0 * u)) } else { -30.0 };
        node.left = Val::Px(x.round());
    }
    let t = time.elapsed_secs();
    // One pass every 8 s, like the deck's scan line.
    for (sc, mut node) in &mut scans {
        node.left = Val::Px((-90.0 + ((t / 8.0) % 1.0) * (sc.0 + 90.0)).round());
    }
    for (p, mut node) in &mut strips {
        node.left = Val::Px(-((t * p.0) % PARALLAX_W).round());
    }
    for mut img in &mut pulse {
        if let Some(a) = img.texture_atlas.as_mut() {
            a.index = (t / 0.09) as usize % 12;
        }
    }
    for (orbit, mut img) in &mut planets {
        if let Some(a) = img.texture_atlas.as_mut() {
            // Each planet keeps its own phase so they don't spin in lockstep.
            a.index = ((t / 0.135) as usize + orbit.0) % 16;
        }
    }
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

fn at(x: f32, y: f32, w: f32, h: f32) -> Node {
    Node {
        position_type: PositionType::Absolute,
        left: Val::Px(x),
        top: Val::Px(y),
        width: Val::Px(w),
        height: Val::Px(h),
        ..default()
    }
}

fn panel(x: f32, y: f32, w: f32, h: f32) -> impl Bundle {
    (
        Node {
            border: UiRect::all(Val::Px(1.0)),
            border_radius: BorderRadius::all(Val::Px(3.0)),
            ..at(x, y, w, h)
        },
        BackgroundColor(INK),
        BorderColor::all(LINE),
    )
}

fn text(font: &Handle<Font>, size: f32, color: Color, s: impl Into<String>) -> impl Bundle {
    (
        Text::new(s.into()),
        TextFont { font: font.clone().into(), font_size: FontSize::Px(size), ..default() },
        TextColor(color),
    )
}

fn text_at(font: &Handle<Font>, size: f32, color: Color, s: impl Into<String>, x: f32, y: f32, w: f32) -> impl Bundle {
    (
        Node { position_type: PositionType::Absolute, left: Val::Px(x), top: Val::Px(y), width: Val::Px(w), ..default() },
        text(font, size, color, s),
    )
}

fn truncate(s: &str, max: usize) -> String {
    if s.chars().count() <= max {
        s.to_owned()
    } else {
        let mut t: String = s.chars().take(max.saturating_sub(1)).collect();
        t.push('…');
        t
    }
}

fn close_button(p: &mut ChildSpawnerCommands, f: &Fonts) {
    p.spawn((
        panel(CLOSE.min.x, CLOSE.min.y, CLOSE.width(), CLOSE.height()),
        children![text_at(&f.label, 11.0, CITRON, "X", 0.0, 3.0, CLOSE.width() - 2.0).with_justify()],
    ));
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

fn render(
    mut commands: Commands,
    mut ui: ResMut<Ui>,
    game: Res<Game>,
    registry: Res<Registry>,
    fonts: Res<Fonts>,
    art: Res<UiArt>,
    root: Res<UiRoot>,
    frame: Res<Frame>,
) {
    if !ui.dirty {
        return;
    }
    ui.dirty = false;
    if let Some(e) = ui.overlay.take() {
        commands.entity(e).despawn();
    }
    ui.typed = None;
    ui.more = None;
    ui.portrait = None;
    ui.fade = None;
    ui.flight = None;
    if game.mode == Mode::Explore {
        return;
    }
    let tall = frame.portrait && game.mode == Mode::Dialogue;
    let vw = if tall { frame.view_w } else { VW };
    let overlay = if tall {
        commands.spawn((Pinned, at(frame.view_x0, 0.0, vw, VH), ZIndex(10))).id()
    } else {
        commands.spawn((at(0.0, 0.0, VW, VH), ZIndex(10))).id()
    };
    commands.entity(root.0).add_child(overlay);
    ui.overlay = Some(overlay);
    let f = &*fonts;
    let mana_dialogue = game.mana_dialogue;

    match game.mode {
        Mode::Dialogue => {
            let Some(d) = ui.dialogue.as_ref() else { return };
            let line = &d.lines[d.idx];
            let (img, layout, w, h) = match (line.who, line.call) {
                (Who::Erikk, false) => (&art.erikk_faces, &art.faces_layout, 124.0, 170.0),
                (Who::Erikk, true) => (&art.erikk_call, &art.call_layout, 120.0, 160.0),
                (Who::Technician, false) => (&art.tech_faces, &art.faces_layout, 124.0, 170.0),
                (Who::Technician, true) => (&art.tech_call, &art.call_layout, 120.0, 160.0),
                (Who::Archivist, false) => (&art.arch_faces, &art.faces_layout, 124.0, 170.0),
                (Who::Archivist, true) => (&art.arch_call, &art.call_layout, 120.0, 160.0),
                (Who::Mechanic, false) => (&art.mech_faces, &art.faces_layout, 124.0, 170.0),
                (Who::Mechanic, true) => (&art.mech_call, &art.call_layout, 120.0, 160.0),
            };
            let mut typed = None;
            let mut more = None;
            let mut portrait = None;
            commands.entity(overlay).with_children(|p| {
                // Portrait phones: a taller box across the narrow view, the
                // speaker smaller above it.
                let (bx, by, bw, bh) = if tall { (6.0, VH - 134.0, vw - 12.0, 128.0) } else { (12.0, 258.0, 616.0, 92.0) };
                let k = if tall { 0.62 } else { 1.0 };
                let (w, h) = (w * k, h * k);
                if line.call && !tall {
                    // A transmission: the caller's head floats as a hologram
                    // over a little brass projector (a codec-style call).
                    portrait = Some(holo_call(p, f, img, layout, line.pose));
                } else {
                    portrait = Some(
                        p.spawn((
                            at(bx + 6.0, by + 4.0 - h + 8.0 * k, w, h),
                            ImageNode::from_atlas_image(img.clone(), TextureAtlas { layout: layout.clone(), index: line.pose }),
                        ))
                        .id(),
                    );
                }
                p.spawn(panel(bx, by, bw, bh)).with_children(|b| {
                    let px = if tall { 8.0 } else { 14.0 };
                    b.spawn(text_at(&f.label, 10.0, LAMP, line.speaker.to_uppercase(), px, 6.0, bw - 16.0));
                    let (font, size) = if mana_dialogue { (&f.mana, if tall { 8.5 } else { 10.0 }) } else { (&f.body, if tall { 11.0 } else { 13.0 }) };
                    typed = Some(b.spawn(text_at(font, size, TEXT, "", px, if tall { 22.0 } else { 24.0 }, bw - 2.0 * px - 2.0)).id());
                    more = Some(b.spawn(text_at(&f.label, 10.0, CITRON, "›", bw - 16.0, bh - 20.0, 14.0)).id());
                });
                p.spawn(text_at(
                    &f.label,
                    8.0,
                    MUTED,
                    format!("{}/{}", d.idx + 1, d.lines.len()),
                    bx + bw - 40.0,
                    by - 12.0,
                    40.0,
                ));
            });
            ui.typed = typed;
            ui.more = more;
            ui.portrait = portrait;
        }

        Mode::Terminal => {
            let Some(term) = ui.terminal.as_ref() else { return };
            let n = term.hits.len();
            let start = term_start(term.sel, n);
            commands.entity(overlay).with_children(|p| {
                p.spawn(panel(TERM.min.x, TERM.min.y, TERM.width(), TERM.height()));
                p.spawn(text_at(&f.label, 9.0, SAGE, format!("TERMINAL · {}", term.dest.label.to_uppercase()), 44.0, 22.0, 400.0));
                p.spawn(text_at(&f.display, 22.0, CITRON, term.dest.name.clone(), 44.0, 32.0, 400.0));
                close_button(p, f);
                // Search box.
                p.spawn((
                    Node { border: UiRect::all(Val::Px(1.0)), border_radius: BorderRadius::all(Val::Px(2.0)), ..at(SEARCH.min.x - 4.0, SEARCH.min.y, SEARCH.width() + 8.0, SEARCH.height()) },
                    BackgroundColor(Color::srgba(0.0, 0.0, 0.0, 0.35)),
                    BorderColor::all(if term.query.is_empty() { LINE } else { CITRON }),
                ));
                let (q, qc) = if term.query.is_empty() {
                    (if ui.touch { "Tap to search".to_owned() } else { "Search: just start typing".to_owned() }, MUTED)
                } else {
                    (format!("{}_", term.query), CITRON)
                };
                p.spawn(text_at(&f.label, 7.0, SAGE, "FIND", SEARCH.min.x + 2.0, SEARCH.min.y + 4.5, 26.0));
                p.spawn(text_at(&f.bold, 10.0, qc, q, SEARCH.min.x + 28.0, SEARCH.min.y + 2.0, SEARCH.width() - 82.0));
                p.spawn(text_at(&f.label, 7.5, MUTED, format!("{} / {}", n, term.dest.items.len()), SEARCH.max.x - 54.0, SEARCH.min.y + 5.0, 52.0).with_justify());
                for (row, k) in (start..n.min(start + T_ROWS)).enumerate() {
                    let item = &term.dest.items[term.hits[k]];
                    let y = T_TOP + row as f32 * ROW_H;
                    let selected = k == term.sel;
                    p.spawn((
                        Node { border_radius: BorderRadius::all(Val::Px(2.0)), ..at(LIST_X - 4.0, y, LIST_W + 8.0, ROW_H - 2.0) },
                        BackgroundColor(if selected { SELECT } else { Color::NONE }),
                    ));
                    p.spawn(text_at(&f.bold, 11.0, if selected { CITRON } else { TEXT }, truncate(&item.title, 44), LIST_X + 4.0, y + 1.0, LIST_W));
                    if let Some(meta) = &item.meta {
                        p.spawn(text_at(&f.label, 7.5, SAGE, truncate(&meta.to_uppercase(), 60), LIST_X + 4.0, y + 15.0, LIST_W));
                    }
                }
                if n == 0 {
                    p.spawn(text_at(&f.body, 11.0, MUTED, format!("Nothing matches \"{}\".", term.query.trim()), LIST_X + 4.0, T_TOP + 6.0, LIST_W));
                }
                // Footer: just the position. PgUp/PgDn keys page; taps near the
                // list edge scroll it, since the window follows the selection.
                if n > 0 {
                    p.spawn(text_at(&f.label, 8.0, MUTED, format!("{} of {}", term.sel + 1, n), LIST_X, 322.0, 80.0));
                }
                // Preview pane: the page draws a live thumbnail of the page over PREVIEW.
                p.spawn((
                    Node { border: UiRect::all(Val::Px(1.0)), border_radius: BorderRadius::all(Val::Px(2.0)), ..at(PREVIEW.min.x, PREVIEW.min.y, PREVIEW.width(), PREVIEW.height()) },
                    BackgroundColor(Color::srgba(0.0, 0.0, 0.0, 0.4)),
                    BorderColor::all(LINE),
                ));
                if let Some(item) = term.current() {
                    let local = item.href.starts_with('/');
                    let note = if local { "Loading preview…" } else { "Opens outside shupp.dev" };
                    p.spawn(text_at(&f.label, 8.0, MUTED, note, PREVIEW.min.x, PREVIEW.min.y + PREVIEW.height() / 2.0 - 5.0, PREVIEW.width()).with_justify());
                    p.spawn(text_at(&f.bold, 12.0, CITRON, truncate(&item.title, 60), PREVIEW.min.x, 218.0, PREVIEW.width()));
                    if let Some(desc) = &item.description {
                        p.spawn(text_at(&f.body, 9.5, TEXT, truncate(desc, 150), PREVIEW.min.x, 250.0, PREVIEW.width()));
                    }
                    p.spawn((panel(OPEN_BTN.min.x, OPEN_BTN.min.y, OPEN_BTN.width(), OPEN_BTN.height()),
                        children![text_at(&f.label, 9.0, CITRON, "OPEN PAGE ›", 0.0, 5.0, OPEN_BTN.width() - 2.0).with_justify()]));
                }
            });
        }

        Mode::Atlas => {
            let here = match game.scene {
                SceneId::Port => DESTS[0].1,
                SceneId::Archive => DESTS[2].1,
                SceneId::Quarters => DESTS[1].1,
                SceneId::Bridge | SceneId::Engine => Vec2::new(320.0, 180.0),
            };
            let sel = ui.atlas_sel;
            let dest = registry.dest(DESTS[sel].0);
            commands.entity(overlay).with_children(|p| {
                // Parallax: far stars drift at 3 px/s, near stars at 11, chart on top.
                p.spawn((at(0.0, 0.0, VW, VH), BackgroundColor(Color::srgb_u8(5, 11, 24))));
                for (img, speed) in [(&art.stars_far, 3.0), (&art.stars_near, 11.0)] {
                    p.spawn((Parallax(speed), at(0.0, 0.0, PARALLAX_W * 2.0, VH))).with_children(|r| {
                        r.spawn((at(0.0, 0.0, PARALLAX_W, VH), ImageNode::new(img.clone())));
                        r.spawn((at(PARALLAX_W, 0.0, PARALLAX_W, VH), ImageNode::new(img.clone())));
                    });
                }
                p.spawn((at(0.0, 0.0, VW, VH), ImageNode::new(art.chart.clone())));
                let sp = DESTS[sel].1;
                p.spawn((
                    Pulse,
                    at(sp.x - 30.0, sp.y - 30.0, 60.0, 60.0),
                    ImageNode::from_atlas_image(art.pulse.clone(), TextureAtlas { layout: art.pulse_layout.clone(), index: 0 }),
                ));
                p.spawn(text_at(&f.label, 9.0, SAGE, "STAR ATLAS", 20.0, 16.0, 200.0));
                p.spawn(text_at(&f.display, 22.0, CITRON, "The Scattered Atlas", 20.0, 26.0, 300.0));
                close_button(p, f);
                for (i, (id, pos)) in DESTS.iter().enumerate() {
                    let d = registry.dest(id);
                    let state = if i == sel { 1 } else if game.visited.iter().any(|v| v == id) { 2 } else { 0 };
                    let icon = art.icons[i].1[state].clone();
                    // A spinning planet with its destination badge pinned to it.
                    p.spawn((
                        Orbit(i * 5),
                        at(pos.x - 20.0, pos.y - 20.0, 40.0, 40.0),
                        ImageNode::from_atlas_image(art.orbits[i].clone(), TextureAtlas { layout: art.orbit_layout.clone(), index: i * 5 }),
                    ));
                    p.spawn((at(pos.x + 4.0, pos.y + 2.0, 22.0, 22.0), ImageNode::new(icon)));
                    p.spawn(text_at(&f.label, 8.0, if i == sel { LAMP } else { TEXT }, d.label.to_uppercase(), pos.x - 50.0, pos.y + 26.0, 100.0))
                        .insert(TextLayout::justify(Justify::Center));
                }
                p.spawn((at(here.x - 12.0, here.y - 40.0, 24.0, 24.0), ImageNode::new(art.ship_cursor.clone())));
                p.spawn(panel(150.0, 282.0, 460.0, 66.0)).with_children(|b| {
                    b.spawn(text_at(&f.label, 8.0, LAMP, dest.label.to_uppercase(), 10.0, 6.0, 300.0));
                    b.spawn(text_at(&f.bold, 13.0, CITRON, dest.name.clone(), 10.0, 18.0, 320.0));
                    b.spawn(text_at(&f.body, 10.0, MUTED, truncate(&dest.preview, 120), 10.0, 36.0, 320.0));
                });
                p.spawn((panel(TRAVEL_BTN.min.x, TRAVEL_BTN.min.y, TRAVEL_BTN.width(), TRAVEL_BTN.height()),
                    children![text_at(&f.label, 9.0, CITRON, "TRAVEL ›", 30.0, 5.0, 100.0)]));
            });
        }
        Mode::Ship => {
            let sel = ui.ship_sel;
            let here = ROOMS.iter().position(|r| matches!(r.2, RoomGo::Scene(s) if s == game.scene));
            commands.entity(overlay).with_children(|p| {
                // The Atlier in cutaway, side on, with its lights alive.
                // The selected room lights up.
                p.spawn((at(0.0, 0.0, VW, VH), BackgroundColor(Color::srgb(0.012, 0.012, 0.06))));
                p.spawn((at(CUT.min.x, CUT.min.y, CUT.width(), CUT.height()), ImageNode::new(art.cutaway.clone())));
                for (i, (src, r, c, speed, depth)) in MAP_LIGHTS.iter().enumerate() {
                    let q = cw(*src);
                    p.spawn((
                        at(q.x - r, q.y - r, r * 2.0, r * 2.0),
                        ImageNode { color: Color::srgba(c.0, c.1, c.2, 0.0), ..ImageNode::new(art.glow_dot.clone()) },
                        MapLight { rgb: Vec3::new(c.0, c.1, c.2), speed: *speed, depth: *depth, phase: i as f32 * 1.7 },
                    ));
                }
                let (w0, w1) = (cw(WATERFALL.0), cw(WATERFALL.1));
                p.spawn((Node { overflow: Overflow::clip(), ..at(w0.x, w0.y, w1.x - w0.x, w1.y - w0.y) },)).with_children(|w| {
                    w.spawn((at(0.0, -32.0, w1.x - w0.x, 96.0), ImageNode { color: Color::srgba(0.8, 0.95, 1.0, 0.55), ..ImageNode::new(art.streaks.clone()) }, Streak));
                });
                p.spawn((at(0.0, 0.0, VW, VH), ImageNode::new(art.room_glow[sel].clone())));
                p.spawn(text_at(&f.label, 9.0, Color::srgb(0.70, 0.86, 1.0), "SHIP MAP · FAST TRAVEL", 20.0, 16.0, 260.0));
                p.spawn(text_at(&f.display, 22.0, Color::WHITE, "The Atlier", 20.0, 26.0, 300.0));
                close_button(p, f);
                for (i, room) in ROOMS.iter().enumerate() {
                    let on = i == sel;
                    let c = room_label_at(i);
                    let tw = room.0.len() as f32 * 4.6 + 10.0;
                    p.spawn((
                        Node { border_radius: BorderRadius::all(Val::Px(2.0)), ..at(c.x - tw / 2.0, c.y - 6.0, tw, 11.0) },
                        BackgroundColor(if on { Color::srgba(0.95, 0.62, 0.25, 0.92) } else { Color::srgba(0.02, 0.03, 0.10, 0.78) }),
                    ))
                    .with_children(|l| {
                        l.spawn(text_at(&f.label, 7.0, if on { Color::srgb(0.08, 0.04, 0.02) } else { Color::srgb(0.80, 0.90, 1.0) }, room.0.to_uppercase(), 0.0, 1.5, tw).with_justify());
                    });
                }
                if let Some(h) = here {
                    let hp = room_label_at(h);
                    p.spawn((at(hp.x - 9.0, hp.y - 28.0, 18.0, 18.0), ImageNode::new(art.ship_cursor.clone()), UiTransform::default(), MapBob));
                }
                let (name, label, go, blurb, _, _) = ROOMS[sel];
                let text = if blurb.is_empty() { room_dest(go).map_or(String::new(), |d| registry.dest(d).preview.clone()) } else { blurb.to_owned() };
                p.spawn(panel(20.0, 290.0, 460.0, 58.0)).with_children(|b| {
                    b.spawn(text_at(&f.label, 8.0, LAMP, if here == Some(sel) { format!("{label} · YOU ARE HERE") } else { label.to_owned() }, 10.0, 5.0, 300.0));
                    b.spawn(text_at(&f.bold, 12.0, CITRON, name, 10.0, 16.0, 320.0));
                    b.spawn(text_at(&f.body, 9.5, MUTED, truncate(&text, 120), 10.0, 33.0, 440.0));
                });
                p.spawn((panel(TRAVEL_BTN.min.x, TRAVEL_BTN.min.y, TRAVEL_BTN.width(), TRAVEL_BTN.height()),
                    children![text_at(&f.label, 9.0, CITRON, "GO ›", 0.0, 5.0, TRAVEL_BTN.width() - 2.0).with_justify()]));
            });
        }

        Mode::Travel => {
            let Some(tr) = ui.travel.as_ref() else { return };
            let mut fade = None;
            let mut flight = None;
            commands.entity(overlay).with_children(|p| {
                if tr.flight {
                    fade = Some(p.spawn((at(0.0, 0.0, VW, VH), ImageNode { color: Color::WHITE.with_alpha(0.0), ..ImageNode::new(art.atlas_bg.clone()) })).id());
                    flight = Some(
                        p.spawn((
                            at(-200.0, 124.0, 192.0, 112.0),
                            ImageNode::from_atlas_image(art.flight.clone(), TextureAtlas { layout: art.flight_layout.clone(), index: 0 }),
                        ))
                        .id(),
                    );
                } else {
                    fade = Some(p.spawn((at(0.0, 0.0, VW, VH), BackgroundColor(INK_SOLID.with_alpha(0.0)))).id());
                }
            });
            ui.fade = fade;
            ui.flight = flight;
        }

        Mode::Sheet => render_sheet(&mut commands, overlay, &ui, &registry, f, &art, &game),
        Mode::Explore | Mode::Lift => {}
    }
}

// ---------------------------------------------------------------------------
// Character menu: the Atlier data deck
// ---------------------------------------------------------------------------

/// One colour set for the character menu. The player picks stone, blue or
/// orange from the menu footer (or T); the page remembers the pick.
#[derive(Clone, Copy)]
struct Theme {
    name: &'static str,
    /// Main panel glass, a diagonal gradient.
    glass: (Color, Color),
    /// The detail card on the right.
    card: (Color, Color),
    edge: Color,
    rule: Color,
    btn: Color,
    on_bg: Color,
    on_edge: Color,
    text: Color,
    label: Color,
    title: Color,
    accent: Color,
    scan: Color,
    foot: Color,
    swatch: Color,
    /// Radar: grid lines, fill, outline.
    radar: (Srgba, Srgba, Srgba),
}

const fn hx(c: u32, a: f32) -> Color {
    Color::srgba(((c >> 16) & 255) as f32 / 255.0, ((c >> 8) & 255) as f32 / 255.0, (c & 255) as f32 / 255.0, a)
}

const fn sx(c: u32, a: f32) -> Srgba {
    Srgba::new(((c >> 16) & 255) as f32 / 255.0, ((c >> 8) & 255) as f32 / 255.0, (c & 255) as f32 / 255.0, a)
}

const THEMES: [Theme; 3] = [
    Theme {
        name: "STONE",
        glass: (hx(0x1d1c1a, 0.97), hx(0x2e2c28, 0.93)),
        card: (hx(0x151412, 0.95), hx(0x23211e, 0.90)),
        edge: hx(0xb3aca0, 0.6),
        rule: hx(0xa39d92, 0.3),
        btn: hx(0x2a2825, 0.75),
        on_bg: hx(0x48443d, 1.0),
        on_edge: hx(0xd8d1c4, 1.0),
        text: hx(0xf1eee8, 1.0),
        label: hx(0xbfb8ab, 1.0),
        title: hx(0xf6f1e6, 1.0),
        accent: hx(0xe9cf98, 1.0),
        scan: hx(0xece5d6, 1.0),
        foot: hx(0x181715, 0.86),
        swatch: hx(0x9a948a, 1.0),
        radar: (sx(0xa39d92, 0.5), sx(0xd8d1c4, 0.32), sx(0xe9cf98, 1.0)),
    },
    Theme {
        name: "BLUE",
        glass: (hx(0x061925, 0.96), hx(0x0b283c, 0.91)),
        card: (hx(0x091b2b, 0.95), hx(0x092235, 0.88)),
        edge: hx(0x92c9d2, 0.6),
        rule: hx(0x86c4cf, 0.33),
        btn: hx(0x0b2434, 0.69),
        on_bg: hx(0x234858, 1.0),
        on_edge: hx(0x91d8e0, 1.0),
        text: hx(0xf2f7f7, 1.0),
        label: hx(0xabd4dc, 1.0),
        title: hx(0xf2f7f7, 1.0),
        accent: hx(0xffc977, 1.0),
        scan: hx(0x92e9ec, 1.0),
        foot: hx(0x081b28, 0.86),
        swatch: hx(0x3f9bbb, 1.0),
        radar: (sx(0x86c4cf, 0.5), sx(0x5fb8c8, 0.38), sx(0xb8ffff, 1.0)),
    },
    Theme {
        name: "ORANGE",
        glass: (hx(0x1a0b10, 0.97), hx(0x2e1610, 0.92)),
        card: (hx(0x140810, 0.95), hx(0x241009, 0.89)),
        edge: hx(0xcc8c4d, 0.7),
        rule: hx(0xd08a4a, 0.3),
        btn: hx(0x2a130d, 0.72),
        on_bg: hx(0x5a2e14, 1.0),
        on_edge: hx(0xee9a4a, 1.0),
        text: hx(0xf1eee6, 1.0),
        label: hx(0xe9a66a, 1.0),
        title: hx(0xe9eb9e, 1.0),
        accent: hx(0xe9eb9e, 1.0),
        scan: hx(0xffb468, 1.0),
        foot: hx(0x150a0b, 0.86),
        swatch: hx(0xe0803a, 1.0),
        radar: (sx(0x79949a, 0.55), sx(0xed8c40, 0.45), sx(0xe9eb9e, 1.0)),
    },
];

/// Theme index for a name from the page ("stone", "blue", "orange").
pub fn theme_index(name: &str) -> Option<usize> {
    THEMES.iter().position(|t| t.name.eq_ignore_ascii_case(name.trim()))
}

const SHEET: Rect = Rect { min: Vec2::new(24.0, 12.0), max: Vec2::new(616.0, 348.0) };
const SHEET_CLOSE: Rect = Rect { min: Vec2::new(590.0, 17.0), max: Vec2::new(606.0, 33.0) };
/// The detail card: Items, Skills, Quests and the Status profile.
const ARTICLE: Rect = Rect { min: Vec2::new(248.0, 74.0), max: Vec2::new(600.0, 318.0) };
const QUEST_CARD: Rect = ARTICLE;
const COL_X: f32 = 40.0;
const COL_W: f32 = 196.0;
/// First row of the left column, under its heading.
const SHEET_TOP: f32 = 92.0;
const SHEET_ROWS: usize = 8;
const RESUME_BTN: Rect = Rect { min: Vec2::new(34.0, 326.0), max: Vec2::new(150.0, 346.0) };
const ITEM_COLS: usize = 4;
const CARD_COLS: usize = 5;

fn tab_rect(i: usize) -> Rect {
    let x = 40.0 + i as f32 * 82.0;
    Rect::new(x, 44.0, x + 78.0, 62.0)
}

fn theme_rect(i: usize) -> Rect {
    let x = 446.0 + i as f32 * 52.0;
    Rect::new(x, 328.0, x + 49.0, 344.0)
}

/// A slot in the Items grid (tab 1) or a mini card in the Skills deck (tab 2).
fn grid_rect(tab: usize, i: usize) -> Rect {
    let (y0, w, h, cols) = if tab == 1 { (SHEET_TOP, 44.0, 42.0, ITEM_COLS) } else { (94.0, 36.0, 46.0, CARD_COLS) };
    let gap = (COL_W - w * cols as f32) / (cols as f32 - 1.0);
    let (c, r) = ((i % cols) as f32, (i / cols) as f32);
    let (x, y) = (COL_X + c * (w + gap), y0 + r * (h + 4.0));
    Rect::new(x, y, x + w, y + h)
}

fn suit_rect(i: usize) -> Rect {
    let x = COL_X + i as f32 * 49.5;
    Rect::new(x, 74.0, x + 47.0, 88.0)
}

fn sheet_window_start(sel: usize, n: usize) -> usize {
    if n <= SHEET_ROWS { 0 } else { sel.saturating_sub(SHEET_ROWS / 2).min(n - SHEET_ROWS) }
}

fn sheet_row_at(at: Vec2, sel: usize, n: usize) -> Option<usize> {
    if n == 0 || at.x < COL_X || at.x > COL_X + COL_W || at.y < SHEET_TOP {
        return None;
    }
    let row = ((at.y - SHEET_TOP) / ROW_H) as usize;
    let i = sheet_window_start(sel, n) + row;
    (row < SHEET_ROWS && i < n).then_some(i)
}

fn gradient(angle_deg: f32, (a, b): (Color, Color)) -> BackgroundGradient {
    BackgroundGradient::from(LinearGradient::new(angle_deg.to_radians(), vec![(a, Val::Percent(0.0)).into(), (b, Val::Percent(100.0)).into()]))
}

/// A rounded box with a 1 px border.
fn boxed(x: f32, y: f32, w: f32, h: f32, bg: Color, edge: Color, radius: f32) -> impl Bundle {
    (
        Node { border: UiRect::all(Val::Px(1.0)), border_radius: BorderRadius::all(Val::Px(radius)), ..at(x, y, w, h) },
        BackgroundColor(bg),
        BorderColor::all(edge),
    )
}

fn hline(x: f32, y: f32, w: f32, c: Color) -> impl Bundle {
    (at(x, y, w, 1.0), BackgroundColor(c))
}

/// A little key cap, like the E prompt in the world.
fn keycap(p: &mut ChildSpawnerCommands, f: &Fonts, t: &Theme, x: f32, y: f32, k: &str) -> f32 {
    let w = 6.0 + k.chars().count() as f32 * 5.0;
    p.spawn((
        boxed(x, y, w, 12.0, t.text.with_alpha(0.08), t.label.with_alpha(0.7), 2.0),
        children![text_at(&f.label, 6.5, t.text, k.to_owned(), 0.0, 1.5, w - 2.0).with_justify()],
    ));
    w
}

/// The detail card's frame: a darker glass pane with a lit top edge.
fn article_frame(p: &mut ChildSpawnerCommands, t: &Theme, r: Rect) {
    p.spawn((
        Node { border: UiRect::top(Val::Px(1.0)), ..at(r.min.x, r.min.y, r.width(), r.height()) },
        gradient(125.0, t.card),
        BorderColor { top: t.on_edge.with_alpha(0.75), ..BorderColor::all(Color::NONE) },
    ));
}

/// The deck's spec strip: label over value, ruled above and below.
fn spec_row(p: &mut ChildSpawnerCommands, f: &Fonts, t: &Theme, x: f32, y: f32, w: f32, specs: &[(&str, String)]) {
    p.spawn(hline(x, y, w, t.rule));
    p.spawn(hline(x, y + 30.0, w, t.rule));
    let n = specs.len().max(1) as f32;
    for (i, (k, v)) in specs.iter().enumerate() {
        let cx = x + i as f32 * w / n;
        p.spawn(text_at(&f.label, 6.5, t.label, k.to_uppercase(), cx, y + 6.0, w / n - 4.0));
        p.spawn(text_at(&f.bold, 9.5, t.text, truncate(v, 22), cx, y + 15.0, w / n - 4.0));
    }
}

/// Eyebrow, title, art, spec strip and description: one record in the card.
fn record_card(
    p: &mut ChildSpawnerCommands,
    f: &Fonts,
    t: &Theme,
    gem: Color,
    eyebrow: &str,
    title: &str,
    icon: Option<ImageNode>,
    specs: &[(&str, String)],
    note: &str,
) {
    let r = ARTICLE;
    let (x, y, w) = (r.min.x + 16.0, r.min.y, r.width() - 32.0);
    article_frame(p, t, r);
    p.spawn((Node { border_radius: BorderRadius::all(Val::Px(1.0)), ..at(x, y + 15.0, 5.0, 5.0) }, BackgroundColor(gem)));
    p.spawn(text_at(&f.label, 7.0, t.label, eyebrow.to_uppercase(), x + 10.0, y + 12.0, w - 90.0));
    if let Some(img) = icon {
        p.spawn(boxed(r.max.x - 92.0, y + 14.0, 76.0, 76.0, gem.with_alpha(0.08), gem.with_alpha(0.45), 3.0));
        p.spawn((at(r.max.x - 86.0, y + 20.0, 64.0, 64.0), img));
    }
    p.spawn(text_at(&f.bold, 16.0, t.title, truncate(title, 60), x, y + 28.0, w - 96.0));
    spec_row(p, f, t, x, y + 100.0, w, specs);
    p.spawn(text_at(&f.body, 10.0, t.text.with_alpha(0.88), truncate(note, 220), x, y + 142.0, w - 20.0));
}

/// The left column's heading, like the deck's h2.
fn col_heading(p: &mut ChildSpawnerCommands, f: &Fonts, t: &Theme, title: &str, count: Option<usize>) {
    p.spawn(text_at(&f.bold, 11.0, t.title, title.to_owned(), COL_X, 74.0, 140.0));
    if let Some(n) = count {
        p.spawn(text_at(&f.label, 7.0, t.label, n.to_string(), COL_X + COL_W - 40.0, 78.0, 40.0).with_justify_right());
    }
}

fn render_sheet(commands: &mut Commands, overlay: Entity, ui: &Ui, registry: &Registry, f: &Fonts, art: &UiArt, game: &Game) {
    let stats = &registry.player.stats;
    let hatch = game.hatch_open;
    let ti = game.menu_theme.min(THEMES.len() - 1);
    let t = &THEMES[ti];
    commands.entity(overlay).with_children(|p| {
        // Shell: one glass slab with the deck's clipped corners.
        let s = SHEET;
        p.spawn((
            Node {
                border: UiRect::all(Val::Px(1.0)),
                border_radius: BorderRadius::px(12.0, 3.0, 12.0, 3.0),
                ..at(s.min.x, s.min.y, s.width(), s.height())
            },
            gradient(115.0, t.glass),
            BorderColor::all(t.edge),
            BoxShadow::new(Color::BLACK.with_alpha(0.55), Val::Px(0.0), Val::Px(8.0), Val::Px(0.0), Val::Px(24.0)),
        ));
        // Header: brand on the left, the orbit and deck name on the right.
        p.spawn(text_at(&f.bold, 10.0, t.text, "A T L I E R", 40.0, 19.0, 120.0));
        p.spawn((
            Cog(0.63),
            UiTransform::IDENTITY,
            Node {
                border: UiRect { top: Val::Px(2.0), right: Val::Px(1.0), bottom: Val::Px(1.0), left: Val::Px(1.0) },
                border_radius: BorderRadius::all(Val::Percent(50.0)),
                ..at(482.0, 20.0, 10.0, 10.0)
            },
            BorderColor { top: t.scan, ..BorderColor::all(t.label.with_alpha(0.6)) },
        ));
        p.spawn(text_at(&f.label, 7.0, t.label, "PERSONAL DATA DECK", 498.0, 21.0, 90.0));
        p.spawn((
            boxed(SHEET_CLOSE.min.x, SHEET_CLOSE.min.y, SHEET_CLOSE.width(), SHEET_CLOSE.height(), t.btn, t.rule, 2.0),
            children![text_at(&f.label, 8.0, t.text, "X", 0.0, 2.0, SHEET_CLOSE.width() - 2.0).with_justify()],
        ));
        // The scan track: a thin rule with a light running along it.
        p.spawn((Node { overflow: Overflow::clip(), ..at(s.min.x + 1.0, 38.0, s.width() - 2.0, 1.0) }, BackgroundColor(t.rule)))
            .with_children(|tr| {
                tr.spawn((
                    Scan(s.width()),
                    at(-90.0, 0.0, 84.0, 1.0),
                    BackgroundGradient::from(LinearGradient::to_right(vec![(t.scan.with_alpha(0.0), Val::Percent(0.0)).into(), (t.scan, Val::Percent(100.0)).into()])),
                ));
            });
        // Section nav.
        for (i, name) in TABS.iter().enumerate() {
            let r = tab_rect(i);
            let on = i == ui.tab;
            p.spawn((
                Node { border: UiRect::all(Val::Px(1.0)), border_radius: BorderRadius::all(Val::Px(2.0)), overflow: Overflow::clip(), ..at(r.min.x, r.min.y, r.width(), r.height()) },
                BackgroundColor(if on { t.on_bg } else { t.btn }),
                BorderColor::all(if on { t.on_edge } else { Color::NONE }),
            ))
            .with_children(|bar| {
                if on {
                    bar.spawn((Shimmer(r.width()), at(-30.0, -2.0, 12.0, r.height() + 4.0), BackgroundColor(Color::WHITE.with_alpha(0.08))));
                }
            });
            p.spawn((at(r.min.x + 5.0, r.min.y + 3.0, 12.0, 12.0), ImageNode::new(art.ui_icons[TAB_ICONS[i]].clone())));
            p.spawn(text_at(&f.label, 8.0, if on { t.title } else { t.text.with_alpha(0.85) }, name.to_uppercase(), r.min.x + 22.0, r.min.y + 4.5, 56.0));
        }
        p.spawn(hline(s.min.x + 1.0, 67.0, s.width() - 2.0, t.rule));

        match ui.tab {
            0 => status_tab(p, f, art, t, stats, hatch),
            1 => items_tab(p, f, art, t, ui, stats, hatch),
            2 => skills_tab(p, f, art, t, ui, stats),
            3 => quests_tab(p, f, art, t, ui, stats),
            _ => {}
        }

        // Footer: a key hint on the left, the theme picker on the right.
        p.spawn((
            Node { border: UiRect::top(Val::Px(1.0)), border_radius: BorderRadius::px(0.0, 0.0, 11.0, 2.0), ..at(s.min.x + 1.0, 322.0, s.width() - 2.0, s.max.y - 323.0) },
            BackgroundColor(t.foot),
            BorderColor { top: t.rule, ..BorderColor::all(Color::NONE) },
        ));
        // Key hints: one short row, just what this section adds. On touch,
        // only the resume button on Quests.
        let hy = 330.0;
        if ui.touch {
            if ui.tab == 3 {
                p.spawn(text_at(&f.label, 7.0, t.title, "FULL RESUME ›", 40.0, hy + 2.0, 90.0));
            }
        } else {
            let mut hints = vec![("TAB", "SECTION")];
            match ui.tab {
                2 => hints.push(("SHIFT TAB", "SUIT")),
                3 => hints.extend([("ENTER", "OPEN"), ("F", "RESUME")]),
                _ => {}
            }
            hints.push(("ESC", "CLOSE"));
            let mut x = 40.0;
            for (k, word) in hints {
                x += keycap(p, f, t, x, hy, k) + 4.0;
                p.spawn(text_at(&f.label, 6.5, t.label, word, x, hy + 2.5, 50.0));
                x += word.len() as f32 * 3.7 + 10.0;
            }
        }
        let tr0 = theme_rect(0);
        if !ui.touch {
            keycap(p, f, t, tr0.min.x - 16.0, hy, "T");
        }
        p.spawn(text_at(&f.label, 7.0, t.label, "THEME", tr0.min.x - if ui.touch { 32.0 } else { 46.0 }, hy + 2.0, 30.0));
        for (i, th) in THEMES.iter().enumerate() {
            let r = theme_rect(i);
            let on = i == ti;
            p.spawn(boxed(r.min.x, r.min.y, r.width(), r.height(), if on { t.on_bg } else { t.btn }, if on { t.on_edge } else { t.rule }, 2.0));
            p.spawn((Node { border_radius: BorderRadius::all(Val::Px(3.0)), ..at(r.min.x + 5.0, r.min.y + 5.0, 6.0, 6.0) }, BackgroundColor(th.swatch)));
            p.spawn(text_at(&f.label, 6.5, if on { t.title } else { t.text.with_alpha(0.8) }, th.name, r.min.x + 14.0, r.min.y + 3.5, r.width() - 15.0));
        }
    });
}

fn status_tab(p: &mut ChildSpawnerCommands, f: &Fonts, art: &UiArt, t: &Theme, stats: &crate::content::Stats, hatch: bool) {
    // Left column: the full-body art, the current quest under it.
    p.spawn((at(86.0, 74.0, 100.0, 204.0), ImageNode::new(art.full_body.clone())));
    if let Some(q) = stats.quest_log.iter().find(|q| q.current) {
        p.spawn(text_at(&f.label, 6.5, t.label, "CURRENT QUEST", COL_X, 282.0, COL_W));
        p.spawn(text_at(&f.bold, 10.0, t.title, truncate(&q.title, 34), COL_X, 291.0, COL_W));
        p.spawn(text_at(&f.label, 6.5, t.accent, truncate(&format!("{} · {}", q.place.to_uppercase(), q.years), 44), COL_X, 305.0, COL_W));
    }
    // Card: the profile.
    let r = ARTICLE;
    let (x, y, w) = (r.min.x + 16.0, r.min.y, r.width() - 32.0);
    article_frame(p, t, r);
    p.spawn(text_at(&f.label, 7.0, t.label, format!("CHARACTER PROFILE · CLASS {}", stats.title.to_uppercase()), x, y + 10.0, w));
    p.spawn(text_at(&f.display, 20.0, t.title, stats.name.clone(), x, y + 19.0, w));
    let items = stats.inventory.key_items.len() + usize::from(hatch);
    let cards = stats.cards.iter().filter(|c| c.suit != "profile").count();
    spec_row(p, f, t, x, y + 48.0, w, &[
        ("Region", stats.location.clone()),
        ("Level", stats.level.to_string()),
        ("Items", items.to_string()),
        ("Cards", cards.to_string()),
        ("Quests", stats.quest_log.len().to_string()),
    ]);
    // Attributes in two columns of three: WIL INT WIT / CHA WIS LCK.
    for (i, a) in stats.attributes.iter().enumerate() {
        let (ax, ay) = (x + (i / 3) as f32 * 64.0, y + 90.0 + (i % 3) as f32 * 22.0);
        p.spawn(text_at(&f.label, 7.5, t.label, a.label.to_uppercase(), ax, ay + 3.0, 30.0));
        p.spawn(text_at(&f.label, 13.0, t.title, a.value.to_string(), ax + 26.0, ay - 2.0, 34.0));
    }
    // Radar, tinted for the theme.
    let (cx, cy, rr) = (x + 236.0, y + 132.0, 34.0);
    p.spawn((at(cx - rr - 4.0, cy - rr - 4.0, (rr + 4.0) * 2.0, (rr + 4.0) * 2.0), ImageNode::new(art.radar[THEMES.iter().position(|x| x.name == t.name).unwrap_or(1)].clone())));
    let n = stats.radar.len().max(1);
    for (i, a) in stats.radar.iter().enumerate() {
        let ang = -std::f32::consts::FRAC_PI_2 + i as f32 * std::f32::consts::TAU / n as f32;
        let lx = cx + ang.cos() * (rr + 22.0);
        let ly = cy + ang.sin() * (rr + 11.0);
        p.spawn(text_at(&f.label, 7.0, t.text, format!("{} {}", a.label.to_uppercase(), a.value as i32), lx - 30.0, ly - 5.0, 60.0)).insert(TextLayout::justify(Justify::Center));
    }
    // Alignment: Myers-Briggs type and the StrengthsFinder top picks.
    let profile: Vec<&crate::content::SkillCard> = stats.cards.iter().filter(|c| c.suit == "profile").collect();
    if !profile.is_empty() {
        let (bx, by, bw) = (x, y + 188.0, w);
        p.spawn(hline(bx, by, bw, t.rule));
        p.spawn(text_at(&f.label, 6.5, t.label, "ALIGNMENT", bx, by + 6.0, 80.0));
        if let Some(c) = profile.iter().find(|c| !c.name.contains('·')) {
            p.spawn((at(bx + 52.0, by + 3.0, 14.0, 14.0), tier_image(art, 3, 2)));
            p.spawn(text_at(&f.bold, 10.0, t.title, c.name.clone(), bx + 70.0, by + 3.0, 50.0));
            p.spawn(text_at(&f.label, 6.5, t.accent, "THE VISIONARY", bx + 106.0, by + 6.5, 100.0));
        }
        p.spawn(text_at(&f.label, 6.5, t.label, "STRENGTHS", bx, by + 26.0, 80.0));
        let strengths: Vec<&&crate::content::SkillCard> = profile.iter().filter(|c| c.name.contains('·')).collect();
        for (i, c) in strengths.iter().enumerate().take(4) {
            let (sx0, sy) = (bx + 52.0 + (i % 2) as f32 * 136.0, by + 23.0 + (i / 2) as f32 * 15.0);
            p.spawn((at(sx0, sy, 12.0, 12.0), tier_image(art, 5, i % 4)));
            p.spawn(text_at(&f.label, 7.0, t.text, c.name.replace(" · ", " ").to_uppercase(), sx0 + 15.0, sy + 2.0, 118.0));
        }
    }
}

fn items_tab(p: &mut ChildSpawnerCommands, f: &Fonts, art: &UiArt, t: &Theme, ui: &Ui, stats: &crate::content::Stats, hatch: bool) {
    let relic = crate::content::KeyItem {
        name: "Dave's Socket Wrench".into(),
        from: "Engine room hatch".into(),
        note: "Brass, heavy, stamped \"D.\" on the handle. Dave says he lost it years ago. He didn't.".into(),
        kind: "relic".into(),
        kind_in_game: "relic".into(),
        rarity: "legendary".into(),
        year: None,
        bonus: "+1 LCK".into(),
    };
    let mut items: Vec<&crate::content::KeyItem> = stats.inventory.key_items.iter().collect();
    if hatch {
        items.push(&relic);
    }
    col_heading(p, f, t, "Inventory", Some(items.len()));
    let slots = items.len().max(16).div_ceil(ITEM_COLS) * ITEM_COLS;
    for i in 0..slots.min(20) {
        let r = grid_rect(1, i);
        let it = items.get(i);
        let on = i == ui.sel && it.is_some();
        let edge = it.map_or(t.rule, |it| rarity_color(&it.rarity));
        p.spawn((
            Node { border: UiRect::all(Val::Px(if on { 2.0 } else { 1.0 })), border_radius: BorderRadius::all(Val::Px(3.0)), ..at(r.min.x, r.min.y, r.width(), r.height()) },
            BackgroundColor(if on { t.on_bg } else { t.btn }),
            BorderColor::all(if on { t.accent } else { edge.with_alpha(if it.is_some() { 0.8 } else { 0.5 }) }),
        ));
        if let Some(it) = it {
            p.spawn((at(r.min.x + 6.0, r.min.y + 5.0, 32.0, 32.0), item_image(art, it)));
            p.spawn((Node { border_radius: BorderRadius::all(Val::Px(2.0)), ..at(r.max.x - 7.0, r.max.y - 7.0, 4.0, 4.0) }, BackgroundColor(edge)));
        }
    }
    if let Some(it) = items.get(ui.sel) {
        let c = rarity_color(&it.rarity);
        let kind = title_case(if it.kind_in_game.is_empty() { &it.kind } else { &it.kind_in_game });
        record_card(p, f, t, c, &format!("{kind} · {}", it.rarity), &it.name, Some(item_image(art, it)), &[
            ("Issuer", it.from.clone()),
            ("Year", it.year.map_or("—".into(), |y| y.to_string())),
            ("Bonus", it.bonus.clone()),
        ], &it.note);
    }
}

fn skills_tab(p: &mut ChildSpawnerCommands, f: &Fonts, art: &UiArt, t: &Theme, ui: &Ui, stats: &crate::content::Stats) {
    for (i, (key, label)) in SUITS.iter().enumerate() {
        let r = suit_rect(i);
        let on = i == ui.suit;
        let sc = suit_color(key);
        p.spawn((
            boxed(r.min.x, r.min.y, r.width(), r.height(), if on { sc.with_alpha(0.32) } else { t.btn }, if on { t.accent } else { sc.with_alpha(0.55) }, 2.0),
            children![text_at(&f.label, 5.5, if on { t.title } else { t.text.with_alpha(0.85) }, *label, 0.0, 3.5, r.width() - 2.0).with_justify()],
        ));
    }
    let suit = SUITS[ui.suit].0;
    let deck: Vec<&crate::content::SkillCard> = stats.cards.iter().filter(|c| c.suit == suit).collect();
    let sc = suit_color(suit);
    for (i, card) in deck.iter().enumerate().take(20) {
        let r = grid_rect(2, i);
        let on = i == ui.sel;
        p.spawn((
            Node { border: UiRect::all(Val::Px(if on { 2.0 } else { 1.0 })), border_radius: BorderRadius::all(Val::Px(3.0)), overflow: Overflow::clip(), ..at(r.min.x, r.min.y, r.width(), r.height()) },
            BackgroundColor(if on { t.on_bg } else { t.btn }),
            BorderColor::all(if on { t.accent } else { sc.with_alpha(0.7) }),
        ))
        .with_children(|m| {
            m.spawn((at(0.0, 0.0, r.width(), 4.0), BackgroundColor(sc.with_alpha(0.85))));
            m.spawn((at(4.0, 8.0, 26.0, 26.0), card_image(art, card, i)));
            m.spawn(text_at(&f.label, 5.5, t.label, pips(card.mastery), 0.0, r.height() - 11.0, r.width() - 2.0).with_justify());
        });
    }
    if let Some(card) = deck.get(ui.sel) {
        let label = match suit {
            "skill" => "Proficiency",
            "discipline" => "Discipline",
            "special" => "Philosophy",
            _ => "Skill",
        };
        record_card(p, f, t, sc, &format!("{label} card"), &card.name, Some(card_image(art, card, ui.sel)), &[
            ("Mastery", pips(card.mastery)),
            ("Feeds", format!("+{} {}", card.mastery.div_ceil(2), card.feeds)),
            ("Suit", title_case(&SUITS[ui.suit].1.to_lowercase())),
        ], &card.flavor);
    } else {
        article_frame(p, t, ARTICLE);
        p.spawn(text_at(&f.body, 10.0, t.label, "No cards in this suit yet.", ARTICLE.min.x + 16.0, ARTICLE.min.y + 16.0, 240.0));
    }
}

fn quests_tab(p: &mut ChildSpawnerCommands, f: &Fonts, art: &UiArt, t: &Theme, ui: &Ui, stats: &crate::content::Stats) {
    let quests = &stats.quest_log;
    let total = quests.len() + stats.training.len();
    if ui.quest_full && let Some(q) = quests.get(ui.sel) {
        quest_full_view(p, f, t, q);
        return;
    }
    col_heading(p, f, t, "Quest log", Some(total));
    let start = sheet_window_start(ui.sel, total);
    for (row, i) in (start..total.min(start + SHEET_ROWS)).enumerate() {
        let y = SHEET_TOP + row as f32 * ROW_H;
        let on = i == ui.sel;
        p.spawn((
            Node {
                border: UiRect { left: Val::Px(if on { 3.0 } else { 0.0 }), ..default() },
                border_radius: BorderRadius::all(Val::Px(2.0)),
                ..at(COL_X, y, COL_W, ROW_H - 3.0)
            },
            BackgroundColor(if on { t.on_bg } else { t.btn }),
            BorderColor::all(t.accent),
        ));
        let (title, place, years, mark) = if i < quests.len() {
            let q = &quests[i];
            (q.title.clone(), q.place.clone(), q.years.clone(), if q.current { 6 } else { 7 })
        } else {
            let tr = &stats.training[i - quests.len()];
            (tr.title.clone(), tr.place.clone(), tr.years.clone(), 5)
        };
        p.spawn((at(COL_X + 7.0, y + 5.0, 14.0, 14.0), ImageNode::new(art.ui_icons[mark].clone())));
        p.spawn(text_at(&f.bold, 9.5, if on { t.title } else { t.text }, truncate(&title, 30), COL_X + 26.0, y + 1.5, COL_W - 30.0));
        p.spawn(text_at(&f.label, 6.5, t.label, truncate(&format!("{} · {}", place.to_uppercase(), years), 40), COL_X + 26.0, y + 14.5, COL_W - 30.0));
    }
    let r = ARTICLE;
    let (x, y, w) = (r.min.x + 16.0, r.min.y, r.width() - 32.0);
    if let Some(q) = quests.get(ui.sel) {
        article_frame(p, t, r);
        let (eyebrow, gem) = if q.current { ("ACTIVE QUEST", t.accent) } else { ("COMPLETED QUEST", t.label) };
        p.spawn((Node { border_radius: BorderRadius::all(Val::Px(3.0)), ..at(x, y + 14.0, 6.0, 6.0) }, BackgroundColor(gem)));
        p.spawn(text_at(&f.label, 7.0, gem, eyebrow, x + 10.0, y + 12.0, 200.0));
        p.spawn(text_at(&f.bold, 16.0, t.title, truncate(&q.title, 48), x, y + 26.0, w));
        spec_row(p, f, t, x, y + 70.0, w, &[
            ("Company", q.place.clone()),
            ("Service", q.years.clone()),
            ("Status", if q.current { "Active".into() } else { "Complete".into() }),
        ]);
        let mut ty = y + 110.0;
        if q.current {
            // How long this quest has been running, as a thin gauge.
            let since = q.years.split('–').next().and_then(|v| v.parse::<i32>().ok()).unwrap_or(2026);
            let run = (2026 - since).clamp(0, 10) as f32 / 10.0;
            p.spawn((Node { border_radius: BorderRadius::all(Val::Px(2.0)), ..at(x, ty, w, 3.0) }, BackgroundColor(t.rule)));
            p.spawn((Node { border_radius: BorderRadius::all(Val::Px(2.0)), ..at(x, ty, (w * run).max(6.0), 3.0) }, BackgroundColor(t.accent)));
            ty += 10.0;
        }
        p.spawn(text_at(&f.body, 9.5, t.text.with_alpha(0.9), truncate(&q.summary, 240), x, ty, w));
        let feats: Vec<String> = q.feats.iter().take(3).map(|v| format!("• {}", truncate(v, 70))).collect();
        p.spawn(text_at(&f.body, 8.5, t.label, feats.join("\n"), x, y + 186.0, w));
        if ui.touch {
            p.spawn(text_at(&f.label, 6.5, t.label.with_alpha(0.8), "TAP THE CARD FOR THE FULL QUEST", x, r.max.y - 14.0, w));
        }
    } else if let Some(tr) = stats.training.get(ui.sel - quests.len()) {
        record_card(p, f, t, t.label, "Training quest", &tr.title, None, &[("School", tr.place.clone()), ("Years", tr.years.clone())], "");
    }
}

/// One quest in full, across the content area: everything it involved.
fn quest_full_view(p: &mut ChildSpawnerCommands, f: &Fonts, t: &Theme, q: &crate::content::Quest) {
    let r = Rect::new(COL_X, 74.0, ARTICLE.max.x, ARTICLE.max.y);
    let (x, y, w) = (r.min.x + 16.0, r.min.y, r.width() - 32.0);
    article_frame(p, t, r);
    let gem = if q.current { t.accent } else { t.label };
    p.spawn((Node { border_radius: BorderRadius::all(Val::Px(3.0)), ..at(x, y + 14.0, 6.0, 6.0) }, BackgroundColor(gem)));
    p.spawn(text_at(&f.label, 7.0, gem, if q.current { "ACTIVE QUEST" } else { "COMPLETED QUEST" }, x + 10.0, y + 12.0, 200.0));
    p.spawn(text_at(&f.bold, 16.0, t.title, q.title.clone(), x, y + 26.0, w));
    spec_row(p, f, t, x, y + 50.0, w, &[
        ("Company", q.place.clone()),
        ("Service", q.years.clone()),
        ("Status", if q.current { "Active".into() } else { "Complete".into() }),
    ]);
    p.spawn(text_at(&f.body, 9.5, t.text.with_alpha(0.92), q.summary.clone(), x, y + 90.0, w));
    let feats: Vec<String> = q.feats.iter().take(6).map(|v| format!("• {}", truncate(v, 110))).collect();
    p.spawn(text_at(&f.body, 9.0, t.text.with_alpha(0.85), feats.join("\n"), x, y + 130.0, w));
    if !q.tech.is_empty() {
        p.spawn(text_at(&f.label, 6.5, t.label, format!("KIT · {}", q.tech.join(" · ").to_uppercase()), x, r.max.y - 16.0, w));
    }
}

/// The HUD: location, menu and map buttons, interaction prompt, first-run hint.
fn hud(
    mut commands: Commands,
    mut ui: ResMut<Ui>,
    game: Res<Game>,
    fonts: Res<Fonts>,
    art: Res<UiArt>,
    root: Res<UiRoot>,
    frame: Res<Frame>,
) {
    let show = game.mode == Mode::Explore;
    let prompt = if show { game.nearby } else { None };
    let key = format!("{show}|{:?}|{:?}|{}|{}", game.scene, prompt.map(|p| p.label), ui.hint > 0.0, ui.touch);
    let key = format!("{key}|{}|{}|{}", ui.tray, frame.view_w.round(), game.sound);
    if key == ui.hud_key {
        return;
    }
    ui.hud_key = key;
    if let Some(e) = ui.hud.take() {
        commands.entity(e).despawn();
    }
    if !show {
        return;
    }
    let f = &*fonts;
    let def = scene_def(game.scene);
    let touch = ui.touch;
    let tray = ui.tray;
    let hint = ui.hint > 0.0;
    let (vw, portrait) = (frame.view_w, frame.portrait);
    let hud = commands.spawn((Pinned, at(frame.view_x0, 0.0, vw, VH), ZIndex(5))).id();
    commands.entity(root.0).add_child(hud);
    ui.hud = Some(hud);
    commands.entity(hud).with_children(|p| {
        p.spawn(panel(8.0, 8.0, 150.0, 34.0)).with_children(|b| {
            b.spawn(text_at(&f.label, 7.5, LAMP, def.label.to_uppercase(), 8.0, 3.0, 140.0));
            b.spawn(text_at(&f.display, 14.0, CITRON, def.name, 8.0, 12.0, 140.0));
        });
        if tray {
            p.spawn(panel(TRAY.min.x - 3.0, TRAY.min.y, TRAY.width() + 3.0, TRAY.height())).with_children(|b| {
                let sound = if game.sound { (11, "SOUND") } else { (12, "MUTED") };
                for (r, icon, label) in [(MENU_BTN, 8usize, "MENU"), (MAP_BTN, 3, "MAP"), (SOUND_BTN, sound.0, sound.1)] {
                    let x = r.min.x + 3.0;
                    b.spawn((at(x + r.width() / 2.0 - 8.0, 6.0, 16.0, 16.0), ImageNode::new(art.ui_icons[icon].clone())));
                    b.spawn(text_at(&f.label, 7.0, CITRON, label, x, 25.0, r.width()).with_justify());
                }
                b.spawn(text_at(&f.label, 12.0, LINE, "‹", 126.0, 12.0, 10.0));
            });
        } else {
            p.spawn(panel(-3.0, 318.0, 13.0, 32.0)).with_children(|b| {
                b.spawn(text_at(&f.label, 12.0, LINE, "›", 4.0, 7.0, 10.0));
            });
        }
        if let Some(pt) = prompt {
            // "Activate console" with a key icon, right beside the thought cloud.
            let text = match pt.action {
                Action::OpenAtlas | Action::Terminal(_) | Action::Menu => format!("Activate {}", pt.label.to_lowercase()),
                _ => pt.label.to_owned(),
            };
            // Manaspace runs wide: about 6.4 UI px per character at this size.
            let w = (32.0 + text.chars().count() as f32 * 6.4).min(vw - 8.0);
            // Portrait: the camera pans, so the prompt sits at the bottom.
            let tip = if portrait { None } else { crate::fx::cloud_tip(game.scene, &pt) };
            let (x, y) = match tip {
                Some(tip) if tip.x + 40.0 + w <= VW - 4.0 => (tip.x + 40.0, tip.y - 26.0),
                Some(tip) => (tip.x - w - 4.0, tip.y - 26.0),
                None if portrait => (vw / 2.0 - w / 2.0, 284.0),
                None => (VW / 2.0 - w / 2.0, 310.0),
            };
            let key = if touch { art.key_tap.clone() } else { art.key_e.clone() };
            p.spawn(panel(x, y, w, 20.0)).with_children(|b| {
                b.spawn((at(3.0, 1.5, 15.0, 15.0), ImageNode::new(key)));
                b.spawn(text_at(&f.label, 8.5, CITRON, text, 23.0, 3.0, w - 24.0));
            });
        }
        if hint {
            let msg = if touch {
                "Tap to walk · tap people and consoles to interact · menus hide in the tab at bottom left"
            } else {
                "WASD or click to walk · E to interact · Esc menu · M atlas"
            };
            if portrait {
                let w = vw - 30.0;
                p.spawn(panel(24.0, 322.0, w, 32.0)).with_children(|b| {
                    b.spawn(text_at(&f.label, 7.5, TEXT, msg, 4.0, 3.0, w - 8.0).with_justify());
                });
            } else {
                p.spawn(panel(120.0, 334.0, 400.0, 18.0)).with_children(|b| {
                    b.spawn(text_at(&f.label, 8.0, TEXT, msg, 0.0, 2.0, 400.0).with_justify());
                });
            }
        }
    });
}

trait Centered {
    fn with_justify(self) -> (Self, TextLayout)
    where
        Self: Sized;
    fn with_justify_right(self) -> (Self, TextLayout)
    where
        Self: Sized;
}
impl<B: Bundle> Centered for B {
    fn with_justify(self) -> (Self, TextLayout) {
        (self, TextLayout::justify(Justify::Center))
    }
    fn with_justify_right(self) -> (Self, TextLayout) {
        (self, TextLayout::justify(Justify::Right))
    }
}

fn tier_image(art: &UiArt, row: usize, col: usize) -> ImageNode {
    ImageNode::from_atlas_image(art.tier_icons.clone(), TextureAtlas { layout: art.tier_layout.clone(), index: row * 4 + col })
}

/// Scroll for degrees, wrench for technical certs, armillary for product and
/// strategy, compass for design and communication; tier from rarity.
fn item_image(art: &UiArt, it: &crate::content::KeyItem) -> ImageNode {
    if it.kind_in_game == "relic" {
        return ImageNode::new(art.ui_icons[item_icon(&it.kind_in_game)].clone());
    }
    let row = match it.rarity.as_str() {
        "legendary" => 4,
        "unique" => 3,
        "rare" => 2,
        "uncommon" => 1,
        _ => 0,
    };
    let col = if matches!(it.kind_in_game.as_str(), "scroll" | "codex") {
        0
    } else if it.bonus.contains("DEV") {
        1
    } else if it.bonus.contains("PRO") || it.bonus.contains("GTM") {
        2
    } else {
        3
    };
    tier_image(art, row, col)
}

/// Skills and equipment are wrenches, disciplines armillaries, specials
/// compasses; mastery sets the tier. The profile suit uses the ornate set.
fn card_image(art: &UiArt, card: &crate::content::SkillCard, i: usize) -> ImageNode {
    if card.suit == "profile" {
        return if i < 4 { tier_image(art, 5, i) } else { tier_image(art, 3, 2) };
    }
    let row = match card.mastery {
        5 => 4,
        4 => 2,
        3 => 1,
        _ => 0,
    };
    let col = match card.suit.as_str() {
        "discipline" => 2,
        "special" => 3,
        _ => 1,
    };
    tier_image(art, row, col)
}

fn item_icon(kind: &str) -> usize {
    match kind {
        "scroll" | "codex" => 5,
        "relic" => 10,
        _ => 4,
    }
}

fn pips(n: u8) -> String {
    format!("{n} / 5")
}

const BRASS: Color = Color::srgb(0.71, 0.54, 0.23);

/// The codec-style hologram for a transmission. Returns the head's entity so
/// the dialogue tick can animate its mouth.
fn holo_call(p: &mut ChildSpawnerCommands, f: &Fonts, img: &Handle<Image>, layout: &Handle<TextureAtlasLayout>, pose: usize) -> Entity {
    let cyan = Color::srgb(0.45, 0.95, 1.0);
    let (x, y, w) = (22.0, 70.0, 150.0);
    p.spawn(text_at(&f.label, 7.0, cyan, "HOLO-COMMS · LINK OPEN", x, y - 14.0, w).with_justify());
    // Light cone from the projector, as stacked slices fading upward.
    for i in 0..10 {
        let k = i as f32 / 10.0;
        let sw = 34.0 + 110.0 * k;
        p.spawn((at(x + (w - sw) / 2.0, y + 160.0 - 16.0 * i as f32 - 16.0, sw, 16.0), BackgroundColor(cyan.with_alpha(0.10 - 0.008 * i as f32))));
    }
    // Scan lines over the head.
    for i in 0..34 {
        p.spawn((at(x + 8.0, y + 4.0 + i as f32 * 4.6, w - 16.0, 1.0), BackgroundColor(cyan.with_alpha(0.10))));
    }
    let head = p
        .spawn((
            Holo,
            UiTransform::IDENTITY,
            at(x + 15.0, y, 120.0, 160.0),
            ImageNode::from_atlas_image(img.clone(), TextureAtlas { layout: layout.clone(), index: pose }).with_color(cyan),
        ))
        .id();
    // The projector: a brass puck with a lit lens.
    p.spawn((
        Node { border: UiRect::all(Val::Px(1.0)), border_radius: BorderRadius::all(Val::Px(5.0)), ..at(x + 40.0, y + 160.0, w - 80.0, 12.0) },
        BackgroundColor(Color::srgb(0.30, 0.22, 0.12)),
        BorderColor::all(BRASS),
    ));
    p.spawn((Node { border_radius: BorderRadius::all(Val::Px(2.0)), ..at(x + w / 2.0 - 12.0, y + 158.0, 24.0, 3.0) }, BackgroundColor(cyan)));
    head
}

fn seg_d(p: Vec2, a: Vec2, b: Vec2) -> f32 {
    let ab = b - a;
    let t = ((p - a).dot(ab) / ab.length_squared().max(1e-6)).clamp(0.0, 1.0);
    p.distance(a + ab * t)
}

fn poly_d(poly: &[Vec2], p: Vec2) -> f32 {
    let n = poly.len();
    (0..n).map(|i| seg_d(p, poly[i], poly[(i + 1) % n])).fold(f32::MAX, f32::min)
}

fn blank(w: u32, h: u32) -> Image {
    let mut img = Image::new_fill(
        Extent3d { width: w, height: h, depth_or_array_layers: 1 },
        TextureDimension::D2,
        &[0, 0, 0, 0],
        TextureFormat::Rgba8UnormSrgb,
        RenderAssetUsages::default(),
    );
    img.sampler = ImageSampler::linear();
    img
}

/// A soft round light, white so it can be tinted.
fn glow_dot_image() -> Image {
    const S: u32 = 64;
    let mut img = blank(S, S);
    for y in 0..S {
        for x in 0..S {
            let d = (Vec2::new(x as f32 + 0.5, y as f32 + 0.5) - Vec2::splat(S as f32 / 2.0)).length() / (S as f32 / 2.0);
            let a = (1.0 - d).clamp(0.0, 1.0).powf(1.8);
            if a > 0.0 {
                let _ = img.set_color_at(x, y, Color::srgba(1.0, 1.0, 1.0, a));
            }
        }
    }
    img
}

/// Thin falling streaks for the waterfall, tiling every 32 px vertically.
fn streak_image() -> Image {
    let (w, h) = (24u32, 96u32);
    let mut img = blank(w, h);
    for x in 0..w {
        // Each column gets its own short dash at its own height.
        let seed = (x * 2_654_435_761u32.wrapping_mul(1)) % 97;
        if x % 3 == 1 {
            continue;
        }
        for y in 0..h {
            let u = ((y + seed) % 32) as f32 / 32.0;
            let a = if u < 0.35 { (1.0 - u / 0.35) * 0.9 } else { 0.0 };
            if a > 0.0 {
                let _ = img.set_color_at(x, y, Color::srgba(1.0, 1.0, 1.0, a));
            }
        }
    }
    img
}

/// One room lit up: a soft fill and a bright outline, transparent elsewhere.
fn room_glow_image(i: usize) -> Image {
    let (w, h) = (VW as u32, VH as u32);
    let mut img = blank(w, h);
    let poly = room_poly(i);
    let (lo, hi) = poly.iter().fold((Vec2::MAX, Vec2::MIN), |(lo, hi), p| (lo.min(*p), hi.max(*p)));
    for y in (lo.y as u32).saturating_sub(4)..((hi.y as u32 + 5).min(h)) {
        for x in (lo.x as u32).saturating_sub(4)..((hi.x as u32 + 5).min(w)) {
            let p = Vec2::new(x as f32 + 0.5, y as f32 + 0.5);
            let d = poly_d(&poly, p);
            let inside = poly_contains(&poly, p);
            let a = if inside { 0.32 } else { 0.0 } + (1.4 - d).clamp(0.0, 1.0) * 0.9 + ((4.0 - d) / 4.0).clamp(0.0, 1.0) * 0.25;
            if a > 0.0 {
                let _ = img.set_color_at(x, y, Color::srgba(1.0, 0.86, 0.55, (a * 0.85).min(1.0)));
            }
        }
    }
    img
}

/// Rasterise the stats radar into a small image (rings, spokes, filled shape).
fn radar_image(values: &[f32], (grid, fill, edge): (Srgba, Srgba, Srgba)) -> Image {
    const S: u32 = 336;
    let n = values.len().max(3);
    let c = Vec2::splat(S as f32 / 2.0);
    let r = S as f32 / 2.0 - 12.0;
    let vert = |i: usize, k: f32| {
        let ang = -std::f32::consts::FRAC_PI_2 + i as f32 * std::f32::consts::TAU / n as f32;
        c + Vec2::new(ang.cos(), ang.sin()) * r * k
    };
    let shape: Vec<Vec2> = (0..n).map(|i| vert(i, values.get(i).copied().unwrap_or(1.0).clamp(0.0, 10.0) / 10.0)).collect();
    let rings: Vec<Vec<Vec2>> = [0.25, 0.5, 0.75, 1.0].iter().map(|k| (0..n).map(|i| vert(i, *k)).collect()).collect();
    let inside = |poly: &[Vec2], p: Vec2| {
        let mut odd = false;
        let mut j = poly.len() - 1;
        for i in 0..poly.len() {
            let (a, b) = (poly[i], poly[j]);
            if (a.y > p.y) != (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x {
                odd = !odd;
            }
            j = i;
        }
        odd
    };
    let seg_dist = |p: Vec2, a: Vec2, b: Vec2| {
        let ab = b - a;
        let t = ((p - a).dot(ab) / ab.length_squared()).clamp(0.0, 1.0);
        p.distance(a + ab * t)
    };
    let poly_dist = |poly: &[Vec2], p: Vec2| (0..poly.len()).map(|i| seg_dist(p, poly[i], poly[(i + 1) % poly.len()])).fold(f32::MAX, f32::min);

    let mut img = Image::new_fill(
        Extent3d { width: S, height: S, depth_or_array_layers: 1 },
        TextureDimension::D2,
        &[0, 0, 0, 0],
        TextureFormat::Rgba8UnormSrgb,
        RenderAssetUsages::RENDER_WORLD | RenderAssetUsages::MAIN_WORLD,
    );
    img.sampler = ImageSampler::linear();
    let blend = |dst: Srgba, src: Srgba| -> Srgba {
        let a = src.alpha + dst.alpha * (1.0 - src.alpha);
        if a <= 0.0 {
            return Srgba::NONE;
        }
        let mix = |s: f32, d: f32| (s * src.alpha + d * dst.alpha * (1.0 - src.alpha)) / a;
        Srgba::new(mix(src.red, dst.red), mix(src.green, dst.green), mix(src.blue, dst.blue), a)
    };
    let cov = |d: f32, w: f32| (w - d + 0.5).clamp(0.0, 1.0);
    for y in 0..S {
        for x in 0..S {
            let p = Vec2::new(x as f32 + 0.5, y as f32 + 0.5);
            let mut px = Srgba::NONE;
            if inside(&rings[3], p) {
                px = blend(px, Srgba::new(0.0, 0.0, 0.0, 0.3));
            }
            for ring in &rings {
                let a = cov(poly_dist(ring, p), 0.8);
                if a > 0.0 {
                    px = blend(px, grid.with_alpha(grid.alpha * a));
                }
            }
            for i in 0..n {
                let a = cov(seg_dist(p, c, vert(i, 1.0)), 0.6);
                if a > 0.0 {
                    px = blend(px, grid.with_alpha(grid.alpha * 0.7 * a));
                }
            }
            if inside(&shape, p) {
                px = blend(px, fill);
            }
            let a = cov(poly_dist(&shape, p), 1.6);
            if a > 0.0 {
                px = blend(px, edge.with_alpha(a));
            }
            for v in &shape {
                let a = cov(p.distance(*v), 3.5);
                if a > 0.0 {
                    px = blend(px, edge.with_alpha(a));
                }
            }
            let _ = img.set_color_at(x, y, Color::Srgba(px));
        }
    }
    img
}
