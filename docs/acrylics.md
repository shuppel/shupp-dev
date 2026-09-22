# Acrylics design-system reference

`/design/acrylics` follows the purpose of the existing VOID and PRISM pages:
it documents a visual system while demonstrating its rules and components.
The content is about the design system itself.

## Reference structure

1. Color schemes and semantic roles: Market, Cobalt, After hours.
2. Material: stroke, blot, layer, pressure-to-width profiles, pigment mix versus digital multiply.
3. Components: actions, selection, input validation, feedback, disclosures,
   surfaces, and dialogs.
4. Typography, spacing, geometry, and motion.
5. Usage rules and implementation examples.

`/design/acrylics/materials` preserves the earlier paint and geometry workshop.
The primary page does not load the canvas engine.

## Reusable primitives

| Component | Contract |
| --- | --- |
| `Button.astro` | `variant="ink|cream|paint"`, optional `href`, native button attributes; tactile rest/hover/press and visible focus |
| `ChoiceChip.astro` | `value`, `label`, `active`, `controls`, `disabled`; a painted selection mark plus `aria-pressed` |
| `PaintMark.astro` | `color`, `shape="stroke|blot"`, `pressure="swell|drag|loaded"`, optional class; stable decorative masks, always hidden from assistive technology |
| `SurfaceCard.astro` | `title`, optional `eyebrow`, `layered`; opaque content ground with optional paint behind it |
| `Dialog.astro` | `id`, `title`, optional class; native modal, labelled title, close button, Escape and focus restoration |

Use native HTML for fields, disclosures, and status rows. Their presentation
comes from the same CSS role tokens rather than new per-example colors.

## Tokens and schemes

`public/acrylics/acrylics.tokens.json` is the scheme reference. It includes paired
text colors, focus, success/error, raw pigments, fonts, spacing, radii, and motion.
`site.css` is scoped to `.ac-site` and supplies the Market defaults. Load the
three fonts (Anton, Hind Madurai, IBM Plex Mono), the stylesheet, and all four SVG
masks when using the components elsewhere. Preserve the `/acrylics/` asset path
or update the mask URLs in the stylesheet.

`site.mjs` fetches the static token JSON and applies the selected scheme to
custom properties on the page root. The same data drives labels, copyable CSS,
and the pigment examples. There is no account, saved collection, enquiry flow,
localStorage, analytics, or external submission on this page. Scheme choice and
component state reset on reload. Disabled demo controls become available only
after initialization; the default reference and download links remain readable
without JavaScript or when token loading fails.

Raw pigments and action colors have separate roles. The decorative blend uses
Spectral.js; it never replaces semantic ink, focus, or action tokens. Digital
multiply is shown alongside it with an explicitly different label. This is a
material approximation, not a claim about a physical paint brand.

## Pressure changes the silhouette

`pressure.mjs` defines `w(t) = w_min + (w_max - w_min) * exp(-(t-mu)^2 / (2*sigma^2))`.
Here `t` is normalized path distance, `mu` sets the location of maximum width,
and `sigma` controls the spread of the press. This is a chosen gesture model,
not a physical equation for an acrylic brush. Width and deposited coverage
are separate signals.

The default `swell` profile uses widths 8–132, peak 0.44, and spread 0.20 in a
640 × 160 SVG space. `drag` presses early and trails off. Both build filled
outlines with seeded bristle ribbons; changing pressure changes the outline,
not merely opacity or the roughness filter. The live reference compares a
fixed-width mark against the same seed with adjustable width, peak, and spread.

`loaded` retains the broad mask for label backgrounds. Headline and selected
control labels also have a solid semantic-color ground, so tapered or broken
edges cannot compromise their contrast. Decorative strokes on surfaces,
underlines, and the composition use the expressive pressure profiles.

Regenerate committed masks after editing the profiles:

```sh
node scripts/acrylics-strokes.mjs
```

In the optional workshop, preset gestures apply the Gaussian over arc length.
Actual pen events supply their own pressure, interpolated between positions.
Brush radius now responds over a wider range; pressure also affects deposit.
Mouse input uses the selected Hand pressure setting, because it has no pressure
sensor. The Gaussian does not replace measured pen pressure.

## Visual rules

- Use stable seeds, frayed coverage, and bristle tracks; do not rerandomize on render.
- Put body text on opaque surfaces. Test each foreground/background role pair.
- Give selection and errors a label or symbol in addition to color.
- Keep rectangular hit targets at least 44px high even when the paint is irregular.
- Move on deliberate input, then settle; respect reduced-motion preferences.

Hind Madurai was observed in Fontjoy's Montserrat/Lora/Hind Madurai pairing.
Anton was independently selected for the tall billboard brief. This revision
retains that visual direction and corrects the page's content and purpose.

## Change radius and verification

The change remains confined to Acrylics routes, assets, components, project
entry, documentation, and tests. No shared homepage, navigation, themes,
dependencies, deployment configuration, or APIs are changed. Existing content
collection consumers pick up the Acrylics entry.

```sh
npx astro build
node --test scripts/acrylics-site.test.mjs scripts/acrylics-math.test.mjs scripts/acrylics-paint.test.mjs scripts/acrylics-pressure.test.mjs
```

Tests cover semantic color-pair contrast across the three schemes, complete CSS
exports, digital-color endpoints, pressure-shaped SVG and actual paint
cross-sections, pressure interpolation, and existing geometry/pigment behavior.
Browser checks should exercise scheme propagation, pigment comparison, action
feedback, selection, validation/error recovery, modal open/close, and CSS copy.
