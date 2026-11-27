import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { appJson } from '../../lib/reading/apps';

export const getStaticPaths: GetStaticPaths = async () =>
  (await getCollection('thoughtful-apps')).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));

export const GET: APIRoute = ({ props }) =>
  new Response(JSON.stringify(appJson(props.entry), null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
