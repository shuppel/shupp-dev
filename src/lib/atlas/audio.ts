// The Scattered Atlas: music, ambience and sound effects.
//
// The game (Rust/WASM) never plays audio. It emits `music` with a room key
// and `sfx` with a sound name; this module plays them with Web Audio.
// Browsers only allow sound after a gesture, so nothing loads or plays until
// the first key press or tap. The on/off setting is saved in localStorage.

const BASE = '/atlas/audio/';

// Room key → [music track, ambience loop layered under it].
const ROOMS: Record<string, [string, string | null]> = {
  bridge: ['bridge_concourse', 'ship_hum'],
  engine: ['engine_room', 'engine_room'],
  quarters: ['captains_quarters', 'quarters'],
  dockyard: ['dockyard', 'dockyard'],
  archive: ['archive_terminal', 'ship_hum'],
  // No star map track: the title theme plays over the planets.
  title: ['title_theme', null],
};

// One name, several takes: pick one at random (never the same twice running).
const VARIANTS: Record<string, string[]> = {
  step_metal: ['fx_footstep_metal_1', 'fx_footstep_metal_2', 'fx_footstep_metal_3', 'fx_footstep_metal_4'],
  step_wood: ['fx_footstep_wood_2', 'fx_footstep_wood_3', 'fx_footstep_wood_4'],
  fx_pongo_bark: ['fx_pongo_bark_1', 'fx_pongo_bark_2', 'fx_pongo_bark_3'],
};

const ALL_SFX = [
  ...Object.values(VARIANTS).flat(),
  'fx_console_activate', 'fx_door_slide', 'fx_holo_comms', 'fx_interact_glow',
  'sting_item_legendary', 'sting_item_rare', 'sting_new_area', 'sting_quest_complete',
  'ui_cancel', 'ui_confirm', 'ui_cursor_move', 'ui_dialogue_text', 'ui_menu_close',
  'ui_menu_open', 'ui_tab_switch', 'ui_theme_toggle',
];

const MUSIC_VOL = 0.42;
const AMB_VOL = 0.32;
const FADE = 1.2;

function volumeFor(name: string): number {
  if (name.startsWith('fx_footstep')) return 0.3;
  if (name === 'ui_dialogue_text') return 0.22;
  if (name === 'ui_cursor_move') return 0.4;
  if (name.startsWith('sting_')) return 0.75;
  if (name.startsWith('ui_')) return 0.55;
  return 0.6;
}

// Minimum gap between repeats, so typing and footsteps don't machine-gun.
function gapFor(name: string): number {
  if (name === 'ui_dialogue_text') return 0.055;
  if (name.startsWith('fx_footstep')) return 0.12;
  if (name === 'ui_cursor_move') return 0.04;
  return 0.03;
}

type Deck = { el: HTMLAudioElement; gain: GainNode; track: string };

