import test from 'node:test';
import assert from 'node:assert/strict';
import { blend, fromHex, toHex, stackColor, vertices, contains, sample, palette, makePreset } from '../public/acrylics/math.mjs';

const near = (a, b) => a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < 1e-10, `${v} != ${b[i]}`));
test('zero opacity is identity for every mode', () => {
  for (const mode of ['multiply', 'screen', 'normal']) near(blend([.2, .4, .6], [.8, .1, .3], 0, mode), [.2, .4, .6]);
});
test('multiply white and screen black leave the backdrop unchanged', () => {
  near(blend([.2, .4, .6], [1, 1, 1], .72, 'multiply'), [.2, .4, .6]);
  near(blend([.2, .4, .6], [0, 0, 0], .72, 'screen'), [.2, .4, .6]);
});
test('independently calculated RGB examples', () => {
  near(blend([.2, .4, .8], [.5, .25, .1], .5, 'multiply'), [.15, .25, .44]);
  near(blend([.2, .4, .8], [.5, .25, .1], .5, 'screen'), [.4, .475, .81]);
  near(blend([.2, .4, .8], [.5, .25, .1], .5, 'normal'), [.35, .325, .45]);
});
test('opaque normal coat covers everything below; coat order matters', () => {
  const layers = [{ color: '#FF0000', alpha: 1 }, { color: '#0000FF', alpha: 1 }];
  assert.equal(toHex(stackColor(layers, '#FFFFFF', 'normal')), '#0000FF');
  assert.equal(toHex(stackColor(layers.toReversed(), '#FFFFFF', 'normal')), '#FF0000');
});
test('multiply and screen commute on an opaque ground even at different opacities', () => {
  const layers = [{ color: '#A514FA', alpha: .42 }, { color: '#B5D12A', alpha: .87 }];
  for (const mode of ['multiply', 'screen']) near(stackColor(layers, '#FFF9ED', mode), stackColor(layers.toReversed(), '#FFF9ED', mode));
});
test('hex conversion round-trips channels and bounds rounded output', () => {
  for (const h of ['#000000', '#FFFFFF', '#F66A9A', '#32BBDD']) assert.equal(toHex(fromHex(h)), h);
  assert.equal(toHex([-1, .5, 2]), '#0080FF');
});
test('geometry and hit testing agree after rotation, stretch, and translation', () => {
  const shape = { ...makePreset('orbit')[0], shape: 'superellipse', size: 100, aspect: 2, x: 400, y: 300, rotation: 90, exponent: 8 };
  const points = vertices(shape);
  assert.ok(contains(points, 400, 300));
  assert.ok(contains(points, 400, 480));
  assert.equal(contains(points, 580, 300), false);
  assert.equal(contains(points, 400, 510), false);
});
test('all shape families contain their centers; distant probe returns only ground', () => {
  for (const name of ['overprint', 'orbit', 'bloom']) {
    const layers = makePreset(name);
    for (const layer of layers) assert.ok(contains(vertices(layer), layer.x, layer.y));
    assert.equal(sample(layers, '#FFF9ED', 'multiply', { x: -1000, y: -1000 }).steps.length, 0);
  }
});
test('sampling respects visible geometry and ignores a zero-opacity coat', () => {
  const layers = makePreset('overprint').map((l) => ({ ...l, shape: 'circle', x: 500, y: 375 }));
  layers[1].alpha = 0;
  const picked = sample(layers, '#FFF9ED', 'multiply', { x: 500, y: 375 });
  assert.deepEqual(picked.steps.map((s) => s.id), ['A', 'C']);
  near(picked.color, stackColor(layers, '#FFF9ED', 'multiply'));
});
test('palette contains all eight subsets, in the current layer order', () => {
  const layers = makePreset('bloom');const p = palette(layers, '#FFF9ED', 'normal');
  assert.equal(p.length, 8);assert.equal(p[0].color, '#FFF9ED');
  assert.equal(p[7].label, 'A + B + C');
  assert.equal(p[7].color, toHex(stackColor(layers, '#FFF9ED', 'normal')));
});
