// Turns a design spec (design-spec/*.spec.json) into the CSS custom properties
// the /design/spec reference page is styled with. Role colors come straight from
// tokens.color.role, one block per mode. The page-only variables at the bottom
// (wireframe paper, code colors, pass/fail tints) are not part of the spec.

type Mode = 'light' | 'dark';
// The spec is our own checked-in JSON, so it is read loosely here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;

export function resolve(tokens: Json, value: string, mode: Mode): string {
  return value.replace(/\{([^}]+)\}/g, (_, path: string) => {
    const node = path.split('.').reduce<Json | string | undefined>((o, k) => (typeof o === 'object' ? o[k] : undefined), tokens);
    if (typeof node === 'string') return resolve(tokens, node, mode);
    if (node?.$value != null) return resolve(tokens, node.$value, mode);
    return resolve(tokens, node?.[mode] ?? '', mode);
  });
}

function modeVars(spec: Json, mode: Mode): Record<string, string> {
  const t = spec.tokens;
  const r = (v: string): string => resolve(t, v, mode);
  const out: Record<string, string> = {};

  for (const b of Object.values<Json>(t.color.brand)) out[b.css] = b.$value;
  for (const [name, role] of Object.entries<Json>(t.color.role)) {
    const css = role.css ?? `--${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
    out[css] = r(role[mode]);
  }
  out['--card-shadow'] = t.shadow.card[mode];
  out['--focus-ring'] = t.shadow.focusRing[mode];
  out['--heading-ink'] = r(t.color.gradient.headingInk[mode]);

  const btn = spec.components.button.variants;
  out['--btn-primary-bg'] = r(btn.primary[mode].bg);
  out['--btn-primary-fg'] = r(btn.primary[mode].fg);
  out['--btn-secondary-bg'] = r(btn.secondary[mode].bg);
  out['--btn-secondary-fg'] = r(btn.secondary[mode].fg);
  out['--btn-secondary-border'] = r(btn.secondary[mode].border.split(' ').slice(1).join(' '));

  const page: Record<Mode, Record<string, string>> = {
    light: {
      '--btn-primary-hover': out['--color-dark'],
      '--btn-secondary-hover-fg': out['--color-light'],
      '--nav-frost': 'rgba(255,255,255,0.92)',
      '--nav-text': out['--color-secondary'],
      '--nav-active': 'linear-gradient(135deg, rgba(121,148,150,0.16), rgba(172,193,150,0.12))',
      '--hero-title': out['--color-secondary'],
      '--wf-bg': '#f4f5f3', '--wf-dot': 'rgba(73,71,91,0.14)', '--wf-line': '#9aa3a4',
      '--wf-fill': 'rgba(255,255,255,0.7)', '--wf-ink': '#49475B',
      '--code-bg': '#fbfbfa', '--code-fg': '#14080E', '--code-key': '#49475B',
      '--code-str': '#4f6b52', '--code-num': '#8a5a2b',
      '--ok': '#3f6136', '--ok-tint': 'rgba(172,193,150,0.3)',
      '--warn': '#7a5d0b', '--warn-tint': 'rgba(233,235,158,0.55)',
      '--bad': '#9b2f2f', '--bad-tint': 'rgba(155,47,47,0.1)',
    },
    dark: {
      '--btn-primary-hover': out['--color-light'],
      '--btn-secondary-hover-fg': out['--color-dark'],
      '--nav-frost': 'rgba(28,28,35,0.92)',
      '--nav-text': out['--text-muted'],
      '--nav-active': 'linear-gradient(135deg, rgba(233,235,158,0.14), rgba(172,193,150,0.08))',
      '--hero-title': out['--color-accent'],
      '--wf-bg': '#1b1b22', '--wf-dot': 'rgba(233,235,158,0.08)', '--wf-line': '#6d6d7c',
      '--wf-fill': 'rgba(35,35,43,0.7)', '--wf-ink': '#a5a5b5',
      '--code-bg': '#1a1a22', '--code-fg': '#e6e7ea', '--code-key': '#E9EB9E',
      '--code-str': '#ACC196', '--code-num': '#e3b98a',
      '--ok': '#ACC196', '--ok-tint': 'rgba(172,193,150,0.16)',
      '--warn': '#E9EB9E', '--warn-tint': 'rgba(233,235,158,0.14)',
      '--bad': '#f0a3a3', '--bad-tint': 'rgba(240,163,163,0.14)',
    },
  };
  return { ...out, ...page[mode] };
}

const block = (selector: string, vars: Record<string, string>, scheme: Mode): string =>
  `${selector} {\n${Object.entries(vars).map(([k, v]) => `  ${k}: ${v};\n`).join('')}  color-scheme: ${scheme};\n}\n`;

/** Light on :root, dark for a dark OS preference and for an explicit data-theme="dark". */
export function rootCss(spec: Json): string {
  const light = modeVars(spec, 'light');
  const dark = modeVars(spec, 'dark');
  return (
    block(':root', light, 'light') +
    `@media (prefers-color-scheme: dark) {\n${block(':root:not([data-theme="light"])', dark, 'dark')}}\n` +
    block(':root[data-theme="dark"]', dark, 'dark')
  );
}
