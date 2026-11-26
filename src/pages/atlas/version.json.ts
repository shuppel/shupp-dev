// The current game build, so an open tab can tell it's out of date and reload
// instead of running an old game against new art.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export function GET() {
  const v = createHash('sha1').update(readFileSync('public/atlas/pkg/scattered_atlas_bg.wasm')).digest('hex').slice(0, 10);
  return new Response(JSON.stringify({ v }), { headers: { 'Content-Type': 'application/json' } });
}
