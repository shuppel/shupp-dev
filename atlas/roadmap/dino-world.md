# Feature card: Dino World

| | |
| --- | --- |
| **Status** | Planned (next world after the ship hub) |
| **Who goes** | Astro the Archivist (playable for this mission) |
| **Audience** | Kids learning letters, roughly ages 3 to 7, with a grown-up nearby |
| **Skill practised** | Matching a word to its starting letter, A to Z |
| **Reward** | Each dinosaur joins the **Dinodex**, which lives in the Archive afterwards |
| **Depends on** | Planet runs from the star map, and the world loading screen (see [ROADMAP.md](../ROADMAP.md)) |

## 1. The pitch

The Crescent drops Astro on a green, friendly dinosaur planet. Twenty-six
dinosaurs live there, one for every letter. To talk to a dinosaur and add it to
the Dinodex, the player presses the letter its name starts with. Brachiosaurus
waits for **B**, Stegosaurus for **S**. Get all 26 and the Dinodex is complete.

Nobody loses. A wrong letter gets a gentle wobble and a hint, never a fail
screen, a timer or a lost life.

## 2. Game loop

1. **Land.** The Crescent sets down at the landing meadow. Astro steps out with
   the Dinodex under one arm.
2. **Explore.** Astro walks the alphabet trail through five zones. Dinosaurs
   idle, graze and wander in each zone.
3. **Meet.** Walking up to a dinosaur opens a speech bubble with its picture and
   name, spoken aloud: "Hi! I'm Brachiosaurus. What letter does my name start
   with?"
4. **Answer.** The player presses a letter key (or taps one on the touch
   keyboard).
   - **Right:** the dinosaur cheers, says a one-line fun fact, and a beam pulls
     its card into the Dinodex. Its trail marker lights up.
   - **Wrong:** the bubble wobbles, the dinosaur says the first sound again
     ("Buh, buh, Brachiosaurus"). After two misses the right key glows. After
     three, the right key bounces and any press of it counts.
5. **Collect.** The Dinodex counter ticks up (e.g. 7 / 26). A zone's gate opens
   when its dinosaurs are collected, though the player can skip ahead.
6. **Return.** With all 26 (or any time, from the landing pad), Astro flies back
   to the ship. The Dinodex appears on a pedestal in the Archive.

### Modes (later, same assets)

| Mode | How it plays |
| --- | --- |
| **Trail** (default) | Walk the zones in A to Z order |
| **Free roam** | All dinosaurs out at once, any order |
| **Sound it out** | The name is spoken but not written; the player hears the first sound |
| **Letter first** | A letter shows; the player finds the dinosaur that starts with it |

## 3. Input rules

The ship uses WASD, E, Space, M, C and Esc. A letter game wants every letter,
so input has two states:

- **Walking:** normal ship controls. Arrow keys are the recommended walk keys
  in this world, since kids will be pressing letters.
- **Answering:** while a dinosaur's bubble is open, every A to Z key is an
  answer. Walking is frozen. Esc closes the bubble. No other key does anything.

On touch, the bubble opens a big on-screen keyboard. It defaults to **ABC
order** (easier for early readers) with a setting for QWERTY. Every key is at
least 44 px logical.

Accessibility: the letter and name are always both spoken and written,
the correct key glow is not colour-only (it also bounces), and reduced motion
swaps the wobble for a fade.

## 4. The 26 dinosaurs

Each one is a real dinosaur whose name starts with its letter. The alternate is
there in case a design reads badly or for a later "round two".

