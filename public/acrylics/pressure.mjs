// A chosen gesture envelope, not a simulation of brush mechanics. t is
// normalized distance along a stroke, not elapsed time or pointer event count.
/** @typedef {{ min: number, max: number, peak: number, spread: number }} PressureProfile */
/** @type {Readonly<Record<'swell' | 'drag', Readonly<PressureProfile>>>} */
export const PRESSURE_PROFILES = Object.freeze({
  swell: Object.freeze({ min: 8, max: 132, peak: 0.44, spread: 0.2 }),
  drag: Object.freeze({ min: 8, max: 124, peak: 0.23, spread: 0.22 }),
});

export function gaussianPressure(t, { peak = 0.44, spread = 0.2 } = {}) {
  if (
    !Number.isFinite(t) ||
    !Number.isFinite(peak) ||
    !Number.isFinite(spread) ||
    spread <= 0
  )
    throw new RangeError(
      "Pressure requires finite values and a positive spread.",
    );
  return Math.exp(-0.5 * ((Math.max(0, Math.min(1, t)) - peak) / spread) ** 2);
}

export function strokeWidth(t, profile = PRESSURE_PROFILES.swell) {
  return (
    profile.min + (profile.max - profile.min) * gaussianPressure(t, profile)
  );
}

const round = (n) => Math.round(n * 100) / 100;
const center = (t) => 79 + Math.sin(t * Math.PI * 2) * 6 - t * 3;
const jitter = (t, seed) =>
  Math.sin(t * 73 + seed) * 0.018 + Math.sin(t * 137 + seed * 1.7) * 0.012;

// The filled outline changes width. Roughness is a smaller, separate signal.
// Fractions select a bristle ribbon within that outline.
export function strokeOutline(
  profile = PRESSURE_PROFILES.swell,
  seed = 17,
  top = -1,
  bottom = 1,
) {
  const edge = (side) =>
    Array.from({ length: 81 }, (_, i) => {
      const t = i / 80;
      const halfWidth = strokeWidth(t, profile) / 2;
      return [
        round(12 + t * 616),
        round(center(t) + halfWidth * side * (1 + jitter(t, seed + side * 3))),
      ];
    });
  return (
    [...edge(top), ...edge(bottom).reverse()]
      .map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`)
      .join(" ") + " Z"
  );
}

export function strokeSvg(profile = PRESSURE_PROFILES.swell, seed = 17) {
  const outline = strokeOutline(profile, seed);
  // Translucent ribbons follow the expanding brush, with independent starts,
  // widths and gaps. They are stable across re-renders and scheme changes.
  const ribbons = Array.from({ length: 29 }, (_, i) => {
    const top = -0.99 + i * 0.068;
    const bottom = Math.min(
      1,
      top + 0.047 + (Math.sin(i * 7 + seed) + 1) * 0.009,
    );
    const opacity = round(0.26 + (Math.sin(i * 13 + seed) + 1) * 0.28);
    return `<path d="${strokeOutline(profile, seed + i, top, bottom)}" opacity="${opacity}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160" preserveAspectRatio="none" aria-hidden="true"><g fill="currentColor"><path d="${outline}" opacity=".32"/>${ribbons}</g></svg>`;
}
