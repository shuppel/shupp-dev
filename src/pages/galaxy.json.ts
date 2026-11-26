import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { jsonUrl, pageUrl, readMinutes } from '../lib/reading/galaxy';
import { siteConfig } from '../config/site';

// /galaxy.json: every visible galaxy note, newest first, pointing at each
// note's page and JSON twin.
const abs = (p: string) => new URL(p, siteConfig.siteUrl).href;

export const GET: APIRoute = async () => {
  const notes = (await getCollection('galaxy'))
    .filter((n) => n.data.visible)
    .sort((a, b) => (b.data.pubDate ?? b.data.formed).getTime() - (a.data.pubDate ?? a.data.formed).getTime());
  const body = {
    $format: 'shupp-index@0.1',
    id: 'galaxy',
    url: abs('/galaxy/'),
    json: abs('/galaxy.json'),
    title: 'Scribe Galaxy',
    count: notes.length,
    items: notes.map((n) => ({
      id: n.id,
      title: n.data.title,
      description: n.data.description,
      published: (n.data.pubDate ?? n.data.formed).toISOString().slice(0, 10),
      lastObserved: n.data.lastObserved.toISOString().slice(0, 10),
      stage: n.data.stage,
      constellation: n.data.constellation,
      minutes: readMinutes(n.body),
      url: abs(pageUrl(n.id)),
      json: abs(jsonUrl(n.id)),
    })),
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