| Letter | Dinosaur | Zone | Size class | Alternate |
| --- | --- | --- | --- | --- |
| A | Ankylosaurus | Landing Meadow | Medium | Allosaurus |
| B | Brachiosaurus | Landing Meadow | Huge | Baryonyx |
| C | Ceratosaurus | Landing Meadow | Medium | Corythosaurus |
| D | Diplodocus | Landing Meadow | Huge | Dilophosaurus |
| E | Edmontosaurus | Landing Meadow | Large | Euoplocephalus |
| F | Fukuiraptor | Fern Forest | Small | Falcarius |
| G | Gallimimus | Fern Forest | Medium | Giganotosaurus |
| H | Hadrosaurus | Fern Forest | Large | Herrerasaurus |
| I | Iguanodon | Fern Forest | Large | Irritator |
| J | Juravenator | Fern Forest | Small | Jobaria |
| K | Kentrosaurus | River Delta | Medium | Kosmoceratops |
| L | Lambeosaurus | River Delta | Large | Leaellynasaura |
| M | Maiasaura | River Delta | Large | Microraptor |
| N | Nodosaurus | River Delta | Medium | Nigersaurus |
| O | Oviraptor | River Delta | Small | Ouranosaurus |
| P | Parasaurolophus | Volcano Ridge | Large | Pachycephalosaurus |
| Q | Qianzhousaurus | Volcano Ridge | Large | Quaesitosaurus |
| R | Rajasaurus | Volcano Ridge | Large | Rugops |
| S | Stegosaurus | Volcano Ridge | Large | Spinosaurus |
| T | Tyrannosaurus | Volcano Ridge | Huge | Triceratops |
| U | Utahraptor | Canyon Nest | Medium | Unenlagia |
| V | Velociraptor | Canyon Nest | Small | Vulcanodon |
| W | Wuerhosaurus | Canyon Nest | Large | Wannanosaurus |
| X | Xenoceratops | Canyon Nest | Large | Xiaosaurus |
| Y | Yutyrannus | Canyon Nest | Large | Yinlong |
| Z | Zuniceratops | Canyon Nest | Medium | Zalmoxes |

Pterosaurs (Pteranodon, Quetzalcoatlus) and marine reptiles are not dinosaurs,
so they stay out of the 26. They can appear as background fliers and swimmers.

Every dinosaur is drawn friendly: big eyes, soft shapes, no teeth bared in the
idle. The Tyrannosaurus can roar in its cheer, but as a happy roar.

## 5. Dinodex

The Dinodex is a field guide Astro carries on the mission and keeps in the
Archive afterwards.

### On the mission

- A small HUD badge shows the count (e.g. 7 / 26). Tapping it or pressing Tab
  opens the Dinodex.
- Collected dinosaurs show their card. Uncollected ones show a silhouette and
  their letter, so the Dinodex doubles as a "who's left" list.
- Opening the Dinodex never needs a letter key, so it can't be confused with an
  answer.

### In the Archive

- After the first dinosaur is collected, a **Dinodex pedestal** appears in the
  Archive next to the records terminal, with its own interaction point
  ("Read the Dinodex").
- Astro has new dialogue about the mission and comments on progress
  ("Fourteen down. The canyon ones are shy.").
- The full Dinodex reads the same as on the mission, plus a "Replay Dino World"
  button that opens the star map on the dino planet.

### Entry card contents

| Field | Example |
| --- | --- |
| Letter | **B** (large, with upper and lower case: B b) |
| Name | Brachiosaurus |
| Say it | BRAK-ee-oh-SOR-us (with a play button) |
| Means | "Arm lizard" |
| Ate | Plants |
| Lived | Late Jurassic |
| Size | Shown next to Astro's silhouette for scale |
| Fun fact | One short sentence a five-year-old can follow |
| Found in | Landing Meadow |

### Data and saving

- `src/lib/atlas/dinodex.ts` (or a `dinodex` block in the registry) holds the
  26 entries, so copy and facts are edited in the site, not in Rust.
- Progress saves the same way `visited` does today: a list of collected
  letters sent through the page bridge and kept in local storage.

## 6. Assets needed

Conventions follow the latest pack README and the other art requests: source
art is 2× logical size, plates are 1280 × 720 for 640 × 360 logical, character
cells are 192 × 256 for 48 × 64 logical with the pivot at (96, 248), and every
animation goes in `sprite_map.json` with row-major cells and frame timings.
All paths are under `public/atlas/assets/`.

### 6.1 Character sprite sheets

