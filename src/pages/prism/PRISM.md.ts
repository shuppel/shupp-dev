import type { APIRoute } from 'astro';
import { ACCEPTANCE, ANTI_PATTERNS, DENSITY_MATERIAL, EVENTS, MATERIALS, RIG, RULES } from '../../data/prism';

// /prism/PRISM.md — the system as rules an agent can apply without judgment.
const row = (cells: (string | number | boolean)[]): string => `| ${cells.map(String).join(' | ')} |`;

const md = `# PRISM — rules for agents

PRISM is a light-mode-first design system built on light. One anchor hue
derives the palette. Density chooses a material, and a material says how an
object treats light. Light events say what actions do to light. The light
rests, and moves only for a story beat or an action.

- Reference: https://shupp.dev/design/prismatic
- Variants lab: https://shupp.dev/design/prismatic/lab
- Tokens: /prism/prism.tokens.json · Material CSS: /prism/prism.css
- Light engine (optional, WebGL2): /prism/light.js, with tables in /prism/rules.js

## Setup

\`\`\`html
<html data-mode="day" style="--h:185; --hr:129">
<link rel="stylesheet" href="/prism/prism.css">
<script type="module" src="/prism/light.js"></script>
\`\`\`

Set \`--hr\` = R(\`--h\`): h if h ≤ 45; round(h − 0.4(h − 45)) if h ≤ 300; else
round((h + 0.4(385 − h)) mod 360).

## Rules

${RULES.map(([name, text], i) => `${i + 1}. **${name}.** ${text}`).join('\n')}

## Materials

Declare with \`data-material\`. With none declared, density decides:
${Object.entries(DENSITY_MATERIAL).map(([d, m]) => `${d} → ${m}`).join(', ')}.
Tint with \`data-tint\` (anchor, near, far, counter, danger, success).

${row(['material', 'T', 'does', 'use for'])}
${row(['---', '---', '---', '---'])}
${Object.entries(MATERIALS).map(([k, m]) => row([`\`${k}\``, m.T, m.does, m.use])).join('\n')}

## Light events

Declare with \`data-light-event="emit absorb pulse void reject lift carry afterglow"\`,
or call \`light.event(el, type)\` from /prism/light.js. 1q = 40ms.

${row(['event', 'on', 'does', 'q', 'kind'])}
${row(['---', '---', '---', '---', '---'])}
${Object.entries(EVENTS).map(([k, e]) => row([`\`${k}\``, e.on, e.does, e.q, e.loops === true ? 'held, loops while held' : e.held === true ? 'held' : e.q > 0 ? 'timed' : 'passive'])).join('\n')}

## Light rig

The rig is a parameter component: \`light.setRig({ … })\`.

${row(['param', 'values', 'default', 'does'])}
${row(['---', '---', '---', '---'])}
${Object.entries(RIG).map(([k, p]) => row([`\`${k}\``, p.values, p.default, p.does])).join('\n')}

## Anti-patterns

${ANTI_PATTERNS.map(([dont, why]) => `- **Don’t ${dont[0].toLowerCase()}${dont.slice(1)}.** ${why}`).join('\n')}

## Acceptance

${ACCEPTANCE.map((a) => `- [ ] ${a}`).join('\n')}
`;

export const GET: APIRoute = () => new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
