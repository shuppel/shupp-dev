// Portfolio projects as reading pages, and their JSON twins.
// /portfolio/<slug>/ and /portfolio/<slug>.json. A project with a customUrl
// (a design system with its own page) still gets a page here, but the index
// sends people straight to the design system, which owns its experience.

import type { CollectionEntry } from 'astro:content';
import { siteConfig } from '../../config/site';

type Project = CollectionEntry<'projects'>;
type Note = CollectionEntry<'galaxy'>;

export const projectUrl = (id: string) => `/portfolio/${id}/`;
export const projectJsonUrl = (id: string) => `/portfolio/${id}.json`;
export const projectHref = (p: Project) => p.data.customUrl ?? projectUrl(p.id);
const abs = (p: string) => new URL(p, siteConfig.siteUrl).href;

/** Galaxy notes about a project: listed on the project, or listing it. */
export const notesFor = (p: Project, notes: Note[]) =>
  notes.filter((n) => n.data.visible && ((p.data.relatedBlogPosts ?? []).includes(n.id) || (n.data.relatedProjects ?? []).includes(p.id)));

export function projectJson(p: Project, notes: Note[]) {
  const d = p.data;
  return {
    $format: 'shupp-page@0.1',
    id: `portfolio/${p.id}`,
    kind: 'project',
    url: abs(projectUrl(p.id)),
    json: abs(projectJsonUrl(p.id)),
    title: d.title,
    description: d.description,
    author: { name: siteConfig.author.name, url: abs('/about/') },
    dates: { project: d.projectDate.toISOString().slice(0, 10) },
    status: d.completed ? 'completed' : 'in-progress',
    technologies: d.technologies,
    links: {
      live: d.projectUrl ?? null,
      source: d.githubUrl ?? null,
      showcase: d.customUrl ? abs(d.customUrl) : null,
      notes: notesFor(p, notes).map((n) => ({ id: n.id, title: n.data.title, url: abs(`/galaxy/${n.id}/`), json: abs(`/galaxy/${n.id}.json`) })),
    },
    image: d.image ? abs(d.image) : null,
    body: { format: 'markdown', content: (p.body ?? '').trim() },
  };
}
