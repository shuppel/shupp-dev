# The Scattered Atlas (M1)

shupp.dev as a small explorable ship, built as a **Tier 2 hybrid** (see the v3
"Atlas & Mobile" draft):

- **Roomy screens** (≥ 900 × 560, no reduced-motion preference): the walkable
  Bevy ship fills `/atlas`. The atlas opens as a console drawer, as a chart or
  a list.
- **Phones, small or calm screens**: the list-first atlas *is* the page. The
  ship view is opt-in ("Open ship view"), so phones never download the WASM
  unless asked.
- **No JavaScript / WebGL failure**: every destination card is a plain link to
  the real page, and the site index is always in the HTML.

The Astro site is untouched. `/atlas` lives next to it until we decide to cut
over.

## How the pieces fit

| Piece | Where | Owns |
| --- | --- | --- |
| Content registry | `src/lib/atlas/registry.ts` | Destinations, panel copy, `player.stats`. Built from the existing content collections, so no copy is written twice. Also served as `/atlas/registry.json`. |
| HTML shell | `src/pages/atlas.astro` | List atlas, chart, selection card, content panels, character sheet, menu, view choice, deep links (`/atlas#/about`). |
| Ship | `atlas/` (this crate) | Rendering the deck, walking, stations. Knows nothing about content. |
| Build output | `public/atlas/pkg/` | The compiled WASM plus wasm-bindgen glue. Committed (see below). |

### Shell ↔ ship messages

- Ship → shell: `window.__atlasEmit(kind, id)`. `kind` is `station` (the
  visitor used a station) or `nearby` (they walked up to one). Station ids:
  `chart` (opens the atlas), `sheet` (character sheet), `comms` (Contact),
  `hatch` (Dockyard = Work).
- Shell → ship: `travel(destinationId)` plays the warp, and
  `set_input_enabled(bool)` pauses walking while a sheet or the drawer is open.

## Building

```sh
cargo install wasm-bindgen-cli --version 0.2.130 --locked   # once
npm i -g binaryen                                            # once, for wasm-opt
./scripts/build-atlas.sh
```

`cargo run --bin native` (from `atlas/`) opens the ship in a desktop window for
quick iteration.

The compiled files in `public/atlas/pkg/` are committed so Netlify's normal
`npm run build` serves them without a Rust toolchain. Rebuild and commit them
whenever `atlas/src` changes. Moving this into CI is a follow-up.

## Controls

WASD or arrow keys to walk, click or tap to walk somewhere, click or tap a
station to walk to it and use it, E / Enter / Space to use the station you are
standing at.
