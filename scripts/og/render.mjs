// Renders the share-card templates in scripts/og/ to 1200x630 images.
// JPEGs keep the cards small for X and friends; the title screen is also
// written as public/og-default.png, the site-wide fallback that Layout.astro,
// JsonLd and older pages already point at.
// Run after changing a template or its art:  node scripts/og/render.mjs
// Needs Playwright's Chromium (not a site dependency, so not run in the Netlify build).
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync } from 'node:fs';

// require() so a globally installed Playwright works too (NODE_PATH=$(npm root -g)).
const { chromium } = createRequire(import.meta.url)('playwright');
const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '../../public/og');
mkdirSync(out, { recursive: true });

const pub = join(here, '../../public');
const cards = [
  ['box-shelf.html', 'og/atlas-box.jpg'],
  ['title-screen.html', 'og/atlas-title.jpg'],
  ['title-screen.html', 'og-default.png'],
];
const only = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
for (const [src, png] of cards) {
  if (only.length && !only.some((o) => png.includes(o))) continue;
  await page.goto(pathToFileURL(join(here, src)).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  const type = png.endsWith('.png') ? 'png' : 'jpeg';
  await page.screenshot({ path: join(pub, png), type, ...(type === 'jpeg' && { quality: 88 }) });
  console.log('wrote public/' + png);
}
await browser.close();
