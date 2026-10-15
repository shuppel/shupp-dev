/* ============================================================
   PRISM v0.9 — the light (optional ES module)
   <script type="module" src="/prism/light.js"></script>

   The light is passive. It rests where the rig puts it, moves only
   for a story beat (scroll light, sunrise) or an action (a light
   event), and sleeps between: no pointer tracking, no rAF at rest.
   The playground is the one place the pointer holds the light.

   One 2D radiance field per scene, solved with radiance cascades
   (A. Sannikov, 2023 — https://radiance.wiki/). Two channels:
   - KEY light casts shadows. It is solved with and without objects;
     the ratio is visibility, which cancels the merge's ringing.
   - PLAY light colors the field: spots, prism bands, emitters,
     pipes, glows. Day tinges the field with it; night glows it.

   Objects are materials (see MATERIALS): per-channel transmittance
   T, emission E, local fog σ, and one-bounce secondary sources
   (prism bands, lens and mirror beams, pipes, diffuse re-emission)
   computed from the analytic incident light.

   Cascade n: probe spacing 2^n texels, 4^(n+1) rays per probe,
   interval L0·[(4^n−1)/3, (4^(n+1)−1)/3), merged top-down with
   L(a→c) = L(a→b) + T(a→b)·L(b→c). One WebGL2 context serves the
   page field and every [data-stage].
   ============================================================ */

// The decision tables (materials, density → material, light events, rig
// defaults) are generated from src/data/prism.ts; agents read the same
// tables as /prism/PRISM.md.
import { MATERIALS, DENSITY_MATERIAL, EVENTS, RIG_DEFAULTS } from './rules.js';
export { MATERIALS, DENSITY_MATERIAL, EVENTS, RIG_DEFAULTS };

const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const Q = 40; // ms, the motion quantum

const MAX_SOURCES = 16;
const MAX_ITEMS = 160;
const TEXELS_LONG_SIDE = 320;   // page field budget (long side, texels); coarsens under 30fps
const STAGE_TEXEL = 2;          // CSS px per texel in stages
const DEPTH = 0.16;             // day: shadow depth before tinting
const FLOOR = 0.8;              // day: no channel of the field drops below 80% (audited)
const GLOW = 0.22;              // night: the most light may lift the field (audited)
const KEY_POWER = 55;           // key radiance; fluence ∝ E·ρ/r, so scale-free
const PLAY_POWER = 40;          // spot and colored-source radiance
const DISPERSE = 15;            // px between the key light's four bands

/* ---------------------------------------------------------------------- shaders */

const VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// Scene → three maps. Items: 4 texels each (rect · T,radius · E,σ · kind,mask).
// Inside overlapping objects the topmost (last) wins, like paint.
const SCENE = `#version 300 es
precision highp float;
uniform highp sampler2D uItems;
uniform int uCount;
layout(location = 0) out vec4 o0; // signed distance, T rgb
layout(location = 1) out vec4 o1; // emission rgb, σ
layout(location = 2) out vec4 o2; // object id, kind, text mask
void main() {
  vec2 p = gl_FragCoord.xy;
  float dOut = 1e4, dIn = 1e4, mask = 0.0;
  int top = -1;
  for (int i = 0; i < ${MAX_ITEMS}; i++) {
    if (i >= uCount) break;
    vec4 r = texelFetch(uItems, ivec2(i * 4, 0), 0);
    vec4 tr = texelFetch(uItems, ivec2(i * 4 + 1, 0), 0);
    vec4 k = texelFetch(uItems, ivec2(i * 4 + 3, 0), 0);
    vec2 b = (r.zw - r.xy) * 0.5;
    float rad = min(tr.w, min(b.x, b.y));
    vec2 q = abs(p - (r.xy + b)) - b + rad;
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad;
    if (k.y > 0.5) { if (d < 0.0) mask = 1.0; continue; }
    if (d < 0.0) { top = i; dIn = min(dIn, -d); } else dOut = min(dOut, d);
  }
  if (top < 0) { o0 = vec4(dOut, 1.0, 1.0, 1.0); o1 = vec4(0.0); o2 = vec4(0.0, 0.0, mask, 1.0); return; }
  o0 = vec4(-min(dIn, dOut), texelFetch(uItems, ivec2(top * 4 + 1, 0), 0).rgb);
  o1 = texelFetch(uItems, ivec2(top * 4 + 2, 0), 0);
  o2 = vec4(float(top + 1), texelFetch(uItems, ivec2(top * 4 + 3, 0), 0).x, mask, 1.0);
}`;

const SOURCES = `
uniform int uSrcCount;
uniform vec4 uSrc[${MAX_SOURCES}];   // x, y, radius (texels), cos(outer half-angle)
uniform vec4 uSrcC[${MAX_SOURCES}];  // radiance rgb, cos(inner half-angle)
uniform vec3 uSrcA[${MAX_SOURCES}];  // axis xy, channel (0 key, 1 play)
float spot(int e, vec2 away) { return smoothstep(uSrc[e].w, uSrcC[e].w, dot(away, uSrcA[e].xy)); }
`;

