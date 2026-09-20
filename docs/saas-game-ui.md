# SaaS Game UI — four directions for review

**Intent:** a reusable SaaS design system inspired by 90s Japanese RPGs. Make work
visible: who owns it, which actions are available, and what happened. This page
presents four candidates for approval before expanding the component system.

Route: `/design/saas-game-ui`.

## The four approaches

| Direction       | Focus                                 | Best use                   | Main trade-off                          |
| --------------- | ------------------------------------- | -------------------------- | --------------------------------------- |
| Command Desk    | Fast, contextual actions              | Repeated daily work        | Needs another view for larger workflows |
| Workflow Map    | Visible sequence and dependencies     | Multi-step automation      | Large maps need grouping                |
| Party Console   | Roles, ownership, and handoffs        | Agents working with people | Extra structure for solo tasks          |
| Dialogue Review | One decision with supporting evidence | Approvals and guided work  | Slower for expert batch tasks           |

The layouts differ in their interaction model, not just their palette. All four
use the same sample: collect six customer notes, prepare a three-point brief,
then mark it reviewed. The options can be combined later after a direction is
chosen. No candidate is approved by selecting its preview tab.

## Presentation

The page has a short introduction, four direction selectors, and one active
interactive example. A benefit and trade-off sit below the example. Supporting
pattern mappings and implementation notes are collapsed by default.

Visual language: original pixel-shaped vector characters and scenes, framed
windows, clear selection cursors, and four restrained palettes. Inter is the
only typeface, self-hosted with its OFL license. Readability, native controls,
responsive layouts, focus visibility, and real task states remain shared rules.
No named site design style is imported.

## Sample behavior

- A single shared sample state carries across the four views.
- Collect → draft → human review; later steps explain their prerequisites.
- Source notes and the brief can be inspected in native dialogs. Recommendations
  cite the relevant note numbers.
- Local timers play a predefined sample, with immediate working feedback.
  Pause cancels pending work while retaining completed milestones; Reset clears
  the sample. There are no model calls, external actions, or stored approvals.
- Selecting a direction updates `?direction=command|map|party|dialogue` for direct
  links. Arrow keys, Home, and End move through the tabs. Browser history restores
  the selected direction. Dialogs support Escape and native focus return.
- The progress count is completed sample steps out of three; there are no
  fictional scores, levels, or currency.

## Implementation and release

Standalone Astro document, one React island, plain CSS, and inline SVG. No added
package dependencies or game engine. Inter assets remain under
`public/saas-game-ui/fonts/`.

`ENABLE_SAAS_GAME_UI` defaults to enabled. Setting it to `false` at build time
redirects the design route to `/portfolio` and hides its portfolio card. The
content entry remains available. Review the temporary flag after 2026-10-20.

## Acceptance checks

1. Each of the four directions has a distinct layout and stated purpose.
2. Complete the three-step sample in each view and inspect its evidence/result.
3. Verify prerequisites, pause, reset, view switching, and final reviewed state.
4. Check tab keyboard navigation, deep links, browser history, dialog Escape,
   focus return, reduced motion, and phone/desktop layouts.
5. Approve a direction before expanding this into a larger component library.
