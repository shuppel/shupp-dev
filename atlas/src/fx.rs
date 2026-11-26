//! Interaction feedback: when the player is close enough to use something,
//! the console lights up white with sparks rising off it, and a thought cloud
//! pops in above it (or above the crew member) with three bouncing dots.
//!
//! The glow sprites are built from the scene art by `atlas/tools/make_fx.py`.

use bevy::prelude::*;
use bevy::sprite::Anchor;

use crate::{to_world, Action, Game, Mode, Player, SceneId, SceneEntity};

/// Console boxes in scene pixels (x0, y0, x1, y1). Keep in sync with make_fx.py.
const GLOWS: [(&str, [f32; 4]); 3] = [
    ("fx/glow_star_console.png", [444.0, 104.0, 560.0, 158.0]),
    ("fx/glow_workbench.png", [292.0, 250.0, 348.0, 298.0]),
    ("fx/glow_records.png", [254.0, 70.0, 388.0, 142.0]),
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
    glows: [Handle<Image>; 3],
    spark: Handle<Image>,
}

#[derive(Resource, Default)]
pub(crate) struct FxState {
    key: Option<(SceneId, Vec2)>,
    t: f32,
    spark_clock: f32,
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

fn setup(mut commands: Commands, assets: Res<AssetServer>) {
    let art = FxArt {
        glows: GLOWS.map(|(path, _)| crate::load_t(&assets, path)),
        spark: crate::load_t(&assets, "fx/spark.png"),
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

/// Which glow (if any) belongs to this point, and the console box.
fn glow_for(scene: SceneId, action: Action) -> Option<(usize, [f32; 4])> {
    let i = match (scene, action) {
        (SceneId::Bridge, Action::OpenAtlas) => 0,
        (SceneId::Port, Action::Terminal(_)) => 1,
        (SceneId::Archive, Action::Terminal(_)) => 2,
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
    let tip = cloud_tip(game.scene, &pt).unwrap_or(player.foot + Vec2::new(6.0, -62.0));
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
