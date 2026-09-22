import { Color, mix } from './spectral.mjs';
import { gaussianPressure } from './pressure.mjs';

export const PAINT_WIDTH = 760;
export const PAINT_HEIGHT = 480;
export const TUBES = [
  ['Vermilion', '#D63228'], ['Forest green', '#174C3C'],
  ['Ochre', '#E2B72D'], ['Ultramarine', '#285799'],
  ['Warm white', '#F4EEE1'], ['Carbon', '#27292B'],
];
const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
export const rgb = (hex) => hex.slice(1).match(/../g).map((v) => parseInt(v, 16));
export const hex = (values) => '#' + values.slice(0, 3).map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase();

// A stable spatial hash: marks do not change when the canvas redraws.
export function noise(x, y, seed = 1) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 69069);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function softNoise(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = noise(ix, iy, seed), b = noise(ix + 1, iy, seed);
  const c = noise(ix, iy + 1, seed), d = noise(ix + 1, iy + 1, seed);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}

export function pigmentMix(a, b, fraction) {
  if (fraction <= 0) return a.slice();
  if (fraction >= 1) return b.slice();
  if (a.every((c, i) => c === b[i])) return a.slice();
  return mix([new Color(a), 1 - fraction], [new Color(b), fraction]).sRGB.map((v) => Math.round(clamp(v, 0, 255)));
}

// The live brush uses a bounded, quantized cache. The comparison swatches use
// the full spectral calculation. This is a pigment-inspired visual model,
// not measured paint chemistry or a fluid solver.
class Mixer {
  constructor() { this.values = new Map(); this.colors = new Map(); }
  color(value) {
    const key = value.join(',');
    if (!this.colors.has(key)) {
      if (this.colors.size >= 2048) this.colors.clear();
      this.colors.set(key, new Color(value));
    }
    return this.colors.get(key);
  }
  mix(a, b, t) {
    if (a.every((v, i) => Math.abs(v - b[i]) < 3)) return b;
    const qa = a.map((v) => Math.min(255, Math.round(v / 8) * 8));
    const qt = Math.max(1, Math.min(31, Math.round(t * 32))) / 32;
    const key = `${qa}/${b}/${qt}`;
    let result = this.values.get(key);
    if (!result) {
      result = mix([this.color(qa), 1 - qt], [this.color(b), qt]).sRGB.map((v) => Math.round(clamp(v, 0, 255)));
      if (this.values.size >= 24000) this.values.clear();
      this.values.set(key, result);
    }
    return result;
  }
}

export class PaintSurface {
  constructor(width = PAINT_WIDTH, height = PAINT_HEIGHT, seed = 41) {
    this.width = width;
    this.height = height;
    this.seed = seed;
    this.count = width * height;
    this.base = new Uint8ClampedArray(this.count * 3);
    this.pigment = new Uint8ClampedArray(this.count * 3);
    this.mass = new Float32Array(this.count);
    this.mixer = new Mixer();
    this.stroke = null;
    this.clear();
  }

