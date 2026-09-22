import React, { useEffect, useRef, useState } from "react";
import CreatureTown, { type TownControl } from "./CreatureTown";
import DinoPortrait from "./DinoPortrait";
import { species } from "./dinoScene";
import { places, type PlaceId } from "./townModel";
import {
  actOnCompanion,
  adoptCompanion,
  advanceNursery,
  changeWorker,
  clockLabel,
  freshNursery,
  jobs,
  restoreNursery,
  type CompanionAction,
  type CreatureKind,
  type Job,
  type WorkerAction,
} from "./creatureEngine";
import {
  gear,
  greeting,
  levelFor,
  levelStarts,
  missionLock,
  missions,
  rankFor,
  type Focus,
  type GearId,
  type MissionId,
  type Temperament,
} from "./companions";

type Panel =
  | "hatchery"
  | "shop"
  | "missions"
  | "mission"
  | "inventory"
  | "character"
  | "journal"
  | "camp"
  | "report"
  | "reward"
  | "map"
  | "menu"
  | "help"
  | "reset"
  | null;
const saveKey = "saas-game-ui-creature-works-v2";
function GearArt({ id }: { id: GearId }): React.JSX.Element {
  return (
    <svg className="ct-gear-art" viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="50" cy="85" rx="24" ry="5" fill="#725d3920" />
      {id === "lens" ? (
        <>
          <circle
            cx="44"
            cy="42"
            r="25"
            fill="#b5d9cf"
            stroke="#9e783d"
            strokeWidth="7"
          />
          <circle cx="44" cy="42" r="18" fill="#deeee280" />
          <path
            d="m64 62 19 20"
            stroke="#6b573e"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M32 31q8-10 18-5"
            fill="none"
            stroke="#fff9e2"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      ) : id === "planner" ? (
        <>
          <rect x="24" y="13" width="54" height="70" rx="7" fill="#77948a" />
          <rect x="29" y="18" width="44" height="59" rx="3" fill="#f7edcd" />
          <rect x="39" y="9" width="23" height="13" rx="4" fill="#b08b50" />
          {[35, 49, 63].map((y) => (
            <g key={y}>
              <path
                d={`m35 ${y} 4 4 6-7`}
                stroke="#6c927d"
                strokeWidth="3"
                fill="none"
              />
              <path d={`M51 ${y}h15`} stroke="#9c987b" strokeWidth="3" />
            </g>
          ))}
        </>
      ) : id === "scarf" ? (
        <>
          <path d="M20 26q35-20 58 0l-8 23q-31 9-47-1Z" fill="#ce7054" />
          <path d="m55 43 17 3-5 38-18-5Z" fill="#b95540" />
          <path
            d="M25 31q25-9 46-1M54 67l15 4"
            fill="none"
            stroke="#ec9d75"
            strokeWidth="5"
          />
        </>
      ) : id === "retry" ? (
        <>
          <path
            d="M29 13q-15 37 21 42 36-4 23-42"
            fill="none"
            stroke="#7b654b"
            strokeWidth="5"
          />
          <circle
            cx="50"
            cy="65"
            r="22"
            fill="#d9b269"
            stroke="#a98543"
            strokeWidth="4"
          />
          <path
            d="M62 65a12 12 0 1 1-8-11m-1-6 3 9-10 1"
            fill="none"
            stroke="#fff2cb"
            strokeWidth="4"
          />
        </>
      ) : (
        <>
          <path
            d="M46 72C8 62 12 29 14 16q21 6 36 31Q63 20 86 16q6 46-33 57Z"
            fill="#e5d6ab"
            stroke="#b5a374"
            strokeWidth="3"
          />
          <path
            d="M20 31 43 54M20 48l21 16M80 31 57 54M79 48 59 64"
            stroke="#c3b387"
            strokeWidth="3"
          />
          <circle cx="50" cy="68" r="9" fill="#c39450" />
        </>
      )}
    </svg>
  );
}
export default function CreatureWorks(): React.JSX.Element {
  const [state, setState] = useState(freshNursery),
    [ready, setReady] = useState(false),
    [saved, setSaved] = useState(false),
    [selected, setSelected] = useState<number | null>(null),
    [panel, setPanel] = useState<Panel>(null),
    [near, setNear] = useState<PlaceId | null>(null),
    [playing, setPlaying] = useState(false),
    [moved, setMoved] = useState(false);
  const [name, setName] = useState("Pip"),
    [kind, setKind] = useState<CreatureKind>("sprout"),
    [temperament, setTemperament] = useState<Temperament>("curious"),
    [missionId, setMissionId] = useState<MissionId>("morning"),
    [brief, setBrief] = useState(missions.morning.prompt),
    [focus, setFocus] = useState<Focus>("balanced"),
    [job, setJob] = useState<Job>("deliver"),
    [interval, setInterval] = useState(15),
    [notice, setNotice] = useState(
      "Welcome to Fernhaven. Your first friend is waiting at the hatchery.",
    ),
    [reward, setReward] = useState({
      level: 1,
      xp: 0,
      buttons: 0,
      leveled: false,
    });
  const dialog = useRef<HTMLDialogElement>(null),
    town = useRef<TownControl>(null),
    lastPanel = useRef<Panel>(null);
  const worker = state.workers.find((w) => w.id === selected),
    pet = worker?.companion,
    assignment = pet?.assignment ?? null,
    level = levelFor(pet?.xp ?? 0),
    locked =
      worker !== undefined && (worker.remaining > 0 || assignment !== null);
  const nearby = places.find((p) => p.id === near),
    paused = panel !== null;
  const open = (next: Panel): void => {
    setPanel(next);
  };
  const close = (): void => {
    dialog.current?.close();
    setPanel(null);
    requestAnimationFrame(() => town.current?.focus());
  };
  useEffect(() => {
    try {
      const restored = restoreNursery(
        localStorage.getItem(saveKey) ??
          localStorage.getItem("saas-game-ui-creature-works-v1"),
      );
      setState(restored);
      setSelected(restored.workers[0]?.id ?? null);
      if (restored.workers.length > 0)
        setNotice("Welcome back, keeper. Your companions are here.");
    } catch {
      /* Session-only fallback. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(saveKey, JSON.stringify(state));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [state, ready]);
  useEffect(() => {
    if (!playing || paused) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setState((s) => advanceNursery(s));
    }, 3000);
    return () => clearInterval(timer);
  }, [playing, paused]);
  useEffect(() => {
    if (playing && state.workers.every((w) => w.remaining === 0 && !w.enabled))
      setPlaying(false);
  }, [playing, state.workers]);
  useEffect(() => {
    if (panel !== null) {
      if (dialog.current?.open !== true) dialog.current?.showModal();
      if (panel !== lastPanel.current) dialog.current?.scrollTo(0, 0);
    }
    lastPanel.current = panel;
  }, [panel]);
  useEffect(() => {
    const key = (e: KeyboardEvent): void => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.repeat ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      )
        return;
      const k = e.key.toLowerCase(),
        target =
          k === "i"
            ? "inventory"
            : k === "c"
              ? "character"
              : k === "m"
                ? "map"
                : null;
      if (target !== null) {
        e.preventDefault();
        if (panel === target) close();
        else open(target);
      } else if (k === "escape" && panel === null) {
        e.preventDefault();
        open("menu");
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [panel]);
  function act(action: CompanionAction): void {
    if (worker !== undefined)
      setState((s) => actOnCompanion(s, worker.id, action));
  }
  function routine(action: WorkerAction): void {
    if (worker !== undefined)
      setState((s) => changeWorker(s, worker.id, action));
  }
  function navigate(id: PlaceId): void {
    close();
    town.current?.goTo(id);
    setNotice(
      `Walking to ${places.find((p) => p.id === id)?.name ?? "your destination"}. Press E when you arrive.`,
    );
  }
  function interact(id: PlaceId): void {
    if (id !== near) return;
    if (id === "hatchery") {
      setName(
        ["Pip", "Momo", "Taro", "Nori", "Fenn", "Kiki"][state.workers.length] ??
          "Pip",
      );
      open("hatchery");
    } else if (id === "gate") {
      open("character");
    } else if (id === "camp") {
      if (worker !== undefined) {
        setJob(worker.job);
        setInterval(worker.interval);
      }
      open("camp");
    } else open(id);
  }
  function chooseMission(id: MissionId): void {
    setMissionId(id);
    setBrief(missions[id].prompt);
    setFocus("balanced");
    open("mission");
  }
  function launch(e: React.FormEvent): void {
    e.preventDefault();
    if (
      worker === undefined ||
      pet === undefined ||
      locked ||
      missionLock(pet, missionId) !== null
    )
      return;
    act({ type: "mission", mission: missionId, brief, focus });
    setPlaying(true);
    close();
    setNotice(
      `${worker.name} is heading into the wilds. Watch for their return.`,
    );
  }
  function accept(): void {
    if (pet === undefined || assignment?.result == null) return;
    const m = missions[assignment.id],
      next = levelFor(pet.xp + m.xp);
    setReward({
      level: next,
      xp: m.xp,
      buttons: m.buttons,
      leveled: next > level,
    });
    act({ type: "accept" });
    open("reward");
    setNotice(
      `${worker?.name ?? "Your companion"} earned +${m.xp} XP and ${m.buttons} buttons.`,
    );
  }
  const title: Record<Exclude<Panel, null>, string> = {
    hatchery: "A little prehistoric possibility.",
    shop: "Good gear. Big adventures.",
    missions: "What shall we do today?",
    mission: missions[missionId].title,
    inventory: "Your field bag.",
    character: "The keeper & the company.",
    journal: "Things we brought home.",
    camp: "A little work, on repeat.",
    report: assignment?.result?.title ?? "A result from the wilds.",
    reward: reward.leveled
      ? `Level ${reward.level}!`
      : "A good little adventure.",
    map: "Around Fernhaven.",
    menu: "Take a breather.",
    help: "Make yourself at home.",
    reset: "Start a new chapter?",
  };
  const eyebrow: Record<Exclude<Panel, null>, string> = {
    hatchery: "Fern & Fossil · Hatchery",
    shop: "The Amber Outfitter",
    missions: "Adventure board",
    mission: "Prepare a mission",
    inventory: "Inventory · I",
    character: "Character · C",
    journal: "Companion journal",
    camp: "Keeper’s camp",
    report: "Look what I found",
    reward: "A little celebration",
    map: "Town map · M",
    menu: "Creature Works",
    help: "Keeper’s field guide",
    reset: "Reset village",
  };
  const partyPicker =
    state.workers.length > 1 ? (
      <label className="ct-party-select">
        Companion
        <select
          aria-label="Choose companion"
          value={selected ?? ""}
          onChange={(e) => {
            const id = Number(e.target.value);
            setSelected(id);
            const w = state.workers.find((w) => w.id === id);
            if (w !== undefined) {
              setJob(w.job);
              setInterval(w.interval);
            }
          }}
        >
          {state.workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} · Lv. {levelFor(w.companion.xp)}
            </option>
          ))}
        </select>
      </label>
    ) : null;
  const noPet = (
    <div className="ct-empty">
      <span className="ct-empty-icon">◌</span>
      <h3>Your company starts with one friend.</h3>
      <p>
        Visit Fern & Fossil to meet the dinosaurs. Choose a form, a name, and a
        little personality.
      </p>
      <button className="ct-primary" onClick={() => navigate("hatchery")}>
        Walk to the hatchery ↗
      </button>
    </div>
  );
  return (
    <main className="ct-game">
      {ready && (
        <CreatureTown
          ref={town}
          workers={state.workers}
          selected={selected}
          paused={paused}
          onNear={setNear}
          onInteract={interact}
          onMove={() => setMoved(true)}
        />
      )}
      <header className="ct-hud-top">
        <div className="ct-town-title">
          <span>CREATURE WORKS</span>
          <h1>
            Fernhaven<span>✦</span>
          </h1>
          <small>A small town. A big little life.</small>
        </div>
        <div className="ct-top-actions">
          <span
            className="ct-wallet"
            title="Earned currency for the selected companion"
          >
            <i>◉</i>
            {pet?.buttons ?? 0}
            <small>buttons</small>
          </span>
          <button onClick={() => open("map")} aria-label="Town map (M)">
            <span>Map</span>
            <kbd>M</kbd>
          </button>
          <button onClick={() => open("menu")} aria-label="Game menu (Escape)">
            <span>Menu</span>
            <kbd>Esc</kbd>
          </button>
        </div>
      </header>
      <div className="ct-objective">
        <span className="ct-quest-mark">!</span>
        <div>
          <small>
            {state.workers.length === 0
              ? "YOUR FIRST CHAPTER"
              : assignment?.result != null
                ? "A FRIEND HAS RETURNED"
                : assignment !== null
                  ? "AN ADVENTURE UNDERWAY"
                  : "A LITTLE POSSIBILITY"}
          </small>
          <b>
            {state.workers.length === 0
              ? "Meet your first companion."
              : assignment?.result != null
                ? `${worker?.name ?? "Someone"} brought you something.`
                : assignment !== null
                  ? missions[assignment.id].title
                  : pet?.missions === 0
                    ? "Find your first mission."
                    : "Where will today take you?"}
          </b>
          <p>
            {state.workers.length === 0
              ? "Walk to the hatchery. Press E at the door."
              : assignment?.result != null
                ? "Open your companion to review the result."
                : assignment !== null
                  ? playing
                    ? "Explore town while they work."
                    : "Resume the expedition from Character (C)."
                  : "Visit the adventure board in the square."}
          </p>
        </div>
      </div>
      {!moved && (
        <div className="ct-first-hint">
          <kbd>W</kbd>
          <span>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd>
          </span>
          <p>Move, or click a place to walk there.</p>
        </div>
      )}
      <div className="ct-context">
        {nearby !== undefined && (
          <button onClick={() => interact(nearby.id)}>
            <kbd>E</kbd>
            <span>
              {nearby.action}
              <small>{nearby.name}</small>
            </span>
            <b>↗</b>
          </button>
        )}
      </div>
      <div className="ct-bottom-hud">
        <button
          className={`ct-buddy ${assignment?.result != null ? "has-result" : ""}`}
          onClick={() => open("character")}
          aria-label="Open character and companions"
        >
          <span className={`ct-species-dot ${worker?.kind ?? "empty"}`}>
            {worker === undefined
              ? "◌"
              : worker.kind === "sprout"
                ? "♧"
                : worker.kind === "finch"
                  ? "ϟ"
                  : "≈"}
          </span>
          <span>
            <small>
              {worker !== undefined
                ? `${species[worker.kind].family} · Lv. ${level}`
                : "KEEPER’S COMPANY"}
            </small>
            <b>{worker?.name ?? "A friend is waiting"}</b>
            <i>
              {assignment?.result != null
                ? "✉ Result ready"
                : assignment !== null
                  ? worker !== undefined && worker.remaining > 0
                    ? `${worker.remaining} min · ${playing ? "Exploring" : "Paused"}`
                    : "Needs your help"
                  : worker !== undefined && worker.remaining > 0
                    ? `${worker.remaining} min · ${playing ? "Routine running" : "Paused"}`
                    : worker !== undefined
                      ? rankFor(pet?.xp ?? 0)
                      : "Visit the hatchery"}
            </i>
          </span>
          <kbd>C</kbd>
        </button>
        <nav className="ct-hotbar" aria-label="Game screens">
          <button onClick={() => open("inventory")} aria-label="Inventory (I)">
            <span>▤</span>
            <b>Inventory</b>
            <kbd>I</kbd>
          </button>
          <button onClick={() => open("character")} aria-label="Character (C)">
            <span>♙</span>
            <b>Character</b>
            <kbd>C</kbd>
          </button>
          <button onClick={() => open("help")} aria-label="How to play">
            <span>?</span>
            <b>Guide</b>
          </button>
        </nav>
        <div className="ct-day">
          <b>✦ Day {Math.floor(state.now / 1440) + 1}</b>
          <span>Fernhaven · Local demo</span>
        </div>
      </div>
      <div className="ct-touch-move" aria-label="Touch movement">
        {[
          { key: "w", label: "Walk north", symbol: "↑" },
          { key: "a", label: "Walk west", symbol: "←" },
          { key: "s", label: "Walk south", symbol: "↓" },
          { key: "d", label: "Walk east", symbol: "→" },
        ].map((k) => (
          <button
            key={k.key}
            aria-label={k.label}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              town.current?.direction(k.key, true);
            }}
            onPointerUp={() => town.current?.direction(k.key, false)}
            onPointerCancel={() => town.current?.direction(k.key, false)}
            onLostPointerCapture={() => town.current?.direction(k.key, false)}
          >
            {k.symbol}
          </button>
        ))}
      </div>
      <div className="ct-sr-notice" role="status">
        {notice}
      </div>
      <dialog
        ref={dialog}
        className={`ct-dialog ct-panel-${panel ?? "closed"}`}
        aria-labelledby="ct-panel-title"
        onClose={() => {
          if (dialog.current?.open !== true) setPanel(null);
        }}
      >
        {panel !== null && (
          <>
            <header className="ct-panel-head">
              <div>
                <span className="ct-eyebrow">{eyebrow[panel]}</span>
                <h2 id="ct-panel-title">{title[panel]}</h2>
              </div>
              <button
                onClick={close}
                className="ct-close"
                aria-label="Close screen"
              >
                ×<small>Esc</small>
              </button>
            </header>
            {["shop", "missions", "inventory", "camp", "journal"].includes(
              panel,
            ) &&
              worker !== undefined && (
                <div className="ct-panel-meta">
                  <span>
                    {worker.name} · Level {level}
                  </span>
                  {partyPicker}
                  <b>◉ {pet?.buttons ?? 0} buttons</b>
                </div>
              )}
            {panel === "hatchery" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (state.workers.length >= 6) return;
                  const id = state.nextId;
                  setState((s) => adoptCompanion(s, name, kind, temperament));
                  setSelected(id);
                  close();
                  setNotice(
                    `${name.trim() || "Your companion"} joined your company. Walk to the adventure board together.`,
                  );
                }}
              >
                <p className="ct-intro">
                  Three small dinosaurs. A thousand things to discover together.
                </p>
                <div className="ct-adoption-lineup">
                  {(Object.keys(species) as CreatureKind[]).map((k) => (
                    <label key={k} data-selected={kind === k}>
                      <input
                        type="radio"
                        name="species"
                        value={k}
                        checked={kind === k}
                        onChange={() => setKind(k)}
                      />
                      <DinoPortrait kind={k} />
                      <span>
                        <b>{species[k].name}</b>
                        <small>{species[k].family}</small>
                      </span>
                      <p>{species[k].description}</p>
                    </label>
                  ))}
                </div>
                <div className="ct-form-row">
                  <label>
                    Their name
                    <input
                      aria-label="Companion name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={24}
                      required
                    />
                  </label>
                  <label>
                    Personality
                    <select
                      aria-label="Companion personality"
                      value={temperament}
                      onChange={(e) =>
                        setTemperament(e.target.value as Temperament)
                      }
                    >
                      <option value="curious">
                        Curious · one more question
                      </option>
                      <option value="cozy">Cozy · one gentle step</option>
                      <option value="bold">Bold · big little plans</option>
                    </select>
                  </label>
                </div>
                <div className="ct-panel-foot">
                  <span>12 starter buttons · A place in your company</span>
                  <button
                    type="submit"
                    className="ct-primary"
                    disabled={state.workers.length >= 6}
                  >
                    {state.workers.length >= 6
                      ? "Your company is full"
                      : `Adopt ${name.trim() || "your companion"}`}
                  </button>
                </div>
              </form>
            )}
            {panel === "shop" &&
              (worker === undefined || pet === undefined ? (
                noPet
              ) : (
                <>
                  <div className="ct-merchant">
                    <span>✦</span>
                    <p>
                      “A good tool makes the adventure. A good scarf makes the
                      entrance.”<small>— Amber, your local outfitter</small>
                    </p>
                  </div>
                  <div className="ct-shop-grid">
                    {(Object.keys(gear) as GearId[]).map((id) => {
                      const item = gear[id],
                        owned = pet.owned.includes(id);
                      return (
                        <article key={id} data-owned={owned}>
                          <div className="ct-item-stage">
                            <GearArt id={id} />
                            <span>
                              {item.cosmetic === true ? "COSMETIC" : "TOOL"}
                            </span>
                          </div>
                          <h3>{item.name}</h3>
                          <p>{item.description}</p>
                          <button
                            className={owned ? "" : "ct-primary"}
                            disabled={
                              owned ||
                              level < item.level ||
                              pet.buttons < item.cost
                            }
                            onClick={() => {
                              act({ type: "buy", item: id });
                              setNotice(
                                `${item.name} added to ${worker.name}’s bag. Press I to equip it.`,
                              );
                            }}
                            aria-label={`Buy ${item.name}`}
                          >
                            {owned
                              ? "✓ In your bag"
                              : level < item.level
                                ? `Unlocks at Lv. ${item.level}`
                                : `◉ ${item.cost} buttons`}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                  <div className="ct-panel-foot">
                    <p className="ct-panel-notice" role="status">
                      {notice.includes("bag")
                        ? notice
                        : "Purchases go into your field bag. Equip them before an adventure."}
                    </p>
                    <button onClick={() => open("inventory")}>
                      Open inventory <kbd>I</kbd>
                    </button>
                  </div>
                </>
              ))}
            {panel === "inventory" &&
              (worker === undefined || pet === undefined ? (
                noPet
              ) : (
                <div className="ct-inventory-layout">
                  <section>
                    <p className="ct-intro">
                      {worker.name}’s belongings. Pick a tool to equip it.
                    </p>
                    <div className="ct-bag-grid">
                      {pet.owned.map((id) => {
                        const item = gear[id],
                          equipped = pet.equipped.includes(id),
                          full =
                            !equipped &&
                            item.cosmetic !== true &&
                            pet.equipped.filter(
                              (g) => gear[g].cosmetic !== true,
                            ).length >= 2;
                        return (
                          <button
                            key={id}
                            className="ct-bag-item"
                            data-equipped={equipped}
                            disabled={locked || full}
                            onClick={() => act({ type: "equip", item: id })}
                            aria-label={`${equipped ? "Unequip" : "Equip"} ${item.name}`}
                          >
                            <GearArt id={id} />
                            <b>{item.name}</b>
                            <span>
                              {equipped
                                ? "Equipped · remove"
                                : full
                                  ? "Tool slots full"
                                  : item.cosmetic === true
                                    ? "Wear accessory"
                                    : "Equip tool"}
                            </span>
                          </button>
                        );
                      })}
                      {Array.from(
                        { length: Math.max(0, 6 - pet.owned.length) },
                        (_, i) => (
                          <div key={`empty-${i}`} className="ct-bag-empty">
                            +
                          </div>
                        ),
                      )}
                    </div>
                    <p className="ct-caption">
                      {locked
                        ? "Finish or recall the current work before changing equipment."
                        : "Two tool slots and a cosmetic. Owning a tool is only the beginning."}
                    </p>
                    <button onClick={() => navigate("shop")}>
                      Walk to the outfitter ↗
                    </button>
                  </section>
                  <section className="ct-paperdoll">
                    <DinoPortrait
                      kind={worker.kind}
                      equipment={pet.equipped}
                      level={level}
                    />
                    <h3>{worker.name}</h3>
                    <p>
                      {species[worker.kind].family} · {rankFor(pet.xp)}
                    </p>
                    <div className="ct-loadout">
                      {[0, 1].map((i) => {
                        const id = pet.equipped.filter(
                          (g) => gear[g].cosmetic !== true,
                        )[i];
                        return (
                          <span key={i}>
                            <small>TOOL {i + 1}</small>
                            <b>
                              {id !== undefined ? gear[id].name : "Empty slot"}
                            </b>
                          </span>
                        );
                      })}
                      <span>
                        <small>ACCESSORY</small>
                        <b>
                          {pet.equipped.includes("scarf")
                            ? "Sunset scarf"
                            : "A little room for flair"}
                        </b>
                      </span>
                    </div>
                  </section>
                </div>
              ))}
            {panel === "character" && (
              <>
                <div className="ct-character-top">
                  <div>
                    <span className="ct-eyebrow">YOU · THE KEEPER</span>
                    <h3>A company of your own.</h3>
                    <p>
                      You explore. They assist. Good work becomes a shared
                      history.
                    </p>
                  </div>
                  <div className="ct-keeper-stats">
                    <span>
                      <b>{state.workers.length}/6</b>companions
                    </span>
                    <span>
                      <b>
                        {state.workers.reduce(
                          (sum, w) => sum + w.companion.missions,
                          0,
                        )}
                      </b>
                      accepted missions
                    </span>
                  </div>
                </div>
                {worker === undefined || pet === undefined ? (
                  noPet
                ) : (
                  <>
                    <div
                      className="ct-party-strip"
                      aria-label="Your companions"
                    >
                      {state.workers.map((w) => (
                        <button
                          key={w.id}
                          aria-pressed={selected === w.id}
                          onClick={() => setSelected(w.id)}
                        >
                          <i className={w.kind}>●</i>
                          {w.name}
                          <small>Lv. {levelFor(w.companion.xp)}</small>
                        </button>
                      ))}
                    </div>
                    <div className="ct-character-layout">
                      <div className="ct-character-art">
                        <DinoPortrait
                          kind={worker.kind}
                          equipment={pet.equipped}
                          level={level}
                        />
                        <span>
                          {species[worker.kind].name} ·{" "}
                          {species[worker.kind].family}
                        </span>
                      </div>
                      <section>
                        <span className="ct-eyebrow">
                          {rankFor(pet.xp)} · {pet.temperament}
                        </span>
                        <h3>
                          {worker.name}
                          <small>Level {level}</small>
                        </h3>
                        <div className="ct-xp">
                          <span>
                            <b>{pet.xp} XP</b>
                            <small>
                              {level >= 5
                                ? "Highest rank reached"
                                : `${levelStarts[level] - pet.xp} to level ${level + 1}`}
                            </small>
                          </span>
                          <progress
                            value={
                              level >= 5 ? 1 : pet.xp - levelStarts[level - 1]
                            }
                            max={
                              level >= 5
                                ? 1
                                : levelStarts[level] - levelStarts[level - 1]
                            }
                          />
                        </div>
                        <blockquote>
                          {greeting(pet, worker.name)}
                          <button onClick={() => act({ type: "hello" })}>
                            ♡ Say hello
                          </button>
                        </blockquote>
                        {assignment !== null ? (
                          <div className="ct-current-mission">
                            <small>
                              {assignment.result !== null
                                ? "RESULT READY"
                                : assignment.failed
                                  ? "NEEDS YOUR HELP"
                                  : "CURRENT MISSION"}
                            </small>
                            <h4>{missions[assignment.id].title}</h4>
                            {assignment.result !== null ? (
                              <button
                                className="ct-primary"
                                onClick={() => open("report")}
                              >
                                Review result & reward
                              </button>
                            ) : (
                              <>
                                <p>
                                  {assignment.failed
                                    ? "A sample service timed out. Recall and equip a retry charm."
                                    : `${worker.remaining} village minutes left · ${playing ? "Exploring" : "Paused"}`}
                                </p>
                                <div className="ct-buttons">
                                  {!assignment.failed && (
                                    <button
                                      onClick={() => {
                                        setPlaying(!playing);
                                        close();
                                      }}
                                    >
                                      {playing
                                        ? "Pause expedition"
                                        : "Resume expedition"}
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      act({ type: "cancelMission" });
                                      setNotice(
                                        "Mission recalled. No reward claimed.",
                                      );
                                    }}
                                  >
                                    Recall mission
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <button
                            className="ct-primary"
                            onClick={() => navigate("missions")}
                          >
                            Walk to the mission board ↗
                          </button>
                        )}
                        <div className="ct-character-links">
                          <button onClick={() => open("inventory")}>
                            Equipment <kbd>I</kbd>
                          </button>
                          <button onClick={() => open("journal")}>
                            Journal <span>{pet.missions}</span>
                          </button>
                        </div>
                      </section>
                    </div>
                  </>
                )}
              </>
            )}
            {panel === "missions" &&
              (worker === undefined || pet === undefined ? (
                noPet
              ) : (
                <>
                  <p className="ct-intro">
                    Choose something worth bringing back. Your companion earns
                    its reward after you review the result.
                  </p>
                  <div className="ct-mission-board">
                    {(Object.keys(missions) as MissionId[]).map((id, i) => {
                      const m = missions[id],
                        lock = missionLock(pet, id);
                      return (
                        <button
                          key={id}
                          className="ct-mission-paper"
                          onClick={() => chooseMission(id)}
                          data-locked={lock !== null}
                        >
                          <span className="ct-paper-pin" />
                          <small>
                            REQUEST No. 0{i + 1} · {m.tag}
                          </small>
                          <span className="ct-mission-symbol">
                            {i === 0 ? "☀" : i === 1 ? "⌕" : "♧"}
                          </span>
                          <h3>{m.title}</h3>
                          <p>{m.description}</p>
                          <div>
                            <b>✦ {m.xp} XP</b>
                            <b>◉ {m.buttons}</b>
                          </div>
                          <em>
                            {lock ??
                              (locked
                                ? "Finish your current work first"
                                : "Prepare this mission ↗")}
                          </em>
                        </button>
                      );
                    })}
                  </div>
                </>
              ))}
            {panel === "mission" &&
              worker !== undefined &&
              pet !== undefined && (
                <form onSubmit={launch}>
                  <p className="ct-intro">{missions[missionId].description}</p>
                  <div className="ct-mission-rewards">
                    <span>✦ {missions[missionId].xp} XP</span>
                    <span>◉ {missions[missionId].buttons} buttons</span>
                    <span>
                      ◷{" "}
                      {Math.max(
                        1,
                        missions[missionId].duration -
                          (worker.upgrades.includes("wings") ? 2 : 0),
                      )}{" "}
                      village min
                    </span>
                  </div>
                  <label className="ct-field">
                    Your brief
                    <textarea
                      aria-label="Your brief"
                      value={brief}
                      rows={3}
                      maxLength={240}
                      onChange={(e) => setBrief(e.target.value)}
                    />
                  </label>
                  <label className="ct-field">
                    Where should {worker.name} focus?
                    <select
                      aria-label="Mission focus"
                      value={focus}
                      onChange={(e) => setFocus(e.target.value as Focus)}
                    >
                      <option value="balanced">A bit of both</option>
                      <option value="work">Work first</option>
                      <option value="life">Everyday life</option>
                    </select>
                  </label>
                  <p className="ct-caption">
                    Focus changes the sample result. Your brief is saved with
                    it; this demo does not interpret it with a live model.
                  </p>
                  {missionLock(pet, missionId) !== null && (
                    <div className="ct-locked">
                      <b>{missionLock(pet, missionId)}</b>
                      <button type="button" onClick={() => navigate("shop")}>
                        Visit the outfitter ↗
                      </button>
                    </div>
                  )}
                  {locked && (
                    <p>Finish, recall, or review the current mission first.</p>
                  )}
                  <div className="ct-panel-foot">
                    <button type="button" onClick={() => open("missions")}>
                      Back to the board
                    </button>
                    <button
                      className="ct-primary"
                      type="submit"
                      disabled={locked || missionLock(pet, missionId) !== null}
                    >
                      Send {worker.name} on this mission
                    </button>
                  </div>
                </form>
              )}
            {panel === "report" && assignment?.result != null && (
              <>
                <article className="ct-report">
                  <blockquote>“{assignment.result.intro}”</blockquote>
                  {assignment.result.sections.map((s, i) => (
                    <section key={s.title}>
                      <span>0{i + 1}</span>
                      <div>
                        <h3>{s.title}</h3>
                        <p>{s.body}</p>
                      </div>
                    </section>
                  ))}
                  <p className="ct-caption">{assignment.result.footnote}</p>
                </article>
                <div className="ct-panel-foot">
                  <button
                    onClick={() => {
                      act({ type: "dismiss" });
                      close();
                      setNotice("Another pass it is. No reward claimed.");
                    }}
                  >
                    Needs another pass
                  </button>
                  <button className="ct-primary" onClick={accept}>
                    Accept & collect reward
                  </button>
                </div>
              </>
            )}
            {panel === "reward" &&
              worker !== undefined &&
              pet !== undefined && (
                <div className="ct-reward">
                  <DinoPortrait
                    kind={worker.kind}
                    equipment={pet.equipped}
                    level={level}
                  />
                  <p>
                    {worker.name} is a {rankFor(pet.xp).toLowerCase()}.
                  </p>
                  <div className="ct-mission-rewards">
                    <span>+{reward.xp} XP</span>
                    <span>+{reward.buttons} buttons</span>
                  </div>
                  {reward.leveled && (
                    <p className="ct-unlock">
                      {reward.level === 2
                        ? "The Research lens is now waiting at the outfitter."
                        : reward.level === 3
                          ? "The Planner pin is unlocked. A new specialty awaits."
                          : "A new title. A few more good adventures together."}
                    </p>
                  )}
                  <div className="ct-buttons">
                    <button
                      className="ct-primary"
                      onClick={() => navigate("shop")}
                    >
                      Walk to the outfitter ↗
                    </button>
                    <button onClick={close}>Back to town</button>
                  </div>
                </div>
              )}
            {panel === "camp" &&
              (worker === undefined || pet === undefined ? (
                noPet
              ) : (
                <>
                  <p className="ct-intro">
                    Give {worker.name} a recurring job. Missions take priority;
                    routines wait while they’re away.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      routine({
                        type: "edit",
                        name: worker.name,
                        job,
                        interval,
                      });
                      setNotice("Routine updated.");
                    }}
                  >
                    <div className="ct-form-row">
                      <label>
                        Routine job
                        <select
                          aria-label="Routine job"
                          value={job}
                          onChange={(e) => setJob(e.target.value as Job)}
                        >
                          {Object.entries(jobs).map(([id, j]) => (
                            <option key={id} value={id}>
                              {j.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Repeat every
                        <select
                          aria-label="Routine schedule"
                          value={interval}
                          onChange={(e) => setInterval(Number(e.target.value))}
                        >
                          {[5, 15, 30].map((n) => (
                            <option key={n} value={n}>
                              {n} village minutes
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <button type="submit" disabled={locked}>
                      Save routine
                    </button>
                  </form>
                  <div className="ct-routine-state">
                    <div>
                      <b>
                        {worker.enabled ? "Routine enabled" : "Routine paused"}
                      </b>
                      <p>
                        {jobs[worker.job].name} · every {worker.interval} min
                      </p>
                    </div>
                    <button
                      className="ct-primary"
                      onClick={() => {
                        routine({ type: "pause" });
                        setPlaying(true);
                        close();
                      }}
                    >
                      {worker.enabled ? "Pause routine" : "Enable routine"}
                    </button>
                  </div>
                  <div className="ct-buttons">
                    {worker.enabled && !playing && (
                      <button
                        className="ct-primary"
                        onClick={() => {
                          setPlaying(true);
                          close();
                        }}
                      >
                        Resume village clock
                      </button>
                    )}
                    <button
                      disabled={locked}
                      onClick={() => {
                        routine({ type: "run" });
                        setPlaying(true);
                        close();
                      }}
                    >
                      Run routine now
                    </button>
                    <button onClick={() => open("journal")}>
                      View run log
                    </button>
                  </div>
                  <p className="ct-caption">
                    Local simulation. One village minute takes three seconds. No
                    background work runs while this page is closed.
                  </p>
                </>
              ))}
            {panel === "journal" &&
              worker !== undefined &&
              pet !== undefined && (
                <>
                  <div className="ct-journal-stats">
                    <span>
                      <b>{pet.missions}</b>accepted missions
                    </span>
                    <span>
                      <b>{pet.xp}</b>total XP
                    </span>
                    <span>
                      <b>{worker.successes}</b>successful runs
                    </span>
                    <span>
                      <b>{worker.failures}</b>failed runs
                    </span>
                  </div>
                  {pet.journal.length === 0 ? (
                    <p className="ct-intro">
                      The first page is still waiting for an adventure.
                    </p>
                  ) : (
                    pet.journal.map((entry, i) => (
                      <details
                        className="ct-journal-entry"
                        key={`${entry.at}-${i}`}
                      >
                        <summary>
                          <b>{entry.result.title}</b>
                          <small>{clockLabel(entry.at)}</small>
                        </summary>
                        <p>“{entry.brief}”</p>
                        {entry.result.sections.map((s) => (
                          <section key={s.title}>
                            <h4>{s.title}</h4>
                            <p>{s.body}</p>
                          </section>
                        ))}
                      </details>
                    ))
                  )}
                  <details className="ct-run-log">
                    <summary>Routine & mission run log</summary>
                    <ol>
                      {worker.log.map((entry, i) => (
                        <li key={i} data-tone={entry.tone}>
                          <time>{clockLabel(entry.at)}</time>
                          {entry.text}
                        </li>
                      ))}
                    </ol>
                    <button
                      disabled={worker.faultNext}
                      onClick={() => routine({ type: "fault" })}
                    >
                      {worker.faultNext
                        ? "Next timeout armed"
                        : "Simulate next timeout"}
                    </button>
                  </details>
                  <button onClick={() => navigate("camp")}>
                    Walk to camp to edit routines ↗
                  </button>
                </>
              )}
            {panel === "map" && (
              <>
                <p className="ct-intro">
                  Pick a destination. Your keeper will walk there.
                </p>
                <div className="ct-town-map">
                  <svg
                    viewBox="0 0 640 420"
                    role="img"
                    aria-label="Town plan with hatchery west, outfitter east, missions north, camp southwest and wilds southeast"
                  >
                    <rect
                      x="6"
                      y="6"
                      width="628"
                      height="408"
                      rx="38"
                      fill="#e1e7cf"
                    />
                    <path
                      d="M90 230H550M320 90v200M160 220v105M490 220v105"
                      fill="none"
                      stroke="#d2bc96"
                      strokeWidth="36"
                      strokeLinecap="round"
                    />
                    <ellipse cx="258" cy="330" rx="35" ry="24" fill="#9dbdbc" />
                    {places.map((p) => (
                      <g
                        key={p.id}
                        transform={`translate(${320 + p.x * 22},${205 + p.z * 18})`}
                      >
                        <rect
                          x="-31"
                          y="-28"
                          width="62"
                          height="45"
                          rx="7"
                          fill={p.color}
                        />
                        <path
                          d="m-38-28 38-22 38 22"
                          fill={p.color}
                          stroke="#435f4540"
                          strokeWidth="3"
                        />
                      </g>
                    ))}
                  </svg>
                  {places.map((p) => (
                    <button
                      key={p.id}
                      style={{
                        left: `${((320 + p.x * 22) / 640) * 100}%`,
                        top: `${((205 + p.z * 18) / 420) * 100}%`,
                      }}
                      onClick={() => navigate(p.id)}
                      aria-label={`Travel to ${p.name}`}
                    >
                      <b>{p.label}</b>
                      <span>↗</span>
                    </button>
                  ))}
                </div>
                <div className="ct-map-legend">
                  <span>WASD / arrows · Move</span>
                  <span>Click ground · Walk</span>
                  <span>E · Interact nearby</span>
                </div>
              </>
            )}
            {panel === "menu" && (
              <div className="ct-menu">
                <p>The town can wait. Your progress stays in this browser.</p>
                <button className="ct-primary" onClick={close}>
                  Resume game
                </button>
                <button onClick={() => open("help")}>How to play</button>
                <a href="/design/saas-game-ui">Explore the design system ↗</a>
                <button className="ct-subtle" onClick={() => open("reset")}>
                  Reset village
                </button>
                <small>
                  {saved ? "Progress saved" : "Local session"} · Sample missions
                  · No live AI connection
                </small>
              </div>
            )}
            {panel === "help" && (
              <div className="ct-guide">
                <p className="ct-intro">
                  You’re the keeper. Explore town with your prehistoric
                  assistants.
                </p>
                <dl>
                  <div>
                    <dt>
                      <kbd>WASD</kbd> / <kbd>↑↓←→</kbd>
                    </dt>
                    <dd>Move through town. Buildings have solid walls.</dd>
                  </div>
                  <div>
                    <dt>Click / tap the world</dt>
                    <dd>Walk to a point, or choose a labelled destination.</dd>
                  </div>
                  <div>
                    <dt>
                      <kbd>E</kbd>
                    </dt>
                    <dd>Interact when you reach a place’s entrance.</dd>
                  </div>
                  <div>
                    <dt>
                      <kbd>I</kbd> Inventory
                    </dt>
                    <dd>Equip owned tools and accessories.</dd>
                  </div>
                  <div>
                    <dt>
                      <kbd>C</kbd> Character
                    </dt>
                    <dd>
                      Choose your walking companion, inspect progress, and
                      review results.
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <kbd>M</kbd> Map
                    </dt>
                    <dd>
                      Find the hatchery, outfitter, board, camp, and wilds.
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <kbd>Esc</kbd>
                    </dt>
                    <dd>
                      Close a screen; press again to pause or leave the game.
                    </dd>
                  </div>
                </dl>
                <p className="ct-caption">
                  Missions and routines use sample data. They pause while a
                  screen is open or this page is hidden. XP rewards accepted
                  results. Purchases use earned buttons.
                </p>
              </div>
            )}
            {panel === "reset" && (
              <div className="ct-menu">
                <p>
                  This removes your companions, equipment, and history from this
                  browser.
                </p>
                <button onClick={close}>Keep my company</button>
                <button
                  className="ct-danger"
                  onClick={() => {
                    setState(freshNursery());
                    setSelected(null);
                    setPlaying(false);
                    close();
                    setNotice("A new chapter begins. Visit the hatchery.");
                  }}
                >
                  Reset everything
                </button>
              </div>
            )}
          </>
        )}
      </dialog>
    </main>
  );
}
