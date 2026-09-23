// Digital compositing on an opaque ground, in sRGB channel values [0, 1].
// W3C Compositing and Blending Level 1, sections 6 and 10.1.
// This is a visual paint metaphor, not a spectral pigment simulation.
export const WIDTH = 1000;
export const HEIGHT = 750;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const fromHex = (hex) => hex.slice(1).match(/../g).map((v) => parseInt(v, 16) / 255);
export const toHex = (rgb) => '#' + rgb.map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

export function blend(backdrop, source, alpha, mode) {
  return backdrop.map((b, i) => {
    const s = source[i];
    const mixed = mode === 'multiply' ? b * s : mode === 'screen' ? 1 - (1 - b) * (1 - s) : s;
    return (1 - alpha) * b + alpha * mixed;
  });
}

export function stackColor(layers, ground, mode) {
  return layers.reduce((color, layer) => blend(color, fromHex(layer.color), layer.alpha, mode), fromHex(ground));
}

// Rendering and hit testing use the same tessellation. Round forms are
// polygonal approximations (192 segments).
export function vertices(layer) {
  const count = layer.shape === 'polygon' ? layer.sides : 192;
  const angle = layer.rotation * Math.PI / 180;
  const ca = Math.cos(angle), sa = Math.sin(angle);
  return Array.from({ length: count }, (_, i) => {
    const t = i / count * Math.PI * 2 - Math.PI / 2;
    let x, y;
    if (layer.shape === 'rosette') {
      const radius = layer.size * (0.76 + 0.24 * Math.cos(layer.petals * (t + Math.PI / 2)));
      x = Math.cos(t) * radius * layer.aspect;
      y = Math.sin(t) * radius;
    } else if (layer.shape === 'polygon') {
      x = Math.cos(t) * layer.size * layer.aspect;
      y = Math.sin(t) * layer.size;
    } else {
      const exponent = layer.shape === 'circle' ? 2 : layer.exponent;
      x = Math.sign(Math.cos(t)) * Math.abs(Math.cos(t)) ** (2 / exponent) * layer.size * layer.aspect;
      y = Math.sign(Math.sin(t)) * Math.abs(Math.sin(t)) ** (2 / exponent) * layer.size;
    }
    return [layer.x + x * ca - y * sa, layer.y + x * sa + y * ca];
  });
}

export function contains(points, x, y) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i], [xj, yj] = points[j];
    if (((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function sample(layers, ground, mode, point) {
  let color = fromHex(ground);
  const steps = [];
  for (const layer of layers) {
    if (layer.alpha === 0 || !contains(vertices(layer), point.x, point.y)) continue;
    const before = color;
    color = blend(color, fromHex(layer.color), layer.alpha, mode);
    steps.push({ id: layer.id, color: layer.color, alpha: layer.alpha, before, after: color });
  }
  return { color, steps };
}

export function palette(layers, ground, mode) {
  return Array.from({ length: 1 << layers.length }, (_, mask) => {
    const subset = layers.filter((_, i) => mask & (1 << i));
    return { label: subset.map((l) => l.id).join(' + ') || 'Ground', color: toHex(stackColor(subset, ground, mode)) };
  });
}

export function makePreset(name) {
  const layer = (id, color, x, y, shape, extra = {}) => ({ id, color, x, y, shape, alpha: 0.72, size: 245, aspect: 1, rotation: 0, exponent: 4, sides: 3, petals: 5, ...extra });
  const presets = {
    overprint: [layer('A', '#F66A9A', 360, 320, 'circle'), layer('B', '#32BBDD', 635, 350, 'superellipse', { rotation: 18 }), layer('C', '#F9D834', 475, 490, 'polygon', { size: 265, rotation: 18 })],
    orbit: [layer('A', '#F27648', 430, 375, 'circle', { aspect: 1.48, rotation: -38, size: 220 }), layer('B', '#498BDC', 570, 380, 'circle', { aspect: 0.55, rotation: -35, size: 300 }), layer('C', '#EED445', 535, 400, 'circle', { size: 135 })],
    bloom: [layer('A', '#F85E51', 400, 340, 'rosette', { petals: 7, size: 290 }), layer('B', '#46C2CA', 580, 385, 'rosette', { petals: 5, size: 280, rotation: 25 }), layer('C', '#E6D94C', 450, 445, 'superellipse', { exponent: 2.5, size: 190, rotation: -20 })],
  };
  return structuredClone(presets[name] || presets.overprint);
}