export function createAudio(store: { get(k: string): string; set(k: string, v: string): void }) {
  let on = store.get('atlas:sound') !== 'off';
  let ctx: AudioContext | null = null;
  let master: GainNode, musicBus: GainNode, sfxBus: GainNode;
  const decks: Deck[] = [];
  let front = 0;
  let room = '';
  let amb: { src: AudioBufferSourceNode; gain: GainNode; name: string } | null = null;
  const buffers = new Map<string, Promise<AudioBuffer | null>>();
  const lastPlayed = new Map<string, number>();
  const lastVariant = new Map<string, string>();
  let duckUntil = 0;

  function buffer(path: string): Promise<AudioBuffer | null> {
    let p = buffers.get(path);
    if (!p) {
      p = fetch(BASE + path)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
        .then((b) => ctx!.decodeAudioData(b))
        .catch(() => null);
      buffers.set(path, p);
    }
    return p;
  }

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = on ? 1 : 0;
      master.connect(ctx.destination);
      musicBus = ctx.createGain();
      musicBus.connect(master);
      sfxBus = ctx.createGain();
      sfxBus.connect(master);
      // Two music decks for crossfades. Both are started inside this gesture
      // so iOS lets them play later without one.
      for (let i = 0; i < 2; i++) {
        const el = new Audio();
        el.loop = true;
        el.preload = 'none';
        el.crossOrigin = 'anonymous';
        const gain = ctx.createGain();
        gain.gain.value = 0;
        ctx.createMediaElementSource(el).connect(gain);
        gain.connect(musicBus);
        el.play().catch(() => {});
        el.pause();
        decks.push({ el, gain, track: '' });
      }
      if (on) for (const n of ALL_SFX) buffer(`sfx/${n}.mp3`);
    }
    if (on && ctx.state !== 'running') ctx.resume().catch(() => {});
    if (on && room) applyRoom(true);
  }
  for (const ev of ['pointerdown', 'keydown', 'touchend']) {
    window.addEventListener(ev, unlock, { capture: true, passive: true });
  }

  function applyRoom(force = false) {
    if (!ctx || !on) return;
    const [track, ambName] = ROOMS[room] ?? [null, null];
    const now = ctx.currentTime;
    const cur = decks[front];
    if (track && (cur.track !== track || force)) {
      if (cur.track !== track) {
        // Crossfade to the other deck.
        cur.gain.gain.cancelScheduledValues(now);
        cur.gain.gain.setValueAtTime(cur.gain.gain.value, now);
        cur.gain.gain.linearRampToValueAtTime(0, now + FADE);
        const old = cur;
        window.setTimeout(() => { if (old !== decks[front]) old.el.pause(); }, FADE * 1000 + 50);
        front = 1 - front;
        const next = decks[front];
        if (next.track !== track) {
          next.track = track;
          next.el.src = `${BASE}music/${track}.mp3`;
        }
        next.gain.gain.cancelScheduledValues(now);
        next.gain.gain.setValueAtTime(0, now);
        next.gain.gain.linearRampToValueAtTime(MUSIC_VOL, now + FADE);
        next.el.play().catch(() => {});
      } else if (cur.el.paused) {
        cur.gain.gain.setValueAtTime(MUSIC_VOL, now);
        cur.el.play().catch(() => {});
      }
    }
    if (ambName !== (amb?.name ?? null)) {
      if (amb) {
        const a = amb;
        a.gain.gain.setValueAtTime(a.gain.gain.value, now);
        a.gain.gain.linearRampToValueAtTime(0, now + FADE);
        a.src.stop(now + FADE + 0.05);
        amb = null;
      }
      if (ambName) {
        const want = room;
        buffer(`amb/${ambName}.mp3`).then((buf) => {
          if (!buf || !ctx || room !== want || amb) return;
          const src = ctx.createBufferSource();
          src.buffer = buf;
          src.loop = true;
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(AMB_VOL, ctx.currentTime + FADE);
          src.connect(gain).connect(musicBus);
          src.start();
          amb = { src, gain, name: ambName };
        });
      }
    }
  }

  function music(key: string) {
    room = key;
    applyRoom();
  }

  function sfx(name: string) {
    if (!ctx || !on || ctx.state !== 'running') return;
    const takes = VARIANTS[name];
    if (takes) {
      const pool = takes.filter((t) => t !== lastVariant.get(name));
      const pick = pool[Math.floor(Math.random() * pool.length)];
      lastVariant.set(name, pick);
      name = pick;
    }
    const now = ctx.currentTime;
    const key = takes ? Object.keys(VARIANTS).find((k) => VARIANTS[k].includes(name))! : name;
    if (now - (lastPlayed.get(key) ?? -1) < gapFor(name)) return;
    lastPlayed.set(key, now);
    buffer(`sfx/${name}.mp3`).then((buf) => {
      if (!buf || !ctx || !on) return;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      // A touch of pitch variety on footsteps and typing.
      if (name.startsWith('fx_footstep') || name === 'ui_dialogue_text') src.playbackRate.value = 0.94 + Math.random() * 0.12;
      const gain = ctx.createGain();
      gain.gain.value = volumeFor(name);
      src.connect(gain).connect(sfxBus);
      src.start();
      if (name.startsWith('sting_')) duck(buf.duration);
    });
  }

  // Stingers sit on top of the music: dip it, then bring it back.
  function duck(seconds: number) {
    if (!ctx) return;
    const now = ctx.currentTime;
    duckUntil = Math.max(duckUntil, now + seconds);
    const g = musicBus.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.3, now + 0.15);
    g.setValueAtTime(0.3, duckUntil);
    g.linearRampToValueAtTime(1, duckUntil + 0.8);
  }

  function setOn(v: boolean) {
    on = v;
    store.set('atlas:sound', v ? 'on' : 'off');
    if (!ctx) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(v ? 1 : 0, now + 0.25);
    if (v) {
      ctx.resume().catch(() => {});
      for (const n of ALL_SFX) buffer(`sfx/${n}.mp3`);
      applyRoom(true);
    } else {
      window.setTimeout(() => { if (!on) for (const d of decks) d.el.pause(); }, 300);
    }
  }

  // A hidden tab goes quiet.
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else if (on) ctx.resume().catch(() => {});
  });

  return { music, sfx, setOn, get on() { return on; } };
}
