// Press entries (broadcasts on the relay) as reading pages, and their JSON
// twins. Same URL scheme as galaxy notes: /press/<slug>/ and /press/<slug>.json.

import type { CollectionEntry } from 'astro:content';
import { siteConfig } from '../../config/site';

type Press = CollectionEntry<'press'>;

export const PRESS_TYPE: Record<Press['data']['type'], { label: string; cta: string }> = {
  article: { label: 'Article', cta: 'Read on' },
  'podcast-episode': { label: 'Podcast', cta: 'Listen on' },
  'podcast-guest': { label: 'Guest spot', cta: 'Listen on' },
  talk: { label: 'Talk', cta: 'Watch on' },
  interview: { label: 'Interview', cta: 'Read on' },
  mention: { label: 'Mention', cta: 'Read on' },
  award: { label: 'Award', cta: 'View on' },
  video: { label: 'Video', cta: 'Watch on' },
  short: { label: 'Short', cta: 'Watch on' },
};

export const pressUrl = (id: string) => `/press/${id}/`;
export const pressJsonUrl = (id: string) => `/press/${id}.json`;
const abs = (p: string) => new URL(p, siteConfig.siteUrl).href;

/** The YouTube video behind an entry: its youtubeUrl, else the external URL,
 *  else the first YouTube link in the body (the Shorts digests). */
export function youtube(entry: Press): { id: string; vertical: boolean } | null {
  const candidates = [entry.data.youtubeUrl, entry.data.embedUrl, entry.data.externalUrl, ...((entry.body ?? '').match(/https:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s)\]]+/g) ?? [])];
  for (const raw of candidates) {
    if (!raw) continue;
    const m = raw.match(/youtube\.com\/(?:watch\?v=|shorts\/|embed\/)([\w-]{11})|youtu\.be\/([\w-]{11})/);
    if (m) {
      const id = m[1] ?? m[2];
      return { id, vertical: entry.data.type === 'short' || raw.includes('/shorts/') };
    }
  }
  return null;
}

/** Spotify embed URL for podcast entries without a video. */
export function spotifyEmbed(entry: Press): string | null {
  const u = entry.data.embedUrl?.includes('spotify') ? entry.data.embedUrl : entry.data.spotifyUrl;
  if (!u) return null;
  const m = u.match(/open\.spotify\.com\/(?:embed\/)?(episode|show)\/([\w]+)/);
  return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
}

/** Drop editorial "> NOTE:" lines left for Erikk; they aren't for readers. */
export const publicBody = (body = '') => body.split('\n').filter((l) => !/^>\s*NOTE:/i.test(l.trim())).join('\n').trim();

export function pressJson(entry: Press) {
  const d = entry.data;
  const yt = youtube(entry);
  return {
    $format: 'shupp-page@0.1',
    id: `press/${entry.id}`,
    kind: d.type,
    url: abs(pressUrl(entry.id)),
    json: abs(pressJsonUrl(entry.id)),
    source: d.externalUrl,
    title: d.title,
    description: d.description,
    author: { name: siteConfig.author.name, url: abs('/about/') },
    dates: { published: d.pubDate.toISOString().slice(0, 10) },
    outlet: d.outlet ? { name: d.outlet, url: d.outletUrl ?? null } : null,
    event: d.eventName ? { name: d.eventName, url: d.eventUrl ?? null, location: d.location ?? null } : null,
    people: { guests: d.guests ?? [], coHosts: d.coHosts ?? [] },
    media: {
      youtube: yt ? { id: yt.id, url: `https://www.youtube.com/watch?v=${yt.id}`, vertical: yt.vertical } : null,
      spotify: d.spotifyUrl ?? null,
      apple: d.appleUrl ?? null,
      image: d.coverImage ?? (yt ? `https://i.ytimg.com/vi/${yt.id}/hqdefault.jpg` : null),
    },
    tags: d.tags ?? [],
    body: { format: 'markdown', content: publicBody(entry.body) },
  };
}
