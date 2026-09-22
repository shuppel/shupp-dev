# SaaS Game UI — system and three playable studies

The main route `/design/saas-game-ui` is a non-demo design-system page. It explains
six shared primitives (actor, world object, command, equipment, feedback, record),
visual foundations, interaction rules, and the exact simulation boundary. It links
to three games. Each has a visible Menu button and Escape exit menu. Escape first
cancels active targeting or closes a native dialog; a subsequent Escape opens the
menu. The menu pauses execution and links back to the system.

The studies explore game interfaces with Inter typography. Fernhaven retools the companion study as a lit 2.5D town. No new dependency, external model, or background scheduler is added.

## Creature Works — Fernhaven

Route: `/design/saas-game-ui/creature-works`.

The world is now the operating surface. A controllable keeper walks through a
sunlit town with a selected dinosaur companion following. A persistent sidebar
no longer exposes every activity. Each place has a purpose and an entrance:

| Place               | Interaction                       | Result                                   |
| ------------------- | --------------------------------- | ---------------------------------------- |
| Fern & Fossil       | Approach the hatchery and press E | Adopt and name a companion               |
| The Amber Outfitter | Walk to the shop and press E      | Buy tools and accessories                |
| Adventure board     | Read the board in the square      | Prepare and dispatch a mission           |
| Keeper’s camp       | Visit the tent                    | Configure, enable, or run recurring jobs |
| The wilds           | Reach the expedition gate         | Inspect the company and current missions |

### Movement and game screens

WASD/arrows move continuously. Click/tap the ground or a named destination to
walk there. A navigation grid routes around building colliders. E opens an
interaction only within the entrance radius. Choosing a destination from the
map moves the keeper; it does not teleport or remotely execute its action.
Touch has the same location prompts and a four-direction pad.

- I: inventory, containing owned gear. Equip two tools and one cosmetic.
- C: keeper/party screen, companion choice, level/XP, equipment and journal.
- M: town map and walking destinations.
- Escape: close the current screen; press again to open the pause/exit menu.

The selected companion follows the keeper. Working companions move toward the
expedition gate or their routine’s town destination. Movement, mission time, and
routine time pause while a screen is open or the page is hidden. Opening a
result and accepting it awards XP and buttons; rejection and recall award none.

### Dinosaur direction and rendering

Mossback is a triceratops, Embertail a raptor, and Tidecrest a sauropod. These are
original procedural models rendered in an orthographic Three.js scene. Surface
maps provide scale pigment and bump detail; a custom material shader shades the
dorsal/underside color. Hemisphere, sunlight, rim light, and shadow maps give
forms volume. The same models and equipped accessories appear in portraits.
No image is used as the playable world. WebGL is required; an explicit fallback
message handles unavailable graphics support. No new package dependency was
added: Three.js was already present in the repository.

The current art is stylized procedural geometry, not a claim of photorealism or
finished production character art. Reduced motion removes decorative bobbing
and camera easing while preserving physical navigation.

Typography remains Inter per the explicit user preference. Fontjoy was revisited
at https://fontjoy.com/; its visible Montserrat/Lora/Hind Madurai pairing was not
adopted. The new visual system uses warm parchment `#f7f2e5`, fern `#486c54`, amber
`#ce9659`, and a sunlit sage world. Game screens replace permanent side panels.

### Missions, inventory, and progression

Adopt up to six companions with curious, cozy, or bold dialogue. New companions
begin with 12 buttons, level 1, and routines disabled. Saying hello changes
dialogue without a reward or penalty.

| Mission                  | Requirement                     | Duration      | Accepted reward   |
| ------------------------ | ------------------------------- | ------------- | ----------------- |
| Rescue my morning        | Level 1                         | 4 village min | 30 XP, 18 buttons |
| Find my next rabbit hole | Level 2, equipped Research lens | 6 min         | 45 XP, 24 buttons |
| Make room for a good day | Level 3, equipped Planner pin   | 8 min         | 60 XP, 30 buttons |

