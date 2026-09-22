import React, { useEffect, useRef, useState } from "react";
import GameMenu from "./GameMenu";
import { Creature, NurseryArt } from "./CreatureArt";
import {
  advanceNursery,
  changeWorker,
  clockLabel,
  freshNursery,
  hatch,
  jobs,
  restoreNursery,
  type CreatureKind,
  type Job,
  type Upgrade,
  type WorkerAction,
} from "./creatureEngine";

const saveKey = "saas-game-ui-creature-works-v1";
export default function CreatureWorks(): React.JSX.Element {
  const [state, setState] = useState(freshNursery);
  const [ready, setReady] = useState(false),
    [saved, setSaved] = useState(false);
  const [playing, setPlaying] = useState(false),
    [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState<number | null>(null),
    [tab, setTab] = useState<"stats" | "augment" | "log">("stats");
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [name, setName] = useState("Pip"),
    [kind, setKind] = useState<CreatureKind>("sprout"),
    [job, setJob] = useState<Job>("deliver"),
    [interval, setInterval] = useState(5);
  const form = useRef<HTMLDialogElement>(null),
    resetDialog = useRef<HTMLDialogElement>(null);
  const worker = state.workers.find((w) => w.id === selected);
  useEffect(() => {
    try {
      const restored = restoreNursery(localStorage.getItem(saveKey));
      setState(restored);
      setSelected(restored.workers[0]?.id ?? null);
    } catch {
      /* Storage may be unavailable. */
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
    if (!playing || menu || editing !== null) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setState((s) => advanceNursery(s));
    }, 1000);
    return () => clearInterval(id);
  }, [playing, menu, editing]);
  function create(): void {
    setEditing("new");
    setName(
      ["Pip", "Momo", "Taro", "Nori", "Fenn", "Kiki"][state.workers.length] ??
        "Pip",
    );
    setKind("sprout");
    setJob("deliver");
    setInterval(5);
    form.current?.showModal();
  }
  function edit(): void {
    if (!worker) return;
    setEditing(worker.id);
    setName(worker.name);
    setKind(worker.kind);
    setJob(worker.job);
    setInterval(worker.interval);
    form.current?.showModal();
  }
  function submit(e: React.FormEvent): void {
    e.preventDefault();
    if (editing === "new") {
      setSelected(state.nextId);
      setState((s) => hatch(s, name, kind, job, interval));
    } else if (editing !== null)
      setState((s) =>
        changeWorker(s, editing, { type: "edit", name, interval, job }),
      );
    setTab("stats");
    form.current?.close();
  }
  function act(action: WorkerAction): void {
    if (worker) setState((s) => changeWorker(s, worker.id, action));
  }
  const milestones = [
    state.workers.length >= 2,
    state.workers.some((w) => w.upgrades.length > 0),
    state.workers.reduce((n, w) => n + w.successes, 0) >= 3,
  ];
  const working = worker !== undefined && worker.remaining > 0;
  return (
    <div className="g-page g-creature-page">
      <header className="g-site">
        <a href="/design/saas-game-ui">← Design system</a>
        <span>02 / Scheduled workers</span>
        <GameMenu saved={saved} onOpenChange={setMenu} />
      </header>
      <main className="g-shell">
        <header className="g-game-title">
          <div>
            <span className="g-eyebrow">A small clockwork sanctuary</span>
            <h1>Creature Works</h1>
          </div>
          <div className="g-clock">
            <b>{clockLabel(state.now)}</b>
            <span>Simulated UTC · 1 second = 1 minute</span>
          </div>
        </header>
        <div className="g-toolbar">
          <div className="g-button-row">
            <button className="g-primary" onClick={() => setPlaying(!playing)}>
              {playing ? "Pause clock" : "Start clock"}
            </button>
            <button onClick={() => setState((s) => advanceNursery(s))}>
              +1 minute
            </button>
            <button onClick={() => setState((s) => advanceNursery(s, 5))}>
              +5 minutes
            </button>
          </div>
          <button onClick={create} disabled={state.workers.length >= 6}>
            + Hatch worker
          </button>
        </div>
        <div className="g-play-layout">
          <section className="g-nursery" aria-label="Worker sanctuary">
            <NurseryArt />
            <div className="g-world-goal">
              <span className="g-eyebrow">Your first little operation</span>
              <h2>
                {milestones.every(Boolean)
                  ? "A thriving sanctuary."
                  : "Bring the workshop to life."}
              </h2>
              <ol>
                {[
                  "Hatch two workers",
                  "Equip an augmentation",
                  "Complete three jobs",
                ].map((goal, i) => (
                  <li key={goal} data-done={milestones[i]}>
                    {milestones[i] ? "✓" : "◇"} {goal}
                  </li>
                ))}
              </ol>
            </div>
            <div className="g-station-labels">
              <span>Post office</span>
              <span>Archive</span>
              <span>Watchtower</span>
            </div>
            {state.workers.map((w, i) => {
              const running = w.remaining > 0;
              const slot = state.workers
                .filter((other) => other.remaining > 0 && other.job === w.job)
                .findIndex((other) => other.id === w.id);
              const x = running
                ? { deliver: 19, index: 50, watch: 82 }[w.job] +
                  (slot % 2) * 16 -
                  8
                : [21, 50, 79][i % 3];
              const y = running
                ? 48 + Math.floor(slot / 2) * 18
                : i < 3
                  ? 70
                  : 88;
              return (
                <button
                  key={w.id}
                  className="g-world-worker"
                  data-worker={w.id}
                  data-state={
                    running ? "working" : w.enabled ? "idle" : "paused"
                  }
                  aria-label={`Inspect ${w.name}`}
                  aria-pressed={selected === w.id}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onClick={() => {
                    setSelected(w.id);
                    setTab("stats");
                  }}
                >
                  <Creature
                    kind={w.kind}
                    upgrades={w.upgrades}
                    active={running && playing && !menu && editing === null}
                  />
                  <span>
                    {w.name}
                    <small>
                      {running
                        ? w.retrying
                          ? "Retrying…"
                          : "Working…"
                        : w.enabled
                          ? `Due ${clockLabel(w.next).slice(3)}`
                          : "Paused"}
                    </small>
                  </span>
                </button>
              );
            })}
            {state.workers.length === 0 && (
              <button className="g-hatch-plinth" onClick={create}>
                <span>✧</span>
                <strong>Hatch your first worker</strong>
                <small>A creature. A job. A schedule.</small>
              </button>
            )}
          </section>
          <aside className="g-inspector" aria-label="Worker dashboard">
            {worker ? (
              <>
                <div className="g-inspector-heading">
                  <Creature kind={worker.kind} upgrades={worker.upgrades} />
                  <div>
                    <span className="g-eyebrow">
                      Worker {String(worker.id).padStart(2, "0")}
                    </span>
                    {state.workers.length > 1 ? (
                      <select
                        className="g-worker-picker"
                        aria-label="Choose worker"
                        value={worker.id}
                        onChange={(e) => {
                          setSelected(Number(e.target.value));
                          setTab("stats");
                        }}
                      >
                        {state.workers.map((other) => (
                          <option key={other.id} value={other.id}>
                            {other.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <h2>{worker.name}</h2>
                    )}
                    <p>{jobs[worker.job].name}</p>
                  </div>
                  <button onClick={edit} disabled={working}>
                    Edit
                  </button>
                </div>
                <div className="g-tabs" aria-label="Worker views">
                  {(["stats", "augment", "log"] as const).map((t) => (
                    <button
                      key={t}
                      aria-pressed={tab === t}
                      onClick={() => setTab(t)}
                    >
                      {t === "stats"
                        ? "Dashboard"
                        : t === "augment"
                          ? "Augment"
                          : "Run log"}
                    </button>
                  ))}
                </div>
                {tab === "stats" && (
                  <div className="g-inspector-content">
                    <div className="g-status" role="status">
                      {working
                        ? `${worker.retrying ? "Retrying" : "Running"} · ${worker.remaining} simulated min left`
                        : worker.enabled
                          ? `Next run: ${clockLabel(worker.next)}`
                          : "Schedule paused"}
                    </div>
                    <dl className="g-stats">
                      <div>
                        <dt>Runs started</dt>
                        <dd>{worker.runs}</dd>
                      </div>
                      <div>
                        <dt>Successful</dt>
                        <dd>{worker.successes}</dd>
                      </div>
                      <div>
                        <dt>Failed runs</dt>
                        <dd>{worker.failures}</dd>
                      </div>
                      <div>
                        <dt>Last duration</dt>
                        <dd>
                          {worker.lastDuration === null
                            ? "—"
                            : `${worker.lastDuration}m`}
                        </dd>
                      </div>
                    </dl>
                    <div className="g-schedule">
                      <span>Every {worker.interval} minutes · UTC</span>
                      <code>*/{worker.interval} * * * *</code>
                    </div>
                    <div className="g-button-row">
                      <button
                        className="g-primary"
                        onClick={() => act({ type: "run" })}
                        disabled={working}
                      >
                        Run now
                      </button>
                      <button onClick={() => act({ type: "pause" })}>
                        {worker.enabled ? "Pause schedule" : "Resume schedule"}
                      </button>
                    </div>
                    <p className="g-small">
                      {worker.enabled
                        ? "The creature wakes when its schedule is due. Run now leaves the schedule intact."
                        : "Pausing stops future scheduled runs. Work already in progress finishes."}
                    </p>
                    <details>
                      <summary>Try a failure</summary>
                      <p className="g-small">
                        Simulate one timeout on this worker’s next attempt. A
                        retry charm can recover it.
                      </p>
                      <button
                        onClick={() => act({ type: "fault" })}
                        disabled={working || worker.faultNext}
                      >
                        {worker.faultNext
                          ? "Timeout armed"
                          : "Simulate next timeout"}
                      </button>
                    </details>
                  </div>
                )}
                {tab === "augment" && (
                  <div className="g-inspector-content">
                    <p className="g-small">
                      Equipment changes the job. Its appearance changes with it.
                    </p>
                    {(
                      [
                        {
                          id: "wings",
                          title: "Swift wings",
                          text: "Complete each attempt in 1 minute instead of 3.",
                        },
                        {
                          id: "retry",
                          title: "Retry charm",
                          text: "Retry a failed attempt once, after 1 minute.",
                        },
                      ] as { id: Upgrade; title: string; text: string }[]
                    ).map((u) => (
                      <button
                        className="g-upgrade"
                        key={u.id}
                        aria-pressed={worker.upgrades.includes(u.id)}
                        disabled={working}
                        onClick={() => act({ type: "upgrade", upgrade: u.id })}
                      >
                        <span className="g-upgrade-icon">
                          {u.id === "wings" ? "↗" : "↻"}
                        </span>
                        <span>
                          <b>{u.title}</b>
                          <small>{u.text}</small>
                        </span>
                        <span>
                          {worker.upgrades.includes(u.id) ? "✓" : "+"}
                        </span>
                      </button>
                    ))}
                    <p className="g-small">
                      {working
                        ? "Augmentations lock during a run. Finish it before changing equipment."
                        : `${worker.upgrades.length} of 2 augmentations equipped. No artificial currency or leveling gate.`}
                    </p>
                  </div>
                )}
                {tab === "log" && (
                  <div className="g-inspector-content">
                    <p className="g-small">
                      {worker.attempts} attempts across {worker.runs} runs ·
                      latest 30 events
                    </p>
                    <ol className="g-log">
                      {worker.log.map((l, i) => (
                        <li key={`${l.at}-${i}`} data-tone={l.tone}>
                          <time>{clockLabel(l.at)}</time>
                          <span>{l.text}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </>
            ) : (
              <div className="g-empty">
                <Creature />
                <span className="g-eyebrow">Meet your automations</span>
                <h2>
                  Every cron job
                  <br />
                  gets a creature.
                </h2>
                <p>
                  Hatch a worker, give it a job, and wind the clock. Select it
                  in the world to see its dashboard, augmentations, and run
                  history.
                </p>
                <button className="g-primary" onClick={create}>
                  Create a creature
                </button>
              </div>
            )}
          </aside>
        </div>
        <footer className="g-game-footer">
          <span>
            {saved ? "Saved in this browser" : "Local session"} · Clock pauses
            offscreen · Simulated jobs
          </span>
          <button
            onClick={() => {
              setPlaying(false);
              resetDialog.current?.showModal();
            }}
          >
            Reset sanctuary
          </button>
        </footer>
      </main>
      <p className="g-under-note">
        Creature = scheduled worker · Nest = idle · Destination = job ·
        Equipment = runtime policy.{" "}
        <a href="/design/saas-game-ui#language">Read the design language ↗</a>
      </p>
      <dialog
        ref={form}
        className="g-dialog g-creator"
        onClose={() => setEditing(null)}
        aria-labelledby="creator-title"
      >
        <form onSubmit={submit}>
          <div className="g-dialog-heading">
            <div>
              <span className="g-eyebrow">Creature creator</span>
              <h2 id="creator-title">
                {editing === "new"
                  ? "A new little worker."
                  : "Refine your worker."}
              </h2>
            </div>
            <button
              type="button"
              aria-label="Close creature creator"
              onClick={() => form.current?.close()}
            >
              ×
            </button>
          </div>
          <div className="g-creator-preview">
            <Creature kind={kind} />
            <p>
              {name || "Your worker"}
              <small>
                {jobs[job].name} · every {interval} min
              </small>
            </p>
          </div>
          <label>
            Name
            <input
              required
              maxLength={24}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </label>
          {editing === "new" && (
            <fieldset>
              <legend>
                Creature form <span>· appearance only</span>
              </legend>
              <div className="g-species">
                {(["sprout", "finch", "moth"] as const).map((k) => (
                  <label key={k}>
                    <input
                      type="radio"
                      name="form"
                      value={k}
                      checked={kind === k}
                      onChange={() => setKind(k)}
                    />
                    <Creature kind={k} />
                    <span>{k}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <div className="g-form-row">
            <label>
              Job
              <select
                aria-label="Job"
                value={job}
                onChange={(e) => setJob(e.target.value as Job)}
              >
                {Object.entries(jobs).map(([value, item]) => (
                  <option key={value} value={value}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Schedule
              <select
                aria-label="Schedule"
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
          </div>
          <p className="g-small">
            UTC schedule: <code>*/{interval} * * * *</code>. The simulation runs
            only while this page is visible.
          </p>
          <button className="g-primary" type="submit">
            {editing === "new" ? "Hatch creature" : "Save worker"}
          </button>
        </form>
      </dialog>
      <dialog
        ref={resetDialog}
        className="g-dialog"
        aria-labelledby="nursery-reset"
      >
        <h2 id="nursery-reset">Start a new sanctuary?</h2>
        <p>This removes the creatures and logs saved in this browser.</p>
        <div className="g-button-row">
          <button onClick={() => resetDialog.current?.close()}>
            Keep my creatures
          </button>
          <button
            onClick={() => {
              setState(freshNursery());
              setSelected(null);
              resetDialog.current?.close();
            }}
          >
            Reset everything
          </button>
        </div>
      </dialog>
    </div>
  );
}
