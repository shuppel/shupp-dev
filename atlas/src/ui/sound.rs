//! Sound cues. The game never plays audio itself: each frame this compares the
//! game and UI state with the last frame and tells the page what happened
//! (`music` with a room key, `sfx` with a sound name). The page owns the
//! audio, the mute setting and the browser's "start on a gesture" rule.

use bevy::prelude::*;

use super::Ui;
use crate::{Action, Game, Mode, SceneId, bridge};

#[derive(Default)]
pub(super) struct Last {
    started: bool,
    mode: Option<Mode>,
    scene: Option<SceneId>,
    music: &'static str,
    tab: usize,
    suit: usize,
    sel: usize,
    term_sel: usize,
    atlas_sel: usize,
    ship_sel: usize,
    quest_full: bool,
    line: usize,
    shown: usize,
    nearby: bool,
    hatch: bool,
    bed: bool,
    paused: bool,
    flight: bool,
    seen: Vec<SceneId>,
    chest: bool,
    sound: bool,
}

const ROOMS: usize = 5;

fn music_for(game: &Game) -> &'static str {
    // No star map track yet: the title theme plays over the planets.
    if game.mode == Mode::Atlas {
        return "title";
    }
    match game.scene {
        SceneId::Bridge => "bridge",
        SceneId::Engine => "engine",
        SceneId::Quarters => "quarters",
        SceneId::Port => "dockyard",
        SceneId::Archive => "archive",
    }
}

fn sfx(name: &str) {
    bridge::emit("sfx", name);
}

pub(super) fn cues(keys: Res<ButtonInput<KeyCode>>, game: Res<Game>, ui: Res<Ui>, mut last: Local<Last>) {
    let line = ui.dialogue.as_ref().map(|d| (d.idx, d.shown as usize, d.lines[d.idx].call));
    let term_sel = ui.terminal.as_ref().map_or(0, |t| t.sel);
    if !last.started {
        last.started = true;
        last.scene = Some(game.scene);
        last.seen.push(game.scene);
        last.mode = Some(game.mode);
        last.hatch = game.hatch_open;
        last.sound = game.sound;
    }

    let music = music_for(&game);
    if music != last.music {
        last.music = music;
        bridge::emit("music", music);
    }

    if game.sound != last.sound {
        last.sound = game.sound;
        // Heard only when turning sound on: the page is muted otherwise.
        sfx("ui_theme_toggle");
    }

    // A new room: the door, then a stinger the first time in this visit.
    if last.scene != Some(game.scene) {
        last.scene = Some(game.scene);
        if !last.flight {
            sfx("fx_door_slide");
        }
        if !last.seen.contains(&game.scene) {
            last.seen.push(game.scene);
            sfx(if last.seen.len() == ROOMS { "sting_quest_complete" } else { "sting_new_area" });
        }
    }
    if let Some(t) = &ui.travel {
        last.flight = t.flight;
    } else if game.mode != Mode::Travel {
        last.flight = false;
    }

    let mode = game.mode;
    if last.mode != Some(mode) {
        let from = last.mode.unwrap_or_default();
        match (from, mode) {
            (_, Mode::Sheet) | (Mode::Explore, Mode::Ship) => sfx("ui_menu_open"),
            (Mode::Explore, Mode::Atlas | Mode::Terminal) => sfx("fx_console_activate"),
            (Mode::Sheet | Mode::Ship | Mode::Atlas, Mode::Explore) => sfx("ui_menu_close"),
            (Mode::Terminal, Mode::Explore) => sfx("ui_cancel"),
            (Mode::Ship | Mode::Atlas, Mode::Travel) => sfx("ui_confirm"),
            (_, Mode::Dialogue) => {
                if line.is_some_and(|l| l.2) {
                    sfx("fx_holo_comms");
                }
            }
            _ => {}
        }
        last.tab = ui.tab;
        last.suit = ui.suit;
        last.sel = ui.sel;
        last.term_sel = term_sel;
        last.atlas_sel = ui.atlas_sel;
        last.ship_sel = ui.ship_sel;
        last.quest_full = ui.quest_full;
        last.mode = Some(mode);
    } else {
        if ui.tab != last.tab || ui.suit != last.suit {
            sfx("ui_tab_switch");
        } else if ui.sel != last.sel || term_sel != last.term_sel || ui.atlas_sel != last.atlas_sel || ui.ship_sel != last.ship_sel {
            sfx("ui_cursor_move");
        }
        if ui.quest_full != last.quest_full {
            sfx(if ui.quest_full { "ui_confirm" } else { "ui_cancel" });
        }
        last.tab = ui.tab;
        last.suit = ui.suit;
        last.sel = ui.sel;
        last.term_sel = term_sel;
        last.atlas_sel = ui.atlas_sel;
        last.ship_sel = ui.ship_sel;
        last.quest_full = ui.quest_full;
    }
    // The menu's THEME key.
    if mode == Mode::Sheet && keys.just_pressed(KeyCode::KeyT) {
        sfx("ui_theme_toggle");
    }

    // Dialogue: a tick as letters type out, a blip on each new line.
    match line {
        Some((idx, shown, call)) => {
            if idx != last.line && last.mode == Some(Mode::Dialogue) {
                sfx(if call { "fx_holo_comms" } else { "ui_confirm" });
            } else if shown > last.shown {
                sfx("ui_dialogue_text");
            }
            last.line = idx;
            last.shown = shown;
        }
        None => {
            last.line = 0;
            last.shown = 0;
        }
    }

    // A glow and prompt appear when Erikk walks up to something.
    let near = mode == Mode::Explore && game.nearby.is_some();
    if near && !last.nearby {
        sfx("fx_interact_glow");
    }
    last.nearby = near;

    // The sea chest opens on the items tab: a rare find, once per visit.
    let chest = game.nearby.is_some_and(|p| matches!(p.action, Action::MenuTab(1)) && p.label.starts_with("Sea chest"));
    let opened = mode == Mode::Sheet || (game.paused && !last.paused);
    if chest && opened && !last.chest {
        last.chest = true;
        sfx("sting_item_rare");
    }
    last.paused = game.paused;

    if game.hatch_open && !last.hatch {
        sfx("sting_item_legendary");
    }
    last.hatch = game.hatch_open;

    if game.pongo_bed && !last.bed {
        sfx("fx_pongo_bark");
    }
    last.bed = game.pongo_bed;
}
