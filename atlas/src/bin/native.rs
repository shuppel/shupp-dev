//! `cargo run --bin native [registry.json]` opens the game in a desktop window.
fn main() {
    let registry = std::env::args()
        .nth(1)
        .and_then(|p| std::fs::read_to_string(p).ok())
        .map(|j| scattered_atlas::Registry::parse(&j))
        .unwrap_or_default();
    scattered_atlas::app(None, registry, scattered_atlas::Boot::default(), vec![]).run();
}
