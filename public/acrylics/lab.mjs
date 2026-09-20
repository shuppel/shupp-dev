import { WIDTH, HEIGHT, clamp, vertices, contains, sample, palette, makePreset, toHex } from './math.mjs';

const root = document.querySelector('.acrylics');
const get = (id) => root.querySelector(`#${id}`);
const canvas = get('paint-board');
const context = canvas.getContext('2d', { colorSpace: 'srgb', willReadFrequently: true });

if (!context) {
  get('lab-error').hidden = false;
} else {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(WIDTH * ratio);
  canvas.height = Math.round(HEIGHT * ratio);
  let layers = makePreset('overprint');
  let selected = 'A';
  let mode = 'multiply';
  let ground = '#FFF9ED';
  let tool = 'move';
  let probe = { x: 500, y: 375 };
  let drag = null;
  let queued = false;
  let paletteSignature = '';
  let currentPalette = [];
  let pickedHex = ground;
  const selectedLayer = () => layers.find((layer) => layer.id === selected);
  const announce = (message) => { get('lab-status').textContent = message; };
  const equations = { multiply: 'f(B,S) = B × S', normal: 'f(B,S) = S', screen: 'f(B,S) = 1 − (1−B)(1−S)' };

  function drawPath(points) {
    context.beginPath();
    points.forEach(([x, y], i) => i ? context.lineTo(x, y) : context.moveTo(x, y));
    context.closePath();
  }

  function syncControls() {
    const layer = selectedLayer();
    for (const button of root.querySelectorAll('[data-layer]')) {
      button.setAttribute('aria-pressed', String(button.dataset.layer === selected));
      button.querySelector('i').style.background = layers.find((l) => l.id === button.dataset.layer).color;
    }
    const controls = {
      'layer-color': layer.color, opacity: Math.round(layer.alpha * 100), shape: layer.shape,
      size: layer.size, rotation: layer.rotation, 'position-x': Math.round(layer.x), 'position-y': Math.round(layer.y),
      aspect: layer.aspect, 'ground-color': ground, 'blend-mode': mode, 'probe-x': Math.round(probe.x), 'probe-y': Math.round(probe.y),
    };
    for (const [id, value] of Object.entries(controls)) get(id).value = value;
    get('layer-hex').textContent = layer.color.toUpperCase();
    get('opacity-value').textContent = `${Math.round(layer.alpha * 100)}%`;
    get('size-value').textContent = Math.round(layer.size);
    get('rotation-value').textContent = `${Math.round(layer.rotation)}°`;
    get('position-x-value').textContent = Math.round(layer.x);
    get('position-y-value').textContent = Math.round(layer.y);
    get('aspect-value').textContent = layer.aspect.toFixed(2);
    get('probe-x-value').textContent = Math.round(probe.x);
    get('probe-y-value').textContent = Math.round(probe.y);
    get('layer-order').textContent = layers.map((l) => l.id).join(' → ');
    get('bring-forward').textContent = layers.at(-1).id === selected ? `${selected} is the top coat` : `Bring ${selected} to front ↑`;
    get('bring-forward').disabled = layers.at(-1).id === selected;
    get('blend-equation').textContent = equations[mode];
    get('shape-parameter-wrap').hidden = layer.shape === 'circle';
    const parameter = get('shape-parameter');
    const info = layer.shape === 'polygon' ? ['Sides n', 3, 10, 1, layer.sides] : layer.shape === 'rosette' ? ['Petals k', 3, 10, 1, layer.petals] : ['Exponent n', 2, 10, .25, layer.exponent];
    get('shape-parameter-label').textContent = info[0];
    parameter.min = info[1]; parameter.max = info[2]; parameter.step = info[3]; parameter.value = info[4];
    get('shape-parameter-value').textContent = info[4];
    canvas.dataset.tool = tool;
    root.querySelectorAll('button[data-tool]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.tool === tool)));
  }

  function geometryMath() {
    const l = selectedLayer();
    const a = Math.round(l.size * l.aspect), b = Math.round(l.size);
    let title, formula, description, values;
    if (l.shape === 'circle' || l.shape === 'superellipse') {
      const n = l.shape === 'circle' ? 2 : l.exponent;
      title = l.shape === 'circle' ? 'Circle / ellipse' : 'Superellipse';
      formula = l.shape === 'circle' ? '(x/a)² + (y/b)² = 1' : '|x/a|ⁿ + |y/b|ⁿ = 1';
      values = `a = ${a} · b = ${b} · n = ${n}`;
      description = l.shape === 'circle' ? 'Stretch one axis to turn a circle into an ellipse.' : 'At n = 2 the form is an ellipse. Larger exponents push it toward a square with rounded corners.';
    } else if (l.shape === 'polygon') {
      title = 'Regular polygon, before stretch';
      formula = 'θᵢ = 2πi/n − π/2';
      values = `n = ${l.sides} vertices · R = ${b} · aspect = ${l.aspect.toFixed(2)}`;
      description = 'Vertices sit on a circle at equal angles. Stretch and rotation are applied afterward.';
    } else {
      title = 'Rosette';
      formula = 'r(t) = R[.76 + .24 cos(k(t + π/2))]';
      values = `k = ${l.petals} petals · R = ${b} · aspect = ${l.aspect.toFixed(2)}`;
      description = 'A periodic change in radius creates the petals. More petals change the rhythm; turning the form changes the overlap.';
    }
    get('geometry-title').textContent = title;
    get('geometry-formula').textContent = formula;
    get('geometry-values').textContent = values;
    get('geometry-description').textContent = description;
    get('transform-values').textContent = `θ = ${l.rotation}° · t = (${Math.round(l.x)}, ${Math.round(l.y)})`;
  }

  function colorMath(result, rendered) {
    pickedHex = toHex(rendered.map((channel) => channel / 255));
    get('sample-hex').textContent = pickedHex;
    get('sample-swatch').style.background = pickedHex;
    get('sample-rgb').textContent = `RGB ${rendered.join(' · ')}`;
    get('sample-layers').textContent = result.steps.length ? result.steps.map((step) => step.id).join(' + ') + ' / AT THE CROSSHAIR' : 'AT THE CROSSHAIR';
    get('sample-count').textContent = result.steps.length ? `${result.steps.length} ${result.steps.length === 1 ? 'coat' : 'coats'} over ground` : 'Ground only';
    get('board-position').textContent = `POINT ${Math.round(probe.x)}, ${Math.round(probe.y)}`;
    const items = [];
    const groundRow = document.createElement('li');
    groundRow.textContent = `Ground ${ground.toUpperCase()}`;items.push(groundRow);
    for (const step of result.steps) {
      const li = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = `${step.id} · ${step.color.toUpperCase()} · α = ${step.alpha.toFixed(2)} → ${toHex(step.after)}`;
      const code = document.createElement('code');
      const b = step.before[0].toFixed(3), s = (parseInt(step.color.slice(1, 3), 16) / 255).toFixed(3), alpha = step.alpha.toFixed(2);
      const f = mode === 'multiply' ? `${b}×${s}` : mode === 'screen' ? `1−(1−${b})(1−${s})` : s;
      code.textContent = `R: (1−${alpha})×${b} + ${alpha}×(${f}) = ${step.after[0].toFixed(3)}`;
      const channels = document.createElement('small');
      channels.textContent = `RGB ≈ ${step.after.map((v) => Math.round(v * 255)).join(' / ')} (0–255)`;
      li.append(title, code, channels);items.push(li);
    }
    get('mix-steps').replaceChildren(...items);
  }

  function paletteTokens() {
    return ':root {\n' + currentPalette.map((entry) => `  --acrylic-${entry.label.toLowerCase().replaceAll(' + ', '-')}: ${entry.color};`).join('\n') + '\n}';
  }

  function paintPalette() {
    const signature = JSON.stringify([ground, mode, layers.map(({ id, color, alpha }) => [id, color, alpha])]);
    if (signature === paletteSignature) return;
    paletteSignature = signature;
    currentPalette = palette(layers, ground, mode);
    get('palette').replaceChildren(...currentPalette.map((entry) => {
      const chip = document.createElement('div');chip.className = 'ac-palette-chip';
      const swatch = document.createElement('i');swatch.style.background = entry.color;swatch.setAttribute('aria-hidden', 'true');
      const caption = document.createElement('div'), label = document.createElement('strong'), value = document.createElement('span');
      label.textContent = entry.label;value.textContent = entry.color;caption.append(label, value);chip.append(swatch, caption);return chip;
    }));
    get('token-output').value = paletteTokens();
  }

  function render() {
    queued = false;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.globalCompositeOperation = 'source-over';context.globalAlpha = 1;
    context.fillStyle = ground;context.fillRect(0, 0, WIDTH, HEIGHT);
    for (const layer of layers) {
      context.globalCompositeOperation = mode === 'normal' ? 'source-over' : mode;
      context.globalAlpha = layer.alpha;context.fillStyle = layer.color;drawPath(vertices(layer));context.fill();
    }
    // Sample the actual paint before selection outlines and the probe are drawn.
    const pixel = context.getImageData(clamp(Math.floor(probe.x * ratio), 0, canvas.width - 1), clamp(Math.floor(probe.y * ratio), 0, canvas.height - 1), 1, 1).data;
    const result = sample(layers, ground, mode, probe);
    colorMath(result, [...pixel].slice(0, 3));
    context.globalCompositeOperation = 'source-over';context.globalAlpha = 1;
    drawPath(vertices(selectedLayer()));context.strokeStyle = '#fff9ed';context.lineWidth = 3;context.setLineDash([8, 7]);context.stroke();
    context.lineDashOffset = 8;context.strokeStyle = '#30291f';context.lineWidth = 1.5;context.stroke();context.lineDashOffset = 0;context.setLineDash([]);
    context.beginPath();context.arc(probe.x, probe.y, 13, 0, Math.PI * 2);context.strokeStyle = '#fff';context.lineWidth = 5;context.stroke();
    context.strokeStyle = '#222';context.lineWidth = 2;context.stroke();
    context.beginPath();context.moveTo(probe.x - 21, probe.y);context.lineTo(probe.x - 8, probe.y);context.moveTo(probe.x + 8, probe.y);context.lineTo(probe.x + 21, probe.y);context.moveTo(probe.x, probe.y - 21);context.lineTo(probe.x, probe.y - 8);context.moveTo(probe.x, probe.y + 8);context.lineTo(probe.x, probe.y + 21);
    context.strokeStyle = '#fff';context.lineWidth = 4;context.stroke();context.strokeStyle = '#222';context.lineWidth = 1.5;context.stroke();
    syncControls();geometryMath();paintPalette();
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(render); } }

  function pointFromEvent(event) {
    const bounds = canvas.getBoundingClientRect();
    return { x: clamp((event.clientX - bounds.left) / bounds.width * WIDTH, 0, WIDTH - 1), y: clamp((event.clientY - bounds.top) / bounds.height * HEIGHT, 0, HEIGHT - 1) };
  }
  canvas.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    const point = pointFromEvent(event);
    if (tool === 'probe') { probe = point;drag = { pointer: event.pointerId, tool }; }
    else {
      const hit = layers.toReversed().find((layer) => layer.alpha > 0 && contains(vertices(layer), point.x, point.y));
      if (!hit) return;
      selected = hit.id;drag = { pointer: event.pointerId, tool, dx: point.x - hit.x, dy: point.y - hit.y };
    }
    canvas.setPointerCapture(event.pointerId);canvas.focus({ preventScroll: true });canvas.classList.add('is-dragging');schedule();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag || drag.pointer !== event.pointerId) return;
    const point = pointFromEvent(event);
    if (drag.tool === 'probe') probe = point;
    else { const layer = selectedLayer();layer.x = clamp(point.x - drag.dx, 0, WIDTH);layer.y = clamp(point.y - drag.dy, 0, HEIGHT); }
    schedule();
  });
  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointer) return;
    const wasProbe = drag.tool === 'probe';drag = null;canvas.classList.remove('is-dragging');
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    announce(wasProbe ? `Sample moved to ${Math.round(probe.x)}, ${Math.round(probe.y)}.` : `Layer ${selected} moved. Use Pick color to inspect an overlap.`);
  }
  canvas.addEventListener('pointerup', endDrag);canvas.addEventListener('pointercancel', endDrag);canvas.addEventListener('lostpointercapture', endDrag);
  canvas.addEventListener('keydown', (event) => {
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (!moves[event.key]) return;
    event.preventDefault();const [dx, dy] = moves[event.key], step = event.shiftKey ? 25 : 5;
    const target = tool === 'probe' ? probe : selectedLayer();
    target.x = clamp(target.x + dx * step, 0, WIDTH - (tool === 'probe' ? 1 : 0));
    target.y = clamp(target.y + dy * step, 0, HEIGHT - (tool === 'probe' ? 1 : 0));schedule();
  });
  root.querySelectorAll('[data-layer]').forEach((button) => button.addEventListener('click', () => { selected = button.dataset.layer;schedule(); }));
  root.querySelectorAll('button[data-tool]').forEach((button) => button.addEventListener('click', () => { tool = button.dataset.tool;schedule();announce(tool === 'probe' ? 'Pick color: click the canvas or move Sample X and Y.' : 'Move shapes: drag a layer or use the position sliders.'); }));
  for (const [id, property, scale] of [['opacity', 'alpha', .01], ['size', 'size', 1], ['rotation', 'rotation', 1], ['position-x', 'x', 1], ['position-y', 'y', 1], ['aspect', 'aspect', 1]]) {
    get(id).addEventListener('input', (event) => { selectedLayer()[property] = Number(event.target.value) * scale;schedule(); });
  }
  get('shape-parameter').addEventListener('input', (event) => { const layer = selectedLayer();layer[layer.shape === 'polygon' ? 'sides' : layer.shape === 'rosette' ? 'petals' : 'exponent'] = Number(event.target.value);schedule(); });
  get('layer-color').addEventListener('input', (event) => { selectedLayer().color = event.target.value;schedule(); });
  get('ground-color').addEventListener('input', (event) => { ground = event.target.value;schedule(); });
  get('shape').addEventListener('change', (event) => { selectedLayer().shape = event.target.value;schedule(); });
  get('blend-mode').addEventListener('change', (event) => { mode = event.target.value;schedule();announce(mode === 'normal' ? 'Normal paint-over: layer order changes the overlap.' : `${mode === 'multiply' ? 'Multiply darkens' : 'Screen lightens'} the ground. Reordering these layers does not change their overlap color.`); });
  get('probe-x').addEventListener('input', (event) => { probe.x = Number(event.target.value);schedule(); });
  get('probe-y').addEventListener('input', (event) => { probe.y = Number(event.target.value);schedule(); });
  get('bring-forward').addEventListener('click', () => { const layer = selectedLayer();layers = [...layers.filter((l) => l.id !== selected), layer];schedule();announce(`Layer ${selected} is on top. ${mode === 'normal' ? 'The paint-over order changed.' : 'In this blend mode, the intersection color is unchanged.'}`); });
  function reset() {
    layers = makePreset(get('preset').value);selected = 'A';mode = 'multiply';ground = '#FFF9ED';probe = { x: 500, y: 375 };tool = 'move';drag = null;
    get('specimen-button').setAttribute('aria-pressed', 'false');get('specimen-button').textContent = 'Keep this color +';get('specimen-status').textContent = 'A tactile little interaction.';
    schedule();announce('Scene reset. Drag the shapes to find a new overlap.');
  }
  get('preset').addEventListener('change', reset);get('reset').addEventListener('click', reset);
  get('copy-palette').addEventListener('click', async () => {
    const tokens = paletteTokens();
    try { await navigator.clipboard.writeText(tokens);announce('Eight color tokens copied.'); }
    catch { get('token-fallback').hidden = false;get('token-fallback').open = true;get('token-output').value = tokens;get('token-output').focus();get('token-output').select();announce('Copy is unavailable here. Your selectable tokens are shown below the palette.'); }
  });
  get('specimen-button').addEventListener('click', () => {
    const button = get('specimen-button'), saved = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(saved));button.textContent = saved ? 'Color kept ✓' : 'Keep this color +';
    get('specimen-status').textContent = saved ? `${pickedHex} kept in this study. Click again to release it.` : 'A tactile little interaction.';
  });

  render();
  get('inspector').disabled = false;
  root.querySelectorAll('[data-control]').forEach((element) => { element.disabled = false; });
  get('board-fallback').hidden = true;canvas.hidden = false;
}
