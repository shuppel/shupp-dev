---
title: "Prismatic"
description: "A light-mode-first, prism/glass design system in OKLCH. One anchor hue drives the palette; one passive light, solved with radiance cascades, falls on fourteen light materials."
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

The light is solved with [radiance cascades](https://radiance.wiki/) in WebGL2, and
as of v0.9 it is passive: it rests where a light rig puts it and moves only for a
story beat or an action. Density chooses a material (glass, frosted, pigment, and
eleven more: prism, filter, mirror, lens, fog…), and every action is a documented
light event. The same decision tables drive the engine and a rules file for agents
([`/prism/PRISM.md`](/prism/PRISM.md)), and everything stays inside WCAG AA.

Explore it at [`/design/prismatic`](/design/prismatic), and compare the variants in
the [light lab](/design/prismatic/lab).
