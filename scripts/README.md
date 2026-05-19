# Spotify RSS Feed Sync

This script automatically syncs podcast episodes from Spotify to your Press page.

## Setup

1. **Get your Spotify RSS feed URL:**
   - Log into [Spotify for Podcasters](https://podcasters.spotify.com/)
   - Go to your podcast dashboard
   - Find the RSS feed URL (format: `https://anchor.fm/s/XXXXXX/podcast/rss`)

2. **Add to environment:**
   ```bash
   # .env or .env.local
   SPOTIFY_RSS_URL=https://anchor.fm/s/XXXXXX/podcast/rss
   ```

3. **Run manually:**
   ```bash
   npm run sync:podcast
   ```

4. **Automatic sync:**
   - The sync runs automatically before each build (`npm run build`)
   - New episodes are created as markdown files in `src/content/press/`

## How It Works

- Fetches the RSS feed from Spotify
- Creates a new press entry for each episode not already in the system
- Uses the episode title, description, publication date, and cover image
- Sets proper metadata (type: podcast-episode, outlet: Humans Only Podcast)

## File Naming

Episodes are saved as:
- `humans-only-ep-{number}-{slug}.md` (if episode number available)
- `humans-only-{slug}.md` (fallback)

## Existing Episodes

The script won't overwrite existing files, so you can manually edit episode descriptions or add custom cover images after they're created.
