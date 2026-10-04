---
title: "Acrylics"
description: "A paint-inspired design system: layered color schemes, brush and blot materials, tactile components, and tall billboard typography."
projectDate: 2026-09-20
completed: false
technologies: ["Design Systems", "Design Tokens", "UI Components", "Pigment Mixing", "Astro"]
featured: false
image: "/images/projects/acrylics-paint.webp"
customUrl: "/design/acrylics"
relatedBlogPosts: ["acrylics-paint-mixing-design-system"]
---

## A design system in layers

[Acrylics](/design/acrylics) documents a visual language built from tall market-sign
typography, loaded brushstrokes, pooled blots, and tactile early-web controls.
The page demonstrates the language while explaining how to build with it.

Three schemes—Market, Cobalt, and After hours—recolor the whole reference page.
Semantic tokens separate ground, surface, ink, action, and supporting pigments.
Raw pigments can mix into muted colors; action and text colors use explicit,
contrast-checked pairs.

The component reference covers actions, selection, fields, validation, feedback,
disclosures, surfaces, and dialogs. Five reusable Astro primitives form the core:
Button, ChoiceChip, PaintMark, SurfaceCard, and Dialog. Typography, geometry,
spacing, motion, and usage rules explain how the parts work together. Copy the
current scheme's CSS or download the token definitions and stylesheet.

The [material workshop](/design/acrylics/materials) keeps the paint studio and
geometry experiments as an optional deeper reference. Spectral.js (MIT) provides
pigment-inspired mixing; digital overlays use sRGB compositing. Neither model
predicts a particular brand of physical paint.

Interactive examples stay in page memory and reset on reload. The reference
page is isolated from the site's existing homepage and visual themes.
