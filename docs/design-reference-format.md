# Present a design system as an argument

VOID is the reference for presentation: state a distinctive premise, show the
mechanism, define its constraints, and derive components from it. Acrylics and
Prismatic adopt that progression without sharing VOID's visual treatment.

## Six chapters

| Chapter | Question it answers | Evidence on the page |
| --- | --- | --- |
| Core concepts | What makes this system inherently different? | A clear thesis, a few invariants, and an identity test that survives a palette change |
| Objects & mathematics | What are its objects, variables, and limits? | A finite vocabulary, parameter domains, equations, and live specimens |
| Style guide | Which choices should repeat? | Color roles, typography, geometry, motion, and limits on ornament |
| Components | How do the rules produce usable controls? | Families, variants, states, labels, and interaction examples |
| Information patterns | How do the parts explain something together? | Summary, comparison, density, reading order, and state treatment |
| Build with it | How does someone implement and verify it? | A minimal recipe, downloads, constraints, and source links |

Use an index to expose this sequence. Preserve useful deep links inside each
chapter. A small specimen should sit beside the rule it demonstrates; optional
material workshops can go deeper without taking over the reference page.

## A section's recurring format

1. State a concrete claim about the system.
2. Show a specimen or comparison that makes the claim inspectable.
3. Name the variables and what is held constant.
4. State the allowed values, units, and boundary conditions.
5. Explain the resulting interface choice.

Equations must describe the implementation. Separate aesthetic metaphors from
physical claims. Distinguish a conceptual object contract from a real component
API. Audit text should describe exactly which pairs and states were checked.

## Current applications

- Acrylics: gesture, pigment history, and readable ground; stroke/blot/ground/layer
  vocabulary; Gaussian width and deposited coverage; color schemes and style
  rules; components; an editorial summary and a comparison of the same schemes.
- Prismatic: derived brand color, permanence, and shared light; finite object axes;
  hue offsets, the night hue map, quantized light and timing; style choices;
  component families; a release summary and a quiet record comparison.

The structure is editorial. Each page retains its own material, typography,
spacing character, and interactive examples. It does not require a shared
runtime, a new configuration API, or a shared site theme.
