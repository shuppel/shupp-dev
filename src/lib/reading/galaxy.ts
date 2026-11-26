// Reading pages: the standalone, game-styled version of a content page, and
// the machine-readable JSON twin that sits next to it.
//
// URL scheme: every page keeps its URL, and gets a JSON twin at the same path
// with `.json` instead of the trailing slash.
//   /galaxy/<slug>/      the page people (and search engines) read
//   /galaxy/<slug>.json  the same page for agents and tools (shupp-page@0.1)
//
// Rollout starts small: only the notes in READING_PILOT use the new template.
// Add a slug to move a note over; when every note is listed, drop the list.

import type { CollectionEntry } from 'astro:content';
import type { MarkdownHeading } from 'astro';
import { siteConfig } from '../../config/site';

export const READING_PILOT = new Set<string>(['ephemeral-ui-adaptive-workday']);

export const usesReadingTemplate = (id: string) => READING_PILOT.has(id);

type Note = CollectionEntry<'galaxy'>;

export const STAGE_LABEL: Record<Note['data']['stage'], string> = {
  nebula: 'Nebula',
  protostar: 'Protostar',
  star: 'Star',
  galaxy: 'Galaxy',
};

export const pageUrl = (id: string) => `/galaxy/${id}/`;
export const jsonUrl = (id: string) => `/galaxy/${id}.json`;
const abs = (path: string) => new URL(path, siteConfig.siteUrl).href;

export const wordCount = (body = '') => body.split(/\s+/).filter(Boolean).length;
export const readMinutes = (body = '') => Math.max(1, Math.ceil(wordCount(body) / 200));

export const titleCase = (s: string) =>
  s.split(/[-\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/** The JSON twin of a galaxy note. Format documented in docs/reading-pages.md. */
export function noteJson(entry: Note, all: Note[], headings: MarkdownHeading[]) {
  const d = entry.data;
  const ref = (n: Note) => ({
    id: n.id,
    title: n.data.title,
    url: abs(pageUrl(n.id)),
    json: usesReadingTemplate(n.id) ? abs(jsonUrl(n.id)) : null,
  });
  const connections = d.connections
    .map((id) => all.find((n) => n.id === id))
    .filter((n): n is Note => Boolean(n))
    .map(ref);
  const backlinks = all
    .filter((n) => n.id !== entry.id && n.data.connections.includes(entry.id))
    .map(ref);

  return {
    $format: 'shupp-page@0.1',
    id: `galaxy/${entry.id}`,
    kind: d.pubDate ? 'article' : 'note',
    url: abs(pageUrl(entry.id)),
    json: abs(jsonUrl(entry.id)),
    title: d.title,
    description: d.description,
    author: { name: d.author || siteConfig.author.name, url: abs('/about/') },
    dates: {
      published: d.pubDate?.toISOString().slice(0, 10) ?? null,
      formed: d.formed.toISOString().slice(0, 10),
      lastObserved: d.lastObserved.toISOString().slice(0, 10),
    },
    galaxy: { stage: d.stage, constellation: d.constellation },
    image: d.ogImage ? { url: abs(d.ogImage), alt: d.ogImageAlt ?? null } : null,
    reading: { words: wordCount(entry.body), minutes: readMinutes(entry.body) },
    outline: headings.filter((h) => h.depth <= 3).map((h) => ({ depth: h.depth, text: h.text, anchor: `#${h.slug}` })),
    links: {
      connections,
      backlinks,
      projects: (d.relatedProjects ?? []).map((id) => ({ id, url: abs(`/portfolio/${id}/`) })),
    },
    body: { format: 'markdown', content: (entry.body ?? '').trim() },
  };
}
