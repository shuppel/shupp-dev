import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowCounterClockwise,
  Check,
  FileText,
  GearSix,
  Hand,
  LockSimple,
  PersonSimpleWalk,
  Plus,
  X,
} from "@phosphor-icons/react";
import {
  Person,
  WorkObject,
  Workroom,
  type ObjectAction,
} from "./WorldArtwork";

interface Point {
  x: number;
  y: number;
}
type WorldItem = Point & {
  id: string;
  label: string;
  action: ObjectAction;
  radius: number;
};
interface Destination {
  point: Point;
  objectId?: string;
  label?: string;
}
type InputMode = "character" | "pointer";
const actions: Record<
  ObjectAction,
  { step: number; verb: string; title: string; detail: string; result: string }
> = {
  collect: {
    step: 0,
    verb: "Collect",
    title: "Collect 6 notes",
    detail:
      "Collect the customer notes from this archive. They become the source material for your brief.",
    result:
      "Six source notes are in your inventory. Take them to the writing desk.",
  },
  draft: {
    step: 1,
    verb: "Write",
    title: "Prepare brief",
    detail:
      "Use the collected notes to prepare a short brief. You’ll review it before marking it complete.",
    result: "Your brief is ready. Bring it to the review stand.",
  },
  review: {
    step: 2,
    verb: "Review",
    title: "Mark sample reviewed",
    detail:
      "Check the recommendations against their source notes, then mark this sample as reviewed.",
    result:
      "Sample reviewed. Your notes and brief remain available in the inventory.",
  },
};
const initialObjects: WorldItem[] = [
  {
    id: "archive",
    label: "Source archive",
    action: "collect",
    x: 23,
    y: 61,
    radius: 10,
  },
  {
    id: "desk",
    label: "Writing desk",
    action: "draft",
    x: 51,
    y: 56,
    radius: 10,
  },
  {
    id: "stand",
    label: "Review stand",
    action: "review",
    x: 79,
    y: 63,
    radius: 10,
  },
];
const startPosition: Point = { x: 50, y: 84 };
const notes = [
  "Two customers missed changes to their task status.",
  "Three customers asked for a single daily summary.",
  "The support team manually combines updates every Friday.",
  "Reviewers want to see the source of each recommendation.",
  "The team wants to approve summaries before they are shared.",
  "A draft-only pilot is planned for next week.",
];
const brief = [
  "Combine task updates into a daily summary so changes are easier to follow.",
  "Keep source notes alongside recommendations so reviewers can check the evidence.",
  "Pilot a draft-only summary next week, with a person reviewing every draft.",
];
const movementKeys = new Set([
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "w",
  "a",
  "s",
  "d",
]);
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
function approach(item: WorldItem): Point {
  return { x: item.x, y: clamp(item.y + 8, 56, 92) };
}
function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function emptyObject(): WorldItem {
  return {
    id: "new",
    label: "Notes cabinet",
    action: "collect",
    x: 18,
    y: 80,
    radius: 10,
  };
}

