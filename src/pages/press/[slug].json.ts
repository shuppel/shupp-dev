import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { pressJson } from '../../lib/reading/press';

// /press/<slug>.json: the machine-readable twin of a press page.
export const getStaticPaths: GetStaticPaths = async () =>
  (await getCollection('press')).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify(pressJson((props as any).entry), null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
