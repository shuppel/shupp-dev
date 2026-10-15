---
title: "Prismatic"
description: "A light-mode-first, prism/glass design system in OKLCH. One anchor hue drives the palette; one light, solved live with radiance cascades, falls across every object."
projectDate: 2026-06-21
completed: true
technologies: ["Design Systems", "OKLCH", "CSS", "WebGL2", "Radiance Cascades", "Design Tokens", "Astro", "Accessibility"]
featured: true
image: "/images/projects/prismatic.png"
customUrl: "/design/prismatic"
---

## PRISM

PRISM is a light-mode-first design system built on a prism-glass material model:
light splits into spectra at edges, shadows carry color rather than gray, and the
near-white field does the work.

One **anchor hue** (`--h`, OKLCH degrees) derives every brand color. Rotate it and
the palette re-derives. Night is a redshift, `--hr = redshift(--h)`, not a dimmer.

As of v0.8 the light is solved, not drawn. The pointer emits four band-colored
sources, every card is glass whose transmittance is its density tier, and the field
is lit live with [radiance cascades](https://radiance.wiki/) in WebGL2. Shadows soften
with distance, split into spectra at their edges, and stay inside WCAG AA in both
modes. The field re-solves only when the light crosses a probe, so at rest it costs
nothing.

Explore it at [`/design/prismatic`](/design/prismatic): drag the hue, toggle the mode,
and move the light.
