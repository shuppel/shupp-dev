# SaaS Game UI — system and three playable studies

The main route `/design/saas-game-ui` is a non-demo design-system page. It explains
six shared primitives (actor, world object, command, equipment, feedback, record),
visual foundations, interaction rules, and the exact simulation boundary. It links
to three games. Each has a visible Menu button and Escape exit menu. Escape first
cancels active targeting or closes a native dialog; a subsequent Escape opens the
menu. The menu pauses execution and links back to the system.

The new pages extend the accepted smooth 2D JRPG direction and Inter typography.
No dependencies, game engine, external model, or background scheduler are added.

## Creature Works

Route: `/design/saas-game-ui/creature-works`.

Hatch up to six named creatures. Sprout, finch, and moth are cosmetic forms; jobs
and equipment determine behavior. A worker can deliver digests, index notes, or
check uptime. Its schedule uses one of three UTC presets: `*/5`, `*/15`, or `*/30`
minutes. The clock advances a simulated minute per real second while enabled and
visible, or one/five minutes per manual step. It does not catch up real-world time.

Every worker has a dashboard (runs started, successes, failed runs, last duration,
next occurrence), an augmentation view, and the latest 30 log events. Editing a
schedule recalculates the next UTC boundary. Run now leaves that schedule intact.
Pause disables future scheduled starts while active work finishes. Overlapping
occurrences are skipped and recorded rather than duplicated.

Swift wings reduce an attempt from three simulated minutes to one. A retry charm
retries a failed attempt once after one minute. Both visibly augment the creature.
Equipment and job edits lock during an active run. A deliberate failure control
simulates one service timeout; attempt failures and terminal failed runs remain
distinct. The completion goal is two workers, an augmentation, and three successful
jobs. Play can continue afterward.

Worker state and logs save to a bounded, versioned localStorage record. Returning
restores progress with the clock stopped. Invalid saves reset safely; unavailable
storage falls back to an unsaved session. Reset requires confirmation.

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
creator, dashboards, menus, persistence, and the full relay. Targeted TypeScript
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
