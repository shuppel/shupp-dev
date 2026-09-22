# SaaS Game UI — playable harness encounter

**Intent:** operate software through a 2D JRPG's field, inventory, equipment,
party commands, targeting, and visible consequences. This revision replaces the
card dashboard with a playable encounter. The operator moves independently;
agents move to their targets and produce objects in the field.

Route: `/design/saas-game-ui`. Smooth original SVG illustrations and Inter form
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
