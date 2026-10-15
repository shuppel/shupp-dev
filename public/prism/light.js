/* ============================================================
   PRISM v0.8 — the light (optional ES module)
   <script type="module" src="/prism/light.js"></script>

   One pointer light, solved as a 2D radiance field with radiance
   cascades (A. Sannikov, 2023 — https://radiance.wiki/).

   - The pointer emits four band-colored sources, dispersed across
     the cast axis, so every shadow edge splits into spectra.
   - Every card is glass. Its transmittance is its density tier:
     transient 0.6, standing 0.3, immovable 0.05. Tables default to
     standing, screens to immovable; override with
     data-light="transient|standing|immovable|none".
   - Cascade n: probe spacing 2^n texels, 4^(n+1) rays per probe,
     interval L0·[(4^n−1)/3, (4^(n+1)−1)/3). Merged top-down with
     L(a→c) = L(a→b) + T(a→b)·L(b→c). Memory is constant per cascade.
   - Each update solves twice, with and without cards; their ratio is
     visibility. Day shows only blocked light (multiply), so open field
     keeps its exact color; night shows the glow (screen).
   - The field is re-solved only when the light crosses a c0 probe,
     a card moves, or the hue/mode changes. Idle = zero GPU work.

   It also drives the v0.7 reference beam: six @property refs on
   :root, written at most once per frame, only on quantum crossings.
   Without WebGL2 (or float render targets) only the refs run.
   With reduced motion the light stays at rest; the field still
   follows scroll.
   ============================================================ */

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

const MAX_RECTS = 64;
const OCCLUDERS = '.prism-card, .prism-holo, .prism-screen, .prism-swatch, .prism-table, .guide-table-wrap, [data-light]';
const TRANSMITTANCE = { transient: 0.6, standing: 0.3, immovable: 0.05 };
const TEXELS_LONG_SIDE = 320; // field resolution budget (long side, in texels); coarsens if solves run under 30fps
const EMIT_RADIUS = 9;        // CSS px per source
const EMIT_SPREAD = 15;       // CSS px between dispersed sources
const EMISSION = 55;          // per-source radiance; fluence ∝ E·ρ/r, so scale-free
const SHADOW_DEPTH = 0.16;    // day: the most a shadow may darken the field (mean channel)
const GLOW = 0.22;            // night: the most the light may lift the field

/* ---------------------------------------------------------------- shaders */

const VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// Scene: signed distance to the nearest card (texels) + that card's transmittance.
const SDF = `#version 300 es
precision highp float;
uniform vec4 uRect[${MAX_RECTS}];  // x0 y0 x1 y1, field texels, y up
uniform vec2 uShape[${MAX_RECTS}]; // corner radius, transmittance
uniform int uCount;
out vec4 o;
void main() {
  vec2 p = gl_FragCoord.xy;
  float d = 1e4, t = 1.0;
  for (int i = 0; i < ${MAX_RECTS}; i++) {
    if (i >= uCount) break;
    vec2 b = (uRect[i].zw - uRect[i].xy) * 0.5;
    float r = min(uShape[i].x, min(b.x, b.y));
    vec2 q = abs(p - (uRect[i].xy + b)) - b + r;
    float di = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    if (di < d) { d = di; t = uShape[i].y; }
  }
  o = vec4(d, t, 0.0, 1.0);
}`;

