/**
 * Rebuild the 1200×630 social cards with the pages' real typefaces and tokens.
 * Run: node scripts/design-share-cards.mjs
 * Requires sharp (already in the Astro dependency tree) and fontconfig fonts:
 * Anton, Tilt Prism, IBM Plex Mono — all available from Google Fonts under OFL.
 * Set FONTCONFIG_FILE to a custom fontconfig file if fonts are not installed
 * globally. Fail on missing fonts instead of silently changing the artwork.
 * PNGs are committed; deployment does not need fonts or this generator.
 */
import { readFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
for (const face of ['Anton', 'Tilt Prism', 'IBM Plex Mono']) {
  const resolved = execFileSync('fc-match', ['--format=%{family}', face], { encoding: 'utf8' });
  if (!resolved.includes(face)) throw new Error(`Install ${face} before generating cards (resolved ${resolved}).`);
}
const read = (path) => readFile(new URL(path, root), 'utf8');
const market = JSON.parse(await read('public/acrylics/acrylics.tokens.json')).schemes.market.roles;
const prism = JSON.parse(await read('public/prism/prism.tokens.json'));
const marks = Object.fromEntries(await Promise.all(['stroke', 'stroke-drag', 'blot'].map(async (name) => [name, await read(`public/acrylics/${name}.svg`)])));
const mono = 'IBM Plex Mono';

function mark(name, color, x, y, width, height, rotation = 0, opacity = 1) {
  const svg = marks[name].replace('<svg ', `<svg x="${x}" y="${y}" width="${width}" height="${height}" `).replaceAll('currentColor', color).replaceAll('fill="white"', `fill="${color}"`).replaceAll('fill="#fff"', `fill="${color}"`);
  return `<g opacity="${opacity}" transform="rotate(${rotation} ${x + width / 2} ${y + height / 2})">${svg}</g>`;
}

const acrylics = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${market.field}"/>
  <g fill="${market.ink}">
    <text x="56" y="77" font-family="${mono}" font-size="18" letter-spacing="2">PAINT → INTERFACE</text>
    <text x="52" y="254" font-family="Anton" font-size="132">ACRYLICS</text>
    <text x="57" y="318" font-family="Anton" font-size="34">COLOR WITH A HISTORY.</text>
    <text x="57" y="388" font-family="${mono}" font-size="20">Layered palettes. Loaded brushes.</text>
    <text x="57" y="424" font-family="${mono}" font-size="20">A tactile design system.</text>
  </g>
  ${mark('stroke', market.pigment, 645, 100, 500, 255, -13)}
  ${mark('stroke-drag', market['pigment-2'], 645, 286, 550, 200, 16, 0.92)}
  ${mark('blot', market.highlight, 961, 325, 210, 180, 12)}
  <g transform="rotate(-6 911 280)">
    <rect x="764" y="196" width="304" height="208" rx="5" fill="${market.ink}"/>
    <rect x="756" y="187" width="304" height="208" rx="5" fill="${market.surface}" stroke="${market.ink}" stroke-width="2"/>
    <text x="780" y="224" font-family="${mono}" font-size="14" fill="${market.ink}">BRUSH + BLOT + GROUND</text>
    <text x="778" y="300" font-family="Anton" font-size="42" fill="${market.ink}">ONE MORE COAT.</text>
    <rect x="781" y="326" width="151" height="42" rx="4" fill="${market.accent}"/>
    <text x="799" y="353" font-family="${mono}" font-size="15" fill="${market['on-accent']}">Apply color ↗</text>
    <circle cx="984" cy="347" r="15" fill="${market['pigment-2']}"/>
    <circle cx="1020" cy="347" r="15" fill="${market.highlight}"/>
  </g>
  <path d="M56 547 H1144" stroke="${market.line}"/>
  <text x="56" y="590" font-family="${mono}" font-size="18" fill="${market.ink}">shupp.dev/design/acrylics</text>
  <text x="1144" y="590" text-anchor="end" font-family="${mono}" font-size="16" fill="${market.muted}">A DESIGN SYSTEM BY ERIKK SHUPP</text>
</svg>`;

// SVG renderers do not all implement OKLCH, so resolve the token bands to sRGB.
function oklchHex(L, C, degrees) {
  const h = degrees * Math.PI / 180, a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return '#' + [4.0767416621*l - 3.3077115913*m + 0.2309699292*s, -1.2684380046*l + 2.6097574011*m - 0.3413193965*s, -0.0041960863*l - 0.7034186147*m + 1.707614701*s].map((c) => {
    c = Math.min(1, Math.max(0, c));
    return Math.round(255 * (c <= 0.0031308 ? 12.92*c : 1.055*c**(1/2.4)-0.055)).toString(16).padStart(2, '0');
  }).join('');
}
const hue = prism.param.anchorHue.$value;
const bands = ['anchor', 'near', 'far', 'counter'].map((name) => {
  const token = prism.dispersion[name];
  const [, L, C] = token.$value.match(/^oklch\(([\d.]+) ([\d.]+)/);
  return { name, color: oklchHex(+L, +C, hue + token.offsetDeg), offset: token.offsetDeg };
});
const ink = oklchHex(0.28, 0.03, hue), field = oklchHex(0.962, 0.008, hue);
const prismatic = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="spectrum" x2="1" y2="1">${bands.map((b, i) => `<stop offset="${i/3}" stop-color="${b.color}"/>`).join('')}</linearGradient>
    <linearGradient id="glass" x2="0.6" y2="1"><stop stop-color="white" stop-opacity=".96"/><stop offset="1" stop-color="white" stop-opacity=".45"/></linearGradient>
    <filter id="cast" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="26"/></filter>
  </defs>
  <rect width="1200" height="630" fill="${field}"/>
  <text x="56" y="77" font-family="${mono}" font-size="18" letter-spacing="2" fill="${ink}">COLOR → LIGHT → INTERFACE</text>
  <text x="50" y="265" font-family="Tilt Prism" font-size="164" fill="${ink}">PRISM</text>
  <text x="57" y="326" font-family="${mono}" font-size="27" fill="${ink}">One hue. A whole spectrum.</text>
  <text x="57" y="371" font-family="${mono}" font-size="18" fill="${ink}">Prismatic · An OKLCH design system</text>
  <g transform="rotate(-9 931 253)">
    <rect x="825" y="202" width="267" height="191" rx="28" fill="url(#spectrum)" filter="url(#cast)" opacity=".7"/>
    <rect x="796" y="155" width="281" height="213" rx="26" fill="url(#glass)" stroke="url(#spectrum)" stroke-width="3"/>
    <path d="M851 309 L929 188 L1008 309 Z" fill="url(#spectrum)" opacity=".4" stroke="${ink}" stroke-width="1.5"/>
    <path d="M815 262 H895 M961 262 L1056 219 M961 262 H1056 M961 262 L1056 305" fill="none" stroke="url(#spectrum)" stroke-width="5"/>
  </g>
  ${bands.map((b, i) => `<rect x="${56+i*277}" y="434" width="257" height="77" rx="12" fill="${b.color}"/><text x="${74+i*277}" y="480" font-family="${mono}" font-size="17" fill="${ink}">${b.name} / ${b.offset>=0?'+':'−'}${Math.abs(b.offset)}°</text>`).join('')}
  <path d="M56 547 H1144" stroke="${ink}" opacity=".22"/>
  <text x="56" y="590" font-family="${mono}" font-size="18" fill="${ink}">shupp.dev/design/prismatic</text>
  <text x="1144" y="590" text-anchor="end" font-family="${mono}" font-size="16" fill="${ink}">A DESIGN SYSTEM BY ERIKK SHUPP</text>
</svg>`;

await mkdir(new URL('public/images/social/', root), { recursive: true });
for (const [name, svg] of Object.entries({ acrylics, prismatic })) {
  const target = new URL(`public/images/social/${name}-card.png`, root);
  await sharp(Buffer.from(svg)).png().toFile(target.pathname);
  console.log(`Wrote ${target.pathname}`);
}
