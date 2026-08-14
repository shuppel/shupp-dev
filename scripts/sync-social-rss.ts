#!/usr/bin/env node
/**
 * Social RSS Feed Sync Script
 * -----------------------------------------------------------------------------
 * Fetches recent posts from social platforms via RSS and writes them into the
 * `social` content collection (src/content/social/*.md), which powers /feed.
 *
 * Bluesky exposes a native RSS feed (https://bsky.app/profile/<handle>/rss).
 * X (Twitter) and TikTok do NOT expose public/native RSS, so those feeds must
 * be provided by a third-party RSS bridge (e.g. rss.app, Nitter, RSSHub). Point
 * the corresponding env var at that feed URL and this script will pick it up.
 *
 * Env vars (all optional — feeds without a URL are skipped):
 *   X_RSS_URL         RSS feed for X       @KimJungUzi
 *   TIKTOK_RSS_URL    RSS feed for TikTok  @thoughtfulappco
 *   BLUESKY_RSS_URL   RSS feed for Bluesky (defaults to the native shupp.dev feed)
 */

import { writeFile, mkdir, access } from 'fs/promises';

const SOCIAL_DIR = new URL('../src/content/social/', import.meta.url);

type Platform = 'x' | 'bluesky' | 'tiktok';

interface FeedSource {
  platform: Platform;
  handle: string;   // Display handle, e.g. "@KimJungUzi"
  outlet: string;   // Friendly source label
  url: string;      // RSS feed URL ('' => skipped)
  tags: string[];
}

const FEEDS: FeedSource[] = [
  {
    platform: 'x',
    handle: '@KimJungUzi',
    outlet: 'X (Twitter)',
    url: process.env.X_RSS_URL ?? '',
    tags: ['x', 'twitter'],
  },
  {
    platform: 'tiktok',
    handle: '@thoughtfulappco',
    outlet: 'Thoughtful App Co.',
    url: process.env.TIKTOK_RSS_URL ?? '',
    tags: ['tiktok', 'thoughtful-app-co'],
  },
  {
    platform: 'bluesky',
    handle: 'shupp.dev',
    outlet: 'Bluesky',
    url: process.env.BLUESKY_RSS_URL ?? 'https://bsky.app/profile/shupp.dev/rss',
    tags: ['bluesky'],
  },
];

interface SocialPost {
  title: string;
  text: string;
  pubDate: string;
  guid: string;
  link: string;
  image?: string;
}

async function fetchRSSFeed(url: string): Promise<SocialPost[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const xmlText = await response.text();
    return parseRSS(xmlText);
  } catch (error) {
    console.error(`   ✗ Error fetching feed: ${String(error)}`);
    return [];
  }
}

function parseRSS(xmlText: string): SocialPost[] {
  const posts: SocialPost[] = [];

  // Simple regex-based parsing (matches the approach used by sync-spotify-rss.ts).
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];

    const rawTitle = extractTag(itemContent, 'title') ?? '';
    const rawDescription = extractTag(itemContent, 'description') ?? '';
    const pubDate = extractTag(itemContent, 'pubDate') ?? '';
    const guid = extractTag(itemContent, 'guid') ?? extractTag(itemContent, 'link') ?? '';
    const link = extractTag(itemContent, 'link') ?? '';

    // Prefer the (usually richer) description as the post body, fall back to title.
    const bodySource = rawDescription.length > 0 ? rawDescription : rawTitle;
    const text = stripHtml(bodySource);

    // Best-effort media extraction: media:content, enclosure, or first <img> in the body.
    const image =
      extractAttribute(itemContent, 'media:content', 'url') ??
      extractAttribute(itemContent, 'media:thumbnail', 'url') ??
      extractAttribute(itemContent, 'enclosure', 'url') ??
      extractImgSrc(rawDescription);

    posts.push({
      title: stripHtml(rawTitle),
      text,
      pubDate,
      guid,
      link,
      image,
    });
  }

  return posts;
}

function extractTag(content: string, tagName: string): string | undefined {
  // Handle CDATA-wrapped and plain tag bodies.
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = content.match(regex);
  if (match?.[1] === undefined) return undefined;
  const value = match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
  return value.length > 0 ? value : undefined;
}

function extractAttribute(content: string, tagName: string, attrName: string): string | undefined {
  const regex = new RegExp(`<${tagName}[^>]*\\s${attrName}="([^"]*)"[^>]*>`, 'i');
  const match = content.match(regex);
  return match?.[1]?.trim();
}

function extractImgSrc(html: string): string | undefined {
  const match = html.match(/<img[^>]*\ssrc="([^"]*)"/i);
  return match?.[1]?.trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '…';
}

function yamlString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function generateMarkdown(source: FeedSource, post: SocialPost): string {
  const pubDate = new Date(post.pubDate);
  const dateStr = Number.isNaN(pubDate.getTime())
    ? new Date().toISOString().split('T')[0]
    : pubDate.toISOString().split('T')[0];

  const title = truncate(post.text.length > 0 ? post.text : post.title, 120);

  const lines: string[] = [
    '---',
    `platform: ${yamlString(source.platform)}`,
    `author: ${yamlString(source.handle)}`,
    `text: ${yamlString(post.text)}`,
    `pubDate: ${dateStr}`,
    `url: ${yamlString(post.link)}`,
  ];

  if (post.image !== undefined && post.image.length > 0) {
    lines.push(`image: ${yamlString(post.image)}`);
  }
  lines.push(`outlet: ${yamlString(source.outlet)}`);
  lines.push(`tags: [${source.tags.map((t) => yamlString(t)).join(', ')}]`);
  lines.push('featured: false');
  lines.push('---');
  lines.push('');
  lines.push(title);
  lines.push('');

  return lines.join('\n');
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function syncFeed(source: FeedSource): Promise<{ created: number; skipped: number }> {
  if (source.url.length === 0) {
    console.log(`⏭️  ${source.platform} (${source.handle}): no feed URL set, skipping`);
    return { created: 0, skipped: 0 };
  }

  console.log(`📡 ${source.platform} (${source.handle}): fetching ${source.url}`);
  const posts = await fetchRSSFeed(source.url);

  if (posts.length === 0) {
    console.log('   ℹ️  No posts found');
    return { created: 0, skipped: 0 };
  }

  let created = 0;
  let skipped = 0;

  for (const post of posts) {
    const pubDate = new Date(post.pubDate);
    const datePart = Number.isNaN(pubDate.getTime())
      ? 'undated'
      : pubDate.toISOString().split('T')[0];
    const slugBody = slugify(post.text.length > 0 ? post.text : post.title) || 'post';
    const slug = `${source.platform}-${datePart}-${slugBody}`;
    const filePath = new URL(`${slug}.md`, SOCIAL_DIR);

    if (await fileExists(filePath.pathname)) {
      skipped++;
      continue;
    }

    await writeFile(filePath.pathname, generateMarkdown(source, post), 'utf-8');
    created++;
    console.log(`   ✅ Created: ${slug}.md`);
  }

  return { created, skipped };
}

async function syncSocialFeeds(): Promise<void> {
  console.log('🌐 Syncing social feeds...\n');

  await mkdir(SOCIAL_DIR, { recursive: true });

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const source of FEEDS) {
    const { created, skipped } = await syncFeed(source);
    totalCreated += created;
    totalSkipped += skipped;
  }

  console.log(`\n📊 Summary: ${totalCreated} created, ${totalSkipped} already exist`);
}

// Run the sync
syncSocialFeeds().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
