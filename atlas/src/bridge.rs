//! The seam between Bevy and the HTML shell.
//!
//! Outbound: `emit(kind, id)` calls `window.__atlasEmit(kind, id)` if the
//! shell defined it. Inbound: the shell calls the exported `travel` and
//! `set_input_enabled`, which queue messages that a Bevy system drains.

use std::cell::RefCell;
use std::collections::VecDeque;

pub enum Inbound {
    Travel(String),
    Input(bool),
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
        fn atlas_emit(kind: &str, id: &str) -> Result<(), JsValue>;
    }

    pub fn emit(kind: &str, id: &str) {
        let _ = atlas_emit(kind, id);
    }

    /// Start the ship inside `<canvas id="{canvas_id}">`.
    #[wasm_bindgen]
    pub fn start(canvas_id: &str) {
        crate::app(Some(format!("#{canvas_id}"))).run();
    }

    /// The visitor chose Travel in the atlas (list or chart).
    #[wasm_bindgen]
    pub fn travel(destination: &str) {
        super::push(super::Inbound::Travel(destination.to_owned()));
    }

    /// Pause walking while an HTML panel is open, so keys go to the panel.
    #[wasm_bindgen]
    pub fn set_input_enabled(on: bool) {
        super::push(super::Inbound::Input(on));
    }
}

#[cfg(target_arch = "wasm32")]
pub use web::{set_input_enabled, start, travel};

#[cfg(target_arch = "wasm32")]
pub(crate) fn emit(kind: &str, id: &str) {
    web::emit(kind, id);
}

#[cfg(not(target_arch = "wasm32"))]
pub(crate) fn emit(kind: &str, id: &str) {
    println!("[atlas] {kind}: {id}");
}

#[cfg(not(target_arch = "wasm32"))]
pub fn travel(destination: &str) {
    push(Inbound::Travel(destination.to_owned()));
}

#[cfg(not(target_arch = "wasm32"))]
pub fn set_input_enabled(on: bool) {
    push(Inbound::Input(on));
}