// One cascade. Direction-first layout: the texture is a T×T grid of
// tiles, one per ray direction, each tile holding every probe for it —
// so hardware bilinear filtering interpolates the four upper probes.
const CASCADE = `#version 300 es
precision highp float;
uniform sampler2D uSdf;
uniform sampler2D uUpper;
uniform vec2 uField;
uniform float uN;
uniform bool uTop;
uniform float uL0;
uniform vec3 uEmit[4];  // x, y, radius (texels)
uniform vec3 uColor[4]; // linear radiance
out vec4 o;

// Sources are additive discs (emissive, not occluding), intersected
// analytically so both solves see identical hits. A disc the interval
// starts inside was counted by the cascade below. Cards are thin glass:
// T applies once per entry, and sphere tracing never steps across one.
vec4 march(vec2 origin, vec2 dir, float a, float b) {
  float te[4];
  for (int e = 0; e < 4; e++) {
    vec2 oc = origin - uEmit[e].xy;
    float h = dot(oc, dir), q = h * h - dot(oc, oc) + uEmit[e].z * uEmit[e].z;
    float t0 = -h - sqrt(max(q, 0.0)), t1 = -h + sqrt(max(q, 0.0));
    te[e] = q < 0.0 ? 1e9 : t0 >= a && t0 < b ? t0 : a == 0.0 && t0 < 0.0 && t1 > 0.0 ? 0.0 : 1e9;
  }
  vec3 rad = vec3(0.0);
  float tr = 1.0, t = a;
  bool inside = texture(uSdf, (origin + dir * a) / uField).r < 0.0;
  for (int i = 0; i < 64; i++) {
    if (t >= b) break;
    vec2 p = origin + dir * t;
    if (any(lessThan(p, vec2(0.0))) || any(greaterThan(p, uField))) break;
    vec2 s = texture(uSdf, p / uField).rg;
    if (s.r < 0.0 && !inside) {
      tr *= s.g;
      if (tr < 0.004) break;
    }
    inside = s.r < 0.0;
    float next = min(t + max(abs(s.r), 0.5), b);
    for (int e = 0; e < 4; e++) if (te[e] >= t && te[e] < next) rad += tr * uColor[e];
    t = next;
  }
  return vec4(rad, tr);
}

void main() {
  vec2 px = floor(gl_FragCoord.xy);
  float s = exp2(uN);          // probe spacing
  vec2 P = uField / s;         // probes per axis
  float T = 2.0 * s;           // tiles per axis: 4^(n+1) rays
  vec2 tile = floor(px / P);
  vec2 probe = px - tile * P;
  float d = tile.y * T + tile.x;
  float ang = (d + 0.5) / (T * T) * 6.28318530718;
  float a = uL0 * (exp2(2.0 * uN) - 1.0) / 3.0;
  float b = uL0 * (exp2(2.0 * uN + 2.0) - 1.0) / 3.0;
  vec4 r = march((probe + 0.5) * s, vec2(cos(ang), sin(ang)), a, b);
  if (!uTop && r.a > 0.0) {
    // merge: four child rays of the upper cascade, bilinear across probes
    vec2 P2 = P * 0.5;
    float T2 = T * 2.0;
    vec2 q = clamp((probe + 0.5) * 0.5, vec2(0.5), P2 - 0.5);
    vec3 up = vec3(0.0);
    for (int k = 0; k < 4; k++) {
      float d2 = d * 4.0 + float(k);
      up += texture(uUpper, (vec2(mod(d2, T2), floor(d2 / T2)) * P2 + q) / (2.0 * uField)).rgb;
    }
    r.rgb += r.a * up * 0.25;
  }
  o = r;
}`;

// Fluence → the field. The field is solved twice, with and without
// cards. Their ratio v is visibility: merge ringing is identical in both
// solves, so it cancels. The analytic fluence f₀ of the sources sets the
// amount; reach fades it to zero past the top cascade's interval.
// Day shows only the light a card stopped, so open field keeps its exact
// color. A shadow keeps the far band as its ambient (as skylight tints
// real shadows blue), and its edges take the complement of the bands lost.
// Night shows the light itself: a glow screened onto the dark ground.
const DISPLAY = `#version 300 es
precision highp float;
uniform sampler2D uLit;
uniform sampler2D uOpen;
uniform vec2 uField;
uniform vec3 uEmit[4];
uniform vec3 uColor[4];
uniform float uNight;
uniform float uDepth;
uniform vec3 uAmbient; // per-channel shadow weight, mean 1
uniform float uGlow;
out vec4 o;
vec3 fluence(sampler2D c0, vec2 p) {
  vec2 S = 2.0 * uField;
  return 0.25 * (texture(c0, p / S).rgb + texture(c0, (p + vec2(uField.x, 0.0)) / S).rgb
       + texture(c0, (p + vec2(0.0, uField.y)) / S).rgb + texture(c0, (p + uField) / S).rgb);
}
void main() {
  vec2 p = gl_FragCoord.xy;
  vec3 f = fluence(uLit, p), fo = fluence(uOpen, p), f0 = vec3(0.0);
  for (int e = 0; e < 4; e++) {
    float r = length(p - uEmit[e].xy);
    f0 += uColor[e] * (r <= uEmit[e].z ? 1.0 : asin(uEmit[e].z / r) / 3.14159265);
  }
  vec3 v = clamp(f / max(fo, vec3(1e-4)), 0.0, 1.0);
  vec3 a = f0 * smoothstep(0.2, 0.6, fo / max(f0, vec3(1e-4)));
  vec3 day = 1.0 - uDepth * uAmbient * (1.0 - exp(-a * (1.0 - v)));
  vec3 night = uGlow * (1.0 - exp(-a * v));
  o = vec4(mix(day, night, uNight), 1.0);
}`;

