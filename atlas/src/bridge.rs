//! The seam between the game and the page.
//!
//! Outbound: `emit(kind, value)` calls `window.__atlasEmit(kind, value)`:
//! `open` (a site URL to open), `visited` (a destination id), `scene`
//! (the current location label).
//! Inbound: the page calls `go(destinationId)` (hash links) and
//! `set_paused(bool)` and `tap(x, y)` for touch.

use std::cell::RefCell;
use std::collections::VecDeque;

pub enum Inbound {
    Go(String),
    Paused(bool),
    /// A tap at (x, y) as fractions of the canvas size.
    Tap(bevy::math::Vec2, bool),
    /// true: dialogue in Manaspace; false: the sans.
    DialogueFont(bool),
}

thread_local! {
    static INBOX: RefCell<VecDeque<Inbound>> = const { RefCell::new(VecDeque::new()) };
}

pub(crate) fn drain() -> Vec<Inbound> {
    INBOX.with(|q| q.borrow_mut().drain(..).collect())
}

fn push(msg: Inbound) {
    INBOX.with(|q| q.borrow_mut().push_back(msg));
}

#[cfg(target_arch = "wasm32")]
mod web {
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen]
    extern "C" {
        #[wasm_bindgen(js_namespace = window, js_name = __atlasEmit, catch)]
        fn atlas_emit(kind: &str, value: &str) -> Result<(), JsValue>;
    }

    pub fn emit(kind: &str, value: &str) {
        let _ = atlas_emit(kind, value);
    }

    /// Start the game inside `<canvas id="{canvas_id}">`.
    /// `registry` is the JSON from /atlas/registry.json, `start` a destination
    /// id to begin at (or ""), `visited` a comma-separated list of ids.
    #[wasm_bindgen]
    pub fn start(canvas_id: &str, registry: &str, start: &str, visited: &str, dpr: f32) {
        let visited = visited.split(',').filter(|s| !s.is_empty()).map(str::to_owned).collect();
        crate::app(
            Some(format!("#{canvas_id}")),
            crate::Registry::parse(registry),
            crate::Boot { start: start.to_owned(), dpr },
            visited,
        )
        .run();
    }

    #[wasm_bindgen]
    pub fn go(destination: &str) {
        super::push(super::Inbound::Go(destination.to_owned()));
    }

    /// A click or tap on the canvas, as fractions of its size (0–1).
    /// `touch` is true for a finger or pen.
    #[wasm_bindgen]
    pub fn tap(x: f32, y: f32, touch: bool) {
        super::push(super::Inbound::Tap(bevy::math::Vec2::new(x, y), touch));
    }

    /// Dialogue font: true for Manaspace, false for the sans.
    #[wasm_bindgen]
    pub fn set_dialogue_font(mana: bool) {
        super::push(super::Inbound::DialogueFont(mana));
    }

    #[wasm_bindgen]
    pub fn set_paused(paused: bool) {
        super::push(super::Inbound::Paused(paused));
    }
}

#[cfg(target_arch = "wasm32")]
pub use web::{go, set_dialogue_font, set_paused, start, tap};

#[cfg(target_arch = "wasm32")]
pub(crate) fn emit(kind: &str, value: &str) {
    web::emit(kind, value);
}

#[cfg(not(target_arch = "wasm32"))]
pub(crate) fn emit(kind: &str, value: &str) {
    println!("[atlas] {kind}: {value}");
}

#[cfg(not(target_arch = "wasm32"))]
pub fn go(destination: &str) {
    push(Inbound::Go(destination.to_owned()));
}

#[cfg(not(target_arch = "wasm32"))]
pub fn set_paused(paused: bool) {
    push(Inbound::Paused(paused));
}