#### Astro the Archivist (playable)

Astro's portraits, hologram calls and standing NPC sprite already exist in
`cast/archivist/`. To be walkable Astro needs:

| File | Cell (source) | Frames | Notes |
| --- | --- | --- | --- |
| `cast/archivist/walk.png` | 192 × 256 | 6 × 4 facings | Matches Erikk's walk timing |
| `cast/archivist/idle.png` | 192 × 256 | 4 × 4 facings | Breathing, page-flip fidget |
| `cast/archivist/talk.png` | 192 × 256 | 4 × 4 facings | Field talk pose, facing a dinosaur |
| `cast/archivist/dinodex_open.png` | 192 × 256 | 6, facing down | Opens the Dinodex and holds it up |
| `cast/archivist/scan.png` | 192 × 256 | 6, left and right | Holds the Dinodex out while the collect beam runs |
| `cast/archivist/cheer.png` | 192 × 256 | 6, facing down | After a correct letter |
| `cast/archivist/think.png` | 192 × 256 | 4, facing down | Plays during a wrong-letter hint |
| `cast/archivist/board.png` | 192 × 256 | 6, facing up | Climbing into the Crescent |
| `portraits/archivist/expedition.png` | Same as current faces | 4 poses × 4 mouths | Astro in field gear (hat, satchel), for dialogue |

#### The 26 dinosaurs

Dinosaurs come in four size classes so they read at the right scale next to
Astro (48 × 64 logical):

| Size class | Cell (source) | Logical | Pivot (source) |
| --- | --- | --- | --- |
| Small | 192 × 256 | 48 × 64 | (96, 248) |
| Medium | 384 × 384 | 96 × 96 | (192, 376) |
| Large | 640 × 512 | 160 × 128 | (320, 500) |
| Huge | 768 × 768 | 192 × 192 | (384, 756) |

One sheet per dinosaur, `cast/dinos/<id>/sheet.png`, where `<id>` is the
lower-case name (e.g. `brachiosaurus`). Facings are left and right only; right
is drawn, left is mirrored in code.

| Row | Frames | Notes |
| --- | --- | --- |
| Idle | 4 loop | Breathing, tail sway |
| Graze or sniff | 6 loop | Herbivores graze, carnivores sniff the ground |
| Walk | 6 loop | For wandering inside its zone |
| Notice | 3 one shot | Looks up when Astro comes near |
| Talk | 4 loop | Mouth open and close while its line plays |
| Wrong letter | 4 one shot | A puzzled head tilt, never angry |
| Cheer | 6 one shot | The correct-letter reaction |
| Sleep | 2 loop | Used once collected, or at night if a zone gets a night state |

Per dinosaur, 26 times over:

| File | Size (source) | Notes |
| --- | --- | --- |
| `cast/dinos/<id>/sheet.png` | Per size class | The eight rows above |
| `cast/dinos/<id>/portrait.png` | 256 × 256, 4 mouths | Shown in the speech bubble |
| `cast/dinos/<id>/art.png` | 512 × 640 | The Dinodex illustration, like item card art |
| `cast/dinos/<id>/icon.png` | 64 × 64 | Head icon for the Dinodex grid and HUD |
| `cast/dinos/<id>/silhouette.png` | 64 × 64 | Optional; can be generated in code by filling the icon's alpha |

Total: 26 sheets, 26 portraits, 26 illustrations, 26 icons.

#### Ambient creatures (no letter, no interaction)

| File | Cell (source) | Frames | Notes |
| --- | --- | --- | --- |
| `cast/dinos/ambient/pterosaur.png` | 192 × 128 | 6-frame flap | Flies across the sky layer |
| `cast/dinos/ambient/dragonfly.png` | 32 × 32 | 4-frame loop | Giant dragonflies near water |
| `cast/dinos/ambient/hatchling.png` | 96 × 96 | 6-frame hop | Baby dinos in nests, colour-swapped per species |
| `cast/dinos/ambient/fish.png` | 64 × 32 | 4-frame swim | River Delta water |

