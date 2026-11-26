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
use bevy::image::{CompressedImageFormats, ImageSampler, ImageType};
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
}

#[derive(Clone, Copy)]
pub struct Point {
    pub pos: Vec2,
    pub label: &'static str,
    pub action: Action,
}

pub struct SceneDef {
    pub name: &'static str,
    pub label: &'static str,
    pub bg: &'static str,
    pub fg: &'static str,
    pub fg_threshold: f32,
    pub spawn: Vec2,
    pub points: &'static [Point],
    pub npc: Option<(Npc, Vec2)>,
    mask: &'static [u8],
}

const fn p(x: f32, y: f32) -> Vec2 {
    Vec2::new(x, y)
}

pub fn scene_def(id: SceneId) -> &'static SceneDef {
    static BRIDGE: SceneDef = SceneDef {
        name: "The Crescent",
        label: "Bridge",
        bg: "scenes/bridge.png",
        fg: "maps/bridge_foreground.png",
        fg_threshold: 265.0,
        spawn: p(310.0, 298.0),
        points: &[
            Point { pos: p(470.0, 180.0), label: "Star console", action: Action::OpenAtlas },
            Point { pos: p(250.0, 330.0), label: "Gangway to the Dockyard", action: Action::Goto(SceneId::Port) },
        ],
        npc: None,
        mask: include_bytes!("../masks/bridge_walkable.png"),
    };
    static PORT: SceneDef = SceneDef {
        name: "The Dockyard",
        label: "Work",
        bg: "scenes/port.png",
        fg: "maps/port_foreground.png",
        fg_threshold: 335.0,
        spawn: p(323.0, 283.0),
        points: &[
            Point { pos: p(320.0, 153.0), label: "Workbench", action: Action::Terminal("work") },
            Point { pos: p(421.0, 176.0), label: "Talk to the technician", action: Action::Talk(Npc::Technician) },
            Point { pos: p(169.0, 212.0), label: "Board the Crescent", action: Action::Goto(SceneId::Bridge) },
        ],
        npc: Some((Npc::Technician, p(421.0, 176.0))),
        mask: include_bytes!("../masks/port_walkable.png"),
    };
    static ARCHIVE: SceneDef = SceneDef {
        name: "The Archive",
        label: "Writing",
        bg: "scenes/archive.png",
        fg: "maps/archive_foreground.png",
        fg_threshold: 341.0,
        spawn: p(323.0, 301.0),
        points: &[
            Point { pos: p(323.0, 151.0), label: "Records", action: Action::Terminal("writing") },
            Point { pos: p(385.0, 182.0), label: "Talk to the archivist", action: Action::Talk(Npc::Archivist) },
            Point { pos: p(323.0, 328.0), label: "Back to the Crescent", action: Action::Goto(SceneId::Bridge) },
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
            archive: decode_mask(scene_def(SceneId::Archive).mask),
        }
    }
    pub fn walkable(&self, scene: SceneId, at: Vec2) -> bool {
        if at.x < 0.0 || at.y < 0.0 || at.x >= VW || at.y >= VH {
            return false;
        }
        let m = match scene {
            SceneId::Bridge => &self.bridge,
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
}

#[derive(Resource)]
pub struct Game {
    pub scene: SceneId,
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
    pub idle_layout: Handle<TextureAtlasLayout>,
    pub walk_layout: Handle<TextureAtlasLayout>,
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
        mode: Mode::Explore,
        nearby: None,
        pending: None,
        visited,
        paused: false,
        request: None,
    })
    .add_message::<EnterScene>()
    .init_resource::<PageTap>()
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
            animate_player,
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
        idle: assets.load("player/courier_idle_outlined.png"),
        walk: assets.load("player/courier_walk_outlined.png"),
        idle_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(48, 64), 4, 4, None, None)),
        walk_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(48, 64), 6, 4, None, None)),
        npc_layout: layouts.add(TextureAtlasLayout::from_grid(UVec2::new(48, 64), 4, 1, None, None)),
        technician_npc: assets.load("cast/technician/npc_outlined.png"),
        archivist_npc: assets.load("cast/archivist/npc_outlined.png"),
    };

    // Erikk. The art pack's pivot is (24, 62) in a 48 × 64 cell.
    commands.spawn((
        Player::default(),
        Sprite::from_atlas_image(art.idle.clone(), TextureAtlas { layout: art.idle_layout.clone(), index: 0 }),
        Anchor(Vec2::new(0.0, (32.0 - 62.0) / 64.0)),
        Transform::from_xyz(0.0, 0.0, 1.0),
    ));
    commands.insert_resource(art);

    let scene = match boot.start.as_str() {
        "work" => SceneId::Port,
        "writing" => SceneId::Archive,
        _ => SceneId::Bridge,
    };
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
    game.scene = id;
    game.nearby = None;
    game.pending = None;
    match id {
        SceneId::Port => game.mark_visited("work"),
        SceneId::Archive => game.mark_visited("writing"),
        SceneId::Bridge => {}
    }
    bridge::emit("scene", def.label);

    commands.spawn((SceneEntity, Sprite::from_image(assets.load(def.bg)), Transform::from_xyz(0.0, 0.0, 0.0)));
    commands.spawn((
        SceneEntity,
        Foreground,
        Sprite::from_image(assets.load(def.fg)),
        Transform::from_xyz(0.0, 0.0, 0.5),
    ));
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

    player.foot = def.spawn;
    player.target = None;
    player.facing = Facing::Up;
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
    let def = scene_def(game.scene);
    if let Some(pt) = def.points.iter().find(|pt| pt.pos.distance(at) < 30.0) {
        game.pending = Some(*pt);
        player.target = Some(pt.pos);
    } else {
        game.pending = None;
        player.target = Some(at);
    }
}

fn follow_target(time: Res<Time>, masks: Res<Masks>, mut game: ResMut<Game>, mut player: Single<&mut Player>) {
    let Some(target) = player.target else {
        player.walking = false;
        return;
    };
    let to = target - player.foot;
    let step = SPEED * time.delta_secs().min(0.1);
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
    let next = if masks.walkable(game.scene, here + mv) {
        Some(here + mv)
    } else if masks.walkable(game.scene, here + Vec2::new(mv.x, 0.0)) && mv.x.abs() > 0.05 {
        Some(here + Vec2::new(mv.x, 0.0))
    } else if masks.walkable(game.scene, here + Vec2::new(0.0, mv.y)) && mv.y.abs() > 0.05 {
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
    let def = scene_def(game.scene);
    game.nearby = def
        .points
        .iter()
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
        let (cols, ms, image, layout) = if p.walking {
            (6, 0.110, &art.walk, &art.walk_layout)
        } else {
            (4, 0.180, &art.idle, &art.idle_layout)
        };
        p.clock += time.delta_secs();
        if p.clock >= ms {
            p.clock = 0.0;
            p.frame = (p.frame + 1) % cols;
        }
        if p.frame >= cols {
            p.frame = 0;
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