export default function SaasGameUI(): React.JSX.Element {
  const [objects, setObjects] = useState<WorldItem[]>(initialObjects);
  const [mode, setMode] = useState<InputMode>("character");
  const [position, setPosition] = useState<Point>(startPosition);
  const positionRef = useRef<Point>(startPosition);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [keyboardMoving, setKeyboardMoving] = useState(false);
  const keys = useRef(new Set<string>());
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);
  const [running, setRunning] = useState<WorldItem | null>(null);
  const [notice, setNotice] = useState(
    "Click the archive to walk over and discover its action.",
  );
  const [reducedMotion, setReducedMotion] = useState(false);
  const [documentKind, setDocumentKind] = useState<"notes" | "brief">("notes");
  const [editing, setEditing] = useState<WorldItem>(initialObjects[0]);
  const [setupError, setSetupError] = useState("");
  const nextId = useRef(1);
  const stage = useRef<HTMLDivElement>(null);
  const documentDialog = useRef<HTMLDialogElement>(null);
  const setupDialog = useRef<HTMLDialogElement>(null);
  const selected = objects.find((item) => item.id === selectedId) ?? null;
  const nearest = objects.reduce<WorldItem | null>(
    (best, item) =>
      distance(position, approach(item)) <= item.radius &&
      (best === null ||
        distance(position, approach(item)) < distance(position, approach(best)))
        ? item
        : best,
    null,
  );
  const hovered = objects.find((item) => item.id === hoveredId) ?? null;
  const reachable =
    selected !== null &&
    (mode === "pointer" ||
      distance(position, approach(selected)) <= selected.radius);
  const selectedAction = selected === null ? null : actions[selected.action];
  const complete = selectedAction !== null && phase > selectedAction.step;
  const locked = selectedAction !== null && phase < selectedAction.step;
  const cursorState =
    running !== null
      ? "working"
      : hovered === null
        ? mode === "character"
          ? "walk"
          : "select"
        : phase < actions[hovered.action].step
          ? "locked"
          : mode === "character" &&
              distance(position, approach(hovered)) > hovered.radius
            ? "approach"
            : "interact";
  const cursorHint =
    cursorState === "working"
      ? "Working"
      : hovered !== null
        ? cursorState === "locked"
          ? `Requires ${actions[hovered.action].step === 1 ? "source notes" : "a draft brief"}`
          : cursorState === "approach"
            ? `Walk to ${hovered.label.toLowerCase()}`
            : phase > actions[hovered.action].step
              ? "Inspect result"
              : actions[hovered.action].verb
        : mode === "character"
          ? "Click the floor to move"
          : "Select an object";

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    function update(event: MediaQueryListEvent): void {
      setReducedMotion(event.matches);
    }
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (mode !== "character" || (destination === null && !keyboardMoving))
      return;
    let frame = 0;
    let previous = 0;
    function finish(point: Point): void {
      positionRef.current = point;
      setPosition(point);
      setWalking(false);
      setDestination(null);
      if (destination?.objectId !== undefined) {
        setSelectedId(destination.objectId);
        setNotice(
          `You’re beside ${destination.label?.toLowerCase() ?? "the object"}. Choose its action below.`,
        );
      }
    }
    if (reducedMotion && destination !== null && !keyboardMoving) {
      finish(destination.point);
      return;
    }
    function tick(time: number): void {
      const dt =
        previous === 0 ? 0.016 : Math.min((time - previous) / 1000, 0.04);
      previous = time;
      const bounds = stage.current?.getBoundingClientRect();
      if (bounds === undefined) return;
      const here = positionRef.current;
      const dxKey =
        Number(keys.current.has("arrowright") || keys.current.has("d")) -
        Number(keys.current.has("arrowleft") || keys.current.has("a"));
      const dyKey =
        Number(keys.current.has("arrowdown") || keys.current.has("s")) -
        Number(keys.current.has("arrowup") || keys.current.has("w"));
      let dx = dxKey;
      let dy = dyKey;
      const manual = dx !== 0 || dy !== 0;
      if (!manual && destination !== null) {
        dx = ((destination.point.x - here.x) * bounds.width) / 100;
        dy = ((destination.point.y - here.y) * bounds.height) / 100;
      }
      const length = Math.hypot(dx, dy);
      const stride = 215 * dt;
      if (!manual && destination !== null && length <= stride) {
        finish(destination.point);
        return;
      }
      if (length === 0) {
        setWalking(false);
        return;
      }
      const next = {
        x: clamp(
          here.x + (((dx / length) * stride) / bounds.width) * 100,
          6,
          94,
        ),
        y: clamp(
          here.y + (((dy / length) * stride) / bounds.height) * 100,
          56,
          92,
        ),
      };
      positionRef.current = next;
      setPosition(next);
      setWalking(true);
      if (Math.abs(dx) > 0.1) setFacing(dx >= 0 ? 1 : -1);
      frame = window.requestAnimationFrame(tick);
    }
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [destination, keyboardMoving, mode, reducedMotion]);

  useEffect(() => {
    if (running === null) return;
    // A bounded local sample, not a model call or a backend progress estimate.
    const timer = window.setTimeout(() => {
      setPhase(actions[running.action].step + 1);
      setNotice(actions[running.action].result);
      setRunning(null);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [running]);

  useEffect(() => {
    function releaseKeys(): void {
      keys.current.clear();
      setKeyboardMoving(false);
      setWalking(false);
    }
    window.addEventListener("blur", releaseKeys);
    return () => window.removeEventListener("blur", releaseKeys);
  }, []);

  function stopMoving(): void {
    keys.current.clear();
    setKeyboardMoving(false);
    setDestination(null);
    setWalking(false);
  }
  function openDocument(kind: "notes" | "brief"): void {
    stopMoving();
    setDocumentKind(kind);
    documentDialog.current?.showModal();
  }
  function chooseObject(item: WorldItem): void {
    if (
      mode === "pointer" ||
      distance(positionRef.current, approach(item)) <= item.radius
    ) {
      stopMoving();
      setSelectedId(item.id);
      setNotice(
        `${item.label}: ${phase < actions[item.action].step ? "finish the earlier step to unlock this action." : "choose an action below."}`,
      );
    } else {
      keys.current.clear();
      setKeyboardMoving(false);
      setSelectedId(item.id);
      setDestination({
        point: approach(item),
        objectId: item.id,
        label: item.label,
      });
      setNotice(`Walking to ${item.label.toLowerCase()}…`);
    }
  }
  function walkTo(event: React.MouseEvent<HTMLDivElement>): void {
    if (
      (event.target as HTMLElement).closest("button") !== null ||
      mode !== "character" ||
      event.button !== 0
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = {
      x: clamp(((event.clientX - bounds.left) / bounds.width) * 100, 6, 94),
      y: clamp(((event.clientY - bounds.top) / bounds.height) * 100, 56, 92),
    };
    keys.current.clear();
    setKeyboardMoving(false);
    setSelectedId(null);
    setDestination({ point });
    stage.current?.focus({ preventScroll: true });
  }
  function onStageKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    const key = event.key.toLowerCase();
    if (key === "escape") {
      stopMoving();
      setSelectedId(null);
      return;
    }
    if (mode !== "character") return;
    if (movementKeys.has(key)) {
      event.preventDefault();
      keys.current.add(key);
      setDestination(null);
      setKeyboardMoving(true);
    }
    if (
      key === "e" ||
      (key === "enter" && event.target === event.currentTarget)
    ) {
      event.preventDefault();
      if (nearest !== null) {
        stopMoving();
        setSelectedId(nearest.id);
        setNotice(`${nearest.label}: choose its action below.`);
      } else setNotice("Move closer to an object to interact with it.");
    }
  }
  function onStageKeyUp(event: React.KeyboardEvent<HTMLDivElement>): void {
    keys.current.delete(event.key.toLowerCase());
    if (keys.current.size === 0) {
      setKeyboardMoving(false);
      setWalking(false);
    }
  }
  function performAction(): void {
    if (selected === null || running !== null || !reachable) return;
    const definition = actions[selected.action];
    if (phase < definition.step) return;
    if (phase > definition.step) {
      openDocument(selected.action === "collect" ? "notes" : "brief");
      return;
    }
    stopMoving();
    setRunning(selected);
    setNotice(`${definition.title} — working with the local sample…`);
  }
  function resetSample(): void {
    stopMoving();
    setRunning(null);
    setPhase(0);
    setSelectedId(null);
    positionRef.current = startPosition;
    setPosition(startPosition);
    setNotice("Sample reset. Your object layout is kept.");
  }
  function changeMode(value: InputMode): void {
    stopMoving();
    setMode(value);
    setNotice(
      value === "character"
        ? "Click the floor to move. Approach an object to use it."
        : "Select an object to use its action directly.",
    );
  }
  function openSetup(): void {
    stopMoving();
    setEditing(selected ?? objects[0]);
    setSetupError("");
    setupDialog.current?.showModal();
  }
  function saveObject(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (editing.label.trim().length === 0) {
      setSetupError("Give the object a name.");
      return;
    }
    if (![editing.x, editing.y, editing.radius].every(Number.isFinite)) {
      setSetupError("Use valid numbers for position and reach.");
      return;
    }
    if (
      objects.some(
        (item) => item.id !== editing.id && distance(item, editing) < 15,
      )
    ) {
      setSetupError(
        "This is too close to another object. Move it a little farther away.",
      );
      return;
    }
    const saved = {
      ...editing,
      id: editing.id === "new" ? `custom-${nextId.current++}` : editing.id,
      label: editing.label.trim(),
    };
    const nextObjects =
      editing.id === "new"
        ? [...objects, saved]
        : objects.map((item) => (item.id === editing.id ? saved : item));
    if (
      !(Object.keys(actions) as ObjectAction[]).every((action) =>
        nextObjects.some((item) => item.action === action),
      )
    ) {
      setSetupError(
        "Keep an object for each step. Add a replacement before changing this action.",
      );
      return;
    }
    setObjects(nextObjects);
    setSelectedId(saved.id);
    setHoveredId(null);
    setupDialog.current?.close();
    setNotice(
      `${saved.label} is set up. Its ${actions[saved.action].verb.toLowerCase()} action is ready to try.`,
    );
  }

  return (
    <div className="world-study">
      <a className="world-skip" href="#workroom">
        Skip to workroom
      </a>
      <header className="world-site-header">
        <a href="/" className="world-wordmark">
          shupp.dev <span>/ design studies</span>
        </a>
        <a href="/portfolio">
          <ArrowLeft size={14} aria-hidden="true" /> All studies
        </a>
      </header>
      <main className="world-main">
        <div className="world-intro">
          <div>
            <span className="world-eyebrow">
              SAAS GAME UI / OBJECT INTERACTION
            </span>
            <h1>
              Your character.
              <br />
              <span>Your way into the work.</span>
            </h1>
          </div>
          <p>
            Walk to an object. Discover its action.
            <br />
            Use it to change something in the app.
            <small>Illustrated 2D study · Inter typography</small>
          </p>
        </div>
        <section className="world-shell" aria-label="Interactive workroom demo">
          <div className="world-toolbar">
            <div>
              <span className="world-mark" aria-hidden="true">
                ◇
              </span>
              <strong>The workroom</strong>
              <span className="world-demo">Local sample</span>
            </div>
            <div
              className="world-mode"
              role="group"
              aria-label="Interaction mode"
            >
              <button
                aria-pressed={mode === "character"}
                onClick={() => changeMode("character")}
              >
                <PersonSimpleWalk size={16} aria-hidden="true" /> Character
              </button>
              <button
                aria-pressed={mode === "pointer"}
                onClick={() => changeMode("pointer")}
              >
                <Hand size={16} aria-hidden="true" /> Pointer
              </button>
            </div>
          </div>
          <div
            id="workroom"
            ref={stage}
            className="world-stage"
            tabIndex={0}
            role="group"
            aria-label="Workroom. Click to walk, or use arrow keys and E to interact."
            aria-describedby="world-instructions"
            data-mode={mode}
            data-cursor={cursorState}
            onClick={walkTo}
            onKeyDown={onStageKeyDown}
            onKeyUp={onStageKeyUp}
            onBlur={() => {
              keys.current.clear();
              setKeyboardMoving(false);
              setWalking(false);
            }}
          >
            <Workroom />
            <div className="world-location" aria-hidden="true">
              <span>THE RESEARCH ATELIER</span>
              <small>Notes → brief → review</small>
            </div>
            {objects.map((item) => {
              const definition = actions[item.action];
              const itemComplete = phase > definition.step;
              const itemLocked = phase < definition.step;
              const inReach =
                mode === "pointer" ||
                distance(position, approach(item)) <= item.radius;
              return (
                <button
                  key={item.id}
                  className="world-object"
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    zIndex: Math.round(item.y),
                  }}
                  onClick={() => chooseObject(item)}
                  onPointerEnter={() => setHoveredId(item.id)}
                  onPointerLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(item.id)}
                  onBlur={() => setHoveredId(null)}
                  aria-label={item.label}
                  aria-pressed={selectedId === item.id}
                  data-state={
                    itemComplete
                      ? "complete"
                      : itemLocked
                        ? "locked"
                        : running?.id === item.id
                          ? "working"
                          : "ready"
                  }
                  data-reachable={inReach}
                  data-cursor={
                    running !== null
                      ? "working"
                      : itemLocked
                        ? "locked"
                        : inReach
                          ? "interact"
                          : "approach"
                  }
                >
                  <span className="world-object-hint">
                    {itemComplete
                      ? "Inspect"
                      : itemLocked
                        ? "Locked"
                        : inReach
                          ? definition.verb
                          : "Approach"}
                  </span>
                  <WorkObject action={item.action} complete={itemComplete} />
                  <span className="world-object-label">
                    {itemComplete ? (
                      <Check size={12} aria-hidden="true" />
                    ) : itemLocked ? (
                      <LockSimple size={12} aria-hidden="true" />
                    ) : (
                      <span className="world-ready-dot" aria-hidden="true" />
                    )}
                    {item.label}
                  </span>
                </button>
              );
            })}
            {destination !== null && mode === "character" && (
              <span
                className="world-destination"
                style={{
                  left: `${destination.point.x}%`,
                  top: `${destination.point.y}%`,
                }}
                aria-hidden="true"
              />
            )}
            {mode === "character" && (
              <div
                className="world-person"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  zIndex: Math.round(position.y),
                }}
                data-x={position.x.toFixed(2)}
                data-y={position.y.toFixed(2)}
                data-walking={walking}
                aria-label="Your character"
              >
                <span className="world-person-shadow" />
                <Person
                  walking={walking}
                  carrying={phase >= 1}
                  facing={facing}
                />
                <span className="world-you">You</span>
              </div>
            )}
            <div className="world-cursor-hint" aria-hidden="true">
              {cursorState === "locked" ? (
                <LockSimple size={14} />
              ) : mode === "character" ? (
                <PersonSimpleWalk size={15} />
              ) : (
                <Hand size={15} />
              )}
              <span>{cursorHint}</span>
            </div>
            {mode === "character" &&
              nearest !== null &&
              destination === null &&
              !walking && (
                <button
                  className="world-nearby"
                  onClick={() => {
                    setSelectedId(nearest.id);
                    setNotice(`${nearest.label}: choose its action below.`);
                  }}
                >
                  <kbd>E</kbd> Interact with {nearest.label.toLowerCase()}
                </button>
              )}
          </div>
          <div className="world-context" data-has-object={selected !== null}>
            <div className="world-context-copy">
              <span className="world-eyebrow">
                {selected === null
                  ? "YOUR NEXT MOVE"
                  : selected.label.toUpperCase()}
              </span>
              <h2>
                {selected === null
                  ? mode === "character"
                    ? "Start at the source archive."
                    : "Choose an object in the room."
                  : !reachable
                    ? `Walk to ${selected.label.toLowerCase()}.`
                    : locked
                      ? `First, ${selectedAction?.step === 1 ? "collect the notes" : "prepare a brief"}.`
                      : complete
                        ? "Your result is ready to inspect."
                        : selectedAction?.title}
              </h2>
              <p>
                {selected === null
                  ? "The archive holds your notes. The desk prepares a brief. The stand is where you review it."
                  : !reachable
                    ? "The action becomes available when your character is within reach."
                    : locked
                      ? "You can inspect this object now. Its action unlocks when the earlier step is complete."
                      : selectedAction?.detail}
              </p>
            </div>
            <div className="world-context-actions">
              {selected === null ? (
                <button
                  className="world-primary"
                  onClick={() =>
                    chooseObject(
                      objects.find((item) => item.action === "collect") ??
                        objects[0],
                    )
                  }
                >
                  {mode === "character" ? "Walk to archive" : "Select archive"}
                  <ArrowRight size={16} />
                </button>
              ) : !reachable ? (
                <button
                  className="world-primary"
                  onClick={() => chooseObject(selected)}
                  disabled={destination !== null}
                >
                  {" "}
                  {destination !== null ? "Walking…" : "Walk closer"}
                  <PersonSimpleWalk size={17} />
                </button>
              ) : running !== null ? (
                <button
                  className="world-primary world-secondary"
                  onClick={() => {
                    setRunning(null);
                    setNotice("Action paused. Your completed work is kept.");
                  }}
                >
                  Pause action
                </button>
              ) : (
                <button
                  className="world-primary"
                  disabled={locked}
                  onClick={performAction}
                >
                  {complete
                    ? selected.action === "collect"
                      ? "Inspect source notes"
                      : "Read brief"
                    : selectedAction?.title}
                  {locked ? <LockSimple size={16} /> : <ArrowRight size={16} />}
                </button>
              )}
              {selected?.action === "review" && phase === 2 && (
                <button
                  className="world-text-button"
                  onClick={() => openDocument("brief")}
                >
                  Read the draft first <FileText size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="world-status">
            <p role="status" aria-live="polite">
              {notice}
            </p>
            <span>{phase} / 3 steps</span>
          </div>
        </section>
        <div className="world-below">
          <p id="world-instructions">
            {mode === "character" ? (
              <>
                <kbd>Click</kbd> to walk · <kbd>WASD</kbd> or arrows to move ·{" "}
                <kbd>E</kbd> to interact
              </>
            ) : (
              "Select an object to use its action. The pointer changes with the target."
            )}
          </p>
          <button className="world-text-button" onClick={resetSample}>
            <ArrowCounterClockwise size={14} /> Reset task
          </button>
        </div>
        <div className="world-inventory">
          <span className="world-eyebrow">YOUR INVENTORY</span>
          <button disabled={phase < 1} onClick={() => openDocument("notes")}>
            <FileText size={17} />
            <span>
              Source notes
              <small>{phase >= 1 ? "6 collected" : "Waiting to collect"}</small>
            </span>
          </button>
          <button disabled={phase < 2} onClick={() => openDocument("brief")}>
            <FileText size={17} />
            <span>
              Weekly brief
              <small>
                {phase === 3
                  ? "Reviewed"
                  : phase >= 2
                    ? "Ready to review"
                    : "Waiting to prepare"}
              </small>
            </span>
          </button>
          <button
            className="world-setup-link"
            onClick={openSetup}
            disabled={running !== null}
          >
            <GearSix size={17} /> Set up objects
          </button>
        </div>
        <details className="world-details">
          <summary>
            The design system behind the room <span>+</span>
          </summary>
          <div>
            <p>
              <strong>Object → action → result.</strong> Each object has a
              label, an app action, a position, and an interaction distance.
              Approach it with a character or select it with a pointer. Both
              routes use the same action and state.
            </p>
            <p>
              Use “Set up objects” to move or rename objects, change their
              action, and add a new one. This sample uses predefined data; the
              same interaction contract can call your app’s handlers.
            </p>
          </div>
        </details>
        <footer className="world-footer">
          <span>One space. Useful objects. Visible consequences.</span>
          <span>shupp.dev / SaaS Game UI</span>
        </footer>
      </main>
      <dialog
        ref={documentDialog}
        className="world-dialog"
        aria-labelledby="world-document-title"
      >
        <div className="world-dialog-top">
          <span className="world-eyebrow">SAMPLE DOCUMENT</span>
          <form method="dialog">
            <button aria-label="Close document" className="world-close">
              <X size={20} />
            </button>
          </form>
        </div>
        <h2 id="world-document-title">
          {documentKind === "notes" ? "Customer notes" : "Weekly brief"}
        </h2>
        {documentKind === "brief" && (
          <p className="world-document-state">
            {phase === 3
              ? "Reviewed in this sample"
              : "Draft · awaiting your review"}
          </p>
        )}
        <ol className="world-document-list">
          {(documentKind === "notes" ? notes : brief).map((line, index) => (
            <li key={line}>
              <span>
                {documentKind === "notes" ? "NOTE" : "RECOMMENDATION"} 0
                {index + 1}
              </span>
              {line}
              {documentKind === "brief" && (
                <small>
                  Source notes{" "}
                  {index === 0 ? "01, 02, 03" : index === 1 ? "04" : "05, 06"}
                </small>
              )}
            </li>
          ))}
        </ol>
        <div className="world-dialog-actions">
          <form method="dialog">
            <button className="world-primary">
              Back to the room <ArrowRight size={16} />
            </button>
          </form>
          {phase >= 2 && (
            <button
              className="world-text-button"
              onClick={() =>
                setDocumentKind(documentKind === "notes" ? "brief" : "notes")
              }
            >
              {documentKind === "notes" ? "View brief" : "View source notes"}
            </button>
          )}
        </div>
      </dialog>
      <dialog
        ref={setupDialog}
        className="world-dialog world-setup-dialog"
        aria-labelledby="world-setup-title"
      >
        <div className="world-dialog-top">
          <span className="world-eyebrow">SCENE SETUP</span>
          <form method="dialog">
            <button aria-label="Close setup" className="world-close">
              <X size={20} />
            </button>
          </form>
        </div>
        <h2 id="world-setup-title">Give an object a job.</h2>
        <p>Choose an app action and where someone can use it.</p>
        <form onSubmit={saveObject} className="world-setup-form">
          <label>
            Object
            <select
              aria-label="Object"
              value={editing.id}
              onChange={(event) => {
                setEditing(
                  event.target.value === "new"
                    ? emptyObject()
                    : {
                        ...(objects.find(
                          (item) => item.id === event.target.value,
                        ) ?? objects[0]),
                      },
                );
                setSetupError("");
              }}
            >
              {objects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
              {objects.length < 6 && (
                <option value="new">+ Add an object</option>
              )}
            </select>
          </label>
          <label>
            Name
            <input
              value={editing.label}
              onChange={(event) =>
                setEditing({ ...editing, label: event.target.value })
              }
              maxLength={30}
              required
            />
          </label>
          <label>
            App action
            <select
              aria-label="App action"
              value={editing.action}
              onChange={(event) =>
                setEditing({
                  ...editing,
                  action: event.target.value as ObjectAction,
                })
              }
            >
              <option value="collect">Collect source notes</option>
              <option value="draft">Prepare a brief</option>
              <option value="review">Review the brief</option>
            </select>
          </label>
          <div className="world-setup-grid">
            <label>
              Position X (%)
              <input
                type="number"
                min={8}
                max={92}
                step={1}
                value={editing.x}
                onChange={(event) =>
                  setEditing({ ...editing, x: event.target.valueAsNumber })
                }
                required
              />
            </label>
            <label>
              Position Y (%)
              <input
                type="number"
                min={46}
                max={82}
                step={1}
                value={editing.y}
                onChange={(event) =>
                  setEditing({ ...editing, y: event.target.valueAsNumber })
                }
                required
              />
            </label>
          </div>
          <label>
            Interaction distance <span>{editing.radius}% of the scene</span>
            <input
              type="range"
              aria-label="Interaction distance"
              min={6}
              max={18}
              step={1}
              value={editing.radius}
              onChange={(event) =>
                setEditing({ ...editing, radius: Number(event.target.value) })
              }
            />
          </label>
          {setupError !== "" && (
            <p className="world-setup-error" role="alert">
              {setupError}
            </p>
          )}
          <div className="world-dialog-actions">
            <button type="submit" className="world-primary">
              {editing.id === "new" ? (
                <>
                  <Plus size={16} /> Add object
                </>
              ) : (
                <>
                  Save object <Check size={16} />
                </>
              )}
            </button>
            <button
              type="button"
              className="world-text-button"
              onClick={() => {
                setObjects(initialObjects);
                setEditing(initialObjects[0]);
                setSetupError("");
                setSelectedId(null);
                setNotice("The original object layout is restored.");
              }}
            >
              Restore original objects
            </button>
          </div>
        </form>
        <small className="world-setup-note">
          Scene edits last for this visit. Reset task keeps your layout.
        </small>
      </dialog>
    </div>
  );
}