/* ---------------------------------------------------------- color (OKLCH) */

function oklchLinear(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => Math.min(Math.max(c, 0), 1));
}

// Bands in spectral order (by offset): counter, near, anchor, far.
const BANDS = {
  day: [[0.78, 0.13, -140], [0.76, 0.14, -35], [0.74, 0.125, 0], [0.70, 0.11, 75]],
  night: [[0.76, 0.12, -95], [0.74, 0.125, -25], [0.72, 0.115, 0], [0.66, 0.09, 55]],
};

function readHue(name, fallback) {
  const v = parseFloat(root.style.getPropertyValue(name) || getComputedStyle(root).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
}

/* ----------------------------------------------------- the public handle */

const listeners = new Set();
export const light = {
  radiant: false,
  field: [0, 0], scale: 0, cascades: 0, maxCascades: 0, l0: 1,
  frames: 0, writes: 0, solves: 0,
  /** Solve with only the lowest k cascades (1…maxCascades). */
  setCascades(k) {
    this.cascades = Math.max(1, Math.min(this.maxCascades, k | 0));
    dirty = true; schedule(); notify();
  },
  subscribe(fn) { listeners.add(fn); fn(this); return () => listeners.delete(fn); },
};
function notify() { listeners.forEach((fn) => fn(light)); }

/* ------------------------------------------------- reference beam (v0.7) */

const ref = { la: 135, lvx: 0.7071, lvy: 0.7071, li: 0.35, lxp: 30, lyp: 20 };
let unwound = 135; // 359°→1° must not spin the page backwards
let px = innerWidth * 0.3, py = innerHeight * 0.2; // rest: --lxp 30, --lyp 20

function quant(v, step) { return Math.round(Math.round(v / step) * step * 100) / 100; }

function writeRefs() {
  const w = innerWidth, h = innerHeight;
  let dx = w / 2 - px, dy = h / 2 - py; // cast direction: away from the light
  const len = Math.hypot(dx, dy) || 1;
  dx /= len; dy /= len;
  const ang = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
  unwound += ((ang - (((unwound % 360) + 360) % 360) + 540) % 360) - 180;
  const next = {
    la: quant(unwound, 3), lvx: quant(dx, 0.02), lvy: quant(dy, 0.02),
    li: quant(Math.min(1, 0.2 + (len / Math.max(w, h)) * 0.9), 0.05),
    lxp: quant((px / w) * 100, 2), lyp: quant((py / h) * 100, 2),
  };
  let changed = false;
  for (const k in next) {
    if (next[k] !== ref[k]) { ref[k] = next[k]; root.style.setProperty('--' + k, String(next[k])); changed = true; }
  }
  if (changed) light.writes++; // one batched write, ≤ 1 per frame
}

/* ------------------------------------------------------ radiance field */

let gl, canvas, progs, sdfScene, sdfOpen, cascadeTargets, occluders = [];
let W = 0, H = 0, scale = 1;
let dirty = true, lastKey = '', mode = root.dataset.mode, fading = false;
let raf = 0, budget = TEXELS_LONG_SIDE, lastSolve = 0, slow = 0;

function compile(frag) {
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, frag]]) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = new Proxy({}, { get: (c, k) => (k in c ? c[k] : (c[k] = gl.getUniformLocation(p, k))) });
  return { p, u };
}

function target(w, h, filter) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('RGBA16F not renderable');
  return { tex, fb, w, h };
}

function free(t) { if (t) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); } }

