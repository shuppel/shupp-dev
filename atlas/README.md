# The Scattered Atlas

shupp.dev as a small sprite JRPG. `/atlas` is one full-screen canvas and
everything on it is drawn by this Bevy crate: the ship scenes, the courier
you walk around, crew dialogue with portraits, terminals that list the site's
pages, the star atlas for travel, and a JRPG menu.

The menu is the bio:

- **Status**: portrait, class, level (years since the first quest log entry),
  attributes, a six-axis radar chart, skills and disciplines.
- **Items**: key items (credentials and degrees) and gear (the tools used most
  across projects and roles).
- **Quests**: the resume as a quest log, plus training. FULL RESUME opens
  `/resume`.
- **Map**: the star atlas.

Destinations: the Dockyard (Work, a walkable scene with a technician and a
workbench terminal), the Archive (Writing, an archivist and a records
terminal), the Mirror Moon (About, Erikk speaks the bio) and the Comms Beacon
(Contact, a hologram call then a contact terminal). Every terminal row opens
the real page in a new tab.

If WebGL2 is missing or the game fails, the page shows a plain list of the
same destinations. The Astro site is untouched.

## How the pieces fit

| Piece | Where | Owns |
| --- | --- | --- |
| Content registry | `src/lib/atlas/registry.ts` | Destinations, dialogue copy, `player.stats` (radar, inventory, quest log). Built from the content collections. Radar values are derived from counts; tune the divisors there. |
| Page | `src/pages/atlas.astro` | Canvas, loading bar, rotate hint, fallback list, link opening. |
| Game | `atlas/src` | `lib.rs` scenes and walking, `ui.rs` dialogue, terminals, atlas, menu, HUD, `content.rs` registry types, `bridge.rs` page messages. |
| Art | `public/atlas/assets/` | From the v1.1 art pack (see `ART_README.md`). Walk masks live in `atlas/masks/` and are compiled in. |
| Build output | `public/atlas/pkg/` | Compiled WASM plus glue. Committed. |

### Page ↔ game messages

- Game → page: `window.__atlasEmit(kind, value)` with `open` (a URL),
  `visited` (a destination id) or `scene` (a location label).
- Page → game: `start(canvas, registry, startId, visited, dpr)`, `go(id)` for
  hash links, `set_paused(bool)`, and `tap(x, y)` for touch taps (fractions of
  the canvas), since winit loses touch taps in mobile browsers.

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

WASD or arrows to walk, E / Enter / Space to talk or use, M for the atlas,
Esc or C for the menu. On touch, tap to walk, tap a crew member or console to
walk over and use it, and use the MAP and MENU buttons.
