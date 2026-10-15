import type { APIRoute } from 'astro';
import { DENSITY_MATERIAL, EVENTS, MATERIALS, RIG_DEFAULTS } from '../../data/prism';

// /prism/rules.js — the light decision tables as an ES module for /prism/light.js.
export const GET: APIRoute = () =>
  new Response(
    [
      '// Generated from src/data/prism.ts. The PRISM light decision tables.',
      `export const MATERIALS = ${JSON.stringify(MATERIALS, null, 2)};`,
      `export const DENSITY_MATERIAL = ${JSON.stringify(DENSITY_MATERIAL, null, 2)};`,
      `export const EVENTS = ${JSON.stringify(EVENTS, null, 2)};`,
      `export const RIG_DEFAULTS = ${JSON.stringify(RIG_DEFAULTS, null, 2)};`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } },
  );