// One cascade, direction-first: T×T tiles, one per direction, each holding
// every probe, so hardware bilinear filtering merges the four upper probes.
const CASCADE = `#version 300 es
precision highp float;
uniform highp sampler2D uM0;
uniform highp sampler2D uM1;
uniform highp sampler2D uM2;
uniform sampler2D uUp0;
uniform sampler2D uUp1;
uniform vec2 uField;
uniform float uN;
uniform bool uTop;
uniform float uL0;
uniform float uSigma;  // global fog, per texel
${SOURCES}
layout(location = 0) out vec4 o0; // key radiance
layout(location = 1) out vec4 o1; // play radiance

vec3 film(vec2 d) { return 0.62 + 0.38 * cos(2.0 * atan(d.y, d.x) + vec3(0.0, 2.094, 4.189)); }

// Sources are additive discs, intersected analytically; a disc the
// interval starts inside was counted below. Objects apply T once per
// entry and add their emission; fog attenuates continuously.
void march(vec2 org, vec2 dir, float a, float b, out vec3 key, out vec3 play, out vec3 tr) {
  float te[${MAX_SOURCES}];
  for (int e = 0; e < ${MAX_SOURCES}; e++) {
    te[e] = 1e9;
    if (e >= uSrcCount) continue;
    vec2 oc = org - uSrc[e].xy;
    float h = dot(oc, dir), q = h * h - dot(oc, oc) + uSrc[e].z * uSrc[e].z;
    if (q < 0.0) continue;
    float t0 = -h - sqrt(q), t1 = -h + sqrt(q);
    te[e] = t0 >= a && t0 < b ? t0 : a == 0.0 && t0 < 0.0 && t1 > 0.0 ? 0.0 : 1e9;
  }
  key = vec3(0.0); play = vec3(0.0); tr = vec3(1.0);
  float t = a;
  float id = texture(uM2, (org + dir * a) / uField).r;
  for (int i = 0; i < 72; i++) {
    if (t >= b) break;
    vec2 p = org + dir * t;
    if (any(lessThan(p, vec2(0.0))) || any(greaterThan(p, uField))) break;
    vec2 uv = p / uField;
    vec4 m0 = texture(uM0, uv), m1 = texture(uM1, uv), m2 = texture(uM2, uv);
    if (m2.r != id && m2.r > 0.0) {
      play += tr * m1.rgb;
      tr *= m2.g > 0.5 ? m0.gba * film(dir) : m0.gba;
    }
    id = m2.r;
    float next = min(t + max(abs(m0.r), 0.5), b);
    for (int e = 0; e < ${MAX_SOURCES}; e++) {
      if (te[e] >= t && te[e] < next) {
        vec3 c = tr * uSrcC[e].rgb * spot(e, -dir);
        if (uSrcA[e].z > 0.5) play += c; else key += c;
      }
    }
    tr *= exp(-(uSigma + m1.a) * (next - t));
    if (max(tr.r, max(tr.g, tr.b)) < 0.004) break;
    t = next;
  }
}

void main() {
  vec2 px = floor(gl_FragCoord.xy);
  float s = exp2(uN);
  vec2 P = uField / s;
  float T = 2.0 * s;
  vec2 tile = floor(px / P);
  vec2 probe = px - tile * P;
  float d = tile.y * T + tile.x;
  float ang = (d + 0.5) / (T * T) * 6.28318530718;
  vec3 key, play, tr;
  march((probe + 0.5) * s, vec2(cos(ang), sin(ang)),
        uL0 * (exp2(2.0 * uN) - 1.0) / 3.0, uL0 * (exp2(2.0 * uN + 2.0) - 1.0) / 3.0, key, play, tr);
  if (!uTop && max(tr.r, max(tr.g, tr.b)) > 0.0) {
    vec2 P2 = P * 0.5;
    float T2 = T * 2.0;
    vec2 q = clamp((probe + 0.5) * 0.5, vec2(0.5), P2 - 0.5);
    vec3 u0 = vec3(0.0), u1 = vec3(0.0);
    for (int k = 0; k < 4; k++) {
      float d2 = d * 4.0 + float(k);
      vec2 uv = (vec2(mod(d2, T2), floor(d2 / T2)) * P2 + q) / (2.0 * uField);
      u0 += texture(uUp0, uv).rgb;
      u1 += texture(uUp1, uv).rgb;
    }
    key += tr * u0 * 0.25;
    play += tr * u1 * 0.25;
  }
  o0 = vec4(key, 1.0);
  o1 = vec4(play, 1.0);
}`;

// Fluence → blend factors. Day multiplies: blocked key light darkens toward
// the far band, and play light tinges. Night screens: the light glows. Both
// are clamped to the audited bounds; the text mask can hold light off text.
const DISPLAY = `#version 300 es
precision highp float;
uniform sampler2D uLit0;
uniform sampler2D uLit1;
uniform sampler2D uOpen0;
uniform highp sampler2D uM1;
uniform highp sampler2D uM2;
uniform vec2 uField;
uniform float uSigma;
uniform float uFog;
uniform float uNight;
uniform float uDepth;
uniform float uGlow;
uniform float uMask;
uniform vec3 uAmbient;
uniform vec3 uAnchor; // normalized anchor band: white light on paper reads in it
${SOURCES}
out vec4 o;
const float FLOOR = ${FLOOR.toFixed(2)}; // no channel darker than this (audited)
vec3 fluence(sampler2D c0, vec2 p) {
  vec2 S = 2.0 * uField;
  return 0.25 * (texture(c0, p / S).rgb + texture(c0, (p + vec2(uField.x, 0.0)) / S).rgb
       + texture(c0, (p + vec2(0.0, uField.y)) / S).rgb + texture(c0, (p + uField) / S).rgb);
}
void main() {
  vec2 p = gl_FragCoord.xy, uv = p / uField;
  vec3 f = fluence(uLit0, p), fp = fluence(uLit1, p), fo = fluence(uOpen0, p), f0 = vec3(0.0);
  for (int e = 0; e < ${MAX_SOURCES}; e++) {
    if (e >= uSrcCount) break;
    if (uSrcA[e].z > 0.5) continue;
    vec2 v = p - uSrc[e].xy;
    float r = length(v);
    float s = r <= uSrc[e].z ? 1.0 : asin(uSrc[e].z / r) / 3.14159265 * spot(e, v / r);
    f0 += uSrcC[e].rgb * s * exp(-uSigma * r);
  }
  vec3 vis = clamp(f / max(fo, vec3(1e-4)), 0.0, 1.0);
  vec3 a = f0 * smoothstep(0.2, 0.6, fo / max(f0, vec3(1e-4)));
  vec3 blocked = a * (1.0 - vis);
  float scatter = uFog + texture(uM1, uv).a * 60.0;
  float hold = 1.0 - uMask * texture(uM2, uv).b;
  float lp = dot(fp, vec3(0.2126, 0.7152, 0.0722));
  float hi = max(max(fp.r, max(fp.g, fp.b)), 1e-4);
  vec3 chroma = mix(uAnchor, fp / hi, 1.0 - min(fp.r, min(fp.g, fp.b)) / hi);
  // the neutral part of a shadow leans to the far band; its colored part
  // (light a filter let through) keeps its own hue
  vec3 bk = 1.0 - exp(-blocked);
  float g = min(bk.r, min(bk.g, bk.b));
  vec3 day = 1.0 - uDepth * (g * uAmbient + (bk - g) * 1.6);
  day *= mix(vec3(1.0), chroma, clamp((0.35 + scatter) * (1.0 - exp(-lp * 0.8)), 0.0, 0.85) * 0.3);
  day = mix(vec3(1.0), max(day, vec3(FLOOR)), hold);
  vec3 lit = a * vis * 0.6 + fp * (1.0 + scatter * 2.0);
  vec3 night = min(uGlow * (1.0 - exp(-lit)) * hold, vec3(uGlow));
  o = vec4(mix(day, night, uNight), 1.0);
}`;

/* ----------------------------------------------------------------- color (OKLCH) */

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
  day: { counter: [0.78, 0.13, -140], near: [0.76, 0.14, -35], anchor: [0.74, 0.125, 0], far: [0.70, 0.11, 75] },
  night: { counter: [0.76, 0.12, -95], near: [0.74, 0.125, -25], anchor: [0.72, 0.115, 0], far: [0.66, 0.09, 55] },
};
const FIXED = {
  success: [0.72, 0.17, 152], danger: [0.64, 0.2, 27], warning: [0.78, 0.15, 75],
  red: [0.64, 0.24, 27], blue: [0.6, 0.2, 262], white: [0.97, 0.025, 80], warm: [0.9, 0.09, 60],
};

