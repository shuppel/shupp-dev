/**
 * PRISM contrast audit.
 *
 * Verifies WCAG AA (4.5:1) for the body-ink-on-field and ink-soft-on-surface
 * combinations across the wheel, in both day and night modes. Reports any hue
 * band that needs the sanctioned fix: darken --ink L by up to 0.04 (never change
 * hue). Run: `node scripts/prism-contrast-audit.mjs`
 *
 * Color math is self-contained (OKLCH -> OKLab -> linear sRGB -> sRGB), so the
 * script has no dependencies and mirrors how browsers resolve the same tokens.
 */

// ---- OKLCH -> sRGB ---------------------------------------------------------
function oklchToLinearSrgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function linearToSrgb(c) {
  const cl = Math.min(Math.max(c, 0), 1);
  return cl <= 0.0031308 ? 12.92 * cl : 1.055 * cl ** (1 / 2.4) - 0.055;
}

// Relative luminance from linear-light sRGB (clamped to gamut).
function relLuminance(L, C, h) {
  const [r, g, b] = oklchToLinearSrgb(L, C, h).map((v) => Math.min(Math.max(v, 0), 1));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg, bg) {
  const L1 = relLuminance(...fg);
  const L2 = relLuminance(...bg);
  const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

// ---- Token resolvers (mirror prism.css) ------------------------------------
function redshift(h, k = 0.4) {
  if (h <= 45) return h;
  if (h > 300) return Math.round((h + (385 - h) * k) % 360);
  return Math.round(h - (h - 45) * k);
}

// [L, C, hue] for the role tokens, parameterized by anchor hue.
const day = (h) => ({
  field: [0.962, 0.008, h],
  surface: [0.985, 0.005, h],
  ink: [0.28, 0.03, h],
  inkSoft: [0.48, 0.035, h],
});
const night = (h) => {
  const hr = redshift(h);
  return {
    field: [0.235, 0.052, hr],
    surface: [0.875, 0.045, hr - 60],
    ink: [0.26, 0.05, hr], // text on the (light) surface
    inkSoft: [0.4, 0.05, hr],
    onGround: [0.88, 0.035, hr - 60], // text on the (dark) field
  };
};

const HUES = [20, 60, 90, 150, 185, 260, 310];
const AA = 4.5;

function fmt(n) {
  return n.toFixed(2).padStart(5);
}

let needsFix = [];
console.log('PRISM contrast audit — WCAG AA target 4.5:1\n');

for (const mode of ['day', 'night']) {
  console.log(`== ${mode.toUpperCase()} ==`);
  for (const h of HUES) {
    const t = mode === 'day' ? day(h) : night(h);
    const pairs =
      mode === 'day'
        ? [
            ['ink/field', t.ink, t.field],
            ['inkSoft/surface', t.inkSoft, t.surface],
          ]
        : [
            ['ink/surface', t.ink, t.surface],
            ['onGround/field', t.onGround, t.field],
          ];
    const out = pairs
      .map(([label, fg, bg]) => {
        const r = contrast(fg, bg);
        const flag = r >= AA ? 'AA ' : 'XX ';
        if (r < AA) needsFix.push({ mode, h, label, r });
        return `${label} ${fmt(r)} ${flag}`;
      })
      .join('  |  ');
    console.log(`  h=${String(h).padStart(3)}  ${out}`);
  }
  console.log('');
}

if (needsFix.length === 0) {
  console.log('RESULT: AA holds on all tested hues in both modes. No ink-darkening fix needed.');
} else {
  console.log('RESULT: bands below AA (apply up to -0.04 ink L for these hue ranges):');
  for (const f of needsFix) {
    console.log(`  ${f.mode} h=${f.h} ${f.label} = ${f.r.toFixed(2)}`);
  }
  process.exitCode = 1;
}