### 6.2 FX sheets

Put sheets in `fx/dino_world/`.

| File | Size (source) | Frames | Where |
| --- | --- | --- | --- |
| `letter_pop.png` | 256 × 256 | 8, one shot | The pressed letter pops out of the bubble |
| `correct_burst.png` | 384 × 384 | 10, one shot | Star and leaf burst on a right answer |
| `wrong_wobble.png` | 256 × 256 | 6, one shot | Soft grey puff on a wrong answer, no red |
| `hint_glow.png` | 128 × 128 | 6 loop | Ring around the right key after two misses |
| `collect_beam.png` | 128 × 512 | 8 loop | Beam from the dinosaur into the Dinodex |
| `card_fly.png` | 128 × 160 | 8, one shot | The card shrinking into the book |
| `dinodex_sparkle.png` | 96 × 96 | 6 loop | On the Dinodex when a page is added |
| `footstep_dust.png` | 64 × 32 | 6, one shot | Under walking feet (scaled up for Huge dinos) |
| `ground_thump.png` | 512 × 128 | 6, one shot | Shockwave ring for Huge dinos' steps, plus a small camera shake |
| `leaf_rustle.png` | 128 × 128 | 6, one shot | Bushes and ferns when walked through |
| `water_splash.png` | 128 × 128 | 8, one shot | River Delta |
| `ripple.png` | 128 × 64 | 6 loop | Around standing dinos in water |
| `lava_bubble.png` | 64 × 64 | 8 loop | Volcano Ridge pools (far from the path) |
| `smoke_plume.png` | 256 × 512 | 8 loop | Volcano top |
| `pollen.png` | 16 × 16 | 4 | Drifting pollen, spawned in code |
| `fireflies.png` | 16 × 16 | 4 | Fern Forest and Canyon Nest |
| `zone_gate_open.png` | 384 × 384 | 10, one shot | A zone gate opening |
| `confetti.png` | 1280 × 720 | 16, one shot | All 26 collected |
| `landing_dust.png` | 768 × 256 | 10, one shot | The Crescent landing and taking off |
| `zzz.png` | 64 × 64 | 6 loop | Over sleeping, collected dinos |

### 6.3 World and environment sheets

Five walkable zones plus a landing pad. Each zone has the same layer set as the
engine room and dockyard. Put them in `scenes/dino_world/<zone>/`.

| Zone | Letters | Look |
| --- | --- | --- |
| `landing` | none | A meadow clearing where the Crescent lands; signpost to the trail |
| `meadow` | A to E | Open grassland, gentle hills, the big sauropods |
| `fern_forest` | F to J | Tall ferns and cycads, dappled light, small fast dinos |
| `river_delta` | K to O | Shallow river, sandbars, nests on the bank |
| `volcano_ridge` | P to T | Rocky ridge with a distant, calm volcano; warm light |
| `canyon_nest` | U to Z | Red canyon, nesting ledges, sunset sky |

Per zone (six times):

| File | Size (source) | Notes |
| --- | --- | --- |
| `plate.png` | 1280 × 720 | Everything behind the player |
| `walk_mask.png` | 1280 × 720, black and white | Walkable ground |
| `fg_mask.png` | 1280 × 720 | Occluders |
| `zone.json` | n/a | Spawn, exits, each dinosaur's home point and wander box, prop baselines |
| `fg_strip.png` | 1280 × 160 | Front foliage or rocks drawn over the player |
| `parallax_sky.png` | 1280 × 720 | Far sky layer |
| `parallax_far.png` | 1280 × 720 | Distant hills, volcano or canyon walls |
| `parallax_near.png` | 1280 × 720 | Near tree line |

The sky layer has a day and a sunset variant for the Canyon Nest only; the
other zones stay daytime.

### 6.4 Paths

The alphabet trail ties the zones together. It is both painted ground and a
map.

