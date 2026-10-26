---
title: "Design Spec"
description: "A design system written as one machine-readable file: a reusable template plus this site's tokens, components, layout patterns, voice and agent checks. Developers pull tokens from it, designers wireframe from it, and agents build with it."
projectDate: 2026-10-26
completed: false
technologies: ["Design Systems", "Design Tokens", "JSON", "AI Agents", "Astro", "Accessibility"]
featured: false
customUrl: "/design/spec"
---

## Design Spec

The design systems on this site each explain themselves with a page. Design
Spec asks the next question: what does an agent need to stand up a new site,
or restyle an old one, without asking what a color is for?

The answer is one JSON file in ten layers, filled top to bottom: `meta`,
`identity`, `tokens`, `components`, `patterns`, `voice`, `rules`, `contrast`,
`knownIssues` and `acceptance`. Brand colors are raw; components only ever use
role colors, which carry one value per mode. That split is what already lets
this site's PRISM and VOID skins restyle everything by remapping roles alone.

Patterns are stored as CSS grid areas, so the same entry draws a wireframe for
a designer and pastes into a stylesheet for a developer. Every rule names a
check that a person or script can run, and an agent runs them all before it
hands work back.

The first filled spec is this site's own default skin. Extracting it turned up
real drift, which the spec records under `knownIssues` instead of quietly
fixing: a dark-mode primary button at 1.76:1 contrast, a sage teal that
measures 3.24:1 on white, and a button class declared twice.

See it rendered at [`/design/spec`](/design/spec), or fetch the files:
[`template.spec.json`](/design-spec/template.spec.json) and
[`shupp.spec.json`](/design-spec/shupp.spec.json).
