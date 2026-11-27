// Prerenders the /design/spec reference page at build time.
//
// The page draws itself in the browser from the spec JSON embedded in it
// (design-spec/render/page.template.html), which keeps it from drifting from
// the file. Without JavaScript, though (the game terminal's sandboxed
// preview, crawlers), only the sidebar showed. This runs the same script
// against a small string-based stand-in for the DOM and pours the result into
// the page, so the content is there before any script runs. In the browser the
// script clears it and draws it again, identically, then wires up the controls.

export function prerender(html: string, specRaw: string, templateRaw: string): string {
  const start = html.lastIndexOf('<script>');
  const end = html.lastIndexOf('</script>');
  if (start < 0 || end < start) return html;
  const code = html.slice(start + '<script>'.length, end);

  const out: Record<string, string> = { nav: '', app: '' };
  const fills: Record<string, string> = {};
  const noop = () => {};
  const el = (id: string) => {
    if (id === 'spec') return { textContent: specRaw };
    if (id === 'template') return { textContent: templateRaw };
    if (id === 'nav' || id === 'app') {
      return {
        set innerHTML(v: string) { out[id] = v; },
        append(h: string) { out[id] += h; },
      };
    }
    return {
      set innerHTML(v: string) { fills[id] = v; },
      addEventListener: noop,
      setAttribute: noop,
      scrollIntoView: noop,
    };
  };
  const nodeList = Object.assign([], { forEach: noop });
  const document = {
    getElementById: el,
    createElement: () => ({}),
    querySelector: () => ({ addEventListener: noop, querySelectorAll: () => nodeList }),
    querySelectorAll: () => nodeList,
    documentElement: { getAttribute: () => null, setAttribute: noop, removeAttribute: noop },
  };
  const sandbox = {
    document,
    localStorage: { getItem: () => null, setItem: noop },
    location: { hash: '' },
    navigator: {},
    IntersectionObserver: class { observe() {} },
    getSelection: () => ({ removeAllRanges: noop, addRange: noop }),
    setTimeout: noop,
  };

  // `$` in the page turns markup into a fragment; here markup stays a string.
  const shimmed = code.replace(
    "const $ = (h) => { const t = document.createElement('template'); t.innerHTML = h.trim(); return t.content; };",
    'const $ = (h) => h.trim();',
  );
  try {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function(...Object.keys(sandbox), shimmed)(...Object.values(sandbox));
  } catch (err) {
    // The tail of the script wires up controls (nav highlighting, mode toggle)
    // that the stand-in can't fully fake. That's fine once the content exists.
    if (!out.app) {
      console.warn('[design-spec] prerender skipped:', (err as Error).message);
      return html;
    }
  }

  let app = out.app;
  for (const [id, inner] of Object.entries(fills)) {
    app = app.replace(new RegExp(`(<(\\w+)[^>]*\\sid="${id}"[^>]*>)(</\\2>)`), (_, open, _tag, close) => open + inner + close);
  }
  return html
    .replace('<nav id="nav"></nav>', `<nav id="nav">${out.nav}</nav>`)
    .replace('<div class="col" id="app"></div>', `<div class="col" id="app">${app}</div>`);
}
