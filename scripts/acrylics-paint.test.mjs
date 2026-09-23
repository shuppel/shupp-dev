import test from 'node:test';
import assert from 'node:assert/strict';
import { PaintSurface, pigmentMix, rgb, hex, paintGesture } from '../public/acrylics/paint-engine.mjs';

const red = rgb('#D63228'), green = rgb('#174C3C');
const brush = { color: '#D63228', size: 48, load: .9, roughness: .6, pressure: .85, tool: 'brush' };
const stroke = (p, settings = brush) => paintGesture(p, [[30, 50], [80, 45], [145, 55], [195, 50]], settings);
const sum = (values) => values.reduce((a, b) => a + b, 0);

test('pigment mixing preserves endpoints and identical pigments', () => {
  assert.deepEqual(pigmentMix(red, green, 0), red);
  assert.deepEqual(pigmentMix(red, green, 1), green);
  assert.deepEqual(pigmentMix(red, red, .5), red);
});

test('forest green mutes vermilion; the mix differs from RGB averaging', () => {
  const muted = pigmentMix(red, green, .5);
  const chroma = (a) => Math.max(...a) - Math.min(...a);
  assert.ok(chroma(muted) < chroma(red) * .3);
  assert.ok(muted[0] < red[0] * .5);
  assert.notEqual(hex(muted), hex(red.map((v, i) => (v + green[i]) / 2)));
});

test('ochre and blue mix toward green', () => {
  const result = pigmentMix(rgb('#E2B72D'), rgb('#285799'), .5);
  assert.ok(result[1] > result[0] && result[1] > result[2]);
});

test('seeded texture is repeatable and redraw does not change the paint', () => {
  const a = new PaintSurface(220, 100, 7), b = new PaintSurface(220, 100, 7);
  stroke(a); stroke(b);
  assert.deepEqual(a.pixels(), b.pixels());
  assert.deepEqual(a.pixels(), a.pixels());
  const c = new PaintSurface(220, 100, 8); stroke(c);
  assert.notDeepEqual(a.mass, c.mass);
});

test('drying preserves the image and removes mixable wet pigment', () => {
  const p = new PaintSurface(220, 100); stroke(p);
  const before = p.pixels(); p.dry();
  assert.equal(sum(p.mass), 0);
  assert.deepEqual(before, p.pixels());
});

test('a wet overlap mixes while a dried undercoat remains beneath new paint', () => {
  const wet = new PaintSurface(160, 120), dry = new PaintSurface(160, 120);
  const blot = { ...brush, tool: 'blot', size: 80, roughness: 0 };
  for (const p of [wet, dry]) { p.begin(80, 60, blot); p.end(); }
  dry.dry();
  for (const p of [wet, dry]) { p.begin(80, 60, { ...blot, color: '#174C3C' }); p.end(); }
  const c = (60 * 160 + 80) * 3;
  assert.deepEqual(Array.from(dry.pigment.slice(c, c + 3)), green);
  assert.notDeepEqual(Array.from(wet.pigment.slice(c, c + 3)), green);
  assert.notDeepEqual(wet.pixels(), dry.pixels());
});

test('undo snapshot restores color, thickness, dry ground, and texture seed', () => {
  const p = new PaintSurface(220, 100); stroke(p);
  const saved = p.snapshot(), before = p.pixels();
  p.dry(); stroke(p, { ...brush, color: '#174C3C' }); p.clear();
  p.restore(saved);
  assert.deepEqual(p.pixels(), before);
  assert.equal(p.seed, saved.seed);
});

test('dry bristles deposit less paint and leave more untouched canvas', () => {
  const wet = new PaintSurface(220, 100), dry = new PaintSurface(220, 100);
  stroke(wet); stroke(dry, { ...brush, tool: 'dry' });
  assert.ok(sum(dry.mass) < sum(wet.mass) * .5);
  assert.ok(dry.mass.filter((v) => v > .01).length < wet.mass.filter((v) => v > .01).length);
});

test('paint runs low along a long stroke', () => {
  const p = new PaintSurface(420, 100);
  p.begin(20, 50, { ...brush, size: 35 }); p.move(400, 50); p.end();
  const mean = (left, right) => {
    let total = 0;
    for (let y = 35; y < 65; y++) for (let x = left; x < right; x++) total += p.mass[y * p.width + x];
    return total / (right - left);
  };
  assert.ok(mean(300, 360) < mean(50, 110) * .5);
});

test('stroke spacing stays consistent across different pointer event densities', () => {
  const a = new PaintSurface(220, 100), b = new PaintSurface(220, 100);
  for (const p of [a, b]) p.begin(20, 50, brush);
  a.move(200, 50);
  for (let x = 23; x <= 200; x += 3) b.move(x, 50);
  assert.ok(Math.abs(sum(a.mass) - sum(b.mass)) < .001);
});

test('corner blots stay inside the buffer and pressure changes deposited mass', () => {
  const low = new PaintSurface(100, 80), high = new PaintSurface(100, 80);
  low.begin(0, 0, { ...brush, tool: 'blot' }, .2);
  high.begin(0, 0, { ...brush, tool: 'blot' }, 1);
  assert.ok(sum(low.mass) < sum(high.mass));
  assert.equal(high.pixels().length, 100 * 80 * 4);
  assert.ok(high.mass.every(Number.isFinite));
});
