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
  questLog: { title: string; place: string; years: string; current: boolean; summary: string; feats: string[]; tech: string[] }[];
  /** Six radar axes, 1–10. Derived from site content; see `radar` below to tune. */
  radar: { label: string; value: number; note: string }[];
  inventory: {
    keyItems: KeyItem[];
    gear: { name: string; uses: number }[];
  };
  /** The Skills tab: a deck of cards in four suits. */
  cards: SkillCard[];
  training: { title: string; place: string; years: string }[];
}

export type ItemType = 'scroll' | 'certificate' | 'tablet' | 'codex' | 'relic';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface KeyItem {
  id: string;
  name: string;
  from: string;
  note: string;
  kind: 'credential' | 'degree';
  /** What the object is in the game: degrees are scrolls, credentials are tablets, and so on. */
  type: ItemType;
  rarity: Rarity;
  year?: number;
  /** The competency it feeds, e.g. "+1 PRO". */
  bonus: string;
}

export interface SkillCard {
  id: string;
  name: string;
  suit: 'skill' | 'discipline' | 'special' | 'equipment';
  /** 1–5 pips. */
  mastery: number;
  /** The competency it feeds: DEV, PRO, DES, GTM, WRI or COM. */
  feeds: string;
  flavor: string;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Which competency an item or skill feeds, from words in its name. */
function feedsFrom(text: string): string {
  if (/product|scrum|agile|management|business|acquisition|bizdev/i.test(text)) return 'PRO';
  if (/ux|ui|design|illustrator|accessib|token|anime|film|adaptive|user experience/i.test(text)) return 'DES';
  if (/market|brand|seo|growth|go-to/i.test(text)) return 'GTM';
  if (/writ|content|story/i.test(text)) return 'WRI';
  if (/comm|speak|podcast/i.test(text)) return 'COM';
  return 'DEV';
}

function itemType(name: string, kind: 'credential' | 'degree'): ItemType {
  if (/continuous|additional/i.test(name)) return 'codex';
  if (/master|bachelor|doctor|associate/i.test(name)) return 'scroll';
  return kind === 'credential' ? 'tablet' : 'certificate';
}

function itemRarity(name: string, from: string): Rarity {
  if (/master|doctor/i.test(name)) return 'legendary';
  if (/bachelor|product management|nielsen/i.test(`${name} ${from}`)) return 'epic';
  if (/tryhackme|uipath|additional/i.test(`${name} ${from}`)) return 'common';
  return 'rare';
}

// Hand-tuned mastery and flavour for the deck. Anything not listed gets 3 pips
// and a generic line, so new skills on the site still show up.
const CARD_TUNING: Record<string, { mastery?: number; flavor?: string; feeds?: string }> = {
  'full-stack-development': { mastery: 4, flavor: 'From the database to the pixel, one pair of hands.' },
  'typescript-react': { mastery: 4, flavor: 'Types first, then the interface follows.' },
  'machine-optimized-prompt-engineering': { mastery: 5, flavor: 'Speaks fluent machine.' },
  'o-n-scoping': { mastery: 5, flavor: 'Cuts any project down to a straight line.' },
  'cloud-architecture': { mastery: 3, flavor: 'Moors the fleet to the sky.' },
  'api-development': { mastery: 4, flavor: 'Every system gets a front door.' },
  'automation-scripting': { mastery: 4, flavor: 'If it happens twice, a machine does it the third time.' },
  'seo-optimization': { mastery: 3, flavor: 'A lighthouse for the crawlers.' },
  'product-management': { mastery: 5, flavor: 'Knows what to build, and what not to.' },
  'marketing-branding': { mastery: 3, flavor: 'A banner people want to follow.' },
  'user-experience': { mastery: 4, flavor: 'Walks the path before the user does.' },
  'ui-design': { mastery: 4, flavor: 'Pixels in their right places.' },
  'ux-management': { mastery: 4, flavor: 'Keeps a design crew pointed the same way.' },
  'it-architecture': { mastery: 4, flavor: 'Blueprints for federal-scale systems.' },
  'scrum-master': { mastery: 4, flavor: 'Two weeks at a time, every time.' },
  'business-development': { mastery: 3, flavor: 'Finds the next port before the ship needs it.' },
};

// Signature moves. These are rarer than skills and always hand-written.
const SPECIALS: Omit<SkillCard, 'suit'>[] = [
  { id: 'machine-optimized-prompting', name: 'Machine-Optimized Prompting', mastery: 5, feeds: 'DEV', flavor: 'Turns a vague ask into an exact instruction a model can run with.' },
  { id: 'o-n-scoping-special', name: 'O(n) Scoping', mastery: 5, feeds: 'PRO', flavor: 'Any roadmap, cut to the shortest path that still ships.' },
  { id: 'zero-to-one-launch', name: 'Zero-to-One Launch', mastery: 4, feeds: 'GTM', flavor: 'From a napkin to a live product with real users.' },
  { id: 'fractional-rescue', name: 'Fractional Rescue', mastery: 4, feeds: 'PRO', flavor: 'Boards a listing project and gets it sailing again.' },
];

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
    // Current quests first, then newest first.
    .sort((a, b) => Number(b.data.current) - Number(a.data.current) || b.data.startDate.getTime() - a.data.startDate.getTime());

