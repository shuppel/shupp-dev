// PRISM light decision tables — the single source of truth.
// Rendered into /design/prismatic, served to the engine as /prism/rules.js,
// and to agents as /prism/PRISM.md. Change a rule here and all three follow.

export interface Material {
  T: number | 'tint'; // transmittance per crossing; 'tint' = passes its band
  does: string;
  use: string;
}

export interface LightEvent {
  on: string;
  does: string;
  q: number; // duration in quanta (q = 40ms); 0 = passive or held
  held?: boolean; // lasts as long as its state (hover, selection, busy)
  loops?: boolean; // animates, but only while its state holds
}

export interface RigParam {
  values: string;
  default: string | number | boolean;
  does: string;
}

// How each material treats light.
export const MATERIALS: Record<string, Material> = {
  glass: { T: 0.6, does: 'transmits', use: 'transient surfaces' },
  prism: { T: 0.55, does: 'splits incident light into the four bands', use: 'primary actions, hero marks' },
  dichroic: { T: 'tint', does: 'passes its band; glows its complement on the lit side', use: 'brand accents' },
  frosted: { T: 0.3, does: 'transmits without direction and re-emits softly', use: 'standing surfaces, disabled controls' },
  filter: { T: 'tint', does: 'passes only its band, so light on light tinges', use: 'selected or tinted states' },
  pigment: { T: 0.05, does: 'absorbs, bouncing a little of its own color', use: 'immovable surfaces' },
  mirror: { T: 0, does: 'redirects light into a reflected beam', use: 'dividers that route light' },
  emitter: { T: 1, does: 'is a source', use: 'screens, live status, hovered controls' },
  phosphor: { T: 0.5, does: 'stores light and re-emits it over 35q', use: 'notifications, recent changes' },
  fog: { T: 1, does: 'scatters: beams show, and dim with distance', use: 'atmosphere, emphasis zones' },
  void: { T: 0, does: 'absorbs everything', use: 'destructive actions, night occlusion' },
  pipe: { T: 0, does: 'carries light from its lit end along its length', use: 'focus, selection seams, progress' },
  film: { T: 0.8, does: 'shifts color with the angle of the light', use: 'foil, celebratory marks' },
  lens: { T: 0.9, does: 'converges light into a beam', use: 'toggles, the current choice' },
};

// Density chooses the material when none is declared.
export const DENSITY_MATERIAL: Record<string, string> = {
  transient: 'glass',
  standing: 'frosted',
  immovable: 'pigment',
};

// What actions do to light. Every one settles; nothing loops at rest.
export const EVENTS: Record<string, LightEvent> = {
  emit: { on: 'hover · focus', does: 'the object turns faintly emissive', q: 3, held: true },
  absorb: { on: 'press', does: 'the object turns to pigment, then recovers', q: 3 },
  pulse: { on: 'success', does: 'a ring of light disperses outward', q: 12 },
  pipe: { on: 'focus-visible', does: 'a light pipe walks the edge once', q: 10 },
  prism: { on: 'primary (passive)', does: 'the key light splits into bands across it', q: 0 },
  void: { on: 'destructive press', does: 'the object drinks the light near it', q: 8 },
  frost: { on: 'disabled', does: 'the object frosts: light passes, scattered', q: 0 },
  lens: { on: 'toggle', does: 'a lens focuses a beam on the chosen option', q: 0, held: true },
  seam: { on: 'select row', does: 'the row seam becomes a lit pipe', q: 0, held: true },
  sunrise: { on: 'first paint', does: 'the key light rises to rest, once', q: 25 },
  busy: { on: 'aria-busy', does: 'light breathes only while busy', q: 22, held: true, loops: true },
  lift: { on: 'drag · hold', does: 'the object rises: its shadow detaches and softens', q: 0, held: true },
  reject: { on: 'error', does: 'the object becomes a danger filter, then clears', q: 8 },
  afterglow: { on: 'arrival', does: 'phosphor afterglow that decays', q: 35 },
  carry: { on: 'copy · send', does: 'light travels to its destination', q: 10 },
  eclipse: { on: 'mode change', does: 'an occluder crosses the key light', q: 25 },
};