  clear() {
    this.mass.fill(0);
    this.pigment.fill(0);
    this.stroke = null;
    for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
      const i = (y * this.width + x) * 3;
      const grain = (noise(x, y, 7) - .5) * 6 + (x % 3 === 0 ? -1.4 : .4) + (y % 4 === 0 ? -1 : .3);
      this.base[i] = 248 + grain;
      this.base[i + 1] = 240 + grain;
      this.base[i + 2] = 221 + grain;
    }
  }

  snapshot() {
    return { base: this.base.slice(), pigment: this.pigment.slice(), mass: this.mass.slice(), seed: this.seed };
  }

  restore(state) {
    this.base.set(state.base);
    this.pigment.set(state.pigment);
    this.mass.set(state.mass);
    this.seed = state.seed;
    this.stroke = null;
  }

  pixels() {
    const out = new Uint8ClampedArray(this.count * 4);
    for (let i = 0; i < this.count; i++) {
      const cover = 1 - Math.exp(-this.mass[i] * 2.8);
      // Small relief cue from deposited thickness, with a consistent light.
      const left = i % this.width === 0 ? this.mass[i] : this.mass[i - 1];
      const relief = clamp((this.mass[i] - left) * .12, -.055, .055);
      for (let c = 0; c < 3; c++) out[i * 4 + c] = this.base[i * 3 + c] * (1 - cover) + clamp(this.pigment[i * 3 + c] * (1 + relief), 0, 255) * cover;
      out[i * 4 + 3] = 255;
    }
    return out;
  }

  dry() {
    const rendered = this.pixels();
    for (let i = 0; i < this.count; i++) for (let c = 0; c < 3; c++) this.base[i * 3 + c] = rendered[i * 4 + c];
    this.mass.fill(0);
    this.pigment.fill(0);
  }

  begin(x, y, settings, pressure = 1) {
    this.stroke = {
      color: rgb(settings.color), size: settings.size, load: settings.load,
      roughness: settings.roughness, tool: settings.tool, pressure: settings.pressure,
      seed: ++this.seed, distance: 0, remainder: 0, x, y, angle: -.18, pointerPressure: pressure,
    };
    this.dab(x, y, -.18, pressure);
    if (settings.tool === 'blot') {
      // Satellites come from the same seed and pigment as the main deposit.
      const radius = settings.size * .5;
      for (let j = 0; j < 11; j++) {
        const angle = noise(j, 3, this.seed) * Math.PI * 2;
        const reach = radius * (1.03 + noise(j, 8, this.seed) * .55);
        const old = this.stroke.size;
        this.stroke.size = 2 + noise(j, 11, this.seed) * settings.size * .09;
        this.dab(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach, angle, pressure);
        this.stroke.size = old;
      }
    }
  }

  move(x, y, pressure = 1) {
    const s = this.stroke;
    if (!s) return;
    const dx = x - s.x, dy = y - s.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) { s.pointerPressure = pressure; return; }
    const spacing = Math.max(2, s.size * .065);
    const angle = Math.atan2(dy, dx);
    const before = s.distance;
    for (let travel = spacing - s.remainder; travel <= distance; travel += spacing) {
      s.distance = before + travel;
      const interpolatedPressure = s.pointerPressure + (pressure - s.pointerPressure) * travel / distance;
      this.dab(s.x + dx * travel / distance, s.y + dy * travel / distance, angle, interpolatedPressure);
    }
    s.distance = before + distance;
    s.remainder = (s.remainder + distance) % spacing;
    s.x = x; s.y = y; s.angle = angle; s.pointerPressure = pressure;
  }

  end() { this.stroke = null; }

  dab(cx, cy, angle, pointerPressure) {
    const s = this.stroke;
    if (!s) return;
    const p = clamp(pointerPressure * s.pressure, .08, 1);
    const blot = s.tool === 'blot';
    const radius = s.size * (blot ? .27 + .28 * p : .06 + .49 * p);
    const dry = s.tool === 'dry';
    const reach = radius * (blot ? 1.22 : 1.08);
    const ca = Math.cos(angle), sa = Math.sin(angle);
    const depletion = Math.max(.035, Math.exp(-s.distance / (s.size * (dry ? 1.8 : 4.5) * (.4 + s.load))));
    const load = s.load * depletion;
    const x0 = Math.max(0, Math.floor(cx - reach)), x1 = Math.min(this.width - 1, Math.ceil(cx + reach));
    const y0 = Math.max(0, Math.floor(cy - reach)), y1 = Math.min(this.height - 1, Math.ceil(cy + reach));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const dx = x - cx, dy = y - cy;
      const u = (-dx * sa + dy * ca) / radius;
      const v = (dx * ca + dy * sa) / radius;
      const local = Math.atan2(dy, dx);
      let shape, tooth, rim = 1;
      if (blot) {
        const boundary = 1 + .12 * Math.sin(5 * local + s.seed) + .075 * Math.sin(9 * local + s.seed * .7) + .045 * Math.sin(17 * local);
        const r = Math.hypot(dx, dy) / radius / boundary;
        if (r > 1) continue;
        shape = clamp((1 - r) * 19);
        rim = r > .78 ? 1.9 : 1;
        tooth = .6 + .4 * softNoise(x / 14, y / 14, s.seed);
      } else {
        const edge = 1 + .05 * Math.sin(u * 29 + s.seed) + .035 * Math.sin(v * 41 + s.seed);
        const r = Math.sqrt(u * u + (v / .36) ** 2) / edge;
        if (r > 1) continue;
        shape = clamp((1 - r) * 12);
        const bristle = noise(Math.floor((u + 1) * radius * .48), 1, s.seed);
        const track = .5 + .5 * Math.sin(u * radius * 2.4 + s.seed);
        tooth = dry ? clamp((bristle - .43) * 2.8) * (.25 + .75 * track) : .18 + .82 * bristle;
      }
      const grain = noise(x, y, 7);
      const patch = softNoise(x / 11, y / 11, s.seed);
      const skip = dry ? .35 + s.roughness * .32 + (1 - load) * .12 : .003 + s.roughness * .012 + (1 - load) ** 2 * .05;
      if (grain < skip || (dry && patch < .18)) continue;
      const uneven = (1 - s.roughness) + s.roughness * (.22 + .78 * patch) * (.55 + .45 * grain);
      const deposit = shape * tooth * uneven * load * p * (blot ? 1.1 : dry ? .62 : .55) * rim;
      if (deposit < .002) continue;
      const i = y * this.width + x, c = i * 3;
      const amount = this.mass[i];
      const incoming = amount < .001 ? s.color : this.mixer.mix([this.pigment[c], this.pigment[c + 1], this.pigment[c + 2]], s.color, deposit / (amount + deposit));
      this.pigment[c] = incoming[0]; this.pigment[c + 1] = incoming[1]; this.pigment[c + 2] = incoming[2];
      this.mass[i] = Math.min(5, amount + deposit);
    }
  }
}

