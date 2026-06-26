/**
 * Generates the "Prismatic" portfolio screen-art poster from PRISM's real OKLCH
 * tokens. A split canvas — day on the left, redshift (night) on the right — shows
 * the system's signature: one anchor hue, two wavelengths. OKLCH is converted to
 * sRGB hex so librsvg/resvg (via sharp) renders it everywhere.
 *
 * The wordmark uses the real line-work display face (Tilt Prism); labels use
 * Spline Sans Mono — the same faces as the showcase page. To regenerate, those
 * Google fonts must be installed for fontconfig (e.g. dropped in ~/.fonts +
 * `fc-cache -f`). The committed PNG already bakes them in.
 *
 * Run: node scripts/prism-poster.mjs   ->  public/images/projects/prismatic.png
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images', 'projects', 'prismatic.png');

// ---- OKLCH -> sRGB hex ----------------------------------------------------
function oklchHex(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  const ch = lin.map((c) => {
    const cl = Math.min(Math.max(c, 0), 1);
    const s = cl <= 0.0031308 ? 12.92 * cl : 1.055 * cl ** (1 / 2.4) - 0.055;
    return Math.round(s * 255).toString(16).padStart(2, '0');
  });
  return `#${ch.join('')}`;
}

// ---- token palette (anchor h = 185, redshift hr = 129) --------------------
const day = {
  field: oklchHex(0.962, 0.008, 185),
  surface: oklchHex(0.985, 0.005, 185),
  ink: oklchHex(0.28, 0.03, 185),
  inkSoft: oklchHex(0.48, 0.035, 185),
  anchor: oklchHex(0.74, 0.125, 185),
  near: oklchHex(0.76, 0.14, 150),
  far: oklchHex(0.70, 0.11, 260),
  counter: oklchHex(0.78, 0.13, 45),
  dense: oklchHex(0.44, 0.10, 185),
};
const night = {
  field: oklchHex(0.235, 0.052, 129),
  surface: oklchHex(0.875, 0.045, 69),
  onGround: oklchHex(0.88, 0.035, 69),
  onGroundSoft: oklchHex(0.66, 0.04, 69),
  anchor: oklchHex(0.72, 0.115, 129),
  near: oklchHex(0.74, 0.125, 104),
  far: oklchHex(0.66, 0.09, 184),
  counter: oklchHex(0.76, 0.12, 34),
};

const W = 1500, H = 1000, MID = W / 2;
// the real PRISM type faces (registered via fontconfig), matching the page
const display = 'Tilt Prism';
const mono = 'Spline Sans Mono, Liberation Mono, monospace';

// one band-swatch row (4 chips) anchored at (x,y)
function bands(x, y, cw, gap, p, labelFill) {
  const order = ['anchor', 'near', 'far', 'counter'];
  const off = ['+0°', '−35°', '+75°', '−140°'];
  return order
    .map((k, i) => {
      const cx = x + i * (cw + gap);
      return `
        <rect x="${cx}" y="${y}" width="${cw}" height="96" rx="12" fill="${p[k]}"/>
        <text x="${cx + 12}" y="${y + 78}" font-family="${mono}" font-size="17" fill="${day.ink}" opacity="0.82">${k}</text>
        <text x="${cx + cw - 12}" y="${y + 26}" text-anchor="end" font-family="${mono}" font-size="14" fill="${day.ink}" opacity="0.6">${off[i]}</text>`;
    })
    .join('');
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="dichroic" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${day.anchor}"/>
      <stop offset="0.3" stop-color="${day.near}"/>
      <stop offset="0.7" stop-color="${day.far}"/>
      <stop offset="1" stop-color="${day.counter}"/>
    </linearGradient>
    <linearGradient id="dichroicNight" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${night.anchor}"/>
      <stop offset="0.3" stop-color="${night.near}"/>
      <stop offset="0.7" stop-color="${night.far}"/>
      <stop offset="1" stop-color="${night.counter}"/>
    </linearGradient>
    <filter id="cast" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="22"/></filter>
    <filter id="halo" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="34"/></filter>
    <clipPath id="left"><rect x="0" y="0" width="${MID}" height="${H}"/></clipPath>
    <clipPath id="right"><rect x="${MID}" y="0" width="${MID}" height="${H}"/></clipPath>
  </defs>

  <!-- grounds: day | night -->
  <rect x="0" y="0" width="${MID}" height="${H}" fill="${day.field}"/>
  <rect x="${MID}" y="0" width="${MID}" height="${H}" fill="${night.field}"/>

  <!-- DAY side -->
  <g clip-path="url(#left)">
    <text x="80" y="110" font-family="${mono}" font-size="22" letter-spacing="4" fill="${day.inkSoft}">PRISM · DAY</text>
    <!-- floating chip with 3-layer chromatic cast (135° axis) + dichroic edge -->
    <g transform="translate(150 250)">
      <rect x="26" y="34" width="300" height="190" rx="22" fill="${day.anchor}" opacity="0.30" filter="url(#cast)"/>
      <rect x="44" y="54" width="300" height="190" rx="22" fill="${day.far}" opacity="0.26" filter="url(#cast)"/>
      <rect x="14" y="22" width="300" height="190" rx="22" fill="${day.counter}" opacity="0.18" filter="url(#cast)"/>
      <rect x="0" y="0" width="300" height="190" rx="22" fill="${day.surface}"/>
      <rect x="1.25" y="1.25" width="297.5" height="187.5" rx="21" fill="none" stroke="url(#dichroic)" stroke-width="2.5"/>
      <text x="24" y="40" font-family="${mono}" font-size="15" fill="${day.inkSoft}">color on the edge,</text>
      <text x="24" y="62" font-family="${mono}" font-size="15" fill="${day.inkSoft}">quiet body</text>
      <circle cx="250" cy="135" r="34" fill="${day.dense}"/>
    </g>
  </g>

  <!-- NIGHT side -->
  <g clip-path="url(#right)">
    <text x="${MID + 80}" y="110" font-family="${mono}" font-size="22" letter-spacing="4" fill="${night.onGroundSoft}">REDSHIFT · NIGHT</text>
    <!-- chip with axis-free halo + paper edge, spectral body -->
    <g transform="translate(${MID + 150} 250)">
      <ellipse cx="150" cy="95" rx="210" ry="150" fill="${night.anchor}" opacity="0.32" filter="url(#halo)"/>
      <ellipse cx="150" cy="95" rx="240" ry="170" fill="${night.far}" opacity="0.20" filter="url(#halo)"/>
      <rect x="0" y="0" width="300" height="190" rx="22" fill="${night.surface}"/>
      <rect x="0" y="0" width="300" height="190" rx="22" fill="url(#dichroicNight)" opacity="0.12"/>
      <rect x="1.25" y="1.25" width="297.5" height="187.5" rx="21" fill="none" stroke="${night.surface}" stroke-width="2.5" opacity="0.6"/>
      <text x="24" y="40" font-family="${mono}" font-size="15" fill="${oklchHex(0.26, 0.05, 129)}">spectral body,</text>
      <text x="24" y="62" font-family="${mono}" font-size="15" fill="${oklchHex(0.26, 0.05, 129)}">paper edge</text>
      <circle cx="250" cy="135" r="34" fill="${night.surface}"/>
    </g>
  </g>

  <!-- split wordmark in the real line-work display face (Tilt Prism):
       day = dark line work on light, night = light line work on dark -->
  <g clip-path="url(#left)">
    <text x="${MID}" y="630" text-anchor="middle" font-family="${display}" font-size="128" letter-spacing="2" fill="${day.ink}">Prismatic</text>
  </g>
  <g clip-path="url(#right)">
    <text x="${MID}" y="630" text-anchor="middle" font-family="${display}" font-size="128" letter-spacing="2" fill="${night.onGround}">Prismatic</text>
  </g>

  <!-- seam -->
  <line x1="${MID}" y1="0" x2="${MID}" y2="${H}" stroke="${night.field}" stroke-width="1" opacity="0.25"/>

  <!-- band rows (clipped to each half) -->
  <g clip-path="url(#left)">${bands(80, 760, 132, 18, day, day.ink)}</g>
  <g clip-path="url(#right)">${bands(MID + 80, 760, 132, 18, night, night.onGround)}</g>

  <!-- captions -->
  <text x="80" y="918" font-family="${mono}" font-size="18" fill="${day.inkSoft}">--h 185°  ·  one anchor hue</text>
  <text x="${W - 80}" y="918" text-anchor="end" font-family="${mono}" font-size="18" fill="${night.onGroundSoft}">--hr 129°  ·  redshift(h)</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(OUT);
console.log('wrote', OUT);