| File | Size (source) | Notes |
| --- | --- | --- |
| `tiles/dino_world/trail.png` | 32 × 32 tiles, 4 × 4 sheet | Dirt trail autotile: straights, corners, ends, T, cross |
| `tiles/dino_world/trail_stone.png` | 32 × 32 tiles, 4 × 4 sheet | Stepping-stone variant for the river and canyon |
| `tiles/dino_world/bridge.png` | 32 × 32 tiles, 3 × 2 sheet | Log bridge pieces for the River Delta |
| `ui/dino_world/trail_map.png` | 1280 × 720 | Overview map of all six zones with the trail drawn through |
| `ui/dino_world/trail_node.png` | 96 × 96, 3 states | Map marker per dinosaur: locked, nearby, collected |
| `ui/dino_world/you_are_here.png` | 64 × 64, 4-frame bob | Astro's marker on the trail map |
| `paths/dino_world/<zone>.json` | n/a | Trail polyline per zone, used for walk hints and for dinos to wander along |

### 6.5 Props

Separate PNGs with a baseline, like the engine room. Put them in
`props/dino_world/`.

| File | Size (source) | Frames | Notes |
| --- | --- | --- | --- |
| `letter_stone_<a-z>.png` | 192 × 192 | 2 states: dim, lit | 26 trail markers, one carved letter each; lights when that dino is collected |
| `zone_gate.png` | 384 × 512 | 2 states: closed, open | Vine arch between zones |
| `signpost.png` | 192 × 256 | Static | Points to the next zone; zone name drawn at runtime |
| `nest.png` | 256 × 128 | Static | With eggs; hatchlings sit in it |
| `egg_cluster.png` | 128 × 128 | 3 colour variants | Set dressing |
| `fern_large.png`, `fern_small.png` | 256 × 384, 192 × 192 | 4-frame sway | Fern Forest |
| `cycad.png` | 256 × 384 | 4-frame sway | Palm-like tree |
| `conifer.png` | 256 × 512 | Static | Meadow and ridge edges |
| `boulder_large.png`, `boulder_small.png` | 384 × 256, 192 × 128 | Static | Every zone |
| `fallen_log.png` | 384 × 128 | Static | Also a blocker in the walk mask |
| `bones.png` | 256 × 128 | Static | A friendly fossil, not a skeleton scene |
| `reeds.png` | 192 × 192 | 4-frame sway | River Delta |
| `lily_pads.png` | 192 × 96 | Static | River Delta |
| `geyser.png` | 192 × 384 | 8 loop | Volcano Ridge |
| `crystal_cluster.png` | 192 × 192 | 4-frame shimmer | Canyon Nest |
| `crescent_landed.png` | 768 × 512 | Static plus 6-frame idle lights | The ship on the landing pad; boarding point |
| `supply_crate.png` | 192 × 192 | Static | Astro's gear at the landing |
| `dinodex_pedestal.png` | 192 × 256 | 2 states: empty, holding the book, plus 4-frame glow | Goes in the **Archive** scene |

### 6.6 Icons

| File | Size (source) | Notes |
| --- | --- | --- |
| `ui/dino_world/keys/<a-z>.png` | 128 × 128, 4 states | 26 keycaps: normal, pressed, correct, hint |
| `ui/dino_world/keyboard_frame.png` | 1280 × 360 | Back panel for the touch keyboard |
| `ui/icons/dinodex.png` | 64 × 64 | HUD badge and menu icon |
| `ui/icons/dino_counter.png` | 192 × 64 | HUD frame for "7 / 26" (numbers drawn at runtime) |
| `ui/icons/speaker.png` | 64 × 64, 2 states | Replay the name, on the bubble and the card |
| `ui/icons/zone_<id>.png` | 64 × 64 | Six zone icons for the trail map and Dinodex filter |
| `ui/icons/diet_plants.png`, `diet_meat.png`, `diet_both.png` | 48 × 48 | Dinodex card |
| `ui/icons/era_triassic.png`, `era_jurassic.png`, `era_cretaceous.png` | 48 × 48 | Dinodex card |
| `ui/star_map/dino_world_normal.png`, `_selected.png`, `_visited.png` | Match existing planets | 16-frame spinning planet, same as the other destinations |
| `ui/star_map/dino_world_orbit.png` | Match existing orbits | Orbit ring |