Focus changes the computed sample result. The brief is retained as intent;
there is no live model interpreting it. Accepted reports stay in a bounded
journal (latest 12) with the latest 30 run events. Duplicate acceptance cannot
award twice. Levels begin at 0, 30, 75, 135, and 210 XP; visible level caps at 5.
Levels add titles and shop prerequisites, not intelligence or external permissions.

| Gear          | Buttons | Minimum level | Effect                                         |
| ------------- | ------: | ------------: | ---------------------------------------------- |
| Swift wings   |       6 |             1 | Routines take 1 min; missions take 2 fewer min |
| Retry charm   |       6 |             1 | One automatic retry after a simulated timeout  |
| Research lens |      18 |             2 | Unlock scouting when equipped                  |
| Planner pin   |      24 |             3 | Unlock planning when equipped                  |
| Sunset scarf  |       6 |             1 | Cosmetic; no tool slot consumed                |

Purchases happen in the store and enter that companion’s inventory. Ownership
alone does not unlock a mission. Equipment changes lock during active work or
an unreviewed result. Prices, slots, tool prerequisites, and claims retain their
model-level guards.

### Routines and persistence

Camp configures digest delivery, note indexing, and uptime checks at simulated
UTC schedules of 5, 15, or 30 minutes. Missions take priority; overlaps are logged.
Pausing a schedule lets current work finish. Routine runs do not earn mission XP.
The journal retains the deliberate timeout/retry demonstration.

One village minute takes three seconds while time is running. Browser saves
remain schema v2; v1 worker saves still migrate. Existing species keys map to the
new dinosaur forms without losing names, schedules, equipment, stats, or logs.
The keeper’s position is saved separately after validation against town bounds
and colliders. Returning restores time paused; resume an expedition from C or
the clock from camp. There is no real-time catch-up. Reset requires confirmation.

These are local sample simulations. No live model, email, calendar, payment,
token, or external action is connected.

## Relay Guild

Route: `/design/saas-game-ui/relay-guild`.

A tactical board coordinates Sora (researcher), Ren (writer), and Aki (reviewer).
Choose an actor, command, and valid target, then confirm. Each turn advances all
active orders; Auto run advances a turn every 600ms while the page is visible.
The scene renders movement and order destinations. Orders can pause or cancel.

1. Research at the Archive to obtain two source notes.
2. Hand those notes from Sora to Ren.
3. Write a brief at the writing desk.
4. Hand the draft from Ren to Aki.
5. Review at the tower. Three local checks inspect source count, proposed action,
   and evidence citation.
6. Deliver the approved brief at the dispatch gate.

Orders can be issued before their inputs arrive. Agents walk to their stations,
wait with an explicit reason, and resume when a handoff supplies the missing
artifact. A handoff shares a reference without removing the sender's record.
Agent panels expose commands, context artifacts, completed-order counts, and the
latest 24 log events. The game cannot finish without an approved artifact.
This mission resets when its page is left. Restart requires confirmation.

## Verification and maintenance

`npm run test:saas-game-ui` runs deterministic model tests for scheduling boundaries,
manual runs, overlap, pause/edit, duration/retry upgrades, independent workers,
save validation, role/target guards, cancellation, dependency waiting, handoffs,
review failure, and full mission completion. Browser interaction checks cover the
town movement, entrance proximity, inventory/character shortcuts, mission progression, equipment, rewards, journals, menus, persistence, and the full relay. Targeted TypeScript
and ESLint checks plus `npm run build` are the release gates. Existing unrelated
repository-wide type errors are not claimed as passing.

All four routes honor the existing `ENABLE_SAAS_GAME_UI` build-time flag.

---

# Fieldwork — playable harness encounter

**Intent:** operate software through a 2D JRPG's field, inventory, equipment,
party commands, targeting, and visible consequences. This revision replaces the
card dashboard with a playable encounter. The operator moves independently;
agents move to their targets and produce objects in the field.

Fieldwork route: `/design/saas-game-ui/fieldwork`. Smooth original SVG illustrations and Inter form
an implementable 2D style. The previously generated concept image is not used as
a fake interactive surface. Its painted detail is not claimed to be reproduced.
No named saved aesthetic is imported.

