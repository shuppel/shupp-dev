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

---

# Social RSS Feed Sync

`sync-social-rss.ts` pulls recent posts from social platforms into the `social`
content collection (`src/content/social/*.md`), which powers the **/feed** page.

## Setup

Add the feed URLs you want to sync to your `.env` (all are optional — any feed
without a URL is skipped):

```bash
# Bluesky has a NATIVE RSS feed and works out of the box.
BLUESKY_RSS_URL=https://bsky.app/profile/shupp.dev/rss

# X (Twitter) and TikTok do NOT expose public RSS. Point these at a third-party
# RSS bridge (e.g. rss.app, Nitter, RSSHub) for the accounts below:
X_RSS_URL=            # @KimJungUzi
TIKTOK_RSS_URL=       # @thoughtfulappco
```

## Run

```bash
npm run sync:social
```

The sync also runs automatically before each build (`npm run build`).

## How It Works

- Fetches each configured RSS feed and parses recent items
- Creates one markdown file per post in `src/content/social/`
- Won't overwrite existing files, so hand-edits/curation are preserved
- File naming: `{platform}-{YYYY-MM-DD}-{slug}.md`

## Notes on X / TikTok RSS

Neither platform offers an official public RSS feed. To sync them you need a
bridge that produces RSS. Common options:

- **rss.app** — hosted, paste the account URL, get an RSS feed URL back
- **Nitter** / **RSSHub** — self-hostable open-source bridges

Paste the resulting feed URL into `X_RSS_URL` / `TIKTOK_RSS_URL`. Until then,
those platforms are simply skipped and only Bluesky syncs.