export function paintGesture(surface, points, settings) {
  if (!points.length) return;
  const samples = [points[0]];
  const distances = [0];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)], p1 = points[i];
    const p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    for (let step = 1; step <= 12; step++) {
      const t = step / 12;
      const xy = [0, 1].map((axis) => .5 * ((2 * p1[axis]) + (-p0[axis] + p2[axis]) * t + (2 * p0[axis] - 5 * p1[axis] + 4 * p2[axis] - p3[axis]) * t * t + (-p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]) * t * t * t));
      const previous = samples[samples.length - 1];
      distances.push(distances[distances.length - 1] + Math.hypot(xy[0] - previous[0], xy[1] - previous[1]));
      samples.push(xy);
    }
  }
  const length = distances[distances.length - 1];
  // Preset gestures know their full path. Hardware pen pressure remains direct.
  const pressure = (i) => length ? gaussianPressure(distances[i] / length) : 1;
  surface.begin(samples[0][0], samples[0][1], settings, pressure(0));
  for (let i = 1; i < samples.length; i++) surface.move(samples[i][0], samples[i][1], pressure(i));
  surface.end();
}

export function seedStudy(surface, seed = 41) {
  surface.seed = seed;
  surface.clear();
  const scaleX = surface.width / PAINT_WIDTH, scaleY = surface.height / PAINT_HEIGHT;
  const gesture = (points, color, size, tool = 'brush', load = .95) => paintGesture(surface, points.map(([x, y]) => [x * scaleX, y * scaleY]), { color, size: size * scaleX, tool, load, roughness: .58, pressure: .85 });
  gesture([[100, 145], [185, 100], [300, 110], [410, 165], [550, 155], [656, 210]], '#D63228', 150);
  gesture([[170, 352], [230, 290], [330, 265], [410, 295], [515, 305], [625, 265]], '#E2B72D', 145);
  gesture([[320, 76], [338, 135], [387, 194], [436, 228], [472, 320], [548, 365]], '#174C3C', 130);
  gesture([[604, 100]], '#285799', 125, 'blot');
  gesture([[150, 234], [237, 210], [320, 224], [409, 258], [535, 240]], '#F4EEE1', 89, 'dry', .8);
  gesture([[626, 376]], '#D63228', 54, 'blot', .8);
}
