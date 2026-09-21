# SaaS Game UI — an AI harness you can inhabit

**Intent:** make the actual SaaS interface playable. Tasks, context files, agent
controls, patches, and checks are interactive objects. The character is the
operator within that interface. Each action changes application state and leaves
its result on the component it belongs to.

Route: `/design/saas-game-ui`. One AI harness replaces the previous workroom
metaphor. Smooth illustrated 2D and restrained RPG framing remain provisional;
the art direction is not presented as approved. Inter is the chosen typeface.
No saved aesthetic or named design style is imported.

## The working example

A task asks the implementer to reject blank searches, trim surrounding spaces,
and retain valid queries. The original `prepareSearch` returns its input.

1. Assign the task with its button, or drag it onto the agent.
2. Equip `src/search.ts` and `search.test.ts` in Context. Inspect either file.
3. Configure Read files and Propose patch under Tool access. Both are required.
4. Run the agent. Pause and resume its authored sequence if needed.
5. Inspect the proposed diff. Approve and apply it to the local sample, or reject
   it and reconfigure the agent. Applying is gated by opening the diff.
6. Run checks. Expand any result to inspect input, expected, and actual values.
7. Complete the task only after the patched version passes all four checks.

Baseline checks are available before the run. Three fail; one passes. Applying
the patch invalidates prior verification. The patch trims the query and returns
null for empty values; all four checks then pass. Those checks execute actual
JavaScript fixtures in the browser. They are not tests of the user's repository.

Agent activity and the proposed patch are predefined, explicitly labeled sample
output. There is no model inference, shell execution, file system write, API
connection, repository access, or persistence. Reset cancels the pending sample
sequence and restores the task, context, tool access, and results.

## Interaction contract

Each native UI component owns its actions and results. There is no detached
context-action panel. A button executes its explicit command and moves the
operator to that component. Selecting a component heading only moves the
character; movement never executes work by itself.

Character mode keeps the operator visible and marks the current component.
Pointer mode uses the same handlers directly. Focus the workspace and use arrow
keys or WASD to cycle through components in task order. E or Enter focuses the
current component's primary available control. Tab and native keyboard controls
remain available. The character transitions between component docks without
imposing a travel delay on commands. Reduced motion places it immediately.

The cursor changes for assignment, equipping, running, inspection, applying, and
unavailable commands. Text labels, disabled states, and a status message also
convey the action; cursor appearance is supplementary. Drag assignment has an
equivalent native button. Mobile uses the same components in workflow order.
Dialogs use native modality, Escape, and focus return.

## Reusable structure

`harness.ts` defines the five surfaces, commands, authored files, run steps, and
executable check fixtures. `SaasGameUI.tsx` owns command guards and state.
`WorldArtwork.tsx` contains only the illustrated operator. Layout and artwork do
not determine whether a command is allowed.

| Component | Command           | Prerequisite                    | Visible result                   |
| --------- | ----------------- | ------------------------------- | -------------------------------- |
| Task      | Assign            | Unassigned task                 | Agent receives task              |
| Context   | Equip             | No run in progress              | Equipped count and file state    |
| Agent     | Run               | Task, both files, both tools    | Activity and proposed patch      |
| Patch     | Approve & apply   | Finished run and inspected diff | Local implementation changes     |
| Checks    | Verify / complete | Patch required for completion   | Per-case evidence and task state |

Configuration is meaningful to the harness: context and tool access define what
the agent can run with. These controls lock during a run and unlock on rejection
or reset. Character/pointer selection configures the input method. This is a
single worked design example, not a generic canvas editor or an agent platform.

## Implementation and release

Standalone Astro document, React island, native controls, CSS, and smooth inline
SVG. No added dependencies. Self-hosted Inter and its OFL license remain under
`public/saas-game-ui/fonts/`.

`ENABLE_SAAS_GAME_UI` defaults to enabled. Setting it to `false` at build time
redirects the route to `/portfolio` and hides its portfolio card. The content
entry remains available. Review the temporary flag after 2026-10-20.

## Definition of done

- Every work interaction belongs to a functioning dashboard component.
- Character and direct inputs share the same command guards and state.
- Context and tool configuration affect run availability.
- The complete assign → equip → run → inspect → apply → verify flow works.
- Baseline failures, passing patched checks, rejection, pause, and reset are observable.
- Simulation boundaries are clear, without overwhelming the primary interface.
- Desktop and mobile layouts stay usable; art uses smooth contours, not pixels.
