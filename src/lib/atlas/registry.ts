// The Scattered Atlas content registry.
//
// One list of destinations, built from the same content collections the
// regular site renders. The HTML atlas, the content panels, the character
// sheet and (later) the Bevy star chart all read from this, so no copy is
// written twice. See atlas/README.md for how the pieces fit together.

import { getCollection, getEntry } from 'astro:content';
import { siteConfig } from '../../config/site';
import { isFeatureEnabled } from '../../config/features';

export interface AtlasItem {
  title: string;
  description?: string;
  href: string;
  meta?: string;
  external?: boolean;
}

export interface Destination {
  /** Stable id: used in URLs (#about), the visited set and Bevy messages. */
  id: string;
  /** The in-world name. */
  name: string;
  /** The ordinary site label, always shown next to the in-world name. */
  label: string;
  /** One line for the destination card. */
  preview: string;
  /** The real page this destination stands for. */
  href: string;
  /** Longer copy for the top of the content panel (paragraphs). */
  intro: string[];
  items: AtlasItem[];
  /** Position on the star chart, 0–1 in both axes. */
  chart: { x: number; y: number };
}

export interface PlayerStats {
  name: string;
  title: string;
  location: string;
  level: number;
  levelNote: string;
  attributes: { label: string; value: number; note: string }[];
  skills: string[];
  softSkills: string[];
  questLog: { title: string; place: string; years: string; current: boolean }[];
}

export interface AtlasRegistry {
  ship: { name: string; tagline: string };
  destinations: Destination[];
  player: { stats: PlayerStats };
}

const fmtMonth = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const byNewest = <T>(get: (x: T) => Date | undefined) => (a: T, b: T) =>
  (get(b)?.getTime() ?? 0) - (get(a)?.getTime() ?? 0);

export async function getAtlasRegistry(): Promise<AtlasRegistry> {
  const author = (await getEntry('authors', 'erikk-shupp'))!.data;

  const projects = (await getCollection('projects', ({ id }) =>
    id !== 'saas-game-ui' || isFeatureEnabled('enableSaasGameUI'),
  )).sort(byNewest((p) => p.data.projectDate));

  const notes = (await getCollection('galaxy', ({ data }) => data.visible))
    .sort(byNewest((n) => n.data.lastObserved));

  const press = (await getCollection('press')).sort(byNewest((p) => p.data.pubDate));

  const apps = await getCollection('thoughtful-apps');

  const experience = (await getCollection('experience', ({ data }) => data.visible))
    .sort((a, b) => a.data.order - b.data.order);

  const credentials = await getCollection('credentials', ({ data }) => data.visible);

  const firstStart = experience.reduce<Date | null>(
    (min, e) => (!min || e.data.startDate < min ? e.data.startDate : min), null,
  );
  const years = firstStart ? Math.max(1, new Date().getUTCFullYear() - firstStart.getUTCFullYear()) : 1;

  const destinations: Destination[] = [
    {
      id: 'about',
      name: 'The Mirror Moon',
      label: 'About',
      preview: author.shortBio,
      href: '/about',
      intro: author.longBio.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
      items: [
        { title: 'Read the full About page', href: '/about' },
        { title: 'Resume', href: '/resume', description: 'Experience, education and credentials.' },
      ],
      chart: { x: 0.22, y: 0.3 },
    },
    {
      id: 'portfolio',
      name: 'The Dockyard',
      label: 'Work',
      preview: `${projects.length} hulls in dock: design systems, apps, and the experiments between them.`,
      href: '/portfolio',
      intro: ['Selected work and projects. Each one opens its full write-up on the site.'],
      items: projects.map((p) => ({
        title: p.data.title,
        description: p.data.description,
        href: p.data.customUrl ?? `/portfolio/${p.id}`,
        meta: p.data.technologies.slice(0, 3).join(' · '),
      })),
      chart: { x: 0.68, y: 0.22 },
    },
    {
      id: 'galaxy',
      name: 'The Galaxy Garden',
      label: 'Writing',
      preview: `${notes.length} notes, from raw nebulae to fully formed stars.`,
      href: '/galaxy',
      intro: ['A digital garden. Notes grow from nebula to protostar to star as they mature.'],
      items: notes.slice(0, 12).map((n) => ({
        title: n.data.title,
        description: n.data.description,
        href: `/galaxy/${n.id}`,
        meta: `${n.data.stage} · ${fmtMonth(n.data.lastObserved)}`,
      })),
      chart: { x: 0.84, y: 0.62 },
    },
    {
      id: 'press',
      name: 'The Broadcast Relay',
      label: 'Press',
      preview: 'Podcast episodes, videos, articles and appearances.',
      href: '/press',
      intro: [`Transmissions from ${siteConfig.ventures.humansOnlyPodcast.name} and elsewhere.`],
      items: press.slice(0, 12).map((p) => ({
        title: p.data.title,
        description: p.data.description,
        href: `/press/${p.id}`,
        meta: [p.data.outlet, fmtMonth(p.data.pubDate)].filter(Boolean).join(' · '),
      })),
      chart: { x: 0.5, y: 0.78 },
    },
    {
      id: 'foundry',
      name: 'The Foundry',
      label: siteConfig.ventures.thoughtfulAppCo.name,
      preview: siteConfig.ventures.thoughtfulAppCo.tagline + '. App concepts that start from a real problem.',
      href: '/thoughtful-app-co',
      intro: ['Every concept starts with a real problem and ends with a solution that respects people’s time and attention.'],
      items: apps.map((a) => ({
        title: a.data.title,
        description: a.data.oneLiner,
        href: `/thoughtful-app-co/${a.id}`,
        meta: a.data.status,
      })),
      chart: { x: 0.3, y: 0.7 },
    },
    {
      id: 'contact',
      name: 'The Comms Beacon',
      label: 'Contact',
      preview: `Hail ${siteConfig.author.name.split(' ')[0]} by email or on the usual channels.`,
      href: `mailto:${siteConfig.email}`,
      intro: ['The fastest way to reach me is email. I also answer on these channels.'],
      items: [
        { title: 'Email', description: siteConfig.email, href: `mailto:${siteConfig.email}` },
        { title: 'GitHub', href: siteConfig.social.github, external: true },
        { title: 'LinkedIn', href: siteConfig.social.linkedin, external: true },
        { title: 'Bluesky', href: siteConfig.social.bluesky, external: true },
      ],
      chart: { x: 0.12, y: 0.55 },
    },
  ];

  return {
    ship: { name: 'The Scattered Atlas', tagline: siteConfig.tagline },
    destinations,
    player: {
      stats: {
        name: author.name,
        title: siteConfig.author.title,
        location: author.location,
        level: years,
        levelNote: `Years since the first entry in the quest log (${firstStart?.getUTCFullYear() ?? '—'}).`,
        attributes: [
          { label: 'Ships built', value: projects.length, note: 'Projects in the portfolio' },
          { label: 'Notes grown', value: notes.length, note: 'Notes in the Galaxy garden' },
          { label: 'Broadcasts', value: press.length, note: 'Press, podcast and video' },
          { label: 'Seals earned', value: credentials.length, note: 'Credentials' },
        ],
        skills: author.skills ?? [],
        softSkills: author.softSkills ?? [],
        questLog: experience.map((e) => ({
          title: e.data.position,
          place: e.data.company,
          years: `${e.data.startDate.getUTCFullYear()}–${e.data.current || !e.data.endDate ? 'now' : e.data.endDate.getUTCFullYear()}`,
          current: e.data.current,
        })),
      },
    },
  };
}
