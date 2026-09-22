# Acrylics, applied

`/design/acrylics` is an alternate portfolio using existing project and author
collections. `/design/acrylics/materials` preserves the material experiments.
Neither route imports the shared layout or changes the site's active theme.

## Component contracts

| Component | Job | Material behavior |
| --- | --- | --- |
| `Button.astro` | Links and actions | Highlighted gel edge; a pressed control sinks into a denser coat |
| `PaintMark.astro` | Decorative stroke or blot | Rough SVG masks, bristle bands, pooled highlights; never carries text alone |
| `FilterChip.astro` | Category selection | Active stroke plus explicit `aria-pressed` state and a result count |
| `ProjectCard.astro` | Project discovery | Painted cover, readable paper body, a saved blot plus text/checkmark |
| `Dialog.astro` | Details, collection, enquiry review | Native modal focus containment, Escape, explicit close control |

Use `public/acrylics/site.css` only inside `.ac-site`. The standalone document
loads it exclusively; shared site pages do not load this stylesheet.

The primary page contains six curated real projects. The full portfolio remains
one link away. Category and query filters intersect. Project links work without
JavaScript; enhancement-only controls appear after initialization.

A collection's pigment uses the existing vendored Spectral.js implementation,
with equal contributions from the selected projects. Complementary pigments
can become muted. The collection count, project names, and saved labels carry
the meaning without relying on color. Its sole storage key is
`shupp.acrylics.collection.v1`; unknown IDs are discarded, and blocked storage
falls back to memory with a visible explanation. Clearing a collection only
clears that key's contents. No analytics or new network API is introduced.

Enquiries are prepared locally. The visitor must review and choose to copy the
draft or open a `mailto:` URL. This is not a submission endpoint; the page does
not send email or store enquiry text.

## Visual choices

Warm paper, vermilion, dark forest, ochre, and blue give the design a physical
base. Typography: Hind Madurai was observed in Fontjoy's initial
Montserrat/Lora/Hind Madurai combination. Anton is a deliberate independent
adaptation for the tall market-billboard brief; IBM Plex Mono handles captions.
Texture is stable and responsive; no background rendering loop runs on the
portfolio. The larger canvas paint engine only loads on the workshop route.

## Change radius

- New Acrylics page, components, styles, scripts, masks, workshop, and tests.
- The Acrylics project entry appears through the existing collection-driven
  portfolio, related-project lists, and sitemap.
- No changes to the homepage, shared layout/navigation, other design themes,
  package dependencies, APIs, or deployment configuration.

## Verification

`npx astro build` builds the static site. Run the behavior/material tests with:

```sh
node --test scripts/acrylics-site.test.mjs scripts/acrylics-math.test.mjs scripts/acrylics-paint.test.mjs
```

Browser checks should cover filtering, an empty search, save/unsave and reload,
project details and Escape, collection-to-enquiry navigation, draft preparation,
and readable narrow layout. Do not send the sample enquiry.