function readHue(name, fallback) {
  const v = parseFloat(root.style.getPropertyValue(name) || getComputedStyle(root).getPropertyValue(name));
  return Number.isFinite(v) ? v : fallback;
}
function palette(night) {
  const hue = night ? readHue('--hr', 129) : readHue('--h', 185);
  const bands = BANDS[night ? 'night' : 'day'];
  const color = (name) => {
    if (bands[name]) { const [L, C, o] = bands[name]; return oklchLinear(L, C, hue + o); }
    const [L, C, h] = FIXED[name] ?? FIXED.white;
    return oklchLinear(L, C, h);
  };
  return { hue, night, color, order: ['counter', 'near', 'anchor', 'far'] };
}

/* ------------------------------------------------------------------ small math */

const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
const scale3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mul3 = (a, b) => [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const norm3 = (c) => scale3(c, 1 / Math.max(c[0], c[1], c[2], 1e-4));
const ease = (t) => 1 - (1 - Math.min(Math.max(t, 0), 1)) ** 3; // massless: arrives at speed
const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

// Does the segment a→b cross rect o (slab test)?
function crosses(ax, ay, bx, by, o) {
  let t0 = 0, t1 = 1;
  for (const [p, d, lo, hi] of [[ax, bx - ax, o.l, o.r], [ay, by - ay, o.t, o.b]]) {
    if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return false; continue; }
    let u = (lo - p) / d, v = (hi - p) / d;
    if (u > v) [u, v] = [v, u];
    t0 = Math.max(t0, u); t1 = Math.min(t1, v);
    if (t0 > t1) return false;
  }
  return t1 > 0.02 && t0 < 0.98;
}

/* ---------------------------------------------------------------------- GL core */

const gl$ = { gl: null, canvas: null, progs: null, cache: new Map(), items: null, ok: false, tried: false };

function compile(gl, frag) {
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

function initGL() {
  if (gl$.tried) return gl$.ok;
  gl$.tried = true;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, preserveDrawingBuffer: true });
  if (!gl || !(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) return false;
  try {
    gl$.gl = gl; gl$.canvas = canvas;
    gl$.progs = { scene: compile(gl, SCENE), cascade: compile(gl, CASCADE), display: compile(gl, DISPLAY) };
    gl$.items = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, gl$.items);
    for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST);
    canvas.addEventListener('webglcontextlost', () => {
      gl$.ok = false; light.radiant = false; root.classList.remove('prism-radiant');
      scenes.forEach((s) => s.canvas?.remove()); notify();
    });
    gl$.ok = true;
  } catch (err) {
    console.warn('[prism] radiance field disabled:', err);
  }
  return gl$.ok;
}

function mrt(w, h, n, filter) {
  const { gl } = gl$;
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  const tex = Array.from({ length: n }, (_, i) => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0);
    return t;
  });
  gl.drawBuffers(tex.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('RGBA16F not renderable');
  return { fb, tex };
}

function freeTargets(t) {
  const { gl } = gl$;
  for (const m of [t.scene, t.open, ...t.cas]) { m.tex.forEach((x) => gl.deleteTexture(x)); gl.deleteFramebuffer(m.fb); }
}

// Targets per field size; stages share a few sizes, the page has one.
function targets(W, H) {
  const k = W + 'x' + H;
  if (!gl$.cache.has(k)) {
    if (gl$.cache.size >= 12) { const [old, t] = gl$.cache.entries().next().value; freeTargets(t); gl$.cache.delete(old); }
    gl$.cache.set(k, {
      scene: mrt(W, H, 3, gl$.gl.NEAREST),
      open: mrt(W, H, 3, gl$.gl.NEAREST),
      cas: [0, 1, 2].map(() => mrt(2 * W, 2 * H, 2, gl$.gl.LINEAR)),
    });
  }
  return gl$.cache.get(k);
}

function bind(unit, tex) { const { gl } = gl$; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); }

function setSources(u, src) {
  const { gl } = gl$;
  const a = new Float32Array(MAX_SOURCES * 4), c = new Float32Array(MAX_SOURCES * 4), x = new Float32Array(MAX_SOURCES * 3);
  src.forEach((s, i) => {
    a.set([s.x, s.y, s.r, s.cosOut], i * 4);
    c.set([...s.color, s.cosIn], i * 4);
    x.set([s.ax, s.ay, s.play ? 1 : 0], i * 3);
  });
  gl.uniform1i(u.uSrcCount, src.length);
  gl.uniform4fv(u.uSrc, a); gl.uniform4fv(u.uSrcC, c); gl.uniform3fv(u.uSrcA, x);
}

function drawScene(t, items, count, W, H) {
  const { gl, progs } = gl$;
  gl.useProgram(progs.scene.p);
  bind(0, gl$.items);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, MAX_ITEMS * 4, 1, 0, gl.RGBA, gl.FLOAT, items);
  gl.uniform1i(progs.scene.u.uItems, 0);
  gl.uniform1i(progs.scene.u.uCount, count);
  gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
  gl.viewport(0, 0, W, H);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function cascades(maps, a, b, n, W, H) {
  const { gl, progs } = gl$;
  const c = progs.cascade;
  bind(0, maps.tex[0]); bind(1, maps.tex[1]); bind(2, maps.tex[2]);
  gl.viewport(0, 0, 2 * W, 2 * H);
  let src = b, dst = a;
  for (let k = n - 1; k >= 0; k--) {
    gl.uniform1f(c.u.uN, k);
    gl.uniform1i(c.u.uTop, k === n - 1 ? 1 : 0);
    bind(3, src.tex[0]); bind(4, src.tex[1]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    [src, dst] = [dst, src];
  }
  return src;
}

// Solve a built scene (texel space) into the GL canvas's bottom-left W×H.
function render(s) {
  if (!gl$.ok) return false;
  const { gl, progs, canvas } = gl$;
  const { W, H } = s;
  if (canvas.width < W || canvas.height < H) { canvas.width = Math.max(canvas.width, W); canvas.height = Math.max(canvas.height, H); }
  const t = targets(W, H);
  gl.bindVertexArray(null);
  drawScene(t.scene, s.items, s.count, W, H);
  drawScene(t.open, s.items, 0, W, H);

  const c = progs.cascade;
  gl.useProgram(c.p);
  gl.uniform2f(c.u.uField, W, H);
  gl.uniform1f(c.u.uL0, 1);
  gl.uniform1f(c.u.uSigma, s.sigma);
  ['uM0', 'uM1', 'uM2', 'uUp0', 'uUp1'].forEach((n, i) => gl.uniform1i(c.u[n], i));
  setSources(c.u, s.sources);
  const [A, B, C] = t.cas;
  const open = cascades(t.open, A, B, s.n, W, H);
  const lit = cascades(t.scene, C, open === A ? B : A, s.n, W, H);

  const d = progs.display;
  gl.useProgram(d.p);
  ['uLit0', 'uLit1', 'uOpen0', 'uM1', 'uM2'].forEach((n, i) => gl.uniform1i(d.u[n], i));
  bind(0, lit.tex[0]); bind(1, lit.tex[1]); bind(2, open.tex[0]); bind(3, t.scene.tex[1]); bind(4, t.scene.tex[2]);
  gl.uniform2f(d.u.uField, W, H);
  gl.uniform1f(d.u.uSigma, s.sigma);
  gl.uniform1f(d.u.uFog, s.fog);
  gl.uniform1f(d.u.uNight, s.night ? 1 : 0);
  gl.uniform1f(d.u.uDepth, DEPTH);
  gl.uniform1f(d.u.uGlow, s.glow);
  gl.uniform1f(d.u.uMask, s.mask);
  gl.uniform3fv(d.u.uAmbient, s.ambient);
  gl.uniform3fv(d.u.uAnchor, s.anchor);
  setSources(d.u, s.sources);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, W, H);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  return true;
}