// The light rig: parameters that change the page's light.
export const RIG: Record<string, RigParam> = {
  source: { values: 'window | overhead | footlight | spots', default: 'window', does: 'where the key light rests' },
  scroll: { values: 'on | off', default: false, does: 'the key light travels a day arc as you read' },
  fog: { values: '0–1', default: 0, does: 'scatter: beams show and dim with distance' },
  surfaces: { values: 'field | lit | edges', default: 'field', does: 'where light may land' },
  legibility: { values: 'clamp | halo | mask', default: 'clamp', does: 'how text on the field keeps its contrast' },
  depth: { values: 'flat | z', default: 'flat', does: 'whether z-layer offsets a shadow from its object' },
  night: { values: 'occlusion | light', default: 'occlusion', does: 'night as scarce light, or night as light play' },
};

export const RIG_DEFAULTS = Object.fromEntries(Object.entries(RIG).map(([k, v]) => [k, v.default]));

// The rules an agent applies without judgment.
export const RULES: [string, string][] = [
  ['One hue', 'One anchor hue derives the four brand bands at fixed offsets. Success 152°, danger 27° and warning 75° never rotate; info follows the anchor.'],
  ['Night is a redshift', 'Night maps the hue with R(h) and swaps figure and ground. It is occlusion first: objects grow more opaque and light is scarce.'],
  ['Density chooses the material', 'Transient is glass, standing is frosted, immovable is pigment. Declare data-material only to say something more.'],
  ['The light rests', 'The key light sits where the rig puts it. It never tracks the pointer.'],
  ['Motion is evidence', 'Light moves for a story beat (sunrise, scroll light) or an action (a light event), then sleeps. Only aria-busy and actively hovered or focused solid icons may loop.'],
  ['Key light shadows; play light colors', 'Shadows lean toward the far band. Dense absorbs; light on light tinges; a prism splits.'],
  ['Legibility is a hard bound', 'Day shadows darken the field at most 16%; night glow lifts it at most 0.22. Text on the field may take a halo or a mask, never less than AA.'],
  ['Data never casts', 'Rows hold hairlines. Selection is a 2px seam, lit as a pipe.'],
  ['State is never color alone', 'A word or symbol travels with every status.'],
  ['The playground holds the pointer', 'Only the playground lets the pointer move light.'],
  ['Display type is large', 'Tilt Prism only at 40px or more; Instrument Sans below.'],
  ['Shared rendering pipelines', 'The light field shares one WebGL2 context across its stages. Solid icons share one additional Three.js renderer; never create a context per icon.'],
  ['Solid navigation icons', 'Use <prism-icon> from /prism/icons.js with /prism/icons.css: mark, accounts, marketplace, send, activity. Facets derive from the anchor palette. Static at rest; rotate only while an actionable parent is hovered or focused; settle on exit. Prefer reduced motion and keep the action label visible.'],
];

export const ANTI_PATTERNS: [string, string][] = [
  ['Track the cursor with the light', 'Ambient motion while reading. The light rests (§4).'],
  ['Loop an animation at rest', 'Only aria-busy or a solid icon under active hover/focus may loop (§5).'],
  ['Tilt or parallax objects with the pointer', 'Nothing was selected, so nothing should move.'],
  ['Show a pointer cursor on an inert row', 'The cursor promises an action that is not there.'],
  ['Make inert things focusable', 'Focus promises an action too.'],
  ['Pick a material for its looks', 'Density picks the material (§3).'],
  ['Cast gray shadows', 'Shadows lean toward the far band (§6).'],
  ['Let light cross body text unchecked', 'Clamp, halo or mask it (§7).'],
  ['Glow every row', 'Data never casts (§8).'],
  ['Mount a WebGL context per component', 'Use a shared renderer per pipeline: one light context and at most one solid-icon context, never one per icon (§12).'],
];

export const ACCEPTANCE: string[] = [
  'Moving the pointer does not move ambient light. Hovering an actionable solid icon rotates that icon only.',
  'Solid icons stop rendering frames after exit/blur and the 10q settle; offscreen or hidden icons do not animate.',
  'At rest the frame counter stops: the loop sleeps.',
  'Every light event settles within its listed q; held states end with their state.',
  'Under prefers-reduced-motion nothing moves, and held states still show.',
  'The contrast audit passes AA under full shadow and full glow.',
  'Turning the hue re-tints every band and every shadow; semantic hues hold.',
  'A filter’s shadow is its color, a pigment’s is dark, and a prism throws four bands.',
  'A rig change re-lights the page in one solve, and nothing else moves.',
];
