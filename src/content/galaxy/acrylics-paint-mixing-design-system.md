---
title: "Acrylics: a paint-mixing design system for the web"
description: "How Acrylics turns layered color, pigment-inspired math, expressive shapes, and tactile early-web controls into a usable interface system."
stage: "star"
formed: 2026-09-23
lastObserved: 2026-09-23
pubDate: 2026-09-23
author: "Erikk Shupp"
ogImage: "/images/social/acrylics-card.png"
ogImageAlt: "Acrylics design system: expressive black typography, layered color, and a collage of painted shapes."
constellation: "design-systems"
connections: ["better-user-experiences"]
relatedProjects: ["acrylics"]
visible: true
---

A design palette usually begins as a row of swatches. **Acrylics** began with a different question: what if the palette were something you build while you work?

The idea was to layer colors like paint, then let the layers change the feeling of the whole interface. That meant the system needed more than a handful of attractive combinations. It needed a way to explore color, shape, and overlap, and a way to turn the good discoveries into parts a designer could reuse.

[Explore the Acrylics design system](/design/acrylics).

## Color as a process

Acrylics treats color as material to experiment with. Its Market, Cobalt, and After hours schemes recolor the reference page through semantic tokens for the ground, surfaces, ink, actions, and supporting pigments.

The material workshop makes the process visible. You can combine pigments, adjust overlaps, move layers, and change shapes. Spectral.js provides pigment-inspired mixing; the layered digital surfaces use standard sRGB compositing. These are two useful models for interface exploration, not a promise that a screen can predict how a particular physical paint will behave.

That distinction matters. The point is not to claim that a browser is a paint store. The point is to make the choices behind a palette visible and adjustable.

## A playful surface still needs structure

The visual language draws on tall market-billboard typography, loaded brushstrokes, pooled blots, and tactile controls with an early-web spirit. These elements give the system personality, but they do not replace the ordinary work of interface design.

A semantic token says what a color is for. A contrast-checked pair helps keep text and actions legible when the palette changes. The surface can be expressive while the underlying roles stay understandable.

This is the balance Acrylics is trying to find: enough irregularity to feel made by hand, enough consistency that a button or selection still reads as itself.

## From palette experiments to components

A design system has to carry its ideas into everyday controls. Acrylics documents five reusable Astro primitives:

- **Button** for actions
- **ChoiceChip** for selecting among options
- **PaintMark** for expressive marks
- **SurfaceCard** for grouped content
- **Dialog** for focused decisions

The reference also covers fields, validation, feedback, disclosures, and other interaction patterns. Typography, geometry, spacing, motion, and usage rules show how the parts fit together. You can copy the active scheme's CSS or download its token definitions and stylesheet.

The components make the experiments easier to judge. A color layer is more than a pretty sample when you can see how it behaves around a field, a choice, or a dialog.

## A workshop for trying things

The main reference page demonstrates the design language and its components. The [material workshop](/design/acrylics/materials) goes deeper into mixing and geometry.

Experiments live in the page and reset when you reload. The Acrylics reference is isolated from the site's existing homepage and visual themes, so it can change without quietly changing the rest of the site.

I want Acrylics to leave room for play, but to make the system's decisions inspectable: what was layered, what changed, and which tokens or components can carry the result forward.

[Explore Acrylics](/design/acrylics) or [open the material workshop](/design/acrylics/materials).

[Share this article on X](https://twitter.com/intent/tweet?text=Acrylics%20turns%20web%20design%20into%20a%20paint-mixing%20lab%3A%20layered%20color%2C%20pigment-inspired%20math%2C%20playful%20geometry%2C%20and%20reusable%20components.&url=https%3A%2F%2Fshupp.dev%2Fgalaxy%2Facrylics-paint-mixing-design-system%2F)