/* ------------------------------------------------------------------- scene build */

function materialOf(el) {
  if (el.dataset.material) return el.dataset.material;
  if (DENSITY_MATERIAL[el.dataset.light]) return DENSITY_MATERIAL[el.dataset.light];
  if (el.matches('[disabled], [aria-disabled="true"]')) return 'frosted';
  if (el.matches('.prism-screen')) return 'emitter';
  if (el.matches('.prism-table, .guide-table-wrap')) return 'frosted';
  if (el.matches('.prism-btn--dense')) return 'pigment';
  return 'glass';
}

// Incident light at a point from the primary sources, through the objects.
function incident(x, y, sources, objects, self, sigma) {
  let I = [0, 0, 0], dx = 0, dy = 0;
  for (const s of sources) {
    const vx = x - s.px, vy = y - s.py, r = Math.hypot(vx, vy) || 1;
    const sp = s.cosOut < -1 ? 1 : Math.max(0, Math.min(1, ((vx * s.ax + vy * s.ay) / r - s.cosOut) / Math.max(s.cosIn - s.cosOut, 1e-3)));
    if (sp <= 0) continue;
    let c = scale3(s.color, (Math.asin(Math.min(s.pr / r, 1)) / Math.PI) * sp * Math.exp(-sigma * r));
    for (const o of objects) if (o !== self && crosses(s.px, s.py, x, y, o)) c = mul3(c, o.T);
    I = add3(I, c);
    const w = lum(c);
    dx += (vx / r) * w; dy += (vy / r) * w;
  }
  const len = Math.hypot(dx, dy);
  return len ? { I, ux: dx / len, uy: dy / len } : { I, ux: 0.7071, uy: 0.7071 };
}

function spotSource(px, py, pr, color, ax, ay, coneDeg, play = true) {
  const half = (coneDeg * Math.PI) / 360;
  return { px, py, pr, color, ax, ay, cosOut: Math.cos(half), cosIn: Math.cos(half * 0.55), play };
}
function omniSource(px, py, pr, color, play = false) {
  return { px, py, pr, color, ax: 1, ay: 0, cosOut: -2, cosIn: -1, play };
}

const SECONDARY = new Set(['prism', 'lens', 'mirror', 'pipe', 'frosted', 'pigment', 'dichroic', 'phosphor']);

/* A scene: the page field or one stage. */
class Scene {
  constructor(host) {
    this.host = host;
    this.visible = true;
    this.dirty = true;
    this.lastKey = '';
    this.animating = false;
    this.glow = new WeakMap(); // phosphor charge per element
  }

