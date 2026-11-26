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
                (layout_frame, handle_request, input, tick, render, hud)
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
    Door(SceneId),
    Talk(Npc),
    Terminal(String),
    /// A destination id: work, about, writing, contact.
    Destination(String),
    Menu,
}

pub fn trigger(game: &mut Game, pt: Point) {
    game.request = Some(match pt.action {
        Action::OpenAtlas => Request::Atlas,
        Action::Goto(s) => Request::Door(s),
        Action::Talk(n) => Request::Talk(n),
        Action::Terminal(id) => Request::Terminal(id.to_owned()),
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

const MENU_BTN: Rect = Rect { min: Vec2::new(572.0, 8.0), max: Vec2::new(632.0, 28.0) };
const MAP_BTN: Rect = Rect { min: Vec2::new(506.0, 8.0), max: Vec2::new(566.0, 28.0) };

pub fn hud_hit(at: Vec2) -> bool {
    MENU_BTN.contains(at) || MAP_BTN.contains(at)
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

#[derive(Clone, Copy, PartialEq, Eq)]
enum Who {
    Erikk,
    Technician,
    Archivist,
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
    sel: usize,
}

struct Travel {
    t: f32,
    len: f32,
    to: SceneId,
    swapped: bool,
    flight: bool,
}

const TABS: [&str; 4] = ["Status", "Items", "Quests", "Map"];

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
    typed: Option<Entity>,
    more: Option<Entity>,
    portrait: Option<Entity>,
    fade: Option<Entity>,
    flight: Option<Entity>,
}

#[derive(Resource)]
struct Fonts {
    body: Handle<Font>,
    bold: Handle<Font>,
    label: Handle<Font>,
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
    faces_layout: Handle<TextureAtlasLayout>,
    call_layout: Handle<TextureAtlasLayout>,
    atlas_bg: Handle<Image>,
    icons: Vec<(String, [Handle<Image>; 3])>,
    ship_cursor: Handle<Image>,
    flight: Handle<Image>,
    flight_layout: Handle<TextureAtlasLayout>,
    radar: Handle<Image>,
    menu_bg: Handle<Image>,
    /// status, items, quests, map, credential, degree, quest_active, quest_done
    ui_icons: [Handle<Image>; 8],
    key_e: Handle<Image>,
    key_tap: Handle<Image>,
}

#[derive(Resource)]
struct UiRoot(Entity);

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
        label: assets.load("fonts/Cairo_700Bold.ttf"),
        display: assets.load("fonts/Shupp.otf"),
    });
    let icons = DESTS
        .iter()
        .map(|(id, _)| {
            (
                id.to_string(),
                [
                    assets.load(format!("atlas/{id}_normal.png")),
                    assets.load(format!("atlas/{id}_selected.png")),
                    assets.load(format!("atlas/{id}_visited.png")),
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
        faces_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(256, 352), 4, 1, None, None)),
        call_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(192, 256), 4, 1, None, None)),
        atlas_bg: assets.load("scenes/atlas.png"),
        icons,
        ship_cursor: assets.load("atlas/ship_cursor.png"),
        flight: assets.load("ships/crescent_flight.png"),
        flight_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(192, 112), 4, 1, None, None)),
        radar,
        menu_bg: assets.load("ui/menu_bg.png"),
        ui_icons: ["status", "items", "quests", "map", "credential", "degree", "quest_active", "quest_done"]
            .map(|n| assets.load(format!("ui/icon_{n}.png"))),
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
                SceneId::Bridge => 1,
            };
            ui.atlas_sel = here;
            game.mode = Mode::Atlas;
        }
        Request::Menu => {
            ui.tab = 0;
            ui.sel = 0;
            game.mode = Mode::Sheet;
        }
        Request::Door(to) => start_travel(&mut game, &mut ui, to, false),
        Request::Terminal(id) => {
            game.mark_visited(&id);
            ui.terminal = Some(Terminal { dest: registry.dest(&id), sel: 0 });
            game.mode = Mode::Terminal;
        }
        Request::Talk(npc) => {
            let (who, name, dest, closing) = match npc {
                Npc::Technician => (
                    Who::Technician,
                    "Dock Technician",
                    registry.dest("work"),
                    "The workbench has the full manifest. Every entry opens the real write-up.",
                ),
                Npc::Archivist => (
                    Who::Archivist,
                    "Relay Archivist",
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
                    lines.push(Line { speaker: name.clone(), who: Who::Erikk, pose: [1, 2, 0, 3][i % 4], call: false, text: chunk });
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
    mut game: ResMut<Game>,
    mut ui: ResMut<Ui>,
) {
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
    let close_hit = |at: Vec2| Rect::new(600.0, 14.0, 628.0, 40.0).contains(at);

    match game.mode {
        Mode::Explore => {
            if keys.any_just_pressed([KeyCode::Escape, KeyCode::KeyC, KeyCode::Tab]) || tap.is_some_and(|t| MENU_BTN.contains(t)) {
                game.request = Some(Request::Menu);
            } else if keys.just_pressed(KeyCode::KeyM) || tap.is_some_and(|t| MAP_BTN.contains(t)) {
                game.request = Some(Request::Atlas);
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
            let n = term.dest.items.len();
            let mut changed = false;
            if up && term.sel > 0 {
                term.sel -= 1;
                changed = true;
            }
            if down && term.sel + 1 < n {
                term.sel += 1;
                changed = true;
            }
            if ok && n > 0 {
                bridge::emit("open", &term.dest.items[term.sel].href);
            }
            if let Some(at) = tap {
                if close_hit(at) {
                    game.mode = Mode::Explore;
                } else if let Some(i) = terminal_row_at(at, term.sel, n) {
                    if i == term.sel {
                        bridge::emit("open", &term.dest.items[i].href);
                    } else {
                        term.sel = i;
                    }
                    changed = true;
                } else if OPEN_BTN.contains(at) && n > 0 {
                    bridge::emit("open", &term.dest.items[term.sel].href);
                }
            }
            if back {
                game.mode = Mode::Explore;
            }
            if changed || game.mode != Mode::Terminal {
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
            let list_len = match ui.tab {
                1 => registry.player.stats.inventory.key_items.len(),
                2 => registry.player.stats.quest_log.len() + registry.player.stats.training.len(),
                _ => 0,
            };
            let mut changed = false;
            if keys.just_pressed(KeyCode::Tab) || keys.just_pressed(KeyCode::KeyQ) || right {
                ui.tab = (ui.tab + 1) % TABS.len();
                ui.sel = 0;
                changed = true;
            }
            if left {
                ui.tab = (ui.tab + TABS.len() - 1) % TABS.len();
                ui.sel = 0;
                changed = true;
            }
            if up && ui.sel > 0 {
                ui.sel -= 1;
                changed = true;
            }
            if down && ui.sel + 1 < list_len {
                ui.sel += 1;
                changed = true;
            }
            if let Some(at) = tap {
                if close_hit(at) {
                    game.mode = Mode::Explore;
                    changed = true;
                } else if let Some(t) = (0..TABS.len()).find(|t| tab_rect(*t).contains(at)) {
                    ui.tab = t;
                    ui.sel = 0;
                    changed = true;
                } else if let Some(i) = sheet_row_at(at, ui.sel, list_len) {
                    ui.sel = i;
                    changed = true;
                } else if ui.tab == 2 && OPEN_BTN.contains(at) {
                    bridge::emit("open", "/resume");
                }
            }
            if ok && ui.tab == 2 {
                bridge::emit("open", "/resume");
            }
            if ui.tab == 3 {
                // The Map tab is a shortcut to the star atlas.
                game.mode = Mode::Explore;
                game.request = Some(Request::Atlas);
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
        Mode::Travel => {}
    }
}

// Shared geometry between layout and hit tests.
const TERM: Rect = Rect { min: Vec2::new(28.0, 14.0), max: Vec2::new(612.0, 346.0) };
const LIST_X: f32 = 44.0;
const LIST_W: f32 = 300.0;
const LIST_TOP: f32 = 70.0;
const ROW_H: f32 = 28.0;
const ROWS: usize = 9;
const OPEN_BTN: Rect = Rect { min: Vec2::new(470.0, 306.0), max: Vec2::new(596.0, 330.0) };
const TRAVEL_BTN: Rect = Rect { min: Vec2::new(488.0, 318.0), max: Vec2::new(600.0, 342.0) };

fn window_start(sel: usize, n: usize) -> usize {
    if n <= ROWS { 0 } else { sel.saturating_sub(ROWS / 2).min(n - ROWS) }
}

fn terminal_row_at(at: Vec2, sel: usize, n: usize) -> Option<usize> {
    if at.x < LIST_X || at.x > LIST_X + LIST_W || at.y < LIST_TOP {
        return None;
    }
    let row = ((at.y - LIST_TOP) / ROW_H) as usize;
    let i = window_start(sel, n) + row;
    (row < ROWS && i < n).then_some(i)
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
    p.spawn((panel(600.0, 14.0, 26.0, 24.0), children![text_at(&f.label, 11.0, CITRON, "X", 8.0, 3.0, 20.0)]));
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
            };
            let mut typed = None;
            let mut more = None;
            let mut portrait = None;
            commands.entity(overlay).with_children(|p| {
                portrait = Some(
                    p.spawn((
                        at(18.0, 262.0 - h + 8.0, w, h),
                        ImageNode::from_atlas_image(img.clone(), TextureAtlas { layout: layout.clone(), index: line.pose }),
                    ))
                    .id(),
                );
                p.spawn(panel(12.0, 258.0, 616.0, 92.0)).with_children(|b| {
                    b.spawn(text_at(&f.label, 10.0, LAMP, line.speaker.to_uppercase(), 14.0, 6.0, 400.0));
                    typed = Some(b.spawn(text_at(&f.body, 13.0, TEXT, "", 14.0, 24.0, 586.0)).id());
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
            let n = term.dest.items.len();
            let start = window_start(term.sel, n);
            let hint = if ui.touch { "Tap to select, tap again to open" } else { "Up/Down select · Enter open · Esc close" };
            commands.entity(overlay).with_children(|p| {
                p.spawn(panel(TERM.min.x, TERM.min.y, TERM.width(), TERM.height()));
                p.spawn(text_at(&f.label, 9.0, SAGE, format!("TERMINAL · {}", term.dest.label.to_uppercase()), 44.0, 24.0, 400.0));
                p.spawn(text_at(&f.display, 22.0, CITRON, term.dest.name.clone(), 44.0, 34.0, 400.0));
                close_button(p, f);
                for (row, i) in (start..n.min(start + ROWS)).enumerate() {
                    let item = &term.dest.items[i];
                    let y = LIST_TOP + row as f32 * ROW_H;
                    let selected = i == term.sel;
                    p.spawn((
                        Node { border_radius: BorderRadius::all(Val::Px(2.0)), ..at(LIST_X - 4.0, y, LIST_W + 8.0, ROW_H - 2.0) },
                        BackgroundColor(if selected { SELECT } else { Color::NONE }),
                    ));
                    p.spawn(text_at(&f.bold, 11.0, if selected { CITRON } else { TEXT }, truncate(&item.title, 44), LIST_X + 4.0, y + 1.0, LIST_W));
                    if let Some(meta) = &item.meta {
                        p.spawn(text_at(&f.label, 7.5, SAGE, truncate(&meta.to_uppercase(), 60), LIST_X + 4.0, y + 15.0, LIST_W));
                    }
                }
                if n > ROWS {
                    p.spawn(text_at(&f.label, 8.0, MUTED, format!("{} of {}", term.sel + 1, n), LIST_X, 326.0, 120.0));
                }
                if let Some(item) = term.dest.items.get(term.sel) {
                    p.spawn(text_at(&f.bold, 13.0, CITRON, item.title.clone(), 368.0, 72.0, 228.0));
                    if let Some(desc) = &item.description {
                        p.spawn(text_at(&f.body, 11.0, TEXT, truncate(desc, 260), 368.0, 112.0, 228.0));
                    }
                    p.spawn((panel(OPEN_BTN.min.x, OPEN_BTN.min.y, OPEN_BTN.width(), OPEN_BTN.height()),
                        children![text_at(&f.label, 9.0, CITRON, "OPEN PAGE ›", 22.0, 5.0, 120.0)]));
                }
                p.spawn(text_at(&f.label, 8.0, MUTED, hint, 200.0, 326.0, 260.0));
            });
        }

        Mode::Atlas => {
            let here = match game.scene {
                SceneId::Port => DESTS[0].1,
                SceneId::Archive => DESTS[2].1,
                SceneId::Bridge => Vec2::new(320.0, 180.0),
            };
            let sel = ui.atlas_sel;
            let dest = registry.dest(DESTS[sel].0);
            commands.entity(overlay).with_children(|p| {
                p.spawn((at(0.0, 0.0, VW, VH), ImageNode::new(art.atlas_bg.clone())));
                p.spawn(text_at(&f.label, 9.0, SAGE, "STAR ATLAS", 20.0, 16.0, 200.0));
                p.spawn(text_at(&f.display, 22.0, CITRON, "The Scattered Atlas", 20.0, 26.0, 300.0));
                close_button(p, f);
                for (i, (id, pos)) in DESTS.iter().enumerate() {
                    let d = registry.dest(id);
                    let state = if i == sel { 1 } else if game.visited.iter().any(|v| v == id) { 2 } else { 0 };
                    let icon = art.icons[i].1[state].clone();
                    p.spawn((at(pos.x - 16.0, pos.y - 16.0, 32.0, 32.0), ImageNode::new(icon)));
                    p.spawn(text_at(&f.label, 8.0, if i == sel { LAMP } else { TEXT }, d.label.to_uppercase(), pos.x - 50.0, pos.y + 16.0, 100.0))
                        .insert(TextLayout::justify(Justify::Center));
                }
                p.spawn((at(here.x - 12.0, here.y - 40.0, 24.0, 24.0), ImageNode::new(art.ship_cursor.clone())));
                p.spawn(panel(150.0, 282.0, 460.0, 66.0)).with_children(|b| {
                    b.spawn(text_at(&f.label, 8.0, LAMP, dest.label.to_uppercase(), 10.0, 6.0, 300.0));
                    b.spawn(text_at(&f.bold, 13.0, CITRON, dest.name.clone(), 10.0, 18.0, 320.0));
                    b.spawn(text_at(&f.body, 10.0, MUTED, truncate(&dest.preview, 120), 10.0, 36.0, 320.0));
                });
                p.spawn((panel(TRAVEL_BTN.min.x, TRAVEL_BTN.min.y - 30.0, TRAVEL_BTN.width(), TRAVEL_BTN.height()),
                    children![text_at(&f.label, 9.0, CITRON, "TRAVEL ›", 30.0, 5.0, 100.0)]));
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

        Mode::Sheet => render_sheet(&mut commands, overlay, &ui, &registry, f, &art),
        Mode::Explore => {}
    }
}

fn render_sheet(commands: &mut Commands, overlay: Entity, ui: &Ui, registry: &Registry, f: &Fonts, art: &UiArt) {
    let stats = &registry.player.stats;
    commands.entity(overlay).with_children(|p| {
        p.spawn((at(TERM.min.x, TERM.min.y, TERM.width(), TERM.height()), ImageNode::new(art.menu_bg.clone())));
        p.spawn(text_at(&f.label, 9.0, CITRON, "MENU", 38.0, 20.0, 64.0).with_justify());
        close_button(p, f);
        for (i, name) in TABS.iter().enumerate() {
            let r = tab_rect(i);
            let on = i == ui.tab;
            if on {
                p.spawn((
                    Node { border: UiRect::all(Val::Px(1.0)), ..at(r.min.x, r.min.y, r.width(), r.height()) },
                    BackgroundColor(SELECT),
                    BorderColor::all(LINE),
                ));
            }
            p.spawn((at(r.min.x + 4.0, r.min.y + 3.0, 16.0, 16.0), ImageNode::new(art.ui_icons[i].clone())));
            p.spawn(text_at(&f.label, 10.0, if on { CITRON } else { TEXT }, name.to_uppercase(), r.min.x + 25.0, r.min.y + 5.0, 70.0));
        }
        p.spawn(text_at(&f.label, 7.5, MUTED, "Left/Right tabs · Up/Down select · Esc close", 40.0, 326.0, 200.0));

        match ui.tab {
            0 => {
                // STATUS
                p.spawn((at(146.0, 50.0, 102.0, 140.0), ImageNode::from_atlas_image(art.erikk_faces.clone(), TextureAtlas { layout: art.faces_layout.clone(), index: 1 })));
                p.spawn(text_at(&f.display, 22.0, CITRON, stats.name.clone(), 256.0, 46.0, 200.0));
                p.spawn(text_at(&f.label, 8.5, LAMP, format!("CLASS · {}", stats.title.to_uppercase()), 256.0, 76.0, 200.0));
                p.spawn(text_at(&f.body, 10.0, MUTED, stats.location.clone(), 256.0, 90.0, 200.0));
                p.spawn(text_at(&f.label, 9.0, SAGE, "LV", 256.0, 112.0, 30.0));
                p.spawn(text_at(&f.label, 22.0, CITRON, stats.level.to_string(), 276.0, 102.0, 60.0));
                for (i, a) in stats.attributes.iter().enumerate() {
                    let y = 142.0 + i as f32 * 22.0;
                    p.spawn(text_at(&f.label, 8.5, SAGE, a.label.to_uppercase(), 256.0, y, 110.0));
                    p.spawn(text_at(&f.label, 12.0, OLIVE, a.value.to_string(), 366.0, y - 3.0, 40.0));
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
                p.spawn(text_at(&f.label, 8.5, SAGE, "SKILLS", 146.0, 240.0, 100.0));
                p.spawn(text_at(&f.body, 10.0, TEXT, stats.skills.join(" · "), 146.0, 254.0, 450.0));
                p.spawn(text_at(&f.label, 8.5, SAGE, "DISCIPLINES", 146.0, 290.0, 100.0));
                p.spawn(text_at(&f.body, 10.0, TEXT, stats.soft_skills.join(" · "), 146.0, 304.0, 450.0));
            }
            1 => {
                // ITEMS
                let items = &stats.inventory.key_items;
                p.spawn(text_at(&f.label, 8.5, SAGE, "KEY ITEMS", 148.0, 50.0, 200.0));
                let start = window_start(ui.sel, items.len());
                for (row, i) in (start..items.len().min(start + ROWS)).enumerate() {
                    let it = &items[i];
                    let y = LIST_TOP + row as f32 * ROW_H;
                    let on = i == ui.sel;
                    p.spawn((Node { border_radius: BorderRadius::all(Val::Px(2.0)), ..at(144.0, y, 238.0, ROW_H - 2.0) }, BackgroundColor(if on { SELECT } else { Color::NONE })));
                    let icon = if it.kind == "credential" { 4 } else { 5 };
                    p.spawn((at(148.0, y + 5.0, 16.0, 16.0), ImageNode::new(art.ui_icons[icon].clone())));
                    p.spawn(text_at(&f.bold, 10.5, if on { CITRON } else { TEXT }, truncate(&it.name, 32), 170.0, y + 1.0, 210.0));
                    p.spawn(text_at(&f.label, 7.5, SAGE, truncate(&it.from.to_uppercase(), 38), 170.0, y + 15.0, 210.0));
                }
                if let Some(it) = items.get(ui.sel) {
                    p.spawn(text_at(&f.bold, 12.0, CITRON, it.name.clone(), 398.0, 50.0, 200.0));
                    p.spawn(text_at(&f.label, 8.0, LAMP, format!("{} · {}", if it.kind == "credential" { "CREDENTIAL" } else { "TRAINING" }, it.from.to_uppercase()), 398.0, 84.0, 200.0));
                    p.spawn(text_at(&f.body, 10.0, TEXT, truncate(&it.note, 180), 398.0, 100.0, 200.0));
                }
                p.spawn(text_at(&f.label, 8.5, SAGE, "GEAR", 398.0, 186.0, 100.0));
                for (i, g) in stats.inventory.gear.iter().take(12).enumerate() {
                    let (col, row) = (i % 2, i / 2);
                    p.spawn(text_at(&f.body, 9.5, TEXT, format!("{} ×{}", truncate(&g.name, 18), g.uses), 398.0 + col as f32 * 104.0, 200.0 + row as f32 * 18.0, 104.0));
                }
            }
            2 => {
                // QUESTS: the resume as a quest log.
                let quests = &stats.quest_log;
                let total = quests.len() + stats.training.len();
                p.spawn(text_at(&f.label, 8.5, SAGE, "QUEST LOG", 148.0, 50.0, 200.0));
                let start = window_start(ui.sel, total);
                for (row, i) in (start..total.min(start + ROWS)).enumerate() {
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
                    p.spawn(text_at(&f.label, 7.5, SAGE, truncate(&format!("{} · {}", place.to_uppercase(), years), 40), 170.0, y + 15.0, 210.0));
                }
                if ui.sel < quests.len() {
                    let q = &quests[ui.sel];
                    p.spawn(text_at(&f.bold, 12.0, CITRON, q.title.clone(), 398.0, 50.0, 200.0));
                    p.spawn(text_at(&f.label, 8.0, LAMP, format!("{} · {}", q.place.to_uppercase(), q.years), 398.0, 84.0, 200.0));
                    p.spawn(text_at(&f.body, 9.5, TEXT, truncate(&q.summary, 150), 398.0, 98.0, 200.0));
                    let feats: Vec<String> = q.feats.iter().take(4).map(|x| format!("• {}", truncate(x, 70))).collect();
                    p.spawn(text_at(&f.body, 9.0, MUTED, feats.join("\n"), 398.0, 168.0, 200.0));
                } else if let Some(t) = stats.training.get(ui.sel - quests.len()) {
                    p.spawn(text_at(&f.label, 8.0, LAMP, "TRAINING", 398.0, 50.0, 200.0));
                    p.spawn(text_at(&f.bold, 12.0, CITRON, t.title.clone(), 398.0, 64.0, 200.0));
                    p.spawn(text_at(&f.body, 10.0, TEXT, format!("{}\n{}", t.place, t.years), 398.0, 110.0, 200.0));
                }
                p.spawn((panel(OPEN_BTN.min.x, OPEN_BTN.min.y, OPEN_BTN.width(), OPEN_BTN.height()),
                    children![text_at(&f.label, 9.0, CITRON, "FULL RESUME ›", 18.0, 5.0, 120.0)]));
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
    let hint = ui.hint > 0.0;
    let hud = commands.spawn((at(0.0, 0.0, VW, VH), ZIndex(5))).id();
    commands.entity(root.0).add_child(hud);
    ui.hud = Some(hud);
    commands.entity(hud).with_children(|p| {
        p.spawn(panel(8.0, 8.0, 150.0, 34.0)).with_children(|b| {
            b.spawn(text_at(&f.label, 7.5, LAMP, def.label.to_uppercase(), 8.0, 3.0, 140.0));
            b.spawn(text_at(&f.display, 14.0, CITRON, def.name, 8.0, 12.0, 140.0));
        });
        for (r, label) in [(MAP_BTN, "MAP"), (MENU_BTN, "MENU")] {
            p.spawn((panel(r.min.x, r.min.y, r.width(), r.height()), children![text_at(&f.label, 9.0, CITRON, label, 0.0, 3.0, r.width())
                .with_justify()]));
        }
        if let Some(pt) = prompt {
            // "Activate console" with a key icon, right beside the thought cloud.
            let text = match pt.action {
                Action::OpenAtlas | Action::Terminal(_) => format!("Activate {}", pt.label.to_lowercase()),
                _ => pt.label.to_owned(),
            };
            let w = 30.0 + text.chars().count() as f32 * 5.2;
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
                "Tap to walk · tap people and consoles to interact · MENU for the character sheet"
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
