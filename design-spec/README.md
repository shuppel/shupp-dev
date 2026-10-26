# Design spec

A design system written as one JSON file that people and agents can both read.
Developers pull tokens and components from it, designers wireframe from its
patterns, and an agent can stand up or restyle a site from it without asking
what a color is for.

- `template.spec.json` is the blank template. Copy it for a new site.
- `shupp.spec.json` is shupp.dev's default skin, extracted from this repo.

## The layers

Fill them top to bottom. Each layer may reference the ones above it with
`{path.to.token}`, never the ones below.

| Layer | Answers | Who reads it first |
| --- | --- | --- |
| `meta` | What is this, where did it come from, which modes exist? | Everyone |
| `identity` | Why does it look this way? What must never change? | Agents, before any judgment call |
| `tokens` | Which values exist? Brand values, then role values per mode, type, space, radius, shadow, motion, layout, icons. | Developers |
| `components` | What are the reusable parts, their anatomy, states, a11y and do/don't? | Developers, designers |
| `patterns` | How do parts compose into pages, as named grid areas? | Designers wireframing |
| `voice` | How does it talk? | Writers, agents writing copy |
| `rules` | Which constraints are checkable, and how? | Agents, CI |
| `contrast` | Which text/background pairs are used, and do they pass? | Everyone |
| `knownIssues` | Where the shipped code disagrees with the spec. | Whoever fixes drift |
| `acceptance` | What an agent checks before it hands work back. | Agents |

## Conventions

1. **Brand values are raw, role values are used.** Components reference
   `color.role.*`, never `color.brand.*`, except inside gradients. That is
   what lets a skin restyle a site by remapping one layer.
2. **Every value says what it is for.** A token without `use` is a token an
   agent will misuse.
3. **Modes are columns.** A role token carries one value per name in
   `meta.modes`. A single-mode system lists one mode.
4. **Patterns are grid areas.** `grid.areas` is a list of
   `grid-template-areas` rows. A wireframe tool draws the boxes, a developer
   pastes the rows into CSS, and both get the same layout.
5. **Components carry a `wireframe` shape** so a low-fi render needs no
   styling knowledge.
6. **Extraction records drift.** When a spec is pulled from an existing site,
   the spec states the intended value and `knownIssues` lists where the code
   differs. Nothing is silently fixed.
7. **Rules are checkable.** Each rule has a `check` a person or script can run.
   `must` blocks a release; `should` is reviewed.

## Using it

**Stand up a new site.** Copy `template.spec.json` to `<slug>.spec.json`.
Fill `identity` first, then brand colors, then roles. Generate CSS custom
properties from `tokens.color.role` (one block per mode), load the fonts named
in `tokens.font.family`, then build components from `components.*.base`.

**Hand it to an agent.** Give the agent the spec and this instruction:

> Build with design-spec `<slug>.spec.json`. Use only role tokens. Follow
> `identity.invariants`. Before returning, run every `rules` check and every
> `acceptance` item, and report any you could not satisfy.

**Wireframe.** Draw each `patterns.*.grid.areas` as labeled boxes; fill each
region with its component's `wireframe.shape`. The rendered reference page
shows this next to the styled version.

**Edit the style guide.** Change a brand or role value in one place. Anything
that references it with `{…}` follows.

## Relation to the other systems here

PRISM already ships the same idea in a system-specific shape
(`public/prism/prism.tokens.json` and `/prism/PRISM.md`). This format is the
general version: any system on the site (PRISM, VOID, Acrylics, Ephemeral) can
be written as a design spec, and the site's skins are already remaps of the
`role` layer.