  // opts.objects: [{ el?, l, t, r, b, radius, material, tint, z, mask }] in CSS px of the scene
  build(now, pal, opts) {
    const { width, height, scale, W, H, objects, sigmaPx } = opts;
    const occl = pal.night && opts.nightStyle === 'occlusion';
    for (const o of objects) {
      const m = MATERIALS[o.material] ?? MATERIALS.glass;
      const tint = pal.color(o.tint ?? (o.material === 'emitter' || o.material === 'pipe' ? 'anchor' : 'far'));
      o.T = m.T === 'tint' ? norm3(tint).map((c) => Math.max(c, 0.06)) : [m.T, m.T, m.T];
      if (occl && !o.mask) o.T = o.T.map((c) => c * 0.5);
      o.E = o.material === 'emitter' ? scale3(tint, (o.power ?? 0.6) * 4) : [0, 0, 0];
      o.sigma = o.material === 'fog' ? (o.density ?? 1) * 0.012 : 0;
      o.kind = o.material === 'film' ? 1 : 0;
      o.tintC = tint;
    }
    const solid = objects.filter((o) => !o.mask);
    const sources = [...opts.sources];
    for (const o of solid) this.applyEvent(o, now, pal, sources);
    const lit = sources.filter((s) => !s.secondary);
    for (const o of solid) {
      if (!SECONDARY.has(o.material)) continue;
      const cx = (o.l + o.r) / 2, cy = (o.t + o.b) / 2;
      const { I, ux, uy } = incident(cx, cy, lit, solid, o, sigmaPx);
      const L = lum(I);
      const hw = Math.abs(ux) * (o.r - o.l) / 2 + Math.abs(uy) * (o.b - o.t) / 2;
      switch (o.material) {
        case 'prism':
          if (L > 0.004) pal.order.forEach((band, i) => {
            const [ax, ay] = rot([ux, uy], ((i - 1.5) * 7 * Math.PI) / 180);
            sources.push({ ...spotSource(cx + ux * (hw + 4), cy + uy * (hw + 4), 6, scale3(pal.color(band), L * 160), ax, ay, 10), secondary: true });
          });
          break;
        case 'lens':
          if (L > 0.004) sources.push({ ...spotSource(cx + ux * (hw + 4), cy + uy * (hw + 4), 7, scale3(I, 220), ux, uy, 8), secondary: true });
          break;
        case 'mirror': {
          if (L <= 0.004) break;
          const horiz = o.r - o.l >= o.b - o.t;
          const [nx, ny] = horiz ? [0, uy > 0 ? -1 : 1] : [ux > 0 ? -1 : 1, 0];
          const dot = ux * nx + uy * ny;
          const half = Math.max(o.r - o.l, o.b - o.t) / 2;
          sources.push({ ...spotSource(cx + nx * 3, cy + ny * 3, Math.min(half * 0.6, 12), scale3(I, 120), ux - 2 * dot * nx, uy - 2 * dot * ny, 36), secondary: true });
          break;
        }
        case 'pipe': {
          const horiz = o.r - o.l >= o.b - o.t;
          const ends = horiz ? [[o.l, cy], [o.r, cy]] : [[cx, o.t], [cx, o.b]];
          const best = Math.max(...ends.map(([x, y]) => lum(incident(x, y, lit, solid, o, sigmaPx).I)));
          o.E = add3(o.E, scale3(o.tintC, Math.min(best * 40, 3)));
          break;
        }
        case 'frosted': o.E = add3(o.E, scale3(I, 0.6)); break;
        case 'pigment': o.E = add3(o.E, scale3(mul3(I, o.tintC), 0.4)); break;
        case 'dichroic': o.E = add3(o.E, scale3(mul3(I, norm3(o.tintC).map((c) => 1 - c * 0.85)), 1.2)); break;
        case 'phosphor': {
          const st = (o.el && this.glow.get(o.el)) ?? { e: 0, t: now };
          const decayed = st.e * Math.exp(-(now - st.t) / ((35 * Q) / 3));
          const e = Math.max(decayed, L * 6);
          if (o.el) this.glow.set(o.el, { e, t: now });
          if (decayed > L * 6 + 0.01) this.animating = true;
          o.E = add3(o.E, scale3(pal.color('near'), e));
          break;
        }
        default: break;
      }
    }
    // pack items: texel space, y up; 4 texels per item
    const items = new Float32Array(MAX_ITEMS * 16);
    let count = 0;
    for (const o of [...solid, ...objects.filter((x) => x.mask)]) {
      if (count === MAX_ITEMS) break;
      if (o.r < 0 || o.b < 0 || o.l > width || o.t > height) continue;
      let ox = 0, oy = 0;
      if (opts.depth === 'z' && !o.mask) {
        const { ux, uy } = incident((o.l + o.r) / 2, (o.t + o.b) / 2, lit, [], o, 0);
        ox = ux * (o.z ?? 1) * 14; oy = uy * (o.z ?? 1) * 14;
      }
      items.set([(o.l + ox) / scale, H - (o.b + oy) / scale, (o.r + ox) / scale, H - (o.t + oy) / scale,
        ...o.T, (o.radius ?? 0) / scale, ...o.E, o.sigma * scale, o.kind, o.mask ? 1 : 0, 0, 0], count * 16);
      count++;
    }
    const src = sources.slice(0, MAX_SOURCES).map((s) => ({ ...s, x: s.px / scale, y: H - s.py / scale, r: Math.max(1.5, s.pr / scale), ay: -s.ay }));
    if (opts.writeVars) for (const o of solid) if (o.el) writeLit(o, incident((o.l + o.r) / 2, (o.t + o.b) / 2, lit, solid, o, sigmaPx));
    const far = pal.color('far').map((c) => 1 - c ** (1 / 2.2));
    const mean = (far[0] + far[1] + far[2]) / 3 || 1;
    return {
      W, H, n: opts.n, items, count, sources: src, night: pal.night,
      sigma: sigmaPx * scale, fog: opts.fog, mask: opts.mask ?? 0,
      glow: occl ? GLOW * 0.55 : GLOW, ambient: far.map((c) => c / mean), anchor: norm3(pal.color('anchor')),
      key: [pal.hue, pal.night, opts.n, opts.fog, opts.mask, opts.nightStyle, opts.depth,
        items.subarray(0, count * 16).join(), src.map((s) => [s.x, s.y, s.r, ...s.color].map((v) => v.toFixed(1)).join()).join()].join('|'),
    };
  }

  // Light events live on the element as data-light-state (+ start time).
  applyEvent(o, now, pal, sources) {
    const el = o.el;
    const type = el?.dataset.lightState;
    if (!type || !EVENTS[type]) return;
    const ev = EVENTS[type];
    const t = (now - Number(el.dataset.lightT0 ?? now)) / (Math.max(ev.q, 1) * Q);
    if (!ev.held && t >= 1) { clearEvent(el); return; }
    if (ev.loops) this.animating = true;
    const cx = (o.l + o.r) / 2, cy = (o.t + o.b) / 2, k = ev.held ? 1 : 1 - t;
    const grow = (d) => { o.l -= d; o.r += d; o.t -= d; o.b += d; o.radius = (o.radius ?? 0) + d; };
    switch (type) {
      case 'emit': o.E = add3(o.E, scale3(pal.color('anchor'), 0.9)); break;
      case 'absorb': o.T = o.T.map((c) => c * (0.08 + 0.92 * ease(t))); break;
      case 'pulse': sources.push(omniSource(cx, cy, Math.max(o.r - o.l, o.b - o.t) * (0.2 + ease(t) * 0.9), scale3(pal.color('anchor'), 7 * k * k), true)); break;
      case 'void': o.T = [0, 0, 0]; grow(22 * k); break;
      case 'reject': o.T = norm3(pal.color('danger')).map((c) => Math.max(c, 0.05)); o.E = scale3(pal.color('danger'), 0.8 * k); break;
      case 'afterglow': o.E = add3(o.E, scale3(pal.color('near'), 5 * Math.exp(-t * 3))); break;
      case 'busy': o.E = add3(o.E, scale3(pal.color('anchor'), 0.5 + 0.4 * Math.sin((now / (22 * Q)) * Math.PI * 2))); break;
      case 'lift': o.z = 3; break;
      case 'seam': o.E = add3(o.E, scale3(pal.color('anchor'), 1.4)); break;
      case 'lens': sources.push({ ...spotSource(cx, o.t - 34, 8, scale3([1, 1, 1], PLAY_POWER * 0.4), 0, 1, 28), secondary: true }); break;
      case 'carry': {
        const to = document.getElementById(el.dataset.carryTo ?? '');
        if (!to) break;
        const a = el.getBoundingClientRect(), b = to.getBoundingClientRect(), p = ease(t);
        const x = a.left + a.width / 2 + (b.left + b.width / 2 - a.left - a.width / 2) * p - (o.ox ?? 0);
        const y = a.top + a.height / 2 + (b.top + b.height / 2 - a.top - a.height / 2) * p - (o.oy ?? 0);
        sources.push(omniSource(x, y, 7, scale3(pal.color('anchor'), 10 * Math.min(1, k * 3)), true));
        break;
      }
      case 'eclipse': {
        const s = sources[0];
        if (!s) break;
        const off = (ease(t) * 2 - 1) * 70;
        Object.assign(o, { l: s.px + off - 26, r: s.px + off + 26, t: s.py - 26, b: s.py + 26, radius: 26, T: [0, 0, 0] });
        break;
      }
      default: break;
    }
  }
}

