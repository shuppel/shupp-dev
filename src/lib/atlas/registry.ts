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
  questLog: { title: string; place: string; years: string; current: boolean; summary: string; feats: string[] }[];
  /** Six radar axes, 1–10. Derived from site content; see `radar` below to tune. */
  radar: { label: string; value: number; note: string }[];
  inventory: {
    keyItems: { name: string; from: string; note: string; kind: 'credential' | 'degree' }[];
    gear: { name: string; uses: number }[];
  };
  training: { title: string; place: string; years: string }[];
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
  const education = (await getCollection('education', ({ data }) => data.visible))
    .sort((a, b) => a.data.order - b.data.order);

  const firstStart = experience.reduce<Date | null>(
    (min, e) => (!min || e.data.startDate < min ? e.data.startDate : min), null,
  );
  const years = firstStart ? Math.max(1, new Date().getUTCFullYear() - firstStart.getUTCFullYear()) : 1;

  // Four destinations, matching the atlas art (work, about, writing, contact).
  // Between them they cover the whole site IA.
  const destinations: Destination[] = [
    {
      id: 'work',
      name: 'The Dockyard',
      label: 'Work',
      preview: `${projects.length} hulls in dock, plus ${apps.length} Thoughtful App Co. concepts on the bench.`,
      href: '/portfolio',
      intro: ['Every hull in this dock is something Erikk built: design systems, apps, and the experiments between them.'],
      items: [
        ...projects.map((p) => ({
          title: p.data.title,
          description: p.data.description,
          href: p.data.customUrl ?? `/portfolio/${p.id}`,
          meta: p.data.technologies.slice(0, 3).join(' · '),
        })),
        ...apps.map((a) => ({
          title: a.data.title,
          description: a.data.oneLiner,
          href: `/thoughtful-app-co/${a.id}`,
          meta: `Thoughtful App Co. · ${a.data.status}`,
        })),
        { title: 'Open the full portfolio', href: '/portfolio', meta: 'shupp.dev/portfolio' },
      ],
      chart: { x: 140 / 640, y: 137 / 360 },
    },
    {
      id: 'about',
      name: 'The Mirror Moon',
      label: 'About',
      preview: author.shortBio,
      href: '/about',
      intro: author.longBio.split(/\n\s*\n/).map((p) => p.replace(/\*/g, '').trim()).filter(Boolean),
      items: [
        { title: 'Read the full About page', href: '/about' },
        { title: 'Resume', href: '/resume', description: 'Experience, education and credentials.' },
      ],
      chart: { x: 326 / 640, y: 85 / 360 },
    },
    {
      id: 'writing',
      name: 'The Archive',
      label: 'Writing',
      preview: `${notes.length} notes in the Galaxy garden and ${press.length} broadcasts on the relay.`,
      href: '/galaxy',
      intro: ['The archive keeps every note Erikk has grown, from raw nebulae to fully formed stars, and every broadcast sent from the relay.'],
      items: [
        ...notes.map((n) => ({
          title: n.data.title,
          description: n.data.description,
          href: `/galaxy/${n.id}`,
          meta: `Galaxy · ${n.data.stage} · ${fmtMonth(n.data.lastObserved)}`,
        })),
        ...press.map((p) => ({
          title: p.data.title,
          description: p.data.description,
          href: `/press/${p.id}`,
          meta: ['Press', p.data.outlet, fmtMonth(p.data.pubDate)].filter(Boolean).join(' · '),
        })),
      ],
      chart: { x: 473 / 640, y: 180 / 360 },
    },
    {
      id: 'contact',
      name: 'The Comms Beacon',
      label: 'Contact',
      preview: `Hail ${siteConfig.author.name.split(' ')[0]} by email or on the usual channels.`,
      href: `mailto:${siteConfig.email}`,
      intro: ['Fastest way to reach me is email. I also answer on these channels.'],
      items: [
        { title: 'Email', description: siteConfig.email, href: `mailto:${siteConfig.email}` },
        { title: 'GitHub', href: siteConfig.social.github, external: true },
        { title: 'LinkedIn', href: siteConfig.social.linkedin, external: true },
        { title: 'Bluesky', href: siteConfig.social.bluesky, external: true },
      ],
      chart: { x: 270 / 640, y: 256 / 360 },
    },
  ];

  // Gear: the tools that show up most across projects and roles.
  const toolCount = new Map<string, number>();
  for (const t of [...projects.flatMap((p) => p.data.technologies), ...experience.flatMap((e) => e.data.technologies ?? [])]) {
    toolCount.set(t, (toolCount.get(t) ?? 0) + 1);
  }
  const gear = [...toolCount.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 16)
    .map(([name, uses]) => ({ name, uses }));

  // Radar: six axes on a 1–10 scale, each derived from something countable on
  // the site so it stays honest as content grows. Tune the divisors here.
  const clamp = (n: number) => Math.max(1, Math.min(10, Math.round(n)));
  const designProjects = projects.filter((p) =>
    /design|ui|css|font|type|skin/i.test(`${p.data.title} ${p.data.technologies.join(' ')}`)).length;
  const radar = [
    { label: 'Product', value: clamp(years), note: `${years} years in the quest log` },
    { label: 'Build', value: clamp(projects.length / 1.5), note: `${projects.length} projects shipped` },
    { label: 'Design', value: clamp(designProjects / 1.5), note: `${designProjects} design projects` },
    { label: 'Writing', value: clamp(notes.length / 2), note: `${notes.length} Galaxy notes` },
    { label: 'Signal', value: clamp(press.length / 3), note: `${press.length} broadcasts` },
    { label: 'Study', value: clamp((education.length + credentials.length) / 2), note: `${education.length + credentials.length} degrees, courses and credentials` },
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
          summary: e.data.description,
          feats: e.data.achievements,
        })),
        radar,
        inventory: {
          keyItems: [
            ...credentials.map((c) => ({ name: c.data.title, from: c.data.organization, note: c.data.description, kind: 'credential' as const })),
            ...education.map((e) => ({ name: e.data.degree, from: e.data.institution, note: e.data.field, kind: 'degree' as const })),
          ],
          gear,
        },
        training: education.map((e) => ({
          title: `${e.data.degree}, ${e.data.field}`,
          place: e.data.institution,
          years: `${e.data.startDate.getUTCFullYear()}–${e.data.current || !e.data.endDate ? 'now' : e.data.endDate.getUTCFullYear()}`,
        })),
      },
    },
  };
}