## Play the encounter

1. Walk to `search.ts` and `search.test.ts`. Take each into the context inventory.
   Inspection is available first; collecting adds a reference and leaves the
   source object in place.
2. Approach the implementer. Open Equip and attach both files. Read files and
   Propose patch must also be equipped for Implement to become available.
3. Choose Implement. The cursor enters targeting mode and the task highlights.
   Select Search guard and confirm the command. Other objects reject that target
   type. Selecting or approaching something alone never executes the command.
4. The implementer walks to the task, performs its authored sequence, and leaves
   a proposed patch in the field. Pause, resume, and cancel control that sequence.
5. Collect the patch and inspect the diff. Use on task remains unavailable until
   the patch is collected and inspected. Target Search guard and confirm Apply.
6. Approach the verifier, equip `search.test.ts`, and select Verify. Target the
   task and confirm. The verifier moves to the task and executes four checks.
7. All four checks on the applied patch complete the encounter. The task gains a
   completion mark and the evidence is available from the result window.

Verification can run before applying the patch: one baseline check passes and
three fail. Each check produces a visible result on the task. Applying the patch
clears previous verification. Partial or cancelled checks cannot complete the
encounter. Rejecting a proposal removes its inventory reference and allows a new
implementation run. Restart cancels pending work and restores the entire scene.

## Input and game rules

- Click/tap ground to walk there. Hold WASD or arrow keys for continuous movement.
- Click an object to approach it and open its contextual commands. E interacts
  with the nearest object within reach. Movement alone never collects or runs.
- Files and the task are obstacles. An eight-way navigation grid routes around
  them; diagonal movement cannot cut obstacle corners. Movement stays within the
  walkable terrace.
- I opens inventory. Escape cancels targeting, closes the current command view,
  and stops movement. Key release, lost pointer capture, focus loss, and hidden
  document state clear movement input.
- Coarse pointers have a directional pad. Object buttons and command menus are
  native controls. Tab/Enter work throughout. The command menu also provides a
  native Target Search guard action.
- Reduced motion or the optional Instant approach setting removes travel delay.
  Keyboard movement remains directly controlled. Animation is suppressed under
  reduced motion.
- The cursor distinguishes approach, collect, inspect, target, and invalid target
  states. Labels and command availability provide the same information.
- Agent equipment locks while that agent is executing or paused. File references
  can be shared between party members; they are not consumable resources.

The scene has one current interaction, one party strip, and one command area.
Inventory, equipment, code, and evidence appear on demand. No fake health,
currency, experience points, or arbitrary scores are added.

## Implementation

- `field.ts`: typed entities, positions, proximity, bounds, and obstacle routing.
- `useWalker.ts`: continuous frame-based movement shared by operator and agents,
  with path following, directional motion, cancellation, and arrival callbacks.
- `SaasGameUI.tsx`: inventory, equipment, target selection, command guards, agent
  execution, patch review/application, evidence, and encounter completion.
- `WorldArtwork.tsx`: original layered field, three character appearances, and
  document objects. No pixelated rendering or screenshot hotspots.
- `harness.ts`: authored source/patch/run steps and executable check fixtures.

The code-native game adds no dependencies or general-purpose game engine. The
existing Astro page hosts a React island with local CSS and self-hosted Inter.

## Simulation boundary

The game mechanics operate real local application state. The agent's coding
sequence and proposed patch are authored examples. Checks execute the original
or patched sample function in the browser. This is not connected to a model,
user repository, shell, or filesystem. There are no external actions or saved
progress beyond the current page visit.

## Release

`ENABLE_SAAS_GAME_UI` defaults to enabled. Setting it to `false` at build time
redirects the route to `/portfolio` and hides its portfolio card. The content
entry remains available. Review the temporary flag after 2026-10-20.

The MR stays open for review. Behavior and art quality should be judged separately:
a completed input test proves the mechanic, not approval of the visual direction.