// Per-object light for CSS: how much arrives (--lit), its color, and the
// gradient angle pointing at the light (--lit-a). Written only on change.
function writeLit(o, { I, ux, uy }) {
  const L = 1 - Math.exp(-lum(I) * 1.6);
  const c = norm3(I).map((v) => Math.round(155 + v * 100));
  const vars = {
    '--lit': L.toFixed(2), '--lit-c': `rgb(${c.join(' ')})`,
    '--lit-a': Math.round((Math.atan2(-uy, -ux) * 180) / Math.PI + 90) + 'deg',
  };
  for (const k in vars) if (o.el.style.getPropertyValue(k) !== vars[k]) o.el.style.setProperty(k, vars[k]);
}

/* ----------------------------------------------------------------------- events */

const active = new Set(); // timed and looping events keep the loop awake; then it sleeps

export function lightEvent(el, type) {
  const ev = EVENTS[type];
  if (!ev) return;
  el.dataset.lightState = type;
  // reduced motion: held states still show; timed ones resolve instantly
  el.dataset.lightT0 = String(reduce.matches && !ev.held ? -1e9 : performance.now());
  if (!ev.held || ev.loops) active.add(el);
  refresh(el);
}
export function clearEvent(el) {
  if (!el?.dataset.lightState) return;
  delete el.dataset.lightState; delete el.dataset.lightT0;
  active.delete(el);
  refresh(el);
}

/* ------------------------------------------------------------------ the page field */

const PRESETS = {
  window: { x: 0.18, y: 0.1 },
  overhead: { x: 0.5, y: 0.03 },
  footlight: { x: 0.5, y: 0.98 },
  spots: { x: 0.5, y: 0.04 },
};
const OCCLUDERS = '.prism-card, .prism-holo, .prism-screen, .prism-swatch, .prism-table, .guide-table-wrap, [data-light], [data-material]';
const FIELD_TEXT = 'main :is(h1, h2, h3, p, li, small, dt, dd)';

const listeners = new Set();
export const light = {
  radiant: false,
  field: [0, 0], scale: 0, cascades: 0, maxCascades: 0, l0: 1,
  frames: 0, writes: 0, solves: 0,
  rig: { ...RIG_DEFAULTS },
  /** Change rig parameters; the page re-solves once. */
  setRig(patch) {
    Object.assign(this.rig, patch);
    for (const k of ['surfaces', 'legibility', 'depth', 'night']) root.dataset['light' + k[0].toUpperCase() + k.slice(1)] = this.rig[k];
    root.dataset.lightScroll = String(this.rig.scroll);
    page.dirty = true; scenes.forEach((s) => { s.dirty = true; }); schedule(); notify();
  },
  /** Solve the page with only the lowest k cascades (1…maxCascades). */
  setCascades(k) { this.cascades = Math.max(1, Math.min(this.maxCascades, k | 0)); page.dirty = true; schedule(); notify(); },
  subscribe(fn) { listeners.add(fn); fn(this); return () => listeners.delete(fn); },
  event: lightEvent,
  clear: clearEvent,
};
function notify() { listeners.forEach((fn) => fn(light)); }

// The v0.7 reference beam, now written from the key light (never the pointer).
const ref = { la: 135, lvx: 0.7071, lvy: 0.7071, li: 0.35, lxp: 30, lyp: 20 };
let unwound = 135;
function quant(v, step) { return Math.round(Math.round(v / step) * step * 100) / 100; }
function writeRefs(px, py) {
  const w = innerWidth, h = innerHeight;
  let dx = w / 2 - px, dy = h / 2 - py;
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
  for (const k in next) if (next[k] !== ref[k]) { ref[k] = next[k]; root.style.setProperty('--' + k, String(next[k])); changed = true; }
  if (changed) light.writes++;
}

