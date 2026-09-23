import { PaintSurface, PAINT_WIDTH, PAINT_HEIGHT, TUBES, pigmentMix, rgb, hex, paintGesture, seedStudy } from './paint-engine.mjs';

const root = document.querySelector('#paint-studio');
const get = (id) => root.querySelector(`#${id}`);
const canvas = get('wet-canvas');
const context = canvas.getContext('2d', { colorSpace: 'srgb' });
if (!context) {
  get('wet-status').textContent = 'The paint surface could not start. The material study below is still available.';
} else {
  const surface = new PaintSurface();
  const history = [];
  let settings = { color: TUBES[0][1], size: 76, load: .9, roughness: .6, pressure: .85, tool: 'brush' };
  let gesture = null;
  let pendingPoint = null;
  let queued = false;
  let needsPaint = true;
  let probe = { x: 385, y: 171 };
  let pixels;
  let demoSeed = 41;
  let changeCount = 0;
  let pointerMoved = false;
  let keyboardProbe = false;
  canvas.width = PAINT_WIDTH;
  canvas.height = PAINT_HEIGHT;

  function remember() {
    history.push(surface.snapshot());
    if (history.length > 7) history.shift();
    get('wet-undo').disabled = false;
  }

  function announce(message) { get('wet-status').textContent = message; }

  function readSample() {
    const i = (Math.floor(probe.y) * PAINT_WIDTH + Math.floor(probe.x)) * 4;
    const color = hex(Array.from(pixels.slice(i, i + 3)));
    get('wet-sample').textContent = color;
    get('wet-chip').style.background = color;
    get('wet-coordinates').textContent = `${Math.round(probe.x)}, ${Math.round(probe.y)}`;
    const amount = surface.mass[i / 4];
    get('wet-thickness').textContent = amount > .001 ? `${(100 * (1 - Math.exp(-amount * 2.8))).toFixed(0)}% paint coverage · wet` : 'Dry ground / set paint';
  }

  function render() {
    queued = false;
    if (pendingPoint && gesture !== null) {
      surface.move(pendingPoint.x, pendingPoint.y, pendingPoint.pressure);
      probe = { x: pendingPoint.x, y: pendingPoint.y };
      pendingPoint = null;
      needsPaint = true;
    }
    if (needsPaint) {
      pixels = surface.pixels();
      context.putImageData(new ImageData(pixels, PAINT_WIDTH, PAINT_HEIGHT), 0, 0);
      needsPaint = false;
    }
    get('wet-probe').style.left = `${probe.x / PAINT_WIDTH * 100}%`;
    get('wet-probe').style.top = `${probe.y / PAINT_HEIGHT * 100}%`;
    get('wet-probe').hidden = settings.tool !== 'pick' && !keyboardProbe;
    readSample();
  }

  function schedule(paint = false) {
    needsPaint ||= paint;
    if (!queued) { queued = true; requestAnimationFrame(render); }
  }

  function point(event) {
    const bounds = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(PAINT_WIDTH - 1, (event.clientX - bounds.left) / bounds.width * PAINT_WIDTH)),
      y: Math.max(0, Math.min(PAINT_HEIGHT - 1, (event.clientY - bounds.top) / bounds.height * PAINT_HEIGHT)),
      pressure: event.pointerType === 'pen' ? Math.max(.1, event.pressure) : 1,
    };
  }

  function selectTool(tool) {
    settings.tool = tool;
    root.querySelectorAll('[data-paint-tool]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.paintTool === tool)));
    canvas.dataset.paintTool = tool;
    get('wet-gesture').disabled = tool === 'pick';
    get('wet-gesture').textContent = tool === 'blot' ? 'Place a blot' : 'Lay a sample stroke';
    announce(tool === 'pick' ? 'Click to sample. Arrow keys move the sampler; Shift moves farther.' : tool === 'blot' ? 'Click for a pooled blot. Drag to spread it.' : 'Drag to paint. A long stroke runs low; lift to reload the brush.');
    schedule();
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0 || gesture !== null) return;
    const p = point(event);
    keyboardProbe = false;
    canvas.focus({ preventScroll: true });
    if (settings.tool === 'pick') {
      probe = p; schedule(); return;
    }
    remember();
    gesture = event.pointerId;
    pointerMoved = false;
    canvas.setPointerCapture(event.pointerId);
    surface.begin(p.x, p.y, settings, p.pressure);
    probe = p;
    schedule(true);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (gesture !== event.pointerId) return;
    pendingPoint = point(event);
    pointerMoved = true;
    schedule();
  });

  function finish(event) {
    if (gesture !== event.pointerId) return;
    // Finish the last segment even if pointerup precedes the next animation frame.
    if (pendingPoint) {
      surface.move(pendingPoint.x, pendingPoint.y, pendingPoint.pressure);
      probe = pendingPoint; pendingPoint = null;
    }
    surface.end();
    gesture = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    changeCount++;
    announce(`${pointerMoved ? 'Stroke' : 'Mark'} ${changeCount} laid down. The paint is still wet.`);
    schedule(true);
  }
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', finish);
  canvas.addEventListener('lostpointercapture', finish);

  canvas.addEventListener('keydown', (event) => {
    const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!arrows[event.key] && event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (arrows[event.key]) {
      const [x, y] = arrows[event.key], step = event.shiftKey ? 30 : 6;
      probe.x = Math.max(0, Math.min(PAINT_WIDTH - 1, probe.x + x * step));
      probe.y = Math.max(0, Math.min(PAINT_HEIGHT - 1, probe.y + y * step));
      keyboardProbe = true;
      schedule();
    } else if (settings.tool !== 'pick') {
      remember(); surface.begin(probe.x, probe.y, settings); surface.end();
      schedule(true); announce('A paint mark was placed at the sampler position.');
    }
  });

  root.querySelectorAll('[data-paint-tool]').forEach((button) => button.addEventListener('click', () => selectTool(button.dataset.paintTool)));
  root.querySelectorAll('[data-pigment]').forEach((button) => button.addEventListener('click', () => {
    get('wet-color').value = button.dataset.pigment;
    chooseColor(button.dataset.pigment);
  }));
  function chooseColor(value) {
    settings.color = value.toUpperCase();
    get('wet-color-name').textContent = TUBES.find((tube) => tube[1] === settings.color)?.[0] || settings.color;
    root.querySelectorAll('[data-pigment]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.pigment === settings.color)));
  }
  get('wet-color').addEventListener('input', (event) => chooseColor(event.target.value));
  for (const [id, property, scale] of [['wet-size', 'size', 1], ['wet-load', 'load', .01], ['wet-roughness', 'roughness', .01], ['wet-pressure', 'pressure', .01]]) {
    get(id).addEventListener('input', (event) => {
      settings[property] = Number(event.target.value) * scale;
      get(`${id}-value`).textContent = property === 'size' ? event.target.value : `${event.target.value}%`;
    });
  }

  get('wet-gesture').addEventListener('click', () => {
    remember();
    const offset = (changeCount % 4) * 32;
    if (settings.tool === 'blot') paintGesture(surface, [[385 + offset, 225]], settings);
    else paintGesture(surface, [[125, 210 + offset], [235, 185 + offset], [355, 225 + offset], [490, 230 + offset], [630, 195 + offset]], settings);
    probe = { x: 355, y: 225 + offset };
    changeCount++;
    schedule(true);
    announce('Sample gesture painted with the current color, load, and bristles.');
  });
  get('wet-dry').addEventListener('click', () => {
    remember(); surface.dry(); schedule(true);
    announce('Paint set. New paint will cover this surface without mixing into these pigments. Undo restores the wet paint.');
  });
  get('wet-undo').addEventListener('click', () => {
    if (history.length) surface.restore(history.pop());
    get('wet-undo').disabled = history.length === 0;
    schedule(true); announce('Last paint action undone.');
  });
  get('wet-clear').addEventListener('click', () => {
    remember(); surface.clear(); schedule(true);
    announce('Fresh canvas. Undo brings the painting back.');
  });
  get('wet-study').addEventListener('click', () => {
    remember(); seedStudy(surface, ++demoSeed); schedule(true);
    announce('A new arrangement of bristle texture is ready. Each mark keeps its own irregularities.');
  });

  // A controlled color study separates pigment mixing from opacity on paper.
  function comparison() {
    const a = rgb(get('mix-a').value), b = rgb(get('mix-b').value);
    const t = Number(get('mix-ratio').value) / 100;
    const pigment = pigmentMix(a, b, t);
    const digital = a.map((v, i) => v * (1 - t) + b[i] * t);
    get('mix-ratio-value').textContent = `${Math.round((1 - t) * 100)} : ${Math.round(t * 100)}`;
    get('pigment-result').style.background = hex(pigment);
    get('digital-result').style.background = hex(digital);
    get('pigment-value').textContent = hex(pigment);
    get('digital-value').textContent = hex(digital);
    get('mix-stops').replaceChildren(...[0, .125, .25, .375, .5, .625, .75, .875, 1].map((f) => {
      const chip = document.createElement('span');
      chip.style.background = hex(pigmentMix(a, b, f));
      chip.setAttribute('aria-label', `${Math.round(f * 100)}% second pigment: ${hex(pigmentMix(a, b, f))}`);
      return chip;
    }));
  }
  ['mix-a', 'mix-b', 'mix-ratio'].forEach((id) => get(id).addEventListener('input', comparison));
  get('mix-load').addEventListener('click', () => {
    const color = hex(pigmentMix(rgb(get('mix-a').value), rgb(get('mix-b').value), Number(get('mix-ratio').value) / 100));
    get('wet-color').value = color; chooseColor(color);
    if (settings.tool === 'pick') selectTool('brush');
    announce(`${color} is on the brush. Drag on the canvas or lay a sample stroke.`);
  });

  try {
    seedStudy(surface); render(); comparison();
    root.querySelectorAll('[data-wet-control]').forEach((control) => { control.disabled = false; });
    get('wet-inspector').disabled = false;
    get('wet-mix-controls').disabled = false;
    get('wet-fallback').hidden = true;
    canvas.hidden = false;
    chooseColor(settings.color);
    announce('Paint is wet. Try dragging forest green through the red, then dry the surface and try again.');
  } catch (error) {
    console.error('Acrylics paint surface could not initialize', error);
    announce('The paint surface could not start. The static study remains available.');
  }
}
