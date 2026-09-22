import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  PRESSURE_PROFILES,
  gaussianPressure,
  strokeWidth,
  strokeOutline,
  strokeSvg,
} from "../public/acrylics/pressure.mjs";
import {
  PaintSurface,
  paintGesture,
} from "../public/acrylics/paint-engine.mjs";

test("Gaussian peaks at μ; σ broadens the gesture without changing its maximum", () => {
  assert.equal(gaussianPressure(0.44), 1);
  assert.ok(
    gaussianPressure(0.1, { spread: 0.3 }) >
      gaussianPressure(0.1, { spread: 0.15 }),
  );
  assert.ok(
    gaussianPressure(0.2, { peak: 0.2 }) > gaussianPressure(0.8, { peak: 0.2 }),
  );
  assert.equal(strokeWidth(0.44), 132);
  assert.throws(() => gaussianPressure(0.5, { spread: 0 }), RangeError);
});

test("SVG silhouette widens in the middle and tapers independently of edge roughness", () => {
  const vertices = [
    ...strokeOutline().matchAll(/[ML]([\d.-]+),([\d.-]+)/g),
  ].map((match) => [+match[1], +match[2]]);
  const widthAt = (i) => vertices[vertices.length - 1 - i][1] - vertices[i][1];
  assert.ok(widthAt(35) > widthAt(0) * 4);
  assert.ok(widthAt(35) > widthAt(80) * 8);
  const narrow = strokeOutline({ ...PRESSURE_PROFILES.swell, max: 40 });
  assert.notEqual(narrow, strokeOutline());
  assert.equal(strokeSvg(), strokeSvg());
  assert.notEqual(strokeSvg(undefined, 4), strokeSvg());
});

test("committed masks use the same pressure geometry as the live reference", async () => {
  for (const [name, profile] of Object.entries(PRESSURE_PROFILES)) {
    const filename = name === "swell" ? "stroke.svg" : `stroke-${name}.svg`;
    const committed = await readFile(
      new URL(`../public/acrylics/${filename}`, import.meta.url),
      "utf8",
    );
    assert.equal(committed.trim(), strokeSvg(profile));
  }
});

const brush = {
  color: "#D63228",
  size: 80,
  load: 1,
  roughness: 0,
  pressure: 1,
  tool: "brush",
};
const widthAt = (surface, x) => {
  const painted = Array.from({ length: surface.height }, (_, y) => y).filter(
    (y) => surface.mass[y * surface.width + x] > 0.002,
  );
  return painted.length ? painted.at(-1) - painted[0] + 1 : 0;
};

test("painted preset cross-sections visibly swell and taper", () => {
  const surface = new PaintSurface(340, 120, 7);
  paintGesture(
    surface,
    [
      [20, 60],
      [120, 60],
      [220, 60],
      [320, 60],
    ],
    brush,
  );
  assert.ok(widthAt(surface, 150) > widthAt(surface, 35) * 2);
  assert.ok(widthAt(surface, 150) > widthAt(surface, 300) * 3);
});

test("a live pressure change widens actual paint and interpolates between events", () => {
  const sparse = new PaintSurface(260, 120, 7),
    dense = new PaintSurface(260, 120, 7);
  for (const surface of [sparse, dense]) surface.begin(20, 60, brush, 0.1);
  sparse.move(240, 60, 1);
  for (let x = 30; x <= 240; x += 10)
    dense.move(x, 60, 0.1 + (0.9 * (x - 20)) / 220);
  assert.ok(widthAt(sparse, 220) > widthAt(sparse, 40) * 2);
  const difference = sparse.mass.reduce(
    (sum, value, i) => sum + Math.abs(value - dense.mass[i]),
    0,
  );
  assert.ok(
    difference < 0.001,
    `Event density changed deposit by ${difference}`,
  );
});
