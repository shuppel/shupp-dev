import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { appJsonUrl, appScore, appUrl } from '../lib/reading/apps';
import { siteConfig } from '../config/site';

// /thoughtful-app-co.json: every concept, most promising first.
const abs = (p: string) => new URL(p, siteConfig.siteUrl).href;

export const GET: APIRoute = async () => {
  const items = (await getCollection('thoughtful-apps')).sort((a, b) => appScore(b) - appScore(a));
  return new Response(JSON.stringify({
    $format: 'shupp-index@0.1',
    id: 'thoughtful-app-co',
    url: abs('/thoughtful-app-co/'),
    json: abs('/thoughtful-app-co.json'),
    title: 'Thoughtful App Co.',
    count: items.length,
    items: items.map((a) => ({
      id: a.id,
      title: a.data.title,
      description: a.data.oneLiner,
      status: a.data.status,
      category: a.data.category,
      lastUpdated: a.data.lastUpdated.toISOString().slice(0, 10),
      url: abs(appUrl(a.id)),
      json: abs(appJsonUrl(a.id)),
    })),
  }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
