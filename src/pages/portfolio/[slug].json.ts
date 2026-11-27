import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { projectJson } from '../../lib/reading/projects';

// /portfolio/<slug>.json: the machine-readable twin of a project page.
export const getStaticPaths: GetStaticPaths = async () => {
  const notes = await getCollection('galaxy');
  return (await getCollection('projects')).map((entry) => ({ params: { slug: entry.id }, props: { entry, notes } }));
};

export const GET: APIRoute = ({ props }) => {
  const { entry, notes } = props as any;
  return new Response(JSON.stringify(projectJson(entry, notes), null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
