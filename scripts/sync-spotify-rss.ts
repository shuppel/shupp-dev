#!/usr/bin/env node
/**
 * Spotify RSS Feed Sync Script
 * Fetches podcast episodes from Spotify RSS and creates/updates press entries
 */

import { writeFile, mkdir, readFile, access } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Spotify RSS feed URL (you can get this from your Spotify for Podcasters dashboard)
// Format: https://anchor.fm/s/XXXXXX/podcast/rss
const SPOTIFY_RSS_URL = process.env.SPOTIFY_RSS_URL || '';

const PRESS_DIR = new URL('../src/content/press/', import.meta.url);

interface PodcastEpisode {
  title: string;
  description: string;
  pubDate: string;
  enclosure?: {
    url: string;
    type: string;
  };
  guid: string;
  link?: string;
  itunes?: {
    image?: string;
    duration?: string;
    episode?: string;
    season?: string;
  };
}

async function fetchRSSFeed(url: string): Promise<PodcastEpisode[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const xmlText = await response.text();
    return parseRSS(xmlText);
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return [];
  }
}

function parseRSS(xmlText: string): PodcastEpisode[] {
  const episodes: PodcastEpisode[] = [];
  
  // Simple regex-based parsing (for production, consider using fast-xml-parser)
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];
    
    const title = extractTag(itemContent, 'title') || '';
    const description = extractTag(itemContent, 'description') || '';
    const pubDate = extractTag(itemContent, 'pubDate') || '';
    const guid = extractTag(itemContent, 'guid') || '';
    const link = extractTag(itemContent, 'link') || '';
    
    // Extract iTunes specific tags
    const itunesImage = extractTag(itemContent, 'itunes:image') || 
                       extractAttribute(itemContent, 'itunes:image', 'href');
    const itunesDuration = extractTag(itemContent, 'itunes:duration') || '';
    const itunesEpisode = extractTag(itemContent, 'itunes:episode') || '';
    const itunesSeason = extractTag(itemContent, 'itunes:season') || '';
    
    // Extract enclosure
    const enclosureMatch = itemContent.match(/<enclosure[^>]*>/);
    let enclosure;
    if (enclosureMatch) {
      enclosure = {
        url: extractAttribute(itemContent, 'enclosure', 'url') || '',
        type: extractAttribute(itemContent, 'enclosure', 'type') || 'audio/mpeg',
      };
    }
    
    episodes.push({
      title,
      description: stripHtml(description).slice(0, 200) + (description.length > 200 ? '...' : ''),
      pubDate,
      guid,
      link,
      enclosure,
      itunes: {
        image: itunesImage,
        duration: itunesDuration,
        episode: itunesEpisode,
        season: itunesSeason,
      },
    });
  }
  
  return episodes;
}

function extractTag(content: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i');
  const match = content.match(regex);
  return match?.[1]?.trim();
}

function extractAttribute(content: string, tagName: string, attrName: string): string | undefined {
  const regex = new RegExp(`<${tagName}[^>]*${attrName}="([^"]*)"[^>]*>`, 'i');
  const match = content.match(regex);
  return match?.[1]?.trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

function generateMarkdown(episode: PodcastEpisode): string {
  const pubDate = new Date(episode.pubDate);
  const dateStr = pubDate.toISOString().split('T')[0];
  
  // Generate episode number for the slug if available
  const episodeNum = episode.itunes?.episode || '';
  const slugSuffix = episodeNum ? `-ep-${episodeNum}` : '';
  
  const frontmatter = {
    title: episode.title,
    description: episode.description,
    type: 'podcast-episode',
    pubDate: dateStr,
    externalUrl: episode.link || episode.enclosure?.url || '',
    outlet: 'Humans Only Podcast',
    outletUrl: 'https://humansonly.fm',
    coverImage: episode.itunes?.image || '/images/press/humans-only-default.jpg',
    spotifyUrl: episode.link || '',
    embedUrl: episode.enclosure?.url || '',
    tags: ['podcast', 'humans-only'],
    featured: false,
  };

  return `---
${Object.entries(frontmatter)
  .filter(([_, v]) => v !== undefined && v !== '')
  .map(([k, v]) => {
    if (Array.isArray(v)) {
      return `${k}: [${v.map(item => `"${item}"`).join(', ')}]`;
    }
    if (typeof v === 'boolean') {
      return `${k}: ${v}`;
    }
    return `${k}: "${String(v).replace(/"/g, '\\"')}"`;
  })
  .join('\n')}
---

> Episode ${episodeNum ? `#${episodeNum} ` : ''}of the Humans Only Podcast.
> ${episode.itunes?.duration ? `Duration: ${episode.itunes.duration}` : ''}
`;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function syncPodcastEpisodes() {
  if (!SPOTIFY_RSS_URL) {
    console.log('⚠️  SPOTIFY_RSS_URL not set, skipping podcast sync');
    console.log('   Set it in your environment or .env file');
    return;
  }

  console.log('🎧 Fetching podcast episodes from Spotify RSS...');
  
  const episodes = await fetchRSSFeed(SPOTIFY_RSS_URL);
  
  if (episodes.length === 0) {
    console.log('ℹ️  No episodes found or error fetching feed');
    return;
  }

  console.log(`📥 Found ${episodes.length} episodes`);
  
  let created = 0;
  let skipped = 0;
  
  for (const episode of episodes) {
    const episodeNum = episode.itunes?.episode || '';
    const baseSlug = slugify(episode.title);
    const slug = episodeNum ? `humans-only-ep-${episodeNum}-${baseSlug}` : `humans-only-${baseSlug}`;
    const filePath = new URL(`${slug}.md`, PRESS_DIR);
    
    if (await fileExists(filePath.pathname)) {
      skipped++;
      continue;
    }
    
    const markdown = generateMarkdown(episode);
    await writeFile(filePath.pathname, markdown, 'utf-8');
    created++;
    console.log(`✅ Created: ${slug}.md`);
  }
  
  console.log(`\n📊 Summary: ${created} created, ${skipped} already exist`);
}

// Run the sync
syncPodcastEpisodes().catch(console.error);
