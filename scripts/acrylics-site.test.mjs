import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { schemeCss, digitalCoat } from '../public/acrylics/site-state.mjs';
const tokens = JSON.parse(readFileSync(new URL('../public/acrylics/acrylics.tokens.json', import.meta.url)));
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(channel => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a, b) {
  const levels = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (levels[0] + 0.05) / (levels[1] + 0.05);
}
for (const [name, scheme] of Object.entries(tokens.schemes)) {
  test(`${name}: semantic text pairs retain at least 4.5:1 contrast`, () => {
    const r = scheme.roles;
    for (const [foreground, background] of [['ink','field'], ['ink','surface'], ['muted','field'], ['muted','surface'], ['on-accent','accent'], ['on-highlight','highlight'], ['success','surface'], ['danger','surface']]) {
      assert.ok(contrast(r[foreground], r[background]) >= 4.5, `${name} ${foreground}/${background}: ${contrast(r[foreground], r[background]).toFixed(2)}`);
    }
    assert.ok(contrast(r.focus, r.surface) >= 3, 'Focus ring contrast');
  });
}
test('scheme export preserves every semantic role, including paired action text and focus', () => {
  for (const scheme of Object.values(tokens.schemes)) {
    const css = schemeCss(scheme);
    assert.ok(css.includes(`color-scheme: ${scheme.colorScheme};`));
    for (const [role, value] of Object.entries(scheme.roles)) assert.ok(css.includes(`--ac-${role}: ${value};`));
  }
});
test('digital multiply preserves the zero-coat endpoint and differs from the pigment example', () => {
  assert.equal(digitalCoat('#D63228', '#174C3C', 0), '#D63228');
  assert.equal(digitalCoat('#D63228', '#FFFFFF', 1), '#D63228');
  assert.equal(digitalCoat('#D63228', '#000000', 1), '#000000');
  assert.equal(digitalCoat('#D63228', '#174C3C', 0.5), '#752019');
  assert.notEqual(digitalCoat('#D63228', '#174C3C', 0.5), '#4B3E34');
});
