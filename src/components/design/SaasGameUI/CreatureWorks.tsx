import React, { useEffect, useRef, useState } from "react";
import GameMenu from "./GameMenu";
import { Creature, NurseryArt } from "./CreatureArt";
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
  type Report,
  type Temperament,
} from "./companions";

const saveKey = "saas-game-ui-creature-works-v2",
  legacyKey = "saas-game-ui-creature-works-v1";
type Tab = "companion" | "missions" | "kit";
type Panel =
  | "adopt"
  | "mission"
  | "report"
  | "reward"
  | "journal"
  | "settings"
  | "reset"
  | null;
function ReportView({ report }: { report: Report }): React.JSX.Element {
  return (
    <article className="cw-report">
      <p className="cw-brief">“{report.intro}”</p>
      {report.sections.map((s, i) => (
        <section key={s.title}>
          <span>{String(i + 1).padStart(2, "0")}</span>
          <div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        </section>
      ))}
      <p className="g-small">{report.footnote}</p>
    </article>
  );
}
export default function CreatureWorks(): React.JSX.Element {
  const [state, setState] = useState(freshNursery),
    [ready, setReady] = useState(false),
    [saved, setSaved] = useState(false);
  const [playing, setPlaying] = useState(false),
    [menu, setMenu] = useState(false),
    [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<Tab>("companion"),
    [panel, setPanel] = useState<Panel>(null);
  const [name, setName] = useState("Pip"),
    [kind, setKind] = useState<CreatureKind>("sprout"),
    [temperament, setTemperament] = useState<Temperament>("curious");
  const [job, setJob] = useState<Job>("deliver"),
    [interval, setInterval] = useState(15);
  const [chosenMission, setChosenMission] = useState<MissionId>("morning"),
    [brief, setBrief] = useState(missions.morning.prompt),
    [focus, setFocus] = useState<Focus>("balanced");
  const [notice, setNotice] = useState(
    "Adopt a little companion. Give them something good to do.",
  );
  const [reward, setReward] = useState({
    xp: 0,
    buttons: 0,
    level: 1,
    leveled: false,
  });
  const dialog = useRef<HTMLDialogElement>(null),
    inspector = useRef<HTMLElement>(null),
    world = useRef<HTMLElement>(null);
  const worker = state.workers.find((w) => w.id === selected),
    pet = worker?.companion;
  const level = levelFor(pet?.xp ?? 0),
    assignment = pet?.assignment ?? null;
  const working = worker !== undefined && worker.remaining > 0;
  const locked = working || assignment !== null;
  useEffect(() => {
    try {
      const restored = restoreNursery(
        localStorage.getItem(saveKey) ?? localStorage.getItem(legacyKey),
      );
      setState(restored);
      setSelected(restored.workers[0]?.id ?? null);
      if (restored.workers.length > 0)
        setNotice(
          "Welcome back. Your companions and their progress are here. Time is paused until you resume.",
        );
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
    if (!playing || menu || panel !== null) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setState((s) => advanceNursery(s));
    }, 1000);
    return () => clearInterval(id);
  }, [playing, menu, panel]);
  useEffect(() => {
    if (panel !== null && dialog.current?.open !== true)
      dialog.current?.showModal();
  }, [panel]);
  useEffect(() => {
    if (
      playing &&
      state.workers.length > 0 &&
      state.workers.every((w) => w.remaining === 0 && !w.enabled)
    )
      setPlaying(false);
  }, [state.workers, playing]);
  function showTab(next: Tab): void {
    setTab(next);
    if (matchMedia("(max-width: 800px)").matches)
      requestAnimationFrame(() =>
        inspector.current?.scrollIntoView({
          block: "start",
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        }),
      );
  }
  function close(): void {
    dialog.current?.close();
    setPanel(null);
  }
  function create(): void {
    setName(
      ["Pip", "Momo", "Taro", "Nori", "Fenn", "Kiki"][state.workers.length] ??
        "Pip",
    );
    setKind("sprout");
    setTemperament("curious");
    setPanel("adopt");
  }
  function act(action: CompanionAction): void {
    if (worker) setState((s) => actOnCompanion(s, worker.id, action));
  }
  function routine(action: WorkerAction): void {
    if (worker) setState((s) => changeWorker(s, worker.id, action));
  }
  function chooseMission(id: MissionId): void {
    if (!worker) {
      create();
      return;
    }
    setChosenMission(id);
    setBrief(missions[id].prompt);
    setFocus("balanced");
    setPanel("mission");
  }
  function startMission(e: React.FormEvent): void {
    e.preventDefault();
    if (!worker || !pet || locked || missionLock(pet, chosenMission) !== null)
      return;
    act({ type: "mission", mission: chosenMission, brief, focus });
    setPlaying(true);
    setTab("companion");
    close();
    setNotice(
      `${worker.name} is off on a mission. They’ll bring back a result for you to review.`,
    );
    if (matchMedia("(max-width: 800px)").matches)
      world.current?.scrollIntoView({
        block: "start",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  }
  function accept(): void {
    if (!pet || !assignment?.result) return;
    const mission = missions[assignment.id],
      nextLevel = levelFor(pet.xp + mission.xp);
    setReward({
      xp: mission.xp,
      buttons: mission.buttons,
      level: nextLevel,
      leveled: nextLevel > level,
    });
    act({ type: "accept" });
    setPanel("reward");
    setNotice(
      `Result accepted. +${mission.xp} XP and +${mission.buttons} buttons${nextLevel > level ? ` · Level ${nextLevel}!` : "."}`,
    );
  }
  function edit(): void {
    if (!worker) return;
    setName(worker.name);
    setJob(worker.job);
    setInterval(worker.interval);
    setPanel("settings");
  }
  const progress = pet
    ? level >= 5
      ? 100
      : ((pet.xp - levelStarts[level - 1]) /
          (levelStarts[level] - levelStarts[level - 1])) *
        100
    : 0;
  const elapsed =
    assignment && worker ? assignment.duration - worker.remaining : 0;
  const phase =
    assignment?.failed === true
      ? "A little help needed"
      : assignment?.result
        ? "Back with something for you"
        : assignment
          ? elapsed < assignment.duration / 3
            ? "On the way"
            : elapsed < assignment.duration * 0.75
              ? "Figuring things out"
              : "Heading home"
          : working
            ? "Taking care of a routine"
            : "Ready for a little adventure";
  const nextGoal = !pet
    ? "Adopt your first companion."
    : assignment?.result
      ? "Your companion brought something back."
      : assignment?.failed === true
        ? "The mission hit a timeout."
        : assignment
          ? missions[assignment.id].title
          : pet.missions === 0
            ? "Your first mission awaits."
            : level === 2 && !pet.equipped.includes("lens")
              ? "A research lens opens new adventures."
              : level === 3 && !pet.equipped.includes("planner")
                ? "Try a planner pin for a different specialty."
                : "What shall we do together?";
  const mission = missions[chosenMission];
  return (
    <div className="g-page g-creature-page cw-page">
      <header className="g-site">
        <a href="/design/saas-game-ui">← Design system</a>
        <span>02 / Little AI companions</span>
        <GameMenu saved={saved} onOpenChange={setMenu} />
      </header>
      <main className="g-shell">
        <header className="g-game-title">
          <div>
            <span className="g-eyebrow">
              A little friend. A little help. A new adventure.
            </span>
            <h1>Creature Works</h1>
          </div>
          <div className="cw-pocket">
            <span aria-hidden="true">◉</span>
            <div>
              <b>{pet?.buttons ?? 12}</b>
              <small>
                {worker ? `${worker.name}’s buttons` : "Starter buttons"}
              </small>
            </div>
          </div>
        </header>
        <div className="g-toolbar cw-toolbar">
          <p>Raise a companion. Bring useful things back.</p>
          <div className="g-button-row">
            <button
              className="g-primary"
              onClick={() => (worker ? showTab("missions") : create())}
            >
              Mission board
            </button>
            <button onClick={() => (worker ? showTab("kit") : create())}>
              Outfitter
            </button>
            <button onClick={create} disabled={state.workers.length >= 6}>
              + Adopt
            </button>
          </div>
        </div>
        <div className="g-play-layout">
          <section
            className="g-nursery cw-world"
            ref={world}
            aria-label="Companion village"
          >
            <NurseryArt />
            <div className="g-world-goal cw-world-goal">
              <span className="g-eyebrow">
                {assignment ? "Current adventure" : "A small next step"}
              </span>
              <h2>{nextGoal}</h2>
              <p>
                {!pet
                  ? "Choose a face and a name. We’ll take it from there."
                  : assignment?.result
                    ? "Read their result, then collect the mission reward."
                    : assignment
                      ? phase
                      : `${rankFor(pet.xp)} · Level ${level}`}
              </p>
              {assignment?.result ? (
                <button onClick={() => setPanel("report")}>
                  Open the result ↗
                </button>
              ) : !pet ? (
                <button onClick={create}>Meet your companion ↗</button>
              ) : (
                !assignment && (
                  <button
                    onClick={() =>
                      showTab(
                        level > 1 &&
                          ((level === 2 && !pet.equipped.includes("lens")) ||
                            (level === 3 && !pet.equipped.includes("planner")))
                          ? "kit"
                          : "missions",
                      )
                    }
                  >
                    {pet.missions === 0
                      ? "Choose a first mission ↗"
                      : "Let’s see ↗"}
                  </button>
                )
              )}
            </div>
            <div className="g-station-labels">
              <span>Post office</span>
              <span>Archive</span>
              <span>Observatory</span>
            </div>
            {state.workers.map((w, i) => {
              const a = w.companion.assignment,
                running = w.remaining > 0;
              const outward =
                running &&
                (a === null || w.remaining > Math.ceil(a.duration / 4));
              const slot = state.workers
                .filter(
                  (other) =>
                    other.remaining > 0 &&
                    (other.companion.assignment?.id ?? other.job) ===
                      (a?.id ?? w.job),
                )
                .findIndex((other) => other.id === w.id);
              const x = outward
                ? (a
                    ? missions[a.id].destination
                    : { deliver: 19, index: 50, watch: 82 }[w.job]) +
                  (slot % 2) * 14 -
                  7
                : [21, 50, 79][i % 3];
              const y = outward
                ? 49 + Math.floor(slot / 2) * 17
                : i < 3
                  ? 71
                  : 88;
              return (
                <button
                  key={w.id}
                  className="g-world-worker cw-world-pet"
                  data-worker={w.id}
                  data-state={
                    a?.result ? "returned" : running ? "working" : "idle"
                  }
                  aria-label={`Visit ${w.name}`}
                  aria-pressed={selected === w.id}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => {
                    setSelected(w.id);
                    showTab("companion");
                  }}
                >
                  <Creature
                    kind={w.kind}
                    upgrades={w.upgrades}
                    equipment={w.companion.equipped}
                    level={levelFor(w.companion.xp)}
                    active={running && playing && !menu && panel === null}
                  />
                  {a?.result && (
                    <i className="cw-result-marker" aria-label="Result ready">
                      ✉
                    </i>
                  )}
                  <span>
                    {w.name}
                    <small>
                      {a?.result
                        ? "A gift for you!"
                        : a?.failed === true
                          ? "Needs your help"
                          : running
                            ? a
                              ? "On a mission…"
                              : "On a routine…"
                            : `Lv. ${levelFor(w.companion.xp)} · ${w.companion.temperament}`}
                    </small>
                  </span>
                </button>
              );
            })}
            {state.workers.length === 0 && (
              <button
                className="g-hatch-plinth cw-adopt-plinth"
                onClick={create}
              >
                <Creature kind="sprout" />
                <strong>A small beginning.</strong>
                <small>Adopt a companion</small>
              </button>
            )}
            <div className="cw-world-clock">
              {playing ? "●" : "Ⅱ"} {clockLabel(state.now)}
              <span>Village time</span>
            </div>
          </section>
          <aside
            className="g-inspector cw-inspector"
            ref={inspector}
            aria-label="Companion panel"
          >
            {worker && pet ? (
              <>
                <div className="g-inspector-heading cw-identity">
                  <Creature
                    kind={worker.kind}
                    upgrades={worker.upgrades}
                    equipment={pet.equipped}
                    level={level}
                  />
                  <div>
                    <span className="g-eyebrow">{rankFor(pet.xp)}</span>
                    {state.workers.length > 1 ? (
                      <select
                        className="g-worker-picker"
                        aria-label="Choose companion"
                        value={worker.id}
                        onChange={(e) => {
                          setSelected(Number(e.target.value));
                          setTab("companion");
                        }}
                      >
                        {state.workers.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <h2>{worker.name}</h2>
                    )}
                    <p className="cw-personality">
                      {pet.temperament} · Level {level}
                    </p>
                  </div>
                </div>
                <div className="cw-level">
                  <div>
                    <b>Level {level}</b>
                    <span>
                      {level >= 5
                        ? `${pet.xp} XP · All mission types unlocked`
                        : `${pet.xp} / ${levelStarts[level]} XP`}
                    </span>
                  </div>
                  <div
                    className="cw-xp-track"
                    role="progressbar"
                    aria-label="Companion level progress"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="g-tabs">
                  {(["companion", "missions", "kit"] as const).map((t) => (
                    <button
                      key={t}
                      aria-pressed={tab === t}
                      onClick={() => setTab(t)}
                    >
                      {t === "kit"
                        ? "Equipment"
                        : t === "missions"
                          ? "Missions"
                          : "Companion"}
                    </button>
                  ))}
                </div>
                <div className="g-inspector-content cw-content">
                  {tab === "companion" && (
                    <>
                      <div className="cw-speech">
                        <p>{greeting(pet, worker.name)}</p>
                        <button
                          onClick={() => {
                            act({ type: "hello" });
                            setNotice(
                              `${worker.name} leans in. A little attention, no XP required.`,
                            );
                          }}
                          aria-label={`Say hello to ${worker.name}`}
                        >
                          ♡ Say hello
                        </button>
                      </div>
                      {assignment ? (
                        <div className="cw-active-mission">
                          <span className="g-eyebrow">
                            {assignment.failed
                              ? "Mission interrupted"
                              : assignment.result
                                ? "Mission returned"
                                : "Out on an adventure"}
                          </span>
                          <h3>{missions[assignment.id].title}</h3>
                          <p>
                            {phase}
                            {working
                              ? ` · ${worker.remaining} village min left`
                              : ""}
                          </p>
                          {assignment.result ? (
                            <button
                              className="g-primary"
                              onClick={() => setPanel("report")}
                            >
                              Review result & reward
                            </button>
                          ) : assignment.failed ? (
                            <>
                              <p className="g-small">
                                The sample service timed out. Recall this
                                mission, then equip a retry charm before trying
                                again.
                              </p>
                              <button
                                onClick={() => {
                                  act({ type: "cancelMission" });
                                  setNotice(
                                    "Mission recalled. Equip a charm or choose a new mission.",
                                  );
                                }}
                              >
                                Recall mission
                              </button>
                            </>
                          ) : (
                            <>
                              <div className="cw-journey" aria-label={phase}>
                                <span data-done={elapsed >= 0}>Depart</span>
                                <span
                                  data-done={elapsed >= assignment.duration / 3}
                                >
                                  Explore
                                </span>
                                <span
                                  data-done={
                                    elapsed >= assignment.duration * 0.75
                                  }
                                >
                                  Return
                                </span>
                              </div>
                              <div className="g-button-row">
                                <button onClick={() => setPlaying(!playing)}>
                                  {playing
                                    ? "Pause adventure"
                                    : "Resume adventure"}
                                </button>
                                <button
                                  onClick={() => {
                                    act({ type: "cancelMission" });
                                    setNotice(
                                      "Mission recalled. No reward was claimed.",
                                    );
                                  }}
                                >
                                  Recall
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="cw-next">
                          <span className="g-eyebrow">
                            {pet.missions === 0
                              ? "Your first adventure"
                              : "Ready when you are"}
                          </span>
                          <h3>
                            {pet.missions === 0
                              ? "Make today a little lighter."
                              : "What could use a little help?"}
                          </h3>
                          <p>
                            Choose a mission. They’ll bring back something you
                            can read, review, and keep.
                          </p>
                          <button
                            className="g-primary"
                            disabled={working}
                            onClick={() => setTab("missions")}
                          >
                            Give a mission
                          </button>
                        </div>
                      )}
                      <div className="cw-memory">
                        <span>
                          {pet.missions} accepted{" "}
                          {pet.missions === 1 ? "mission" : "missions"}
                        </span>
                        <button onClick={() => setPanel("journal")}>
                          Open journal ↗
                        </button>
                      </div>
                    </>
                  )}
                  {tab === "missions" && (
                    <>
                      <p className="g-small cw-panel-intro">
                        Useful little adventures. XP arrives when you review and
                        accept what comes back.
                      </p>
                      {Object.entries(missions).map(([id, m]) => {
                        const lock = missionLock(pet, id as MissionId);
                        return (
                          <button
                            className="cw-mission-card"
                            key={id}
                            data-locked={lock !== null}
                            onClick={() => chooseMission(id as MissionId)}
                          >
                            <span className="g-eyebrow">{m.tag}</span>
                            <b>{m.title}</b>
                            <small>{m.description}</small>
                            <span className="cw-reward-line">
                              ✧ {m.xp} XP <span>◉ {m.buttons}</span>
                            </span>
                            <em>
                              {lock ??
                                (locked
                                  ? "Finish your current work first"
                                  : `${Math.max(1, m.duration - (worker.upgrades.includes("wings") ? 2 : 0))} village min · View mission →`)}
                            </em>
                          </button>
                        );
                      })}
                    </>
                  )}
                  {tab === "kit" && (
                    <>
                      <div className="cw-kit-summary">
                        <span>Two tool slots. One little flourish.</span>
                        <b>
                          {
                            pet.equipped.filter(
                              (id) => gear[id].cosmetic !== true,
                            ).length
                          }
                          /2 tools
                        </b>
                      </div>
                      <div className="cw-slots">
                        {[0, 1].map((i) => {
                          const id = pet.equipped.filter(
                            (g) => gear[g].cosmetic !== true,
                          )[i];
                          return (
                            <span key={i}>
                              {id ? (
                                <>
                                  <b>{gear[id].icon}</b>
                                  {gear[id].name}
                                </>
                              ) : (
                                <>
                                  <b>＋</b>Empty tool slot
                                </>
                              )}
                            </span>
                          );
                        })}
                      </div>
                      {locked && (
                        <p className="g-small">
                          Finish or recall the mission before changing your
                          loadout.
                        </p>
                      )}
                      <div className="cw-shop">
                        {Object.entries(gear).map(([id, item]) => {
                          const key = id as GearId,
                            owned = pet.owned.includes(key),
                            equipped = pet.equipped.includes(key),
                            levelLocked = level < item.level,
                            full =
                              !equipped &&
                              item.cosmetic !== true &&
                              pet.equipped.filter(
                                (g) => gear[g].cosmetic !== true,
                              ).length >= 2;
                          return (
                            <article
                              key={id}
                              className="cw-shop-item"
                              data-equipped={equipped}
                            >
                              <div className="cw-item-icon">{item.icon}</div>
                              <div>
                                <h3>{item.name}</h3>
                                <p>{item.description}</p>
                                <span>
                                  {levelLocked
                                    ? `Unlocks at level ${item.level}`
                                    : equipped
                                      ? "Equipped"
                                      : owned
                                        ? "In your wardrobe"
                                        : `${item.cost} buttons`}
                                </span>
                              </div>
                              <button
                                aria-label={`${owned ? (equipped ? "Unequip" : "Equip") : "Buy"} ${item.name}`}
                                disabled={
                                  levelLocked ||
                                  (owned
                                    ? locked || full
                                    : pet.buttons < item.cost)
                                }
                                onClick={() => {
                                  act({
                                    type: owned ? "equip" : "buy",
                                    item: key,
                                  });
                                  setNotice(
                                    owned
                                      ? `${item.name} ${equipped ? "put away" : "equipped"}.`
                                      : `${item.name} is yours. Equip it from the wardrobe.`,
                                  );
                                }}
                              >
                                {owned
                                  ? equipped
                                    ? "Remove"
                                    : full
                                      ? "Slots full"
                                      : "Equip"
                                  : levelLocked
                                    ? `Lv. ${item.level}`
                                    : `◉ ${item.cost}`}
                              </button>
                            </article>
                          );
                        })}
                      </div>
                      <p className="g-small">
                        Earn buttons from accepted missions. All equipment here
                        uses the demo’s earned currency.
                      </p>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="g-empty cw-welcome">
                <div className="cw-welcome-friends">
                  <Creature kind="finch" />
                  <Creature kind="sprout" />
                  <Creature kind="moth" />
                </div>
                <span className="g-eyebrow">Your own little assistant</span>
                <h2>
                  Someone small.
                  <br />
                  Something useful.
                </h2>
                <p>
                  Adopt a companion, give it missions, and help it grow into a
                  specialty. It’ll bring back a result. You decide whether it
                  earned the reward.
                </p>
                <button className="g-primary" onClick={create}>
                  Adopt your first companion
                </button>
                <span className="g-small">
                  Three forms · Three personalities · A pocketful of possibility
                </span>
              </div>
            )}
          </aside>
        </div>
        <div className="g-announcement cw-notice" role="status">
          {assignment?.result
            ? `${worker?.name ?? "Your companion"} is home! Open the result to collect the reward.`
            : notice}
        </div>
        <footer className="g-game-footer cw-footer">
          <span>
            {saved ? "Saved in this browser" : "Local session"} · Sample
            missions · No live AI connection
          </span>
          <details className="cw-clock-controls">
            <summary>Village clock</summary>
            <div>
              <p>
                1 second = 1 simulated minute. Pauses when the page is hidden or
                a dialog is open.
              </p>
              <div className="g-button-row">
                <button onClick={() => setPlaying(!playing)}>
                  {playing ? "Pause clock" : "Start clock"}
                </button>
                <button onClick={() => setState((s) => advanceNursery(s))}>
                  +1 minute
                </button>
                <button onClick={() => setState((s) => advanceNursery(s, 5))}>
                  +5 minutes
                </button>
              </div>
            </div>
          </details>
          <button
            onClick={() => {
              setPlaying(false);
              setPanel("reset");
            }}
          >
            Reset village
          </button>
        </footer>
      </main>
      <p className="g-under-note">
        Companion = personal agent · Mission = useful work · Equipment =
        capabilities · XP = accepted results.{" "}
        <a href="/design/saas-game-ui#companions">
          Explore this design pattern ↗
        </a>
      </p>
      <dialog
        ref={dialog}
        className={`g-dialog cw-dialog ${panel === "journal" || panel === "report" ? "cw-dialog-wide" : ""}`}
        aria-labelledby="cw-panel-title"
        onClose={() => setPanel(null)}
      >
        <div className="g-dialog-heading">
          <span className="g-eyebrow">
            {panel === "adopt"
              ? "A new friendship"
              : panel === "mission"
                ? "Mission board"
                : panel === "report"
                  ? "Look what I brought back"
                  : panel === "reward"
                    ? "A little celebration"
                    : panel === "journal"
                      ? "Companion journal"
                      : "Your village"}
          </span>
          <button aria-label="Close panel" onClick={close}>
            ×
          </button>
        </div>
        {panel === "adopt" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const id = state.nextId;
              setState((s) => adoptCompanion(s, name, kind, temperament));
              setSelected(id);
              close();
              showTab("companion");
              setNotice(
                `${name.trim() || "Your companion"} is here! Choose a first mission to get to know each other.`,
              );
            }}
          >
            <h2 id="cw-panel-title">Who’s coming home?</h2>
            <div className="g-creator-preview cw-adopt-preview">
              <Creature kind={kind} />
              <p>
                {name || "Your companion"}
                <small>{temperament} · Level 1 · 12 starter buttons</small>
              </p>
            </div>
            <label className="cw-field">
              Their name
              <input
                required
                maxLength={24}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
              />
            </label>
            <fieldset className="cw-forms">
              <legend>A little face</legend>
              <div className="g-species">
                {(["sprout", "finch", "moth"] as const).map((k) => (
                  <label key={k}>
                    <input
                      type="radio"
                      name="creature-form"
                      checked={kind === k}
                      onChange={() => setKind(k)}
                    />
                    <Creature kind={k} />
                    <span>{k}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="cw-temperaments">
              <legend>
                A way of seeing the world <span>· dialogue style</span>
              </legend>
              {(
                [
                  { id: "curious", description: "Always one more question." },
                  { id: "cozy", description: "One gentle step at a time." },
                  { id: "bold", description: "Small creature, big plans." },
                ] as { id: Temperament; description: string }[]
              ).map((t) => (
                <label key={t.id}>
                  <input
                    type="radio"
                    name="temperament"
                    checked={temperament === t.id}
                    onChange={() => setTemperament(t.id)}
                  />
                  <span>
                    <b>{t.id}</b>
                    <small>{t.description}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <button className="g-primary cw-wide-button" type="submit">
              Bring {name.trim() || "them"} home
            </button>
          </form>
        )}
        {panel === "mission" && worker && pet && (
          <form onSubmit={startMission}>
            <h2 id="cw-panel-title">{mission.title}</h2>
            <p>{mission.description}</p>
            <div className="cw-mission-terms">
              <span>✧ {mission.xp} XP</span>
              <span>◉ {mission.buttons} buttons</span>
              <span>
                {Math.max(
                  1,
                  mission.duration -
                    (worker.upgrades.includes("wings") ? 2 : 0),
                )}{" "}
                village min
              </span>
            </div>
            <label className="cw-field">
              Your brief
              <textarea
                aria-label="Your brief"
                maxLength={240}
                rows={3}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
              />
            </label>
            <label className="cw-field">
              Where should they focus?
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value as Focus)}
                aria-label="Mission focus"
              >
                <option value="balanced">A bit of both</option>
                <option value="work">Work first</option>
                <option value="life">Everyday life</option>
              </select>
            </label>
            <p className="g-small">
              Your focus changes the sample result. The brief is kept with it as
              your intent. This demo does not interpret free text with a model.
            </p>
            {missionLock(pet, chosenMission) !== null && (
              <div className="cw-lock">
                <p>{missionLock(pet, chosenMission)}</p>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    showTab("kit");
                  }}
                >
                  Visit the outfitter
                </button>
              </div>
            )}
            {locked && (
              <p className="g-small">
                {assignment?.result
                  ? "Review the result already waiting for you first."
                  : "Finish or recall the current work first."}
              </p>
            )}
            <button
              className="g-primary cw-wide-button"
              type="submit"
              disabled={locked || missionLock(pet, chosenMission) !== null}
            >
              Send {worker.name} on this mission
            </button>
          </form>
        )}
        {panel === "report" && assignment?.result && (
          <>
            <h2 id="cw-panel-title">{assignment.result.title}</h2>
            <ReportView report={assignment.result} />
            <div className="cw-review-reward">
              <span>Accept this result</span>
              <b>
                +{missions[assignment.id].xp} XP · +
                {missions[assignment.id].buttons} buttons
              </b>
            </div>
            <div className="g-button-row">
              <button className="g-primary" onClick={accept}>
                Accept & collect reward
              </button>
              <button
                onClick={() => {
                  act({ type: "dismiss" });
                  close();
                  showTab("missions");
                  setNotice(
                    "Another pass it is. No reward claimed; choose a mission and refine the focus.",
                  );
                }}
              >
                Needs another pass
              </button>
            </div>
          </>
        )}
        {panel === "reward" && worker && pet && (
          <div className="cw-celebration">
            <div className="cw-reward-art">
              <span>✧</span>
              <Creature
                kind={worker.kind}
                upgrades={worker.upgrades}
                equipment={pet.equipped}
                level={reward.level}
              />
              <span>✧</span>
            </div>
            <h2 id="cw-panel-title">
              {reward.leveled
                ? `Level ${reward.level}!`
                : "A good little adventure."}
            </h2>
            <p>
              {reward.leveled
                ? `${worker.name} is now a ${rankFor(pet.xp).toLowerCase()}.`
                : `${worker.name} brought something useful home.`}
            </p>
            <div className="cw-mission-terms">
              <span>+{reward.xp} XP</span>
              <span>+{reward.buttons} buttons</span>
            </div>
            {reward.leveled && (
              <p className="cw-unlock">
                {reward.level === 2
                  ? "New in the outfitter: Research lens. Your next specialty awaits."
                  : reward.level === 3
                    ? "Planner pin unlocked. A new specialty, and a little star badge."
                    : "A new title, and a history of useful adventures together."}
              </p>
            )}
            <button
              className="g-primary cw-wide-button"
              onClick={() => {
                close();
                showTab("kit");
              }}
            >
              Visit the outfitter
            </button>
            <button
              className="cw-wide-button"
              onClick={() => {
                close();
                showTab("missions");
              }}
            >
              Choose another adventure
            </button>
          </div>
        )}
        {panel === "journal" && worker && pet && (
          <>
            <h2 id="cw-panel-title">{worker.name}’s little history.</h2>
            <dl className="g-stats">
              <div>
                <dt>Accepted missions</dt>
                <dd>{pet.missions}</dd>
              </div>
              <div>
                <dt>Total XP</dt>
                <dd>{pet.xp}</dd>
              </div>
              <div>
                <dt>Successful runs</dt>
                <dd>{worker.successes}</dd>
              </div>
              <div>
                <dt>Failed runs</dt>
                <dd>{worker.failures}</dd>
              </div>
            </dl>
            <h3 className="cw-journal-heading">Things they brought back</h3>
            {pet.journal.length === 0 ? (
              <p className="g-small">
                A quiet first page. Accepted mission results will live here.
              </p>
            ) : (
              pet.journal.map((item, i) => (
                <details className="cw-journal-entry" key={`${item.at}-${i}`}>
                  <summary>
                    {item.result.title}
                    <span>{clockLabel(item.at)}</span>
                  </summary>
                  <ReportView report={item.result} />
                </details>
              ))
            )}
            <details className="cw-routines">
              <summary>Scheduled routines & run log</summary>
              <p className="g-small">
                {jobs[worker.job].name} · Every {worker.interval} village
                minutes · <code>*/{worker.interval} * * * *</code>
                <br />
                {worker.enabled
                  ? `Next occurrence ${clockLabel(worker.next)}`
                  : "Schedule paused"}
                . Missions take priority; overlapping occurrences are skipped.
              </p>
              <div className="g-button-row">
                <button onClick={() => routine({ type: "pause" })}>
                  {worker.enabled ? "Pause schedule" : "Enable schedule"}
                </button>
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
                <button disabled={locked} onClick={edit}>
                  Edit routine
                </button>
              </div>
              <p className="g-small">
                {worker.runs} runs started · {worker.attempts} attempts · last
                duration{" "}
                {worker.lastDuration === null ? "—" : `${worker.lastDuration}m`}
                . Routine runs do not award mission XP.
              </p>
              <button
                disabled={working || worker.faultNext || assignment !== null}
                onClick={() => routine({ type: "fault" })}
              >
                {worker.faultNext ? "Timeout armed" : "Simulate next timeout"}
              </button>
              <ol className="g-log">
                {worker.log.map((l, i) => (
                  <li key={`${l.at}-${i}`} data-tone={l.tone}>
                    <time>{clockLabel(l.at)}</time>
                    <span>{l.text}</span>
                  </li>
                ))}
              </ol>
            </details>
          </>
        )}
        {panel === "settings" && worker && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              routine({ type: "edit", name, interval, job });
              setPanel("journal");
            }}
          >
            <h2 id="cw-panel-title">The everyday routine.</h2>
            <label className="cw-field">
              Companion name
              <input
                required
                maxLength={24}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="cw-field">
              Job
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
            <label className="cw-field">
              Schedule
              <select
                aria-label="Routine schedule"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
              >
                {[5, 15, 30].map((n) => (
                  <option key={n} value={n}>
                    Every {n} minutes
                  </option>
                ))}
              </select>
            </label>
            <p className="g-small">
              A simulated UTC schedule. No jobs run after you leave this page.
            </p>
            <button
              className="g-primary cw-wide-button"
              type="submit"
              disabled={locked}
            >
              Save routine
            </button>
          </form>
        )}
        {panel === "reset" && (
          <>
            <h2 id="cw-panel-title">A new beginning?</h2>
            <p>
              This removes every companion, their equipment, and their journals
              saved in this browser.
            </p>
            <div className="g-button-row">
              <button onClick={close}>Keep my companions</button>
              <button
                onClick={() => {
                  setState(freshNursery());
                  setSelected(null);
                  setTab("companion");
                  setPlaying(false);
                  close();
                  setNotice("A fresh village. Who’s coming home first?");
                }}
              >
                Reset everything
              </button>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
