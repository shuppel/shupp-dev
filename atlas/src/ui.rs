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

// Palette: shupp.dev brand colours plus the warm lamp orange from the art pack.
const INK: Color = Color::srgba(0.078, 0.031, 0.055, 0.94);
const INK_SOLID: Color = Color::srgb(0.078, 0.031, 0.055);
const LINE: Color = Color::srgb(0.80, 0.55, 0.30);
const TEXT: Color = Color::srgb(0.945, 0.933, 0.902);
const MUTED: Color = Color::srgb(0.72, 0.70, 0.66);
const SAGE: Color = Color::srgb(0.475, 0.580, 0.588);
const OLIVE: Color = Color::srgb(0.675, 0.757, 0.588);
const CITRON: Color = Color::srgb(0.914, 0.922, 0.620);
const LAMP: Color = Color::srgb(0.93, 0.55, 0.25);
const SELECT: Color = Color::srgba(0.93, 0.55, 0.25, 0.22);

pub struct UiPlugin;

impl Plugin for UiPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(Frame { scale: 1.0, offset: Vec2::ZERO, window: Vec2::ZERO })
            .insert_resource(Ui::default())
            .add_systems(Startup, setup_ui.after(crate::setup))
            .add_systems(
                Update,
                (layout_frame, handle_request, input, tick, render, hud, animate_map)
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
}

pub fn trigger(game: &mut Game, pt: Point) {
    game.request = Some(match pt.action {
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
}

impl Frame {
    pub fn to_scene(&self, screen: Vec2) -> Vec2 {
        screen / self.scale - self.offset
    }
}

// The menus hide in a sliver tab at the bottom-left edge (this is a website
// first; the game chrome stays out of the way). Tap the sliver to slide out
// the tray with the Menu and Map icons.
const SLIVER: Rect = Rect { min: Vec2::new(0.0, 312.0), max: Vec2::new(22.0, 356.0) };
const TRAY: Rect = Rect { min: Vec2::new(0.0, 312.0), max: Vec2::new(98.0, 356.0) };
const MENU_BTN: Rect = Rect { min: Vec2::new(6.0, 316.0), max: Vec2::new(44.0, 352.0) };
const MAP_BTN: Rect = Rect { min: Vec2::new(46.0, 316.0), max: Vec2::new(84.0, 352.0) };

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
const SUITS: [(&str, &str); 4] = [("skill", "SKILLS"), ("discipline", "DISCIPLINES"), ("special", "SPECIALS"), ("equipment", "EQUIPMENT")];

#[derive(Resource, Default)]
struct Ui {
    dirty: bool,
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
    blueprint: Handle<Image>,
    room_glow: Vec<Handle<Image>>,
    radar: Handle<Image>,
    menu_bg: Handle<Image>,
    full_body: Handle<Image>,
    /// status, items, quests, map, credential, degree, quest_active, quest_done,
    /// character, ship, settings
    ui_icons: [Handle<Image>; 11],
    cog: Handle<Image>,
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
    Dest(&'static str),
}

/// Rooms on the ship map (a side-view blueprint of the Atlier, after
/// Erikk's sketch): name, site label, where it goes, blurb, and the room's
/// outline in sketch coordinates (see `bp`).
type RoomDef = (&'static str, &'static str, RoomGo, &'static str, &'static [(f32, f32)]);
const ROOMS: [RoomDef; 5] = [
    ("Engine Room", "SKILLS", RoomGo::Scene(SceneId::Engine), "Dave keeps the reactor humming. Ask him about the tools that keep the ship flying.",
        &[(72.0, 162.0), (100.0, 160.0), (180.0, 172.0), (250.0, 196.0), (254.0, 232.0), (205.0, 262.0), (152.0, 278.0), (124.0, 268.0), (110.0, 232.0), (96.0, 196.0)]),
    ("Captain's Quarters", "ABOUT", RoomGo::Dest("about"), "A bunk, a desk, and a mirror. Stand in front of it and you end up explaining yourself.",
        &[(216.0, 88.0), (262.0, 86.0), (262.0, 112.0), (216.0, 112.0)]),
    ("The Archive", "WRITING", RoomGo::Scene(SceneId::Archive), "",
        &[(262.0, 86.0), (370.0, 93.0), (432.0, 120.0), (440.0, 136.0), (400.0, 138.0), (330.0, 128.0), (286.0, 126.0), (262.0, 112.0)]),
    ("The Dockyard", "WORK", RoomGo::Scene(SceneId::Port), "",
        &[(196.0, 162.0), (240.0, 150.0), (296.0, 130.0), (330.0, 128.0), (400.0, 138.0), (392.0, 182.0), (330.0, 186.0), (232.0, 172.0)]),
    ("The Bridge", "HOME", RoomGo::Scene(SceneId::Bridge), "The helm of the Atlier, and the heart of the ship.",
        &[(400.0, 138.0), (440.0, 136.0), (466.0, 160.0), (470.0, 182.0), (392.0, 182.0)]),
];
/// The hull outline and the deck line, in sketch coordinates.
const HULL: [(f32, f32); 18] = [
    (100.0, 128.0), (135.0, 100.0), (260.0, 84.0), (370.0, 92.0), (435.0, 118.0), (470.0, 160.0), (480.0, 186.0), (468.0, 196.0),
    (400.0, 208.0), (300.0, 225.0), (240.0, 248.0), (200.0, 272.0), (150.0, 284.0), (116.0, 274.0), (106.0, 240.0), (98.0, 200.0),
    (70.0, 162.0), (92.0, 150.0),
];
const DECK: [(f32, f32); 2] = [(76.0, 160.0), (470.0, 182.0)];

/// Sketch coordinates to the logical frame.
fn bp(p: (f32, f32)) -> Vec2 {
    Vec2::new(20.0 + (p.0 - 50.0) * 1.33, 18.0 + (p.1 - 60.0) * 1.16)
}

fn room_poly(i: usize) -> Vec<Vec2> {
    ROOMS[i].4.iter().map(|p| bp(*p)).collect()
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

fn room_center(i: usize) -> Vec2 {
    let poly = room_poly(i);
    poly.iter().copied().sum::<Vec2>() / poly.len() as f32
}

fn room_dest(go: RoomGo) -> Option<&'static str> {
    match go {
        RoomGo::Scene(SceneId::Port) => Some("work"),
        RoomGo::Scene(SceneId::Archive) => Some("writing"),
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
        body: assets.load("fonts/Hind_400Regular.ttf"),
        bold: assets.load("fonts/Hind_600SemiBold.ttf"),
        // Manaspace for the game chrome: labels, tabs, prompts, stats.
        // Small caps labels: a vector face, so they stay crisp at any scale
        // (the pixel font smeared at fractional sizes).
        label: assets.load("fonts/Cairo_700Bold.ttf"),
        mana: assets.load("fonts/Manaspace.ttf"),
        display: assets.load("fonts/Shupp.otf"),
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
    let radar = images.add(radar_image(&registry.player.stats.radar.iter().map(|a| a.value).collect::<Vec<_>>()));
    commands.insert_resource(UiArt {
        erikk_faces: assets.load("portraits/live.png"),
        erikk_call: assets.load("portraits/call.png"),
        tech_faces: assets.load("cast/technician/faces.png"),
        tech_call: assets.load("cast/technician/calls.png"),
        arch_faces: assets.load("cast/archivist/faces.png"),
        arch_call: assets.load("cast/archivist/calls.png"),
        mech_faces: assets.load("cast/mechanic/faces.png"),
        mech_call: assets.load("cast/mechanic/calls.png"),
        faces_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(256, 352), 4, 1, None, None)),
        call_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(192, 256), 4, 1, None, None)),
        atlas_bg: assets.load("scenes/atlas.png"),
        stars_far: assets.load("parallax/stars_far.png"),
        stars_near: assets.load("parallax/stars_near.png"),
        chart: assets.load("ui/star_map/chart.png"),
        pulse: assets.load("ui/star_map/selection_pulse.png"),
        pulse_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(112, 112), 12, 1, None, None)),
        icons,
        orbits: DESTS.iter().map(|(id, _)| crate::load_smooth(&assets, format!("ui/star_map/{id}_orbit.png"))).collect(),
        orbit_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(96, 96), 16, 1, None, None)),
        ship_cursor: assets.load("ui/star_map/ship_cursor.png"),
        // The Atlier, the big terrarium ship, is what travels between stars.
        flight: crate::load_smooth(&assets, "ships/atlier/flight.png"),
        flight_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(768, 448), 4, 1, None, None)),
        blueprint: images.add(blueprint_image()),
        room_glow: (0..ROOMS.len()).map(|i| images.add(room_glow_image(i))).collect(),
        radar,
        menu_bg: assets.load("ui/menu_bg.png"),
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
        ]
        .map(|p| crate::load_smooth(&assets, p)),
        cog: images.add(cog_image()),
        key_e: assets.load("ui/key_e.png"),
        key_tap: assets.load("ui/key_tap.png"),
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

