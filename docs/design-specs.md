# Design Specs — shupp.dev

Living spec for the design system. Source of truth for tokens is `src/layouts/Layout.astro`; this document explains **what** the tokens are and **why** they exist.

## Typography

Three families, each with a clear role. All are loaded via local `@font-face` in `Layout.astro` for performance and offline reliability.

| Token | Family | Role | Rationale |
|---|---|---|---|
| `--font-main-header` | `'Shupp', 'Maitree', serif` | Display / wordmark | Custom brand serif used sparingly for masthead and brand mark; Maitree is the closest free fallback if Shupp fails to load. |
| `--font-secondary-header` | `'Cairo', sans-serif` | Section titles, h2/h3, eyebrow labels, buttons | Geometric humanist sans — strong at uppercase tracking, holds shape at small sizes. |
| `--font-body` | `'Hind', sans-serif` | Body, descriptions, navigation labels | Optimized for screen body text at 14–18px; pairs cleanly with Cairo. |

**Discipline:** never declare `font-family` inline with a literal string. Always reference a token. New use cases get a new token in `Layout.astro`, not a one-off.

### Scale (used in practice)

| Size | Pixels (1rem = 16px) | Usage |
|---|---|---|
| 0.68rem | ~11px | Eyebrow / section labels (uppercase, 0.14em tracking) |
| 0.75rem | 12px | Eyebrow type chips (uppercase, 0.05em tracking) |
| 0.8rem | ~13px | Outlet meta, dates, badges |
| 0.85–0.9rem | ~14px | Card descriptions, asset notes |
| 0.95rem | ~15px | Nav links, social labels |
| 1rem | 16px | Base / quick-link h3 |
| 1.05–1.1rem | ~17px | Tagline, lead paragraph, card titles |
| 1.5rem | 24px | Year heading |
| 1.9rem (mobile) – 2.4rem | ~30–38px | Page hero h1 |
| 2.5rem | 40px | Press page h1 |

## Colors

Five-color brand palette. Everything else derives from these.

### Brand

| Token | Hex | Notes |
|---|---|---|
| `--color-dark` | `#14080E` | Near-black plum. Body text on light; canvas in dark mode. |
| `--color-secondary` | `#49475B` | Cool slate. Secondary text, gradient companions. |
| `--color-tertiary` | `#799496` | Sage teal. Brand accent for hover/active borders and outline buttons. **Note:** at ~4.0:1 on white, *do not use for normal-size body text* — use `--color-secondary` instead. |
| `--color-accent` | `#ACC196` | Olive green. Headshot ring, dark-mode accent on hover/active. |
| `--color-light` | `#E9EB9E` | Pale citron. Dark-mode highlight / decorative gradient terminus. |

### Semantic (derived)

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--background-color` | `#f9fafb` | `var(--color-dark)` | Page canvas |
| `--background-alt` | `#f1f5f9` | `var(--color-secondary)` | Subtle sectioning |
| `--surface` | `#ffffff` | `#23232b` | Cards, hero, asset previews |
| `--surface-elevated` | `#ffffff` | `#2a2a33` | Elevated cards (reserved) |
| `--surface-muted` | `#f8f8f6` | `#1a1a22` | Inset / preview backgrounds |
| `--text-color` | `var(--color-dark)` | `#f3f4f6` | Primary text |
| `--text-strong` | `var(--color-dark)` | `#f3f4f6` | Headings, emphasized labels |
| `--text-light` | `var(--color-secondary)` | `var(--color-light)` | Secondary text |
| `--text-muted` | `#6b7280` | `#a5a5b5` | Tertiary metadata |
| `--border-color` | `var(--color-tertiary)` | `var(--color-tertiary)` | Defined borders |
| `--border-subtle` | `rgba(121,148,150,0.15)` | `rgba(233,235,158,0.10)` | Card outlines |
| `--hover-tint` | `rgba(121,148,150,0.08)` | `rgba(233,235,158,0.08)` | Background on hover |
| `--focus-ring` | `0 0 0 3px rgba(121,148,150,0.45)` | `0 0 0 3px rgba(233,235,158,0.55)` | Keyboard focus indicator |

### Contrast guardrails (WCAG AA)

- Body text (normal weight, ≤18px): require ≥ 4.5:1.
- Large text (≥24px or ≥18px bold): require ≥ 3:1.
- `--color-tertiary` on white = ~4.0:1 → fails for body. **Use only for ≥18px bold accent text, decorative borders, or icons in a duotone pair.**
- `--color-secondary` on white = ~7.8:1 → safe for body.

## Spacing

8px base; rem-driven so it scales with user font preference.

| Step | Rem | Pixels | Usage |
|---|---|---|---|
| 0.5x | 0.25rem | 4px | Tight inline gaps |
| 1x | 0.5rem | 8px | Component-internal |
| 1.5x | 0.75rem | 12px | Card content gaps |
| 2x | 1rem | 16px | Card padding |
| 3x | 1.5rem | 24px | Section padding-x |
| 4x | 2rem | 32px | Hero padding |
| 6x | 3rem | 48px | Section margin / layout gap |

## Components

### Border radius

| Token (de facto) | Value | Usage |
|---|---|---|
| `sm` | 6–8px | Inline pills, small buttons |
| `md` | 10–12px | Cards, link cards, asset cards |
| `lg` | 18px | Hero card |
| `pill` | 20–999px | Tags, year-link mobile, small buttons |
| `circle` | 50% | Headshot, theme toggle |

### Shadows

| Use | Value |
|---|---|
| Card resting | `0 2px 8px rgba(20,8,14,0.04)` |
| Card hover | `0 6px 20px rgba(20,8,14,0.08)` |
| Hero card | `0 6px 28px rgba(20,8,14,0.06)` |
| Focus ring | `var(--focus-ring)` |

### Transitions

| Use | Curve | Duration |
|---|---|---|
| Hover micro-interactions | `ease` | 0.2s |
| Card lifts | `cubic-bezier(0.25, 0.8, 0.25, 1)` | 0.3s |
| Page-level fades | same easing | 0.7s |

All transitions are wrapped in `@media (prefers-reduced-motion: reduce)` overrides at the component level.

## Accessibility rules

1. Every interactive element has a visible `:focus-visible` state via `box-shadow: var(--focus-ring)`.
2. Active nav links carry `aria-current="page"` (set in client JS).
3. Anchored sections use `scroll-margin-top` so deep-links don't land flush with the viewport edge.
4. Icon-only buttons must have `aria-label`. Decorative icons inside a labelled link get `aria-hidden`.
5. Color is never the only signal — pair with iconography or text.
6. `prefers-reduced-motion: reduce` disables transforms, transitions, and the quantum-outline animation.

## Iconography

Phosphor icons (duotone weight) via `src/components/Icon/Icon.astro`. Single library, single weight. No emoji in UI surfaces. Minimum on-screen size: 14px; reserve 12px for purely decorative inline icons.

## Migration notes (May 2026)

The recent press/index/SideNav redesign introduced page-level hard-codes (`white`, `#23232b`, `#f3f4f6`, `#d1d5db`, `#a5a5b5`, ad-hoc rgba tints). All have been migrated to the tokens above. New rule: if you reach for a literal hex inside a component file, stop and add a semantic token here first.