class PageScene extends Scene {
  constructor() {
    super(document.body);
    this.budget = TEXELS_LONG_SIDE;
    this.occluders = [];
    this.text = [];
    this.intro = reduce.matches ? null : performance.now();
  }
  mount() {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'prism-light-field';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.mode = root.dataset.mode;
    this.canvas.dataset.blend = this.mode === 'night' ? 'screen' : 'multiply';
    this.ctx = this.canvas.getContext('2d');
    document.body.prepend(this.canvas);
    this.resize();
    this.collect();
  }
  resize() {
    if (!this.canvas) return;
    const vw = innerWidth, vh = innerHeight;
    this.scale = Math.max(2, Math.max(vw, vh) / this.budget);
    const diag = Math.hypot(vw, vh) / this.scale;
    let n = 3;
    while ((4 ** n - 1) / 3 < diag) n++;
    const unit = 2 ** (n - 1);
    this.W = Math.ceil(vw / this.scale / unit) * unit;
    this.H = Math.ceil(vh / this.scale / unit) * unit;
    this.canvas.width = this.W; this.canvas.height = this.H;
    this.canvas.style.width = this.W * this.scale + 'px';
    this.canvas.style.height = this.H * this.scale + 'px';
    const keep = light.cascades === light.maxCascades;
    Object.assign(light, { field: [this.W, this.H], scale: this.scale, maxCascades: n });
    if (keep || !light.cascades || light.cascades > n) light.cascades = n;
    this.dirty = true; notify();
  }
  collect() {
    const live = `:is(${OCCLUDERS}):not([data-light="none"])`;
    this.occluders = [...document.querySelectorAll(live)]
      .filter((el) => !el.parentElement?.closest(live) && !el.closest('[data-stage]'))
      .map((el) => ({ el, radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0 }));
    this.text = [...document.querySelectorAll(FIELD_TEXT)].filter((el) => !el.closest(live) && !el.closest('[data-stage]'));
    this.dirty = true;
  }
  // Rest position from the rig (viewport fractions, so it survives resize),
  // a day arc when scroll light is on, and the one-time sunrise.
  keyLight(now) {
    const { rig } = light, vw = innerWidth, vh = innerHeight;
    let { x, y } = PRESETS[rig.source] ?? PRESETS.window;
    let warm = 0;
    if (rig.scroll) {
      const p = Math.min(1, Math.max(0, scrollY / Math.max(1, document.documentElement.scrollHeight - vh)));
      x = 0.1 + 0.8 * p; y = 0.24 - 0.2 * Math.sin(Math.PI * p); warm = 1 - Math.sin(Math.PI * p);
    }
    if (this.intro !== null) {
      const t = (now - this.intro) / (25 * Q);
      if (t >= 1) this.intro = null; else { y = 1.1 + (y - 1.1) * ease(t); this.animating = true; }
    }
    return { px: x * vw, py: y * vh, warm };
  }
  frame(now) {
    this.animating = false;
    const { px, py, warm } = this.keyLight(now);
    writeRefs(px, py);
    if (!this.canvas || !gl$.ok) return;
    const pal = palette(root.dataset.mode === 'night');
    const { rig } = light;
    const nightLight = pal.night && rig.night === 'light';
    // key light: four bands dispersed across the cast vector
    const nx = -ref.lvy, ny = ref.lvx;
    const power = KEY_POWER * (pal.night && rig.night === 'occlusion' ? 0.55 : 1) * (rig.source === 'spots' ? 0.45 : 1);
    const warmC = oklchLinear(...FIXED.warm);
    const sources = pal.order.map((band, i) => {
      const c = pal.color(band);
      return omniSource(px + nx * (i - 1.5) * DISPERSE, py + ny * (i - 1.5) * DISPERSE, 9,
        scale3(warm ? add3(scale3(c, 1 - warm * 0.4), scale3(warmC, warm * 0.4)) : c, power));
    });
    if (rig.source === 'spots') {
      sources.push(spotSource(innerWidth * 0.04, innerHeight * 0.3, 14, scale3(pal.color('red'), PLAY_POWER), 0.8, 0.6, 46));
      sources.push(spotSource(innerWidth * 0.96, innerHeight * 0.3, 14, scale3(pal.color('blue'), PLAY_POWER), -0.8, 0.6, 46));
    }
    const objects = [];
    const seen = new Set();
    const add = (el, radius) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      seen.add(el);
      objects.push({ el, l: r.left, t: r.top, r: r.right, b: r.bottom, radius, material: materialOf(el), tint: el.dataset.tint, z: Number(el.dataset.z ?? 1) });
    };
    for (const { el, radius } of this.occluders) add(el, radius);
    // nested controls join the scene while an event is on them
    for (const el of document.querySelectorAll('[data-light-state]')) if (!seen.has(el) && !el.closest('[data-stage]')) add(el, parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0);
    if (rig.legibility === 'mask') for (const el of this.text) {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight && r.width > 1) objects.push({ l: r.left - 6, t: r.top - 4, r: r.right + 6, b: r.bottom + 4, radius: 8, material: 'glass', mask: true });
    }
    const s = this.build(now, pal, {
      width: this.W * this.scale, height: this.H * this.scale, scale: this.scale, W: this.W, H: this.H, n: light.cascades,
      sources, objects, sigmaPx: rig.fog * 0.0012, fog: rig.fog * 0.6 + (nightLight ? 0.25 : 0),
      mask: rig.legibility === 'mask' ? 0.85 : 0, depth: rig.depth, nightStyle: rig.night, writeVars: true,
    });
    if (!this.dirty && s.key === this.lastKey && !this.animating) return;
    this.dirty = false; this.lastKey = s.key;
    if (render(s)) {
      this.ctx.clearRect(0, 0, this.W, this.H);
      this.ctx.drawImage(gl$.canvas, 0, gl$.canvas.height - this.H, this.W, this.H, 0, 0, this.W, this.H);
      // the blend changes with the image that needs it, never before
      this.canvas.dataset.blend = pal.night ? 'screen' : 'multiply';
      if (!this.fading) this.canvas.style.opacity = '1';
      light.solves++;
    }
  }
  // Mode changes refract over 25q: fade the field out, re-solve, fade in.
  syncMode() {
    if (!this.canvas || root.dataset.mode === this.mode) return;
    this.mode = root.dataset.mode;
    if (reduce.matches) { this.dirty = true; schedule(); return; }
    this.fading = true;
    this.canvas.style.opacity = '0';
    setTimeout(() => { this.fading = false; this.dirty = true; schedule(); }, 500);
  }
}

/* ------------------------------------------------------------------------ stages */

// <div class="prism-stage" data-stage [data-fog] [data-mode] [data-night] [data-depth]>
//   <i data-source data-color="white|anchor|near|far|counter|red|blue" [data-cone] [data-axis] [data-power] [data-disperse]></i>
//   <div data-material="prism" [data-tint] [data-z]></div>
// </div>
const STAGE_OBJECTS = '[data-material], [data-light], [data-light-state], .prism-btn, .prism-card, .prism-table, .prism-row, .prism-chip';

class StageScene extends Scene {
  constructor(el) {
    super(el);
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'prism-stage-field';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.ctx = this.canvas.getContext('2d');
    el.prepend(this.canvas);
    new ResizeObserver(() => { this.resize(); schedule(); }).observe(el);
    this.resize();
  }
  resize() {
    const r = this.host.getBoundingClientRect();
    this.cw = r.width; this.ch = r.height;
    let n = 3;
    while ((4 ** n - 1) / 3 < Math.hypot(r.width, r.height) / STAGE_TEXEL) n++;
    this.n = n;
    const unit = 2 ** (n - 1);
    this.W = Math.max(unit, Math.ceil(r.width / STAGE_TEXEL / unit) * unit);
    this.H = Math.max(unit, Math.ceil(r.height / STAGE_TEXEL / unit) * unit);
    this.canvas.width = this.W; this.canvas.height = this.H;
    this.canvas.style.width = this.W * STAGE_TEXEL + 'px';
    this.canvas.style.height = this.H * STAGE_TEXEL + 'px';
    this.dirty = true;
  }
  frame(now) {
    this.animating = false;
    if (!this.visible || !this.cw || !gl$.ok) return;
    const host = this.host, origin = host.getBoundingClientRect();
    const night = (host.dataset.mode ?? root.dataset.mode) === 'night';
    const pal = palette(night);
    const sources = [];
    let intro = 1;
    if (host.dataset.intro) {
      intro = ease((now - Number(host.dataset.intro)) / (25 * Q));
      if (intro < 1) this.animating = true; else delete host.dataset.intro;
    }
    for (const el of host.querySelectorAll('[data-source]')) {
      if (el.hidden || el.dataset.off !== undefined) continue;
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2 - origin.left;
      const y = this.ch * 1.1 + (r.top + r.height / 2 - origin.top - this.ch * 1.1) * intro;
      const name = el.dataset.color ?? 'white';
      const play = name === 'red' || name === 'blue' || el.dataset.play !== undefined;
      const power = Number(el.dataset.power ?? 1) * (play ? PLAY_POWER : KEY_POWER) * (night && (host.dataset.night ?? light.rig.night) === 'occlusion' ? 0.55 : 1);
      if (el.dataset.cone) {
        const axis = el.dataset.axis !== undefined ? (Number(el.dataset.axis) * Math.PI) / 180 : Math.atan2(this.ch / 2 - y, this.cw / 2 - x);
        sources.push(spotSource(x, y, 10, scale3(pal.color(name), power), Math.cos(axis), Math.sin(axis), Number(el.dataset.cone), play));
      } else if (el.dataset.disperse !== undefined) {
        pal.order.forEach((band, i) => sources.push(omniSource(x, y + (i - 1.5) * 6, 5, scale3(pal.color(band), power))));
      } else {
        sources.push(omniSource(x, y, 7, scale3(pal.color(name), power), play));
      }
    }
    const objects = [];
    for (const el of host.querySelectorAll(STAGE_OBJECTS)) {
      const parent = el.parentElement?.closest(STAGE_OBJECTS);
      if ((parent && host.contains(parent) && !el.dataset.lightState) || el.closest('[data-stage]') !== host) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1) continue;
      objects.push({
        el, ox: origin.left, oy: origin.top,
        l: r.left - origin.left, t: r.top - origin.top, r: r.right - origin.left, b: r.bottom - origin.top,
        radius: parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, material: materialOf(el),
        tint: el.dataset.tint, z: Number(el.dataset.z ?? 1),
        power: el.dataset.power ? Number(el.dataset.power) : undefined,
        density: el.dataset.density ? Number(el.dataset.density) : undefined,
      });
    }
    const masked = host.dataset.lightLegibility === 'mask';
    if (masked) for (const el of host.querySelectorAll(':is(h3, h4, p, span):not([data-material] *, .prism-btn *)')) {
      const r = el.getBoundingClientRect();
      if (r.width > 1) objects.push({ l: r.left - origin.left - 4, t: r.top - origin.top - 3, r: r.right - origin.left + 4, b: r.bottom - origin.top + 3, radius: 6, material: 'glass', mask: true });
    }
    const fog = Number(host.dataset.fog ?? 0);
    const nightStyle = host.dataset.night ?? light.rig.night;
    const s = this.build(now, pal, {
      width: this.cw, height: this.ch, scale: STAGE_TEXEL, W: this.W, H: this.H, n: this.n,
      sources, objects, sigmaPx: fog * 0.0025, fog: fog + (night && nightStyle === 'light' ? 0.25 : 0),
      mask: masked ? 0.85 : 0, depth: host.dataset.depth ?? 'flat', nightStyle, writeVars: true,
    });
    if (!this.dirty && s.key === this.lastKey && !this.animating) return;
    this.dirty = false; this.lastKey = s.key;
    this.canvas.dataset.blend = night ? 'screen' : 'multiply';
    if (render(s)) {
      this.ctx.clearRect(0, 0, this.W, this.H);
      this.ctx.drawImage(gl$.canvas, 0, gl$.canvas.height - this.H, this.W, this.H, 0, 0, this.W, this.H);
    }
  }
}