// Size the field: long side ≈ TEXELS_LONG_SIDE, both sides divisible by
// 2^(N−1) so every cascade's probe grid is whole. N covers the diagonal.
function resize() {
  const vw = innerWidth, vh = innerHeight;
  scale = Math.max(2, Math.max(vw, vh) / budget);
  const diag = Math.hypot(vw, vh) / scale;
  let n = 3;
  while (light.l0 * (4 ** n - 1) / 3 < diag) n++;
  const unit = 2 ** (n - 1);
  W = Math.ceil(vw / scale / unit) * unit;
  H = Math.ceil(vh / scale / unit) * unit;
  canvas.width = W; canvas.height = H;
  canvas.style.width = W * scale + 'px';
  canvas.style.height = H * scale + 'px';
  [sdfScene, sdfOpen, ...(cascadeTargets ?? [])].forEach(free);
  sdfScene = target(W, H, gl.NEAREST);
  sdfOpen = target(W, H, gl.NEAREST);
  cascadeTargets = [0, 1, 2].map(() => target(2 * W, 2 * H, gl.LINEAR));
  drawSdf(sdfOpen, new Float32Array(MAX_RECTS * 4), new Float32Array(MAX_RECTS * 2), 0);
  const keep = light.cascades === light.maxCascades;
  Object.assign(light, { field: [W, H], scale, maxCascades: n });
  if (keep || !light.cascades || light.cascades > n) light.cascades = n;
  dirty = true; notify();
}

function collect() {
  const live = `:is(${OCCLUDERS}):not([data-light="none"])`;
  occluders = [...document.querySelectorAll(live)]
    .filter((el) => !el.parentElement?.closest(live))
    .map((el) => {
      const tier = el.dataset.light
        || (el.matches('.prism-screen') ? 'immovable' : el.matches('.prism-table, .guide-table-wrap') ? 'standing' : 'transient');
      return { el, t: TRANSMITTANCE[tier] ?? TRANSMITTANCE.transient, r: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0 };
    });
  dirty = true;
}

function drawSdf(t, rect, shape, count) {
  gl.useProgram(progs.sdf.p);
  gl.uniform4fv(progs.sdf.u.uRect, rect);
  gl.uniform2fv(progs.sdf.u.uShape, shape);
  gl.uniform1i(progs.sdf.u.uCount, count);
  gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
  gl.viewport(0, 0, W, H);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// Top-down over the cascades, ping-ponging a → b. Returns the c0 target.
function cascade(sdf, a, b) {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, sdf.tex);
  gl.viewport(0, 0, 2 * W, 2 * H);
  let src = b, dst = a;
  for (let n = light.cascades - 1; n >= 0; n--) {
    gl.uniform1f(progs.cascade.u.uN, n);
    gl.uniform1i(progs.cascade.u.uTop, n === light.cascades - 1 ? 1 : 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, src.tex);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    [src, dst] = [dst, src];
  }
  return src;
}

function solve() {
  const vw = W * scale, vh = H * scale;
  const rect = new Float32Array(MAX_RECTS * 4), shape = new Float32Array(MAX_RECTS * 2);
  let count = 0;
  for (const o of occluders) {
    if (count === MAX_RECTS) break;
    const r = o.el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1 || r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) continue;
    // a card never shadows the light it holds: T eases to 1 within 48px of the pointer
    const near = Math.hypot(Math.max(r.left - px, 0, px - r.right), Math.max(r.top - py, 0, py - r.bottom));
    const hold = 1 - Math.min(near / 48, 1) ** 2 * (3 - 2 * Math.min(near / 48, 1));
    rect.set([r.left / scale, H - r.bottom / scale, r.right / scale, H - r.top / scale], count * 4);
    shape.set([o.r / scale, o.t + (1 - o.t) * hold], count * 2);
    count++;
  }
  // Re-solve only when a source crosses a c0 probe, a card moves, or the hue/mode changes.
  const night = root.dataset.mode === 'night';
  const hue = night ? readHue('--hr', 129) : readHue('--h', 185);
  const ex = px / scale, ey = H - py / scale;
  const key = [Math.floor(ex), Math.floor(ey), hue, night, light.cascades, rect.join()].join('|');
  if (!dirty && key === lastKey) return;
  dirty = false; lastKey = key; light.solves++;

  // four bands, dispersed across the cast vector, in spectral order
  const nx = -ref.lvy, ny = ref.lvx;
  const emit = new Float32Array(12), color = new Float32Array(12);
  BANDS[night ? 'night' : 'day'].forEach(([L, C, off], i) => {
    const t = (i - 1.5) * EMIT_SPREAD / scale;
    emit.set([ex + nx * t, ey - ny * t, Math.max(1.5, EMIT_RADIUS / scale)], i * 3);
    color.set(oklchLinear(L, C, hue + off).map((c) => c * EMISSION), i * 3);
  });

  drawSdf(sdfScene, rect, shape, count);
  const c = progs.cascade;
  gl.useProgram(c.p);
  gl.uniform2f(c.u.uField, W, H);
  gl.uniform1f(c.u.uL0, light.l0);
  gl.uniform3fv(c.u.uEmit, emit);
  gl.uniform3fv(c.u.uColor, color);
  gl.uniform1i(c.u.uSdf, 0);
  gl.uniform1i(c.u.uUpper, 1);
  const [A, B, C] = cascadeTargets;
  const open = cascade(sdfOpen, A, B);
  const lit = cascade(sdfScene, C, open === A ? B : A);

  const d = progs.display;
  gl.useProgram(d.p);
  gl.uniform1i(d.u.uLit, 0);
  gl.uniform1i(d.u.uOpen, 1);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, lit.tex);
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, open.tex);
  gl.uniform2f(d.u.uField, W, H);
  gl.uniform3fv(d.u.uEmit, emit);
  gl.uniform3fv(d.u.uColor, color);
  gl.uniform1f(d.u.uNight, night ? 1 : 0);
  gl.uniform1f(d.u.uDepth, SHADOW_DEPTH);
  const far = oklchLinear(0.70, 0.11, hue + 75).map((c) => 1 - c ** (1 / 2.2));
  const mean = (far[0] + far[1] + far[2]) / 3 || 1;
  gl.uniform3fv(d.u.uAmbient, far.map((c) => c / mean));
  gl.uniform1f(d.u.uGlow, GLOW);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, W, H);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

