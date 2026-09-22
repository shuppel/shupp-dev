# Acrylics design-system reference

`/design/acrylics` follows the purpose of the existing VOID and PRISM pages:
it documents a visual system while demonstrating its rules and components.
The content is about the design system itself.

## Reference structure

1. Color schemes and semantic roles: Market, Cobalt, After hours.
2. Material: stroke, blot, layer, pigment mix versus digital multiply.
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
| `PaintMark.astro` | `color`, `shape="stroke|blot"`, optional class; stable decorative masks, always hidden from assistive technology |
| `SurfaceCard.astro` | `title`, optional `eyebrow`, `layered`; opaque content ground with optional paint behind it |
| `Dialog.astro` | `id`, `title`, optional class; native modal, labelled title, close button, Escape and focus restoration |

Use native HTML for fields, disclosures, and status rows. Their presentation
comes from the same CSS role tokens rather than new per-example colors.

## Tokens and schemes

`public/acrylics/acrylics.tokens.json` is the scheme reference. It includes paired
text colors, focus, success/error, raw pigments, fonts, spacing, radii, and motion.
`site.css` is scoped to `.ac-site` and supplies the Market defaults. Load the
three fonts (Anton, Hind Madurai, IBM Plex Mono), the stylesheet, and both SVG
masks when using the components elsewhere. Preserve the `/acrylics/` asset path
or update the two mask URLs in the stylesheet.

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
node --test scripts/acrylics-site.test.mjs scripts/acrylics-math.test.mjs scripts/acrylics-paint.test.mjs
```

Tests cover semantic color-pair contrast across the three schemes, complete CSS
exports, digital-color endpoints, and the existing geometry/pigment behavior.
Browser checks should exercise scheme propagation, pigment comparison, action
feedback, selection, validation/error recovery, modal open/close, and CSS copy.
