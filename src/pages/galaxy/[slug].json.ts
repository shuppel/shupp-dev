import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection, render } from 'astro:content';
import { noteJson, usesReadingTemplate } from '../../lib/reading/galaxy';

// /galaxy/<slug>.json: the machine-readable twin of a reading page.
// Only notes on the reading template get one for now (see READING_PILOT).
export const getStaticPaths: GetStaticPaths = async () => {
  const all = await getCollection('galaxy');
  return all
    .filter((entry) => entry.data.visible && usesReadingTemplate(entry.id))
    .map((entry) => ({ params: { slug: entry.id }, props: { entry, all } }));
};

export const GET: APIRoute = async ({ props }) => {
  const { entry, all } = props as { entry: any; all: any[] };
  const { headings } = await render(entry);
  return new Response(JSON.stringify(noteJson(entry, all.filter((n) => n.data.visible), headings), null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
