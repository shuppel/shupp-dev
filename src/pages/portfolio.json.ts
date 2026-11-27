import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { projectJsonUrl, projectUrl } from '../lib/reading/projects';
import { siteConfig } from '../config/site';

// /portfolio.json: every project, newest first.
const abs = (p: string) => new URL(p, siteConfig.siteUrl).href;

export const GET: APIRoute = async () => {
  const items = (await getCollection('projects')).sort((a, b) => b.data.projectDate.getTime() - a.data.projectDate.getTime());
  return new Response(JSON.stringify({
    $format: 'shupp-index@0.1',
    id: 'portfolio',
    url: abs('/portfolio/'),
    json: abs('/portfolio.json'),
    title: 'Portfolio',
    count: items.length,
    items: items.map((p) => ({
      id: p.id,
      title: p.data.title,
      description: p.data.description,
      date: p.data.projectDate.toISOString().slice(0, 10),
      status: p.data.completed ? 'completed' : 'in-progress',
      technologies: p.data.technologies,
      showcase: p.data.customUrl ? abs(p.data.customUrl) : null,
      url: abs(projectUrl(p.id)),
      json: abs(projectJsonUrl(p.id)),
    })),
  }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
