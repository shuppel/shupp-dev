---
title: "Void"
description: "A ceramic material model where depth is carried entirely by the boundary of an object — one absolute-black hairline with an asymmetric gradient pair, and not a single gradient in any fill. Fired in two modes."
projectDate: 2026-08-10
completed: true
technologies: ["Design Systems", "CSS", "Design Tokens", "WebGL", "Perceptual Design", "Astro", "Accessibility"]
featured: true
image: "/images/projects/void.png"
customUrl: "/design/void"
---

## VOID

VOID is a ceramic material model built on one perceptual trick, where **depth is
carried entirely by the boundary of an object, never by its fill.** Every object
is drawn with a 1.5px hairline of absolute black; a hard, short light gradient sits
immediately inside that hairline and a soft, long dark one immediately outside. The
asymmetry drives lateral inhibition harder than a real edge would — the Cornsweet
illusion — so a face that is one flat colour value edge to edge reads as glazed,
lifted material.

The consequence is that two discs filled with the same `#1c1e26` can read as two
different substances, depending only on what happens in the twelve pixels either
side of their edge. Sample the centre of any object on the page with a colour
picker and you get the same value back.

Three presets over one shadow structure do the whole job — `.lit`,
`.lit--ceramic` (decay zero, the purest form of the thesis), and `.lit--sunk`
(the pair inverted, which supplies the entire input vocabulary). State is a
separate primitive: an **omnidirectional, tinted ring inside the hairline**, even
and complete, which no light position could ever produce — so hue can never be
misread as lighting.

Light is one global vector written by a single spring that never tracks the
pointer. Moving the cursor across the page does nothing at all; pressing a control
injects an impulse toward it and the spring returns to rest, then **cancels its own
rAF loop** — zero scripting cost between interactions. The one WebGL surface on the
page is a conformal loader whose falloff field is warped by a Möbius disc
automorphism: the silhouette stays a mathematically exact circle while the band
thickens and thins, and the progress head accelerates and decelerates around the
ring with no easing function anywhere in the source.

Three kinds of motion exist and no others. A **press** flips which side of the
hairline receives light, so the surface takes the press while the object stays
exactly where it is — no translate, no scale, no layout shift, and the incision
inside a pressed surface flips sign with it. A **disclosure** grows an object out
of nothing, hairline and black bleed drawn correctly at every intermediate height,
because the element carrying the depth preset is the element being sized. And
**scroll** produces readouts rather than animations: a rail that reports position,
a group header that reports it has pinned. Entrances animate `--lift-scale` — the
light finding an object that was already in place.

Explore the live showcase at [`/design/void`](/design/void): strip the
gradient pair away and watch the page fall flat, drag the light's resting azimuth,
desaturate the status row to check that nothing depends on hue, hold a button,
open a menu, and run the conformal ring through its three drive modes.

The structure was never about darkness, so it is fired in two modes. Night is the
default — absolute black against near-black is where the illusion is strongest —
but invert the ladder and everything holds: the hairline is still #000, the light
is still white and inside it, the bleed is still black and outside it. Only how
hard each side has to work changes, so a mode here is a token set and nothing
else, right down to the WebGL ring, which reads its two grounds from the tokens
at draw time.

It is the deliberate inverse of [PRISM](/design/prismatic), the light-mode-first
prism-glass system next door. PRISM spends a colour budget; VOID has none —
every saturated pixel on screen belongs to a status ring or a dot.
