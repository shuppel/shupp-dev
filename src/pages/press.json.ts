import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { pressJsonUrl, pressUrl, youtube } from '../lib/reading/press';
import { siteConfig } from '../config/site';

// /press.json: every press entry, newest first, pointing at each page and JSON twin.
const abs = (p: string) => new URL(p, siteConfig.siteUrl).href;

export const GET: APIRoute = async () => {
  const items = (await getCollection('press')).sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
  return new Response(JSON.stringify({
    $format: 'shupp-index@0.1',
    id: 'press',
    url: abs('/press/'),
    json: abs('/press.json'),
    title: 'Press and broadcasts',
    count: items.length,
    items: items.map((n) => ({
      id: n.id,
      kind: n.data.type,
      title: n.data.title,
      description: n.data.description,
      published: n.data.pubDate.toISOString().slice(0, 10),
      outlet: n.data.outlet ?? null,
      source: n.data.externalUrl,
      youtube: youtube(n)?.id ?? null,
      url: abs(pressUrl(n.id)),
      json: abs(pressJsonUrl(n.id)),
    })),
  }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