/* ------------------------------------------------------------------------- loop */

const page = new PageScene();
const scenes = new Set([page]);
let raf = 0, lastSolve = 0, slow = 0, io = null;

function schedule() { if (!raf) raf = requestAnimationFrame(frame); }

function frame(now) {
  raf = 0; light.frames++;
  const before = light.solves;
  scenes.forEach((s) => s.frame(now));
  if (light.solves > before) pace(now);
  notify();
  if (active.size || [...scenes].some((s) => s.animating)) schedule(); // otherwise: asleep
}

// Under 30fps for a sustained run, coarsen the page field by 20% (floor 160 texels).
function pace(now) {
  const dt = now - lastSolve;
  lastSolve = now;
  if (dt > 200) return;
  slow = dt > 34 ? slow + 1 : Math.max(0, slow - 1);
  if (slow > 8 && page.budget > 160) { page.budget *= 0.8; slow = 0; page.resize(); }
}

export function mountStage(el) {
  if (el._prismStage || !initGL()) return el._prismStage ?? null;
  const s = new StageScene(el);
  el._prismStage = s;
  scenes.add(s);
  io?.observe(el);
  schedule();
  return s;
}

/** Mark a scene dirty: the stage holding el, or everything. */
export function refresh(el) {
  const s = el?.closest?.('[data-stage]')?._prismStage;
  if (s) s.dirty = true; else scenes.forEach((x) => { x.dirty = true; });
  schedule();
}

/* ------------------------------------------------------------ declarative events */

// data-light-event="emit absorb pulse void reject lift carry afterglow" on any control.
function wireEvents() {
  const owner = (e) => (e.target instanceof Element ? e.target.closest('[data-light-event]') : null);
  const has = (el, t) => el.dataset.lightEvent.split(/\s+/).includes(t);
  addEventListener('pointerover', (e) => { const el = owner(e); if (el && has(el, 'emit') && !el.dataset.lightState) lightEvent(el, 'emit'); });
  addEventListener('pointerout', (e) => { const el = owner(e); if (el && has(el, 'emit') && !el.contains(e.relatedTarget) && el.dataset.lightState === 'emit') clearEvent(el); });
  addEventListener('focusin', (e) => { const el = owner(e); if (el && has(el, 'emit') && !el.dataset.lightState) lightEvent(el, 'emit'); });
  addEventListener('focusout', (e) => { const el = owner(e); if (el && el.dataset.lightState === 'emit') clearEvent(el); });
  addEventListener('pointerdown', (e) => {
    const el = owner(e);
    if (!el) return;
    if (has(el, 'void')) lightEvent(el, 'void');
    else if (has(el, 'absorb')) lightEvent(el, 'absorb');
    if (has(el, 'lift')) lightEvent(el, 'lift');
  });
  addEventListener('pointerup', () => document.querySelectorAll('[data-light-state="lift"]').forEach(clearEvent));
  addEventListener('click', (e) => {
    const el = owner(e);
    if (!el) return;
    for (const t of ['pulse', 'reject', 'carry']) if (has(el, t)) lightEvent(el, t);
    if (has(el, 'afterglow')) lightEvent(document.getElementById(el.dataset.lightFor ?? '') ?? el, 'afterglow');
  });
}

/* ------------------------------------------------------------------------ start */

function start() {
  if (initGL()) {
    page.mount();
    light.radiant = true;
    root.classList.add('prism-radiant');
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const s = e.target._prismStage;
        if (!s) continue;
        s.visible = e.isIntersecting;
        if (s.visible) { s.dirty = true; schedule(); }
      }
    }, { rootMargin: '160px' });
    document.querySelectorAll('[data-stage]').forEach(mountStage);
    new ResizeObserver(() => { page.collect(); schedule(); }).observe(document.body);
  }
  addEventListener('resize', () => { page.resize(); schedule(); });
  addEventListener('scroll', schedule, { passive: true });
  light.setRig({});
  new MutationObserver(() => { page.syncMode(); refresh(); })
    .observe(root, { attributes: true, attributeFilter: ['data-mode'] });
  new MutationObserver(() => refresh())
    .observe(root, { attributes: true, attributeFilter: ['style'] });
  wireEvents();
  schedule();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