fn layout_frame(
    window: Single<&Window, With<PrimaryWindow>>,
    mut frame: ResMut<Frame>,
    mut scale: ResMut<UiScale>,
    root: Res<UiRoot>,
    mut nodes: Query<&mut Node>,
) {
    let size = Vec2::new(window.width(), window.height());
    if size == frame.window || size.x < 1.0 {
        return;
    }
    frame.window = size;
    frame.scale = (size.x / VW).min(size.y / VH);
    frame.offset = (size / frame.scale - Vec2::new(VW, VH)) / 2.0;
    scale.0 = frame.scale;
    if let Ok(mut node) = nodes.get_mut(root.0) {
        node.left = Val::Px(frame.offset.x);
        node.top = Val::Px(frame.offset.y);
    }
}

// ---------------------------------------------------------------------------
// Requests: interactions, menu, page links
// ---------------------------------------------------------------------------

fn handle_request(mut game: ResMut<Game>, mut ui: ResMut<Ui>, registry: Res<Registry>) {
    let Some(req) = game.request.take() else { return };
    if game.mode == Mode::Travel {
        return;
    }
    ui.dirty = true;
    match req {
        Request::Atlas => {
            let here = match game.scene {
                SceneId::Port => 0,
                SceneId::Archive => 2,
                SceneId::Bridge | SceneId::Engine => 1,
            };
            ui.atlas_sel = here;
            game.mode = Mode::Atlas;
        }
        Request::Ship => {
            let here = ROOMS.iter().position(|r| matches!(r.2, RoomGo::Scene(s) if s == game.scene)).unwrap_or(0);
            ui.ship_sel = here;
            game.mode = Mode::Ship;
        }
        Request::Menu => {
            ui.tab = 0;
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
                    "Dock Technician",
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
            lines.push(Line { speaker: name.into(), who, pose: 3, call: false, text: closing.into() });
            ui.dialogue = Some(Dialogue { lines, idx: 0, shown: 0.0, after: None });
            game.mode = Mode::Dialogue;
        }
        Request::Destination(id) => match id.as_str() {
            "work" => start_travel(&mut game, &mut ui, SceneId::Port, true),
            "writing" => start_travel(&mut game, &mut ui, SceneId::Archive, true),
            "about" => {
                game.mark_visited("about");
                let dest = registry.dest("about");
                let name = registry.player.stats.name.clone();
                let mut lines = Vec::new();
                for (i, chunk) in std::iter::once(dest.preview.clone())
                    .chain(dest.intro.iter().cloned())
                    .flat_map(|p| paginate(&p))
                    .enumerate()
                {
                    // The captain's quarters mirror: Erikk explaining himself to his reflection.
                    lines.push(Line { speaker: format!("{name} · in the mirror"), who: Who::Erikk, pose: [1, 2, 0, 3][i % 4], call: false, text: chunk });
                }
                lines.push(Line {
                    speaker: name,
                    who: Who::Erikk,
                    pose: 1,
                    call: false,
                    text: "Open the menu for my full character sheet: stats, items and the quest log.".into(),
                });
                ui.dialogue = Some(Dialogue { lines, idx: 0, shown: 0.0, after: None });
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
            let tray_tap = |r: Rect| ui.tray && tap.is_some_and(|t| r.contains(t));
            if keys.any_just_pressed([KeyCode::Escape, KeyCode::KeyC, KeyCode::Tab]) || tray_tap(MENU_BTN) {
                ui.tray = false;
                game.request = Some(Request::Menu);
            } else if keys.just_pressed(KeyCode::KeyM) || tray_tap(MAP_BTN) {
                // M and the tray's map button open the ship map; the bridge's star console has the planets.
                ui.tray = false;
                game.request = Some(Request::Ship);
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
            // A quest opened in full: any key or tap closes it, except the resume button.
            if ui.quest_full {
                if tap.is_some_and(|at| OPEN_BTN.contains(at)) {
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
            let next = keys.just_pressed(KeyCode::Tab) || keys.just_pressed(KeyCode::KeyQ);
            // In the grids the arrows move the cursor; elsewhere left/right flip tabs.
            let grid = cols > 1;
            if next || (!grid && right) {
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
            if let Some(at) = tap {
                if close_hit(at) {
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
                } else if ui.tab == 3 && OPEN_BTN.contains(at) {
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
const LIST_TOP: f32 = 70.0;
const T_TOP: f32 = 86.0;
const ROW_H: f32 = 28.0;
const ROWS: usize = 9;
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

fn window_start(sel: usize, n: usize) -> usize {
    if n <= ROWS { 0 } else { sel.saturating_sub(ROWS / 2).min(n - ROWS) }
}

fn terminal_row_at(at: Vec2, sel: usize, n: usize) -> Option<usize> {
    if at.x < LIST_X || at.x > LIST_X + LIST_W || at.y < T_TOP {
        return None;
    }
    let row = ((at.y - T_TOP) / ROW_H) as usize;
    let i = term_start(sel, n) + row;
    (row < T_ROWS && i < n).then_some(i)
}

const ITEM_COLS: usize = 4;
/// The quest summary card on the right of the Quests tab.
const QUEST_CARD: Rect = Rect { min: Vec2::new(390.0, 46.0), max: Vec2::new(600.0, 306.0) };
const CARD_COLS: usize = 5;

/// A slot in the Items grid (tab 1) or a mini card in the Skills deck (tab 2).
fn grid_rect(tab: usize, i: usize) -> Rect {
    let (x0, y0, w, h, cols) = if tab == 1 { (148.0, 66.0, 42.0, 42.0, ITEM_COLS) } else { (148.0, 76.0, 34.0, 46.0, CARD_COLS) };
    let (c, r) = ((i % cols) as f32, (i / cols) as f32);
    let (x, y) = (x0 + c * (w + 5.0), y0 + r * (h + 5.0));
    Rect::new(x, y, x + w, y + h)
}

fn suit_rect(i: usize) -> Rect {
    let x = 146.0 + i as f32 * 48.0;
    Rect::new(x, 52.0, x + 46.0, 68.0)
}

fn rarity_color(r: &str) -> Color {
    match r {
        "legendary" => Color::srgb(0.91, 0.73, 0.29),
        "epic" => Color::srgb(0.69, 0.42, 0.85),
        "rare" => Color::srgb(0.31, 0.62, 0.85),
        _ => Color::srgb(0.62, 0.62, 0.62),
    }
}

fn suit_color(s: &str) -> Color {
    match s {
        "skill" => Color::srgb(0.36, 0.55, 0.78),
        "discipline" => Color::srgb(0.38, 0.66, 0.52),
        "special" => Color::srgb(0.91, 0.73, 0.29),
        _ => Color::srgb(0.72, 0.50, 0.32),
    }
}

/// Two-letter monogram used on cards until their art arrives.
fn monogram(name: &str) -> String {
    let words: Vec<&str> = name.split(|c: char| !c.is_alphanumeric()).filter(|w| !w.is_empty() && !["and", "of", "the"].contains(&w.to_lowercase().as_str())).collect();
    match words.as_slice() {
        [] => "?".into(),
        [w] => w.chars().take(2).collect::<String>().to_uppercase(),
        [a, b, ..] => format!("{}{}", a.chars().next().unwrap_or(' '), b.chars().next().unwrap_or(' ')).to_uppercase(),
    }
}

fn title_case(s: &str) -> String {
    let mut c = s.chars();
    c.next().map(|f| f.to_uppercase().collect::<String>() + c.as_str()).unwrap_or_default()
}

fn tab_rect(i: usize) -> Rect {
    Rect::new(40.0, 64.0 + i as f32 * 26.0, 132.0, 86.0 + i as f32 * 26.0)
}

fn sheet_row_at(at: Vec2, sel: usize, n: usize) -> Option<usize> {
    if n == 0 || at.x < 148.0 || at.x > 148.0 + 230.0 || at.y < LIST_TOP {
        return None;
    }
    let row = ((at.y - LIST_TOP) / ROW_H) as usize;
    let i = window_start(sel, n) + row;
    (row < ROWS && i < n).then_some(i)
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

/// A brass cog on the quest dossier, turning at this many radians a second.
#[derive(Component)]
struct Cog(f32);

/// A destination planet turning in place.
#[derive(Component)]
struct Orbit(usize);

fn animate_map(
    time: Res<Time>,
    mut strips: Query<(&Parallax, &mut Node)>,
    mut pulse: Query<&mut ImageNode, (With<Pulse>, Without<Orbit>)>,
    mut planets: Query<(&Orbit, &mut ImageNode), Without<Pulse>>,
    mut sweeps: Query<(&Shimmer, &mut Node), Without<Parallax>>,
    mut cogs: Query<(&Cog, &mut UiTransform), Without<Holo>>,
    mut holo: Query<(&mut ImageNode, &mut UiTransform), (With<Holo>, Without<Pulse>, Without<Orbit>, Without<Cog>)>,
) {
    let tt = time.elapsed_secs();
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
    let overlay = commands.spawn((at(0.0, 0.0, VW, VH), ZIndex(10))).id();
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
                if line.call {
                    // A transmission: the caller's head floats as a hologram
                    // over a little brass projector (a codec-style call).
                    portrait = Some(holo_call(p, f, img, layout, line.pose));
                } else {
                    portrait = Some(
                        p.spawn((
                            at(18.0, 262.0 - h + 8.0, w, h),
                            ImageNode::from_atlas_image(img.clone(), TextureAtlas { layout: layout.clone(), index: line.pose }),
                        ))
                        .id(),
                    );
                }
                p.spawn(panel(12.0, 258.0, 616.0, 92.0)).with_children(|b| {
                    b.spawn(text_at(&f.label, 10.0, LAMP, line.speaker.to_uppercase(), 14.0, 6.0, 400.0));
                    let (font, size) = if mana_dialogue { (&f.mana, 10.0) } else { (&f.body, 13.0) };
                    typed = Some(b.spawn(text_at(font, size, TEXT, "", 14.0, 24.0, 586.0)).id());
                    more = Some(b.spawn(text_at(&f.label, 10.0, CITRON, "›", 596.0, 72.0, 14.0)).id());
                });
                p.spawn(text_at(
                    &f.label,
                    8.0,
                    MUTED,
                    format!("{}/{}", d.idx + 1, d.lines.len()),
                    590.0,
                    246.0,
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
                // A blueprint of the Atlier, side on. The selected room lights up.
                p.spawn((at(0.0, 0.0, VW, VH), ImageNode::new(art.blueprint.clone())));
                p.spawn((at(0.0, 0.0, VW, VH), ImageNode::new(art.room_glow[sel].clone())));
                p.spawn(text_at(&f.label, 9.0, Color::srgb(0.70, 0.86, 1.0), "SHIP MAP · FAST TRAVEL", 20.0, 16.0, 260.0));
                p.spawn(text_at(&f.display, 22.0, Color::WHITE, "The Atlier", 20.0, 26.0, 300.0));
                p.spawn(text_at(&f.label, 7.0, Color::srgb(0.70, 0.86, 1.0).with_alpha(0.7), "SECTION A-A · NOT TO SCALE", 20.0, 52.0, 200.0));
                close_button(p, f);
                for (i, room) in ROOMS.iter().enumerate() {
                    let on = i == sel;
                    let c = room_center(i);
                    let tw = 96.0;
                    p.spawn(text_at(&f.label, 7.0, if on { Color::WHITE } else { Color::srgb(0.70, 0.86, 1.0) }, room.0.to_uppercase(), c.x - tw / 2.0, c.y - 5.0, tw).with_justify());
                }
                if let Some(h) = here {
                    let hp = room_center(h);
                    p.spawn((at(hp.x - 10.0, hp.y - 30.0, 20.0, 20.0), ImageNode::new(art.ship_cursor.clone())));
                }
                let (name, label, go, blurb, _) = ROOMS[sel];
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

        Mode::Sheet => render_sheet(&mut commands, overlay, &ui, &registry, f, &art, game.hatch_open),
        Mode::Explore | Mode::Lift => {}
    }
}

fn render_sheet(commands: &mut Commands, overlay: Entity, ui: &Ui, registry: &Registry, f: &Fonts, art: &UiArt, hatch: bool) {
    let stats = &registry.player.stats;
    commands.entity(overlay).with_children(|p| {
        p.spawn((at(TERM.min.x, TERM.min.y, TERM.width(), TERM.height()), ImageNode::new(art.menu_bg.clone())));
        p.spawn(text_at(&f.label, 9.0, CITRON, "MENU", 38.0, 20.0, 64.0).with_justify());
        close_button(p, f);
        for (i, name) in TABS.iter().enumerate() {
            let r = tab_rect(i);
            let on = i == ui.tab;
            if on {
                // Selected tab: an amber bar with an anime-style light sweep across it.
                p.spawn((
                    Node { border: UiRect::all(Val::Px(1.0)), overflow: Overflow::clip(), ..at(r.min.x, r.min.y, r.width(), r.height()) },
                    BackgroundColor(SELECT),
                    BorderColor::all(LINE),
                ))
                .with_children(|bar| {
                    bar.spawn((Shimmer(r.width()), at(-30.0, -2.0, 14.0, r.height() + 4.0), BackgroundColor(Color::WHITE.with_alpha(0.18))))
                        .with_children(|band| {
                            band.spawn((at(5.0, 0.0, 3.0, r.height() + 4.0), BackgroundColor(Color::WHITE.with_alpha(0.55))));
                        });
                });
            }
            p.spawn((at(r.min.x + 4.0, r.min.y + 3.0, 16.0, 16.0), ImageNode::new(art.ui_icons[TAB_ICONS[i]].clone())));
            p.spawn(text_at(&f.label, 10.0, if on { CITRON } else { TEXT }, name.to_uppercase(), r.min.x + 25.0, r.min.y + 5.0, 70.0));
        }

        match ui.tab {
            0 => {
                // STATUS
                // Full-body character art, standing beside the sheet.
                p.spawn((at(152.0, 44.0, 96.0, 196.0), ImageNode::new(art.full_body.clone())));
                p.spawn(text_at(&f.display, 22.0, CITRON, stats.name.clone(), 256.0, 46.0, 200.0));
                p.spawn(text_at(&f.label, 8.5, LAMP, format!("CLASS · {}", stats.title.to_uppercase()), 256.0, 76.0, 200.0));
                p.spawn(text_at(&f.body, 10.0, MUTED, stats.location.clone(), 256.0, 90.0, 200.0));
                p.spawn(text_at(&f.label, 9.0, SAGE, "LV", 256.0, 112.0, 30.0));
                p.spawn(text_at(&f.label, 22.0, CITRON, stats.level.to_string(), 276.0, 102.0, 60.0));
                // Attributes in two columns of three: WIL INT WIT / CHA WIS LCK.
                for (i, a) in stats.attributes.iter().enumerate() {
                    let (x, y) = (256.0 + (i / 3) as f32 * 76.0, 144.0 + (i % 3) as f32 * 24.0);
                    p.spawn(text_at(&f.label, 8.5, SAGE, a.label.to_uppercase(), x, y + 3.0, 40.0));
                    p.spawn(text_at(&f.label, 14.0, OLIVE, a.value.to_string(), x + 30.0, y - 2.0, 40.0));
                }
                // Radar.
                let (cx, cy, r) = (512.0, 150.0, 78.0);
                p.spawn((at(cx - r - 6.0, cy - r - 6.0, (r + 6.0) * 2.0, (r + 6.0) * 2.0), ImageNode::new(art.radar.clone())));
                let n = stats.radar.len().max(1);
                for (i, a) in stats.radar.iter().enumerate() {
                    let ang = -std::f32::consts::FRAC_PI_2 + i as f32 * std::f32::consts::TAU / n as f32;
                    let lx = cx + ang.cos() * (r + 18.0);
                    let ly = cy + ang.sin() * (r + 14.0);
                    p.spawn(text_at(&f.label, 8.0, TEXT, format!("{} {}", a.label.to_uppercase(), a.value as i32), lx - 40.0, ly - 6.0, 80.0))
                        .insert(TextLayout::justify(Justify::Center));
                }
                if let Some(q) = stats.quest_log.iter().find(|q| q.current) {
                    p.spawn(text_at(&f.label, 8.0, SAGE, "CURRENT QUEST", 152.0, 252.0, 200.0));
                    p.spawn(text_at(&f.bold, 12.0, CITRON, q.title.clone(), 152.0, 266.0, 440.0));
                    p.spawn(text_at(&f.label, 8.0, LAMP, format!("{} · {}", q.place.to_uppercase(), q.years), 152.0, 284.0, 440.0));
                }
                let counts = format!(
                    "{} ITEMS  ·  {} CARDS  ·  {} QUESTS",
                    stats.inventory.key_items.len() + usize::from(hatch),
                    stats.cards.len(),
                    stats.quest_log.len()
                );
                p.spawn(text_at(&f.label, 8.0, MUTED, counts, 152.0, 310.0, 440.0));
            }
            1 => {
                // ITEMS: an inventory grid; the selected item opens as a card.
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
                p.spawn(text_at(&f.label, 8.0, SAGE, format!("INVENTORY · {}", items.len()), 148.0, 50.0, 200.0));
                let slots = items.len().max(16).div_ceil(ITEM_COLS) * ITEM_COLS;
                for i in 0..slots.min(20) {
                    let r = grid_rect(1, i);
                    let it = items.get(i);
                    let on = i == ui.sel && it.is_some();
                    let edge = it.map_or(LINE.with_alpha(0.25), |it| rarity_color(&it.rarity));
                    p.spawn((
                        Node { border: UiRect::all(Val::Px(if on { 2.0 } else { 1.0 })), border_radius: BorderRadius::all(Val::Px(3.0)), ..at(r.min.x, r.min.y, r.width(), r.height()) },
                        BackgroundColor(if on { SELECT } else { Color::srgba(0.0, 0.0, 0.0, 0.35) }),
                        BorderColor::all(if on { CITRON } else { edge }),
                    ));
                    if let Some(it) = it {
                        p.spawn((at(r.min.x + 9.0, r.min.y + 7.0, 24.0, 24.0), ImageNode::new(art.ui_icons[item_icon(&it.kind_in_game)].clone())));
                        // Rarity gem in the corner.
                        p.spawn((Node { border_radius: BorderRadius::all(Val::Px(2.0)), ..at(r.max.x - 7.0, r.max.y - 7.0, 4.0, 4.0) }, BackgroundColor(edge)));
                    }
                }
                if let Some(it) = items.get(ui.sel) {
                    let c = rarity_color(&it.rarity);
                    let kind = title_case(if it.kind_in_game.is_empty() { &it.kind } else { &it.kind_in_game });
                    item_card(p, f, c, &it.name, &format!("{} · {}", kind.to_uppercase(), it.rarity.to_uppercase()), |p, b| {
                        p.spawn((at(b.x + b.w / 2.0 - 28.0, b.y + b.h / 2.0 - 28.0, 56.0, 56.0), ImageNode::new(art.ui_icons[item_icon(&it.kind_in_game)].clone())));
                    }, &[
                        ("ISSUER", it.from.clone()),
                        ("YEAR", it.year.map_or("—".into(), |y| y.to_string())),
                        ("BONUS", it.bonus.clone()),
                    ], &it.note);
                }
            }
            2 => {
                // SKILLS: a deck in four suits.
                for (i, (_, label)) in SUITS.iter().enumerate() {
                    let r = suit_rect(i);
                    let on = i == ui.suit;
                    p.spawn((
                        Node { border: UiRect::all(Val::Px(1.0)), border_radius: BorderRadius::all(Val::Px(2.0)), ..at(r.min.x, r.min.y, r.width(), r.height()) },
                        BackgroundColor(if on { suit_color(SUITS[i].0).with_alpha(0.35) } else { Color::NONE }),
                        BorderColor::all(if on { CITRON } else { suit_color(SUITS[i].0).with_alpha(0.6) }),
                        children![text_at(&f.label, 6.5, if on { CITRON } else { TEXT }, *label, 0.0, 3.5, r.width() - 2.0).with_justify()],
                    ));
                }
                let suit = SUITS[ui.suit].0;
                let deck: Vec<&crate::content::SkillCard> = stats.cards.iter().filter(|c| c.suit == suit).collect();
                let sc = suit_color(suit);
                for (i, card) in deck.iter().enumerate().take(25) {
                    let r = grid_rect(2, i);
                    let on = i == ui.sel;
                    p.spawn((
                        Node { border: UiRect::all(Val::Px(if on { 2.0 } else { 1.0 })), border_radius: BorderRadius::all(Val::Px(3.0)), overflow: Overflow::clip(), ..at(r.min.x, r.min.y, r.width(), r.height()) },
                        BackgroundColor(Color::srgba(0.05, 0.03, 0.05, 0.9)),
                        BorderColor::all(if on { CITRON } else { sc }),
                    ))
                    .with_children(|m| {
                        m.spawn((at(0.0, 0.0, r.width(), 6.0), BackgroundColor(sc.with_alpha(0.8))));
                        m.spawn(text_at(&f.display, 15.0, if on { CITRON } else { TEXT }, monogram(&card.name), 0.0, 11.0, r.width() - 2.0).with_justify());
                        m.spawn(text_at(&f.label, 5.5, sc, pips(card.mastery), 0.0, r.height() - 12.0, r.width() - 2.0).with_justify());
                    });
                }
                if let Some(card) = deck.get(ui.sel) {
                    let label = SUITS[ui.suit].1.trim_end_matches('S');
                    item_card(p, f, sc, &card.name, &format!("{} CARD", label), |p, b| {
                        p.spawn(text_at(&f.display, 40.0, sc, monogram(&card.name), b.x, b.y + b.h / 2.0 - 24.0, b.w).with_justify());
                    }, &[
                        ("MASTERY", pips(card.mastery)),
                        ("FEEDS", format!("+{} {}", card.mastery.div_ceil(2), card.feeds)),
                    ], &card.flavor);
                } else {
                    p.spawn(text_at(&f.body, 10.0, MUTED, "No cards in this suit yet.", 352.0, 60.0, 240.0));
                }
            }
            3 => {
                // QUESTS: career as a quest log. The active quest is a brass
                // dossier; finished ones are stamped logbook pages.
                let quests = &stats.quest_log;
                let total = quests.len() + stats.training.len();
                p.spawn(text_at(&f.label, 8.0, SAGE, "QUEST LOG", 148.0, 50.0, 200.0));
                let start = window_start(ui.sel, total);
                // The full view covers the list, so skip drawing it underneath.
                let shown = if ui.quest_full && ui.sel < quests.len() { 0 } else { total.min(start + ROWS) };
                for (row, i) in (start..shown.max(start)).enumerate() {
                    let y = LIST_TOP + row as f32 * ROW_H;
                    let on = i == ui.sel;
                    p.spawn((Node { border_radius: BorderRadius::all(Val::Px(2.0)), ..at(144.0, y, 238.0, ROW_H - 2.0) }, BackgroundColor(if on { SELECT } else { Color::NONE })));
                    let (title, place, years, mark) = if i < quests.len() {
                        let q = &quests[i];
                        (q.title.clone(), q.place.clone(), q.years.clone(), if q.current { 6 } else { 7 })
                    } else {
                        let t = &stats.training[i - quests.len()];
                        (t.title.clone(), t.place.clone(), t.years.clone(), 5)
                    };
                    p.spawn((at(148.0, y + 5.0, 16.0, 16.0), ImageNode::new(art.ui_icons[mark].clone())));
                    p.spawn(text_at(&f.bold, 10.5, if on { CITRON } else { TEXT }, truncate(&title, 30), 170.0, y + 1.0, 210.0));
                    p.spawn(text_at(&f.label, 7.0, SAGE, truncate(&format!("{} · {}", place.to_uppercase(), years), 40), 170.0, y + 15.0, 210.0));
                }
                let d = (390.0, 46.0, 210.0, 260.0);
                if ui.quest_full && let Some(q) = quests.get(ui.sel) {
                    quest_full_view(p, f, art, q);
                } else if let Some(q) = quests.get(ui.sel) {
                    if q.current {
                        dossier(p, f, art, d, q);
                    } else {
                        logbook(p, f, d, &q.title, &format!("{} · {}", q.place, q.years), &q.summary, &q.feats);
                    }
                } else if let Some(t) = stats.training.get(ui.sel - quests.len()) {
                    logbook(p, f, d, &t.title, &format!("{} · {}", t.place, t.years), "Training quest.", &[]);
                }
                if !ui.quest_full && ui.sel < quests.len() {
                    p.spawn(text_at(&f.label, 7.0, MUTED, if ui.touch { "TAP THE CARD FOR THE FULL QUEST" } else { "ENTER FOR THE FULL QUEST" }, 390.0, 316.0, 80.0));
                }
                p.spawn((panel(OPEN_BTN.min.x, OPEN_BTN.min.y, OPEN_BTN.width(), OPEN_BTN.height()),
                    children![text_at(&f.label, 9.0, CITRON, "FULL RESUME ›", 0.0, 5.0, OPEN_BTN.width() - 2.0).with_justify()]));
            }
            _ => {}
        }
    });
}

/// The HUD: location, menu and map buttons, interaction prompt, first-run hint.
fn hud(
    mut commands: Commands,
    mut ui: ResMut<Ui>,
    game: Res<Game>,
    fonts: Res<Fonts>,
    art: Res<UiArt>,
    root: Res<UiRoot>,
) {
    let show = game.mode == Mode::Explore;
    let prompt = if show { game.nearby } else { None };
    let key = format!("{show}|{:?}|{:?}|{}|{}", game.scene, prompt.map(|p| p.label), ui.hint > 0.0, ui.touch);
    let key = format!("{key}|{}", ui.tray);
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
    let hud = commands.spawn((at(0.0, 0.0, VW, VH), ZIndex(5))).id();
    commands.entity(root.0).add_child(hud);
    ui.hud = Some(hud);
    commands.entity(hud).with_children(|p| {
        p.spawn(panel(8.0, 8.0, 150.0, 34.0)).with_children(|b| {
            b.spawn(text_at(&f.label, 7.5, LAMP, def.label.to_uppercase(), 8.0, 3.0, 140.0));
            b.spawn(text_at(&f.display, 14.0, CITRON, def.name, 8.0, 12.0, 140.0));
        });
        if tray {
            p.spawn(panel(TRAY.min.x - 3.0, TRAY.min.y, TRAY.width() + 3.0, TRAY.height())).with_children(|b| {
                for (r, icon, label) in [(MENU_BTN, 8usize, "MENU"), (MAP_BTN, 3, "MAP")] {
                    let x = r.min.x + 3.0;
                    b.spawn((at(x + r.width() / 2.0 - 8.0, 6.0, 16.0, 16.0), ImageNode::new(art.ui_icons[icon].clone())));
                    b.spawn(text_at(&f.label, 7.0, CITRON, label, x, 25.0, r.width()).with_justify());
                }
                b.spawn(text_at(&f.label, 12.0, LINE, "‹", 88.0, 12.0, 10.0));
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
            let w = 32.0 + text.chars().count() as f32 * 6.4;
            let (x, y) = match crate::fx::cloud_tip(game.scene, &pt) {
                Some(tip) if tip.x + 40.0 + w <= VW - 4.0 => (tip.x + 40.0, tip.y - 26.0),
                Some(tip) => (tip.x - w - 4.0, tip.y - 26.0),
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
            p.spawn(panel(120.0, 334.0, 400.0, 18.0)).with_children(|b| {
                b.spawn(text_at(&f.label, 8.0, TEXT, msg, 0.0, 2.0, 400.0).with_justify());
            });
        }
    });
}

trait Centered {
    fn with_justify(self) -> (Self, TextLayout)
    where
        Self: Sized;
}
impl<B: Bundle> Centered for B {
    fn with_justify(self) -> (Self, TextLayout) {
        (self, TextLayout::justify(Justify::Center))
    }
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

/// A content box: x, y, width, height.
#[derive(Clone, Copy)]
struct Bx {
    x: f32,
    y: f32,
    w: f32,
    h: f32,
}

/// The detail card on the right of Items and Skills: a framed title plate,
/// an art window, attribute rows and flavour text.
fn item_card(
    p: &mut ChildSpawnerCommands,
    f: &Fonts,
    edge: Color,
    title: &str,
    kind: &str,
    art: impl FnOnce(&mut ChildSpawnerCommands, Bx),
    attrs: &[(&str, String)],
    note: &str,
) {
    let c = Bx { x: 352.0, y: 48.0, w: 248.0, h: 262.0 };
    p.spawn((
        Node { border: UiRect::all(Val::Px(2.0)), border_radius: BorderRadius::all(Val::Px(4.0)), ..at(c.x, c.y, c.w, c.h) },
        BackgroundColor(Color::srgba(0.06, 0.04, 0.06, 0.92)),
        BorderColor::all(edge),
    ));
    p.spawn(text_at(&f.label, 7.0, edge, kind.to_owned(), c.x + 10.0, c.y + 7.0, c.w - 20.0));
    p.spawn(text_at(&f.bold, 11.0, CITRON, truncate(title, 64), c.x + 10.0, c.y + 18.0, c.w - 20.0));
    // Art window: the detailed illustration goes here once the art lands.
    let a = Bx { x: c.x + 10.0, y: c.y + 48.0, w: c.w - 20.0, h: 96.0 };
    p.spawn((
        Node { border: UiRect::all(Val::Px(1.0)), border_radius: BorderRadius::all(Val::Px(2.0)), ..at(a.x, a.y, a.w, a.h) },
        BackgroundColor(edge.with_alpha(0.12)),
        BorderColor::all(edge.with_alpha(0.5)),
    ));
    art(p, a);
    let mut y = a.y + a.h + 8.0;
    for (k, v) in attrs {
        p.spawn(text_at(&f.label, 7.0, SAGE, *k, c.x + 10.0, y + 2.0, 60.0));
        p.spawn(text_at(&f.bold, 9.5, TEXT, truncate(v, 40), c.x + 70.0, y, c.w - 80.0));
        y += 15.0;
    }
    p.spawn(text_at(&f.body, 9.0, MUTED, truncate(note, 150), c.x + 10.0, y + 4.0, c.w - 20.0));
}

const BRASS: Color = Color::srgb(0.71, 0.54, 0.23);

/// The active quest: a riveted brass dossier with turning cogs.
fn dossier(p: &mut ChildSpawnerCommands, f: &Fonts, art: &UiArt, (x, y, w, h): (f32, f32, f32, f32), q: &crate::content::Quest) {
    p.spawn((
        Node { border: UiRect::all(Val::Px(2.0)), border_radius: BorderRadius::all(Val::Px(4.0)), overflow: Overflow::clip(), ..at(x, y, w, h) },
        BackgroundColor(Color::srgba(0.16, 0.10, 0.06, 0.96)),
        BorderColor::all(BRASS),
    ))
    .with_children(|d| {
        d.spawn((Cog(0.6), UiTransform::IDENTITY, at(w - 52.0, -18.0, 64.0, 64.0), ImageNode::new(art.cog.clone()).with_color(BRASS.with_alpha(0.55))));
        d.spawn((Cog(-1.0), UiTransform::IDENTITY, at(w - 70.0, 30.0, 32.0, 32.0), ImageNode::new(art.cog.clone()).with_color(BRASS.with_alpha(0.4))));
        for (rx, ry) in [(4.0, 4.0), (w - 10.0, 4.0), (4.0, h - 10.0), (w - 10.0, h - 10.0)] {
            d.spawn((Node { border_radius: BorderRadius::all(Val::Px(3.0)), ..at(rx, ry, 4.0, 4.0) }, BackgroundColor(BRASS)));
        }
        d.spawn((Node { border_radius: BorderRadius::all(Val::Px(3.0)), ..at(12.0, 13.0, 6.0, 6.0) }, BackgroundColor(LAMP)));
        d.spawn(text_at(&f.label, 7.5, LAMP, "ACTIVE QUEST", 22.0, 10.0, 120.0));
        d.spawn(text_at(&f.bold, 12.0, CITRON, q.title.clone(), 12.0, 26.0, w - 60.0));
        d.spawn(text_at(&f.label, 7.5, BRASS, format!("{} · {}", q.place.to_uppercase(), q.years), 12.0, 58.0, w - 24.0));
        // Pressure tube: how long this quest has been running.
        let since = q.years.split('–').next().and_then(|y| y.parse::<i32>().ok()).unwrap_or(2026);
        let run = (2026 - since).clamp(0, 10) as f32 / 10.0;
        d.spawn((Node { border: UiRect::all(Val::Px(1.0)), border_radius: BorderRadius::all(Val::Px(3.0)), ..at(12.0, 74.0, w - 24.0, 7.0) }, BorderColor::all(BRASS), BackgroundColor(Color::srgba(0.0, 0.0, 0.0, 0.4))));
        d.spawn((Node { border_radius: BorderRadius::all(Val::Px(2.0)), ..at(13.0, 75.0, ((w - 26.0) * run).max(4.0), 5.0) }, BackgroundColor(LAMP)));
        d.spawn(text_at(&f.body, 9.0, TEXT, truncate(&q.summary, 150), 12.0, 88.0, w - 24.0));
        let feats: Vec<String> = q.feats.iter().take(3).map(|x| format!("• {}", truncate(x, 64))).collect();
        d.spawn(text_at(&f.body, 8.5, MUTED, feats.join("\n"), 12.0, 160.0, w - 24.0));
    });
}

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

/// One quest in full, over the list: everything it involved.
fn quest_full_view(p: &mut ChildSpawnerCommands, f: &Fonts, art: &UiArt, q: &crate::content::Quest) {
    let (x, y, w, h) = (140.0, 44.0, 460.0, 262.0);
    let (bg, edge, ink, sub) = if q.current {
        (Color::srgba(0.16, 0.10, 0.06, 0.98), BRASS, TEXT, BRASS)
    } else {
        (Color::srgb(0.87, 0.81, 0.67), Color::srgb(0.55, 0.42, 0.28), Color::srgb(0.22, 0.14, 0.09), Color::srgb(0.45, 0.30, 0.18))
    };
    p.spawn((
        Node { border: UiRect::all(Val::Px(2.0)), border_radius: BorderRadius::all(Val::Px(4.0)), overflow: Overflow::clip(), ..at(x, y, w, h) },
        BackgroundColor(bg),
        BorderColor::all(edge),
    ))
    .with_children(|d| {
        if q.current {
            d.spawn((Cog(0.5), UiTransform::IDENTITY, at(w - 70.0, -24.0, 88.0, 88.0), ImageNode::new(art.cog.clone()).with_color(BRASS.with_alpha(0.45))));
            d.spawn((Node { border_radius: BorderRadius::all(Val::Px(3.0)), ..at(14.0, 15.0, 6.0, 6.0) }, BackgroundColor(LAMP)));
            d.spawn(text_at(&f.label, 7.5, LAMP, "ACTIVE QUEST", 24.0, 12.0, 160.0));
        } else {
            d.spawn(text_at(&f.label, 7.5, sub, "COMPLETED QUEST", 14.0, 12.0, 160.0));
        }
        d.spawn(text_at(&f.bold, 14.0, if q.current { CITRON } else { ink }, q.title.clone(), 14.0, 24.0, w - 100.0));
        d.spawn(text_at(&f.label, 8.0, sub, format!("{} · {}", q.place.to_uppercase(), q.years), 14.0, 46.0, w - 28.0));
        d.spawn(text_at(&f.body, 9.5, ink, q.summary.clone(), 14.0, 62.0, w - 28.0));
        let feats: Vec<String> = q.feats.iter().take(6).map(|x| format!("• {}", truncate(x, 110))).collect();
        d.spawn(text_at(&f.body, 9.0, ink, feats.join("\n"), 14.0, 104.0, w - 28.0));
        if !q.tech.is_empty() {
            d.spawn(text_at(&f.label, 7.0, sub, format!("KIT · {}", q.tech.join(" · ").to_uppercase()), 14.0, h - 20.0, w - 28.0));
        }
    });
}

/// A finished quest: an aged logbook page with a COMPLETE stamp.
fn logbook(p: &mut ChildSpawnerCommands, f: &Fonts, (x, y, w, h): (f32, f32, f32, f32), title: &str, sub: &str, summary: &str, feats: &[String]) {
    let ink = Color::srgb(0.22, 0.14, 0.09);
    p.spawn((
        Node { border: UiRect::all(Val::Px(1.0)), border_radius: BorderRadius::all(Val::Px(2.0)), overflow: Overflow::clip(), ..at(x, y, w, h) },
        BackgroundColor(Color::srgb(0.87, 0.81, 0.67)),
        BorderColor::all(Color::srgb(0.55, 0.42, 0.28)),
    ))
    .with_children(|d| {
        for i in 0..14 {
            d.spawn((at(0.0, 30.0 + i as f32 * 16.0, w, 1.0), BackgroundColor(Color::srgba(0.4, 0.5, 0.6, 0.18))));
        }
        d.spawn(text_at(&f.bold, 12.0, ink, title.to_owned(), 12.0, 10.0, w - 24.0));
        d.spawn(text_at(&f.label, 7.5, Color::srgb(0.45, 0.30, 0.18), sub.to_uppercase(), 12.0, 44.0, w - 24.0));
        d.spawn(text_at(&f.body, 9.0, ink, truncate(summary, 150), 12.0, 60.0, w - 24.0));
        let feats: Vec<String> = feats.iter().take(3).map(|x| format!("• {}", truncate(x, 64))).collect();
        d.spawn(text_at(&f.body, 8.5, Color::srgb(0.35, 0.25, 0.17), feats.join("\n"), 12.0, 140.0, w - 24.0));
        let red = Color::srgb(0.72, 0.16, 0.12);
        d.spawn((
            UiTransform::from_rotation(Rot2::degrees(-12.0)),
            Node { border: UiRect::all(Val::Px(2.0)), border_radius: BorderRadius::all(Val::Px(3.0)), ..at(w - 104.0, h - 44.0, 88.0, 24.0) },
            BorderColor::all(red.with_alpha(0.8)),
            children![text_at(&f.label, 10.0, red.with_alpha(0.85), "COMPLETE", 0.0, 4.0, 84.0).with_justify()],
        ));
    });
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

/// The blueprint sheet: grid paper, the hull, the deck line and every room
/// outline. Drawn at 2× for crisp lines; lines are stamped along each
/// segment so startup stays quick.
fn blueprint_image() -> Image {
    const K: f32 = 2.0;
    let (w, h) = ((VW * K) as u32, (VH * K) as u32);
    let hull: Vec<Vec2> = HULL.iter().map(|p| bp(*p)).collect();
    let mut buf = vec![Vec3::ZERO; (w * h) as usize];
    for y in 0..h {
        for x in 0..w {
            let p = Vec2::new((x as f32 + 0.5) / K, (y as f32 + 0.5) / K);
            let mut c = Vec3::new(0.05, 0.16, 0.34);
            let fine = (p.x % 10.0).min(10.0 - p.x % 10.0).min((p.y % 10.0).min(10.0 - p.y % 10.0));
            let coarse = (p.x % 50.0).min(50.0 - p.x % 50.0).min((p.y % 50.0).min(50.0 - p.y % 50.0));
            if fine < 0.35 {
                c = c.lerp(Vec3::new(0.30, 0.50, 0.75), 0.25);
            }
            if coarse < 0.5 {
                c = c.lerp(Vec3::new(0.40, 0.62, 0.88), 0.45);
            }
            if poly_contains(&hull, p) {
                c = c.lerp(Vec3::new(0.10, 0.25, 0.48), 0.5);
            }
            buf[(y * w + x) as usize] = c;
        }
    }
    // Stamp an antialiased line of half-width `wd` (logical px).
    let mut stroke = |pts: &[Vec2], closed: bool, wd: f32, color: Vec3, strength: f32| {
        let n = pts.len();
        let segs = if closed { n } else { n - 1 };
        for i in 0..segs {
            let (a, b) = (pts[i] * K, pts[(i + 1) % n] * K);
            let (lo, hi) = (a.min(b) - Vec2::splat(wd * K + 2.0), a.max(b) + Vec2::splat(wd * K + 2.0));
            for y in (lo.y.max(0.0) as u32)..(hi.y.min(h as f32 - 1.0) as u32) {
                for x in (lo.x.max(0.0) as u32)..(hi.x.min(w as f32 - 1.0) as u32) {
                    let d = seg_d(Vec2::new(x as f32 + 0.5, y as f32 + 0.5), a, b);
                    let cov = (wd * K - d + 0.5).clamp(0.0, 1.0) * strength;
                    if cov > 0.0 {
                        let px = &mut buf[(y * w + x) as usize];
                        *px = px.lerp(color, cov);
                    }
                }
            }
        }
    };
    let ink = Vec3::new(0.92, 0.96, 1.0);
    for i in 0..ROOMS.len() {
        stroke(&room_poly(i), true, 0.5, Vec3::new(0.62, 0.80, 1.0), 0.75);
    }
    let deck: Vec<Vec2> = DECK.iter().map(|p| bp(*p)).collect();
    stroke(&deck, false, 0.5, ink, 0.6);
    stroke(&hull, true, 0.9, ink, 1.0);
    let mut img = blank(w, h);
    for y in 0..h {
        for x in 0..w {
            let c = buf[(y * w + x) as usize];
            let _ = img.set_color_at(x, y, Color::srgb(c.x, c.y, c.z));
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
                let _ = img.set_color_at(x, y, Color::srgba(0.55, 0.92, 1.0, a.min(1.0)));
            }
        }
    }
    img
}

/// A plain cog wheel, white so it can be tinted.
fn cog_image() -> Image {
    const S: u32 = 128;
    let mut img = Image::new_fill(
        Extent3d { width: S, height: S, depth_or_array_layers: 1 },
        TextureDimension::D2,
        &[0, 0, 0, 0],
        TextureFormat::Rgba8UnormSrgb,
        RenderAssetUsages::default(),
    );
    let c = S as f32 / 2.0;
    for y in 0..S {
        for x in 0..S {
            let d = Vec2::new(x as f32 + 0.5 - c, y as f32 + 0.5 - c);
            let r = d.length();
            let ang = d.y.atan2(d.x);
            // Ten teeth: the rim bumps out where cos(10θ) is high.
            let tooth = if (ang * 10.0).cos() > 0.2 { 60.0 } else { 50.0 };
            let edge = (tooth - r).min(r - 18.0);
            let spoke = (ang * 3.0).cos().abs() > 0.93 || r > 40.0 || r < 26.0;
            let a = edge.clamp(0.0, 1.0) * if spoke { 1.0 } else { 0.0 };
            if a > 0.0 {
                let _ = img.set_color_at(x, y, Color::srgba(1.0, 1.0, 1.0, a));
            }
        }
    }
    img
}

/// Rasterise the stats radar into a small image (rings, spokes, filled shape).
fn radar_image(values: &[f32]) -> Image {
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
                px = blend(px, Srgba::new(0.08, 0.03, 0.055, 0.55));
            }
            for ring in &rings {
                let a = cov(poly_dist(ring, p), 0.8);
                if a > 0.0 {
                    px = blend(px, Srgba::new(0.475, 0.58, 0.588, 0.55 * a));
                }
            }
            for i in 0..n {
                let a = cov(seg_dist(p, c, vert(i, 1.0)), 0.6);
                if a > 0.0 {
                    px = blend(px, Srgba::new(0.475, 0.58, 0.588, 0.4 * a));
                }
            }
            if inside(&shape, p) {
                px = blend(px, Srgba::new(0.93, 0.55, 0.25, 0.45));
            }
            let a = cov(poly_dist(&shape, p), 1.6);
            if a > 0.0 {
                px = blend(px, Srgba::new(0.914, 0.922, 0.62, a));
            }
            for v in &shape {
                let a = cov(p.distance(*v), 3.5);
                if a > 0.0 {
                    px = blend(px, Srgba::new(0.914, 0.922, 0.62, a));
                }
            }
            let _ = img.set_color_at(x, y, Color::Srgba(px));
        }
    }
    img
}
