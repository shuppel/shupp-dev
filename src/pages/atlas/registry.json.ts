// The atlas content registry as JSON, for the Bevy star chart and anything else
// that wants the site's IA without scraping HTML.
import type { APIRoute } from 'astro';
import { getAtlasRegistry } from '../../lib/atlas/registry';

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await getAtlasRegistry()), {
    headers: { 'Content-Type': 'application/json' },
  });