### 6.7 Dinodex UI

Put these in `ui/dinodex/`.

| File | Size (source) | Frames | Notes |
| --- | --- | --- | --- |
| `book_closed.png` | 384 × 512 | Static | Cover with a dinosaur footprint emblem |
| `book_open.png` | 1152 × 720 | Static | Two-page spread, the main frame |
| `page_turn.png` | 1152 × 720 | 8, one shot | Turning a page |
| `grid_slot.png` | 160 × 160 | 3 states: empty, silhouette, collected | 26 slots, A to Z, on the index spread |
| `entry_frame.png` | 560 × 720 | Static | Right-hand page frame around the illustration |
| `fact_panel.png` | 560 × 360 | Static | Left-hand page panel for name, say-it, means, ate, lived, fact |
| `size_compare.png` | 512 × 192 | Static | Ground line with Astro's silhouette for scale |
| `letter_tab_<a-z>.png` | 48 × 64 | 2 states | 26 thumb tabs down the page edge |
| `stamp_collected.png` | 192 × 192 | 6, one shot | Stamp that thumps onto a new entry |
| `complete_banner.png` | 768 × 256 | Static | "Dinodex complete!" (text drawn at runtime) |
| `ribbon_bookmark.png` | 48 × 192 | 4-frame sway | Decoration |

All text (names, facts, pronunciations) is drawn at runtime with the site
fonts, as the pack README asks.

### 6.8 Audio

The ship already has music, ambience and sound effects, so this world needs
its own:

| File | Notes |
| --- | --- |
| `audio/dino_world/music_trail.ogg` | Calm, bouncy loop |
| `audio/dino_world/ambience_<zone>.ogg` | Six loops: birds, river, wind, distant rumble |
| `audio/dino_world/voice/names/<id>.ogg` | 26 spoken names |
| `audio/dino_world/voice/letters/<a-z>.ogg` | 26 letter names, and 26 letter sounds (`<a-z>_sound.ogg`) |
| `audio/dino_world/voice/lines/<id>_hello.ogg`, `_fact.ogg` | 52 short dinosaur lines |
| `audio/dino_world/sfx/` | Correct, wrong (soft), collect, page turn, stamp, gate open, footsteps by size class |

## 7. Asset count

| Group | Files |
| --- | --- |
| Astro sheets and portraits | 9 |
| Dinosaur sheets, portraits, illustrations, icons | 104 (26 × 4) |
| Ambient creatures | 4 |
| FX sheets | 20 |
| Zone layers | 48 (6 zones × 8) |
| Path tiles, map and data | 6 sheets plus 6 path files |
| Props | about 45, including 26 letter stones |
| Icons | about 45, including 26 keycaps |
| Dinodex UI | about 36, including 26 letter tabs |
| Audio | about 150 clips |

This is a much heavier load than the ship hub, which is why this world should
load behind the world loading screen (see the roadmap).

## 8. Build order

1. **Grey box.** One zone, three dinosaurs with placeholder art, the answer
   state, the Dinodex count, save and load. Prove the loop is fun with a kid.
2. **Loading screen and planet run.** The star map can fly to Dino World and
   back, with the world's assets loaded and freed behind the loading screen.
3. **Meadow (A to E) at full art.** First vertical slice.
4. **Dinodex in the Archive.** Pedestal, Astro's new lines, the full book.
5. **Remaining four zones**, then audio, then the extra modes.

## 9. Open questions

- Should Astro be fully playable here, or should Erikk walk with Astro as a
  follower? This card assumes Astro is playable, since Astro is the one on the
  mission.
- Letters only in upper case, or teach upper and lower case together? The card
  shows both (B b) on the Dinodex entry.
- Is ABC order the right default for the touch keyboard, with QWERTY as the
  option?
- Should a grown-up setting let them pick the letters in play (e.g. only the
  letters in a child's name)?
