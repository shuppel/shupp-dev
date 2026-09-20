# SaaS Game UI — character and object interaction

**Intent:** make a character a way to operate a SaaS interface. A person moves
through a workspace, approaches an object, discovers its available action, and
uses it to change application state. Objects carry the meaning of the work.

Route: `/design/saas-game-ui`. This replaces the four candidate layouts with one
working interaction prototype. Smooth illustrated 2D is a provisional art
direction; it does not imply that the user has approved a final JRPG aesthetic.
Inter remains the chosen typeface. No named design style is imported.

## Interaction contract

1. Click/tap the floor to walk there, or focus the room and use WASD/arrow keys.
2. Select an object to approach its interaction point. Selecting a distant
   object moves the person; the action remains gated by proximity.
3. Within reach, press E or select the object to reveal its contextual action.
4. Explicitly execute the action. Its result changes the object state and the
   inventory; movement alone never executes work.

The pointer changes between walking, approaching, interacting, locked, and
working states. A visible hint also names the possible interaction. Pointer
mode removes the walking requirement and uses the same object/action handlers.
All tasks have native button paths for keyboard and touch access.

The workroom is an open, bounded interaction area. This prototype does not add
an obstacle pathfinder, game engine, backend, or multiplayer system.

## Objects and setup

Each `WorldItem` has an ID, label, action key, position, and interaction radius.
The local action registry determines its prerequisite, verb, description, and
result. Art is separated in `WorldArtwork.tsx`; changing the illustration does
not change the input or action contract.

`Set up objects` edits labels, action bindings, positions, and reach distances,
or creates an additional object (up to six in this sample). It prevents
placements within 15 normalized units of another object and preserves at least
one binding for each required task step. Restore returns the original objects.
Task reset preserves the configured layout. Scene edits last for the page visit.

Positions and reach are normalized scene coordinates. Click-to-approach uses a
bounded point in front of the object. The world is responsive; artwork and
native controls remain distinct from those coordinates.

## Sample task

- **Source archive:** collect six predefined customer notes into inventory.
- **Writing desk:** use those notes to prepare a predefined three-point brief.
- **Review stand:** inspect the brief and its sources, then mark the sample as
  reviewed. No content is sent or published.

The sample uses local timers and predefined results. Pause cancels pending work;
reset clears the task. Collected notes appear in the character's hand, completed
objects change appearance, and inventory documents become available. Source and
brief dialogs cite the note numbers and support native Escape/focus return.

Reduced motion removes walking animation and places the character immediately
at click destinations. Keyboard movement remains user-controlled. Key release,
focus loss, mode changes, and reset stop the appropriate movement state.

## Implementation and release

Standalone Astro document, a React island, native HTML controls, CSS cursors, and
smooth inline SVG. No added packages. The Inter font and OFL license remain under
`public/saas-game-ui/fonts/`.

`ENABLE_SAAS_GAME_UI` defaults to enabled. Setting it to `false` at build time
redirects the design route to `/portfolio` and hides its portfolio card. The
content entry remains available. Review the temporary flag after 2026-10-20.

## Definition of done for this iteration

- The character moves independently of task progress.
- Distance and object state change the available action and cursor.
- Character and direct pointer input reach the same actual sample handlers.
- A user can configure and use an additional object.
- The primary room has one contextual action panel; setup and technical detail
  stay behind deliberate controls.
- Artwork has smooth contours; there is no crisp-edge/pixelated rendering.
