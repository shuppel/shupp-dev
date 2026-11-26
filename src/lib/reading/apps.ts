// Thoughtful App Co. concepts: the reading page and its JSON twin.
//   /thoughtful-app-co/<id>/      the page
//   /thoughtful-app-co/<id>.json  the same concept for agents and tools

import type { CollectionEntry } from 'astro:content';
import { siteConfig } from '../../config/site';

type App = CollectionEntry<'thoughtful-apps'>;

export const appUrl = (id: string) => `/thoughtful-app-co/${id}/`;
export const appJsonUrl = (id: string) => `/thoughtful-app-co/${id}.json`;
const abs = (p: string) => new URL(p, siteConfig.siteUrl).href;

export const APP_STATUS: Record<App['data']['status'], string> = {
  concept: 'Concept',
  exploring: 'Exploring',
  prototyping: 'Prototyping',
  shelved: 'Shelved',
};

export const RATINGS = {
  feasibility: ['Moonshot', 'Challenging', 'Doable', 'Straightforward', 'Weekend project'],
  excitement: ['Meh', 'Interesting', 'Cool', 'Thrilling', 'Exhilarating'],
  seriousness: ['Absurd', 'Whimsical', 'Practical', 'Meaningful', 'Revolutionary'],
} as const;

/** Excitement weighs more than feasibility, the order the index has always used. */
export const appScore = (a: App) => a.data.excitement * 0.6 + a.data.feasibility * 0.4;

export function appJson(entry: App) {
  const d = entry.data;
  const rating = (k: keyof typeof RATINGS) => ({ score: d[k], of: 5, label: RATINGS[k][d[k] - 1] });
  return {
    $format: 'shupp-page@0.1',
    id: `thoughtful-app-co/${entry.id}`,
    kind: 'app-concept',
    url: abs(appUrl(entry.id)),
    json: abs(appJsonUrl(entry.id)),
    title: d.title,
    description: d.oneLiner,
    status: d.status,
    category: d.category,
    dates: { lastUpdated: d.lastUpdated.toISOString().slice(0, 10) },
    ratings: { feasibility: rating('feasibility'), excitement: rating('excitement'), seriousness: rating('seriousness') },
    problem: d.problem,
    features: d.features.map(({ name, what, why }) => ({ name, what, why })),
    userJourney: d.userJourney,
    technicalArchitecture: d.technicalArchitecture,
    moonshotFeatures: d.moonshotFeatures,
    marketResearch: d.marketResearch,
    openQuestions: d.openQuestions,
    resources: d.resources ?? [],
    github: d.githubUrl ?? null,
    body: { format: 'markdown', content: (entry.body ?? '').trim() },
  };
}
