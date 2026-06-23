---
title: "Prismatic"
description: "A light-mode-first, prism/glass design system in OKLCH. One anchor hue drives the entire palette across day and redshift (night) modes."
projectDate: 2026-06-21
completed: true
technologies: ["Design Systems", "OKLCH", "CSS", "Design Tokens", "Astro", "Accessibility"]
featured: true
image: "/images/projects/prismatic.png"
customUrl: "/design/prismatic"
---

## PRISM

PRISM is a light-mode-first design system built on a prism-glass material model:
light splits into spectra at edges, shadows carry color rather than gray, and the
near-white field does the work. It inverts the dark-mode / liquid-glass conventions
on purpose.

The whole system is parametric. A single **anchor hue** (`--h`, in OKLCH degrees)
drives every brand color — rotate it and the palette re-derives. There are two
modes: **day**, and **redshift (night)**, where night is treated as a wavelength
shift rather than a darkness (`--hr = redshift(--h)`), minting zero new colors.

Explore the live, interactive showcase at [`/design/prismatic`](/design/prismatic):
drag the anchor-hue slider and toggle the mode to watch the entire page — including
hairlines, shadows, and the outline display type — recast in real time, all while
holding WCAG AA contrast across the wheel.
