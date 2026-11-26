import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { siteConfig } from '../config/site';

// /about.json: the about page for agents and tools. No photos.
export const GET: APIRoute = async () => {
  const a = (await getCollection('authors'))[0].data;
  return new Response(JSON.stringify({
    $format: 'shupp-page@0.1',
    id: 'about',
    kind: 'person',
    url: `${siteConfig.siteUrl}/about/`,
    json: `${siteConfig.siteUrl}/about.json`,
    name: a.name,
    title: a.title,
    location: a.location,
    email: siteConfig.email,
    summary: a.shortBio,
    bio: a.longBio.split('\n\n').map((p) => p.trim()).filter(Boolean),
    skills: a.skills ?? [],
    softSkills: a.softSkills ?? [],
    interests: a.interests ?? [],
    links: a.socialLinks,
  }, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