/* ---------------------------------------------------------------- loop */

function schedule() { if (!raf) raf = requestAnimationFrame(frame); }

function frame(now) {
  raf = 0; light.frames++;
  writeRefs();
  if (light.radiant && !fading) {
    const before = light.solves;
    solve();
    if (light.solves > before && typeof now === 'number') pace(now);
  }
  notify();
}

// Under 30fps for a sustained drag, coarsen the field by 20% (floor: 160 texels).
function pace(now) {
  const dt = now - lastSolve;
  lastSolve = now;
  if (dt > 200) return;
  slow = dt > 34 ? slow + 1 : Math.max(0, slow - 1);
  if (slow > 8 && budget > 160) { budget *= 0.8; slow = 0; resize(); }
}

// Mode changes refract over 25q: fade the field out, swap blend, fade in.
function syncMode() {
  if (root.dataset.mode === mode || !light.radiant) { mode = root.dataset.mode; return; }
  mode = root.dataset.mode;
  const swap = () => {
    canvas.dataset.blend = mode === 'night' ? 'screen' : 'multiply';
    fading = false; dirty = true; frame();
    canvas.style.opacity = '1';
  };
  if (reduce.matches) return swap();
  fading = true;
  canvas.style.opacity = '0';
  setTimeout(swap, 500);
}

function startField() {
  canvas = document.createElement('canvas');
  canvas.className = 'prism-light-field';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.dataset.blend = mode === 'night' ? 'screen' : 'multiply';
  gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, premultipliedAlpha: false });
  if (!gl || !(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) return;
  try {
    progs = { sdf: compile(SDF), cascade: compile(CASCADE), display: compile(DISPLAY) };
    resize();
  } catch (err) {
    console.warn('[prism] radiance field disabled:', err);
    return;
  }
  document.body.prepend(canvas);
  canvas.addEventListener('webglcontextlost', () => {
    light.radiant = false; canvas.remove(); root.classList.remove('prism-radiant'); notify();
  });
  light.radiant = true;
  root.classList.add('prism-radiant');
  collect();
  addEventListener('resize', () => { resize(); schedule(); });
  addEventListener('scroll', schedule, { passive: true });
  new ResizeObserver(() => { collect(); schedule(); }).observe(document.body);
}

function onPointer(e) { px = e.clientX; py = e.clientY; schedule(); }

function start() {
  startField();
  new MutationObserver(() => { syncMode(); schedule(); })
    .observe(root, { attributes: true, attributeFilter: ['data-mode', 'style'] });
  if (!reduce.matches) {
    addEventListener('pointermove', onPointer, { passive: true });
    addEventListener('pointerdown', onPointer, { passive: true });
  }
  schedule();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
