// Shared page controls for the Prismatic reference and its lab:
// anchor hue, day / redshift mode, and the playground (the one place
// the pointer is allowed to move the light).
import { refresh } from './light.js';

const root = document.documentElement;

// Redshift: an art-directed hue map. Spectral hues (45–300) slide toward
// red; non-spectral pinks (300–360) wrap forward.
export function redshift(h, k = 0.4) {
  if (h <= 45) return h;
  if (h > 300) return Math.round((h + (385 - h) * k) % 360);
  return Math.round(h - (h - 45) * k);
}

const $ = (id) => document.getElementById(id);

function applyHue(h) {
  const hr = redshift(h);
  root.style.setProperty('--h', h);
  root.style.setProperty('--hr', hr);
  if ($('ds-day-h')) $('ds-day-h').textContent = h + '°';
  if ($('ds-night-h')) $('ds-night-h').textContent = hr + '°';
  const night = root.dataset.mode === 'night';
  const offsets = night ? [0, -25, 55, -95] : [0, -35, 75, -140];
  const base = night ? hr : h;
  const eq = $('guide-hue-equation');
  if (eq) eq.textContent = (night ? 'Night' : 'Day') + ': H = ' + base + '° → bands '
    + offsets.map((o) => ((base + o) % 360 + 360) % 360 + '°').join(', ');
  document.querySelectorAll('[data-band-offset]').forEach((label) => {
    const o = offsets[Number(label.dataset.bandOffset)];
    label.textContent = (o >= 0 ? '+' : '−') + Math.abs(o) + '°';
  });
}

const slider = $('ds-hue-slider');
if (slider) {
  slider.addEventListener('input', () => applyHue(parseInt(slider.value, 10)));
  applyHue(parseInt(slider.value, 10));
}

// Mode toggle: refracts over 25q, never snaps.
const modeBtn = $('ds-mode-toggle');
modeBtn?.addEventListener('click', () => {
  const next = root.dataset.mode === 'night' ? 'day' : 'night';
  root.dataset.mode = next;
  $('ds-mode-label').textContent = next === 'night' ? 'Redshift' : 'Day';
  modeBtn.setAttribute('aria-pressed', String(next === 'night'));
  if (slider) applyHue(parseInt(slider.value, 10));
});

// Playground: drag sources and objects; arrow keys move the focused one by 2%.
for (const stage of document.querySelectorAll('[data-playground]')) {
  const movable = (t) => (t instanceof Element ? t.closest('[data-source], [data-material]') : null);
  let held = null, dx = 0, dy = 0;
  const place = (el, x, y) => {
    const r = stage.getBoundingClientRect();
    el.style.left = Math.min(98, Math.max(2, ((x - r.left) / r.width) * 100)).toFixed(1) + '%';
    el.style.top = Math.min(98, Math.max(2, ((y - r.top) / r.height) * 100)).toFixed(1) + '%';
    refresh(stage);
  };
  stage.addEventListener('pointerdown', (e) => {
    held = movable(e.target);
    if (!held || !stage.contains(held)) { held = null; return; }
    const r = held.getBoundingClientRect();
    // sources are centered on their point; objects keep the grab offset
    [dx, dy] = held.dataset.source !== undefined ? [0, 0] : [e.clientX - r.left, e.clientY - r.top];
    stage.setPointerCapture(e.pointerId);
    held.dataset.held = '';
    e.preventDefault();
  });
  stage.addEventListener('pointermove', (e) => { if (held) place(held, e.clientX - dx, e.clientY - dy); });
  const drop = () => { if (held) delete held.dataset.held; held = null; };
  stage.addEventListener('pointerup', drop);
  stage.addEventListener('pointercancel', drop);
  stage.addEventListener('keydown', (e) => {
    const el = movable(e.target);
    const step = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[e.key];
    if (!el || !step) return;
    el.style.left = Math.min(98, Math.max(2, parseFloat(el.style.left) + step[0])) + '%';
    el.style.top = Math.min(98, Math.max(2, parseFloat(el.style.top) + step[1])) + '%';
    refresh(stage);
    e.preventDefault();
  });
}

// Stage controls: fog sliders, per-stage mode, material pickers.
document.querySelectorAll('[data-fog-for]').forEach((input) => input.addEventListener('input', () => {
  const stage = $(input.dataset.fogFor);
  stage.dataset.fog = input.value;
  refresh(stage);
}));
document.querySelectorAll('[data-mode-for]').forEach((btn) => btn.addEventListener('click', () => {
  const stage = $(btn.dataset.modeFor);
  const night = stage.dataset.mode !== 'night';
  stage.dataset.mode = night ? 'night' : 'day';
  btn.setAttribute('aria-pressed', String(night));
  refresh(stage);
}));
document.querySelectorAll('[data-material-for]').forEach((select) => select.addEventListener('change', () => {
  const el = $(select.dataset.materialFor);
  el.dataset.material = select.value;
  el.textContent = select.value;
  refresh(el);
}));
