# SaaS Game UI — monochrome edition

Route: `/design/saas-game-ui`. A standalone Astro document with a React island
for local demonstrations. The current design replaces the previous colored
presets with one independent black and white visual language.

## Visual direction

- **Typography:** Inter throughout. Larger, medium-weight display type contrasts
  with regular interface and reading text. Fontjoy's shared-theme/contrast
  principle informed the role hierarchy: <https://fontjoy.com/>. This is an
  authored selection, not a claim that Fontjoy generated a pairing.
- **Color:** black, white, and neutral grays only. Invert swaps foreground and
  background without changing the workflow. The initial canvas is always white.
- **Form:** flat surfaces, 1px rules, 3px control corners, native inputs, and
  restrained press/selection feedback. Object inversion denotes selection;
  outlines, patterns, icons, and language distinguish states.
- **Scope:** this study does not import the VOID, PRISM, Acrylics, or Yūgen design
  styles. A future named style should be an explicit design choice.

## Surface contract

Load `/saas-game-ui/saas-game-ui.css`, then wrap native controls in:

```html
<section class="sg" data-mode="day">
  <button class="sg-button sg-button--primary">Save draft</button>
</section>
```

Modes: `day` (white canvas), `night` (black canvas). There are no treatment presets.
Reusable primitives include `.sg-button`, `.sg-input`, `.sg-panel`, `.sg-status`,
`.sg-inventory-tile`, `.sg-progress`, `.sg-dialog`, `.sg-menu`, and `.sg-table`.
The locally hosted Inter Latin variable font and its OFL license live in
`public/saas-game-ui/fonts/`. Copy those files with the CSS when reusing it.
No JavaScript dependencies were added for typography.

## Interaction model

- The board accepts three unique steps: Discover → Compose → Review.
- Click a tool or an empty slot to place a step. Native dragging can swap steps.
  Removing and adding a tool provides an equivalent keyboard path.
- Execution uses bounded local timers and predefined sample outcomes. There is
  no inference, connector action, external request, or persistent storage.
- An optional interruption fails Compose. Retry clears the sample interruption
  and starts a fresh sample run. Stop cancels the pending timer.
- Completion means a draft is queued for review, not approved or published.
- Inversion preserves the workflow and component state.
- Native dialog focus management and Escape are preserved. Reduced motion
  removes transitions. Status changes have visible text and live regions.

## Release switch

`ENABLE_SAAS_GAME_UI` defaults to enabled. Set it to `false` **at build time** to
redirect the design route to `/portfolio` and hide its card. The descriptive
`/portfolio/saas-game-ui` content entry remains available. Review the temporary
flag after 2026-10-20.

## Review checklist

1. Inspect both canvas polarities at desktop, tablet, and mobile widths.
2. Add Review and run the sample; verify the human-review handoff.
3. Include an interruption, run, and retry; stop a run while it is working.
4. Remove a step, attempt an incomplete run, restore it, and run again.
5. Swap tiles by dragging, then restore the required order.
6. Edit the routine name, save, select the inventory tile, change the data row,
   use the context menu, advance progress, and open/close the dialog.
7. Check keyboard focus, reduced motion, local Inter loading, and neutral colors.
