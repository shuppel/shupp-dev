# SaaS Game UI design study

Route: `/design/saas-game-ui`. The standalone Astro document follows the existing
PRISM and VOID showcase pattern. The React island owns local demonstration state;
the stylesheet provides reusable `.sg` primitives and role tokens.

## Surface contract

Load `/saas-game-ui/saas-game-ui.css`, then wrap native controls in:

```html
<section class="sg" data-treatment="toybox" data-mode="day">
  <button class="sg-button sg-button--primary">Save draft</button>
</section>
```

Treatments: `toybox`, `cartridge`, `tactics`. Modes: `day`, `night`.
Components: `.sg-button`, `.sg-input`, `.sg-panel`, `.sg-status`,
`.sg-inventory-tile`, `.sg-progress`, `.sg-dialog`, `.sg-menu`, `.sg-table`.
Page layout classes are scoped beneath the `.sg` surface; behavior is deliberately
kept separate from the CSS. The local mono font has system fallbacks.

## Interaction model

- The board accepts three unique steps: Discover → Compose → Review.
- Click a tool or an empty slot to place a step. Native dragging can swap steps.
  Removing and adding a tool provides an equivalent keyboard path.
- Execution uses three bounded local timers and predefined sample outcomes.
  There is no inference, network request, connector action, or persistent storage.
- An optional interruption fails Compose. Retry clears the sample interruption
  and starts a fresh sample run; Stop cancels the active timer.
- Completion means a draft is queued for review, not approved or published.
- Treatment and mode changes retain the same workflow state.
- Native dialog focus management and Escape behavior are preserved. Motion is
  reduced under `prefers-reduced-motion`; status has visible text and live regions.

## Release switch

`ENABLE_SAAS_GAME_UI` defaults to enabled. Set it to `false` **at build time** to
redirect the design route to `/portfolio` and hide its card on that page. The
descriptive `/portfolio/saas-game-ui` content entry remains available. Review the
temporary flag after 2026-10-20.

## Review checklist

1. Change all three treatments in both day and night modes.
2. Add Review and run the sample; verify the human-review handoff.
3. Include an interruption, run, and retry; stop a run while it is working.
4. Remove a step, attempt an incomplete run, restore it, and run again.
5. Swap tiles by dragging, then restore the required order.
6. Edit the routine name, save, select the inventory tile, change the data row,
   duplicate using the context menu, advance progress, and open/close the dialog.
7. Check keyboard focus, reduced motion, and narrow screens.
8. Build with the release switch both enabled and disabled.
