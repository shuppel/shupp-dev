# PRISM Solid icons

A shared Three.js component for PRISM navigation. The logo and icons use the same faceted geometry vocabulary and OKLCH-derived material palette. No pointer tracking, autoplay, or movement at rest.

```html
<link rel="stylesheet" href="/prism/icons.css">
<script type="module" src="/prism/icons.js"></script>
<button><prism-icon name="accounts"></prism-icon> All accounts</button>
```

| Name | Form |
| --- | --- |
| mark | Elongated octahedron, the PRISM logo |
| accounts | Four faceted octahedra |
| marketplace | Faceted pediment, pillars, and a central prism |
| send | Folded, extruded arrow |
| activity | Three ascending faceted columns and a signal prism |

- Keep a visible action label on the enclosing button or link. The solid is decorative and is not independently focusable.
- Set `--prism-icon-size` on an icon or ancestor (default 32px).
- The enclosing action's pointerenter/focusin starts rotation. Pointerleave/focusout settles to the nearest resting orientation in 400ms. A turn is 960ms (24 PRISM quanta).
- The frame loop sleeps at rest, pauses for hidden pages, and skips clipped/offscreen icons. One WebGL2 renderer is shared by the entire family.
- Day uses `--h`; night uses `--hr`. Palette bands stay related to PRISM's anchor hue, with directional lighting and thin facet boundaries.
- `prefers-reduced-motion: reduce` renders static solids. Focus rings and text continue to identify the active action.
- With WebGL2 unavailable, the same Three.js geometry, transforms, camera, and face colors project into inline SVG. CSS facets serve as the placeholder while the renderer initializes. If the module cannot load, the action’s text label remains available.
- The light-field engine may own a separate renderer; never create a WebGL context per icon.
- `icons.js` exports `ICON_NAMES` and `ICON_MOTION`. The vendored Three.js r180 dependency is pinned and retains its MIT license in `vendor/THREE-LICENSE.txt`.

Changing the module or material stylesheet changes the family everywhere. Consumers choose a semantic name and size; they do not supply their own icon animations or materials.
