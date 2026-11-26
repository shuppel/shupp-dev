# Reading pages

The pages the game opens from its terminals (The Archive and friends) are
standalone reading pages: one written piece, no site sidebar or nav, dressed
in the game's palette, type and pixel sprites. Each one has a JSON twin for
agents and tools. They need no JavaScript, so they render the same in the
terminal's sandboxed preview, for crawlers, and in a normal tab.

## URLs

Every page keeps its URL, so links and search rankings carry over. The JSON
twin sits at the same path with `.json` in place of the trailing slash.

| What | Page | JSON |
| --- | --- | --- |
| Galaxy note | `/galaxy/<slug>/` | `/galaxy/<slug>.json` |
| Design spec | (rendered spec page) | `/design-spec/<name>.spec.json` (already live) |

The page links its twin with `<link rel="alternate" type="application/json">`,
and the footer links it for people.

## JSON format: `shupp-page@0.1`

```jsonc
{
  "$format": "shupp-page@0.1",
  "id": "galaxy/<slug>",            // collection/slug, stable
  "kind": "article" | "note",       // article when it has a pubDate
  "url": "https://shupp.dev/galaxy/<slug>/",
  "json": "https://shupp.dev/galaxy/<slug>.json",
  "title": "", "description": "",
  "author": { "name": "", "url": "" },
  "dates": { "published": "YYYY-MM-DD" | null, "formed": "", "lastObserved": "" },
  "galaxy": { "stage": "nebula|protostar|star|galaxy", "constellation": "" },
  "image": { "url": "", "alt": "" } | null,
  "reading": { "words": 0, "minutes": 0 },
  "outline": [{ "depth": 2, "text": "", "anchor": "#slug" }],
  "links": {
    "connections": [{ "id": "", "title": "", "url": "", "json": "" | null }],
    "backlinks":   [ /* same shape */ ],
    "projects":    [{ "id": "", "url": "" }]
  },
  "body": { "format": "markdown", "content": "" }
}
```

## Rollout

Only the notes listed in `READING_PILOT` (`src/lib/reading/galaxy.ts`) use
the template and get a JSON twin. Add a slug to move a note over. Those notes
are built by `src/pages/galaxy/[...read].astro`, the rest still by
`[slug].astro`, so the reading page ships only `src/styles/reading.css`.

## Pieces

- `src/layouts/ReadingLayout.astro`: head (SEO, OG, JSON-LD, JSON twin), the
  top bar (where you are on the ship, Return to ship) and the footer.
- `src/components/Reading/GalaxyReading.astro`: a galaxy note on that layout.
- `src/components/Reading/PixelGlyph.astro`: small pixel glyphs (stages,
  clock, arrows, diamond ornament) drawn as crisp SVG.
- `src/styles/reading.css`: tokens and type. Fonts and sprites are the game's
  own files under `/atlas/assets/`.