  const credentials = await getCollection('credentials', ({ data }) => data.visible);
  const education = (await getCollection('education', ({ data }) => data.visible))
    .sort((a, b) => a.data.order - b.data.order);

  /** Level is years working professionally: Erikk started in 2002. */
  const CAREER_START = 2002;
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
        { title: 'X', description: '@KimJungUzi', href: siteConfig.social.twitter, external: true },
        { title: 'Bluesky', href: siteConfig.social.bluesky, external: true },
      ],
      chart: { x: 270 / 640, y: 256 / 360 },
    },
  ];

  function card(name: string, suit: SkillCard['suit'], mastery?: number, flavor?: string): SkillCard {
    const id = slug(name);
    const t = CARD_TUNING[id] ?? {};
    return { id: `${suit}-${id}`, name, suit, mastery: t.mastery ?? mastery ?? 3, feeds: t.feeds ?? feedsFrom(name), flavor: t.flavor ?? flavor ?? 'Part of the kit.' };
  }

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
  // Competencies: the radar. Mostly hand-set by Erikk; DES is still counted from the site.
  const radar = [
    { label: 'DEV', value: 6, note: 'Development: hand-set' },
    { label: 'PRO', value: 9, note: 'Product: hand-set' },
    { label: 'DES', value: clamp(designProjects / 1.5), note: `${designProjects} design projects` },
    // GTM is hand-set: the site doesn't count go-to-market work well.
    { label: 'GTM', value: 5, note: 'Go-to-market: launches, positioning and growth' },
    { label: 'WRI', value: 9, note: 'Writing: hand-set' },
    { label: 'COM', value: 8, note: 'Comms: hand-set' },
  ];


  return {
    ship: { name: 'The Scattered Atlas', tagline: siteConfig.tagline },
    destinations,
    player: {
      stats: {
        name: author.name,
        title: siteConfig.author.title,
        location: 'DMV Area',
        level: new Date().getUTCFullYear() - CAREER_START,
        levelNote: `Years working professionally (since ${CAREER_START}).`,
        // Attributes: the character, not the résumé. Hand-set on a 1–20 scale; tune freely.
        attributes: [
          { label: 'WIL', value: 12, note: 'Willpower: sees hard things through' },
          { label: 'INT', value: 15, note: 'Intelligence: systems and architecture' },
          { label: 'WIT', value: 15, note: 'Wit: quick on his feet' },
          { label: 'CHA', value: 16, note: 'Charisma: rallies a crew' },
          { label: 'WIS', value: 16, note: 'Wisdom: knows what not to build' },
          { label: 'LCK', value: 15, note: 'Luck: right place, right time' },
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
          tech: e.data.technologies ?? [],
        })),
        radar,
        inventory: {
          keyItems: [
            ...credentials.map((c) => ({ name: c.data.title, from: c.data.organization, note: c.data.description, kind: 'credential' as const, year: c.data.issueDate.getUTCFullYear() })),
            ...education.map((e) => ({ name: e.data.degree, from: e.data.institution, note: e.data.field, kind: 'degree' as const, year: (e.data.endDate ?? e.data.startDate).getUTCFullYear() })),
          ].map((it): KeyItem => ({
            ...it,
            id: slug(`${it.name}-${it.from}`),
            type: itemType(it.name, it.kind),
            rarity: itemRarity(it.name, it.from),
            bonus: `+1 ${feedsFrom(`${it.name} ${it.note}`)}`,
          })),
          gear,
        },
        cards: [
          ...(author.skills ?? []).map((name: string) => card(name, 'skill')),
          ...(author.softSkills ?? []).map((name: string) => card(name, 'discipline')),
          ...SPECIALS.map((c) => ({ ...c, suit: 'special' as const })),
          ...gear.map((g) => card(g.name, 'equipment', Math.max(1, Math.min(5, Math.ceil(g.uses / 2))), `Carried on ${g.uses} ${g.uses === 1 ? 'mission' : 'missions'}.`)),
        ],
        training: education.map((e) => ({
          title: `${e.data.degree}, ${e.data.field}`,
          place: e.data.institution,
          years: `${e.data.startDate.getUTCFullYear()}–${e.data.current || !e.data.endDate ? 'now' : e.data.endDate.getUTCFullYear()}`,
        })),
      },
    },
  };
}
