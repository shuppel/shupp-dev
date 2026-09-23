import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowCounterClockwise,
  Backpack,
  Check,
  FileCode,
  Flag,
  Question,
  ShieldCheck,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import { FieldArt, Folio, Person } from "./WorldArtwork";
import {
  approach,
  clamp,
  distance,
  moveKeys,
  objects,
  spawn,
  type ActorId,
  type Command,
  type FieldObject,
  type ItemId,
  type ObjectId,
} from "./field";
import { useWalker } from "./useWalker";
import GameMenu from "./GameMenu";
import {
  checkCases,
  patchCode,
  runChecks,
  runSteps,
  sourceCode,
  type CheckResult,
} from "./harness";

type RunState = "idle" | "moving" | "working" | "paused" | "ready";
type CheckState = "idle" | "moving" | "working";
type Tray = "none" | "inventory" | "equipment" | "controls";
type DocumentKind = "source" | "tests" | "diff" | "checks";
interface Equipment {
  source: boolean;
  tests: boolean;
  read: boolean;
  write: boolean;
  check: boolean;
}
const freshEquipment = (): Record<"implementer" | "verifier", Equipment> => ({
  implementer: {
    source: false,
    tests: false,
    read: true,
    write: true,
    check: false,
  },
  verifier: {
    source: false,
    tests: false,
    read: true,
    write: false,
    check: true,
  },
});
const itemNames: Record<ItemId, string> = {
  source: "search.ts",
  tests: "search.test.ts",
  patch: "search.patch",
};
const commandNames: Record<Command, string> = {
  implement: "Implement",
  verify: "Verify",
  apply: "Apply patch",
};
const workPoints = {
  implementer: { x: 65, y: 49 },
  verifier: { x: 83, y: 62 },
};
const homePoints = {
  implementer: { x: 43, y: 43 },
  verifier: { x: 48, y: 72 },
};
const fixedBlocks = objects.filter((o) => o.kind !== "agent");

export default function SaasGameUI(): React.JSX.Element {
  const field = useRef<HTMLDivElement>(null),
    keys = useRef(new Set<string>()),
    dialog = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLElement | null>(null);
  const [reduced, setReduced] = useState(false),
    [instant, setInstant] = useState(false);
  const [patchAvailable, setPatchAvailable] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const blocks = fixedBlocks.filter((o) => o.id !== "patch" || patchAvailable);
  const player = useWalker({
    initial: spawn,
    field,
    blocks,
    reduced: reduced || instant,
    keyboard: keys,
    paused: menuOpen,
  });
  const implementer = useWalker({
    initial: homePoints.implementer,
    field,
    blocks,
    reduced: reduced || instant,
    paused: menuOpen,
  });
  const verifier = useWalker({
    initial: homePoints.verifier,
    field,
    blocks,
    reduced: reduced || instant,
    paused: menuOpen,
  });
  const [active, setActive] = useState<ObjectId | null>(null),
    [tray, setTray] = useState<Tray>("none");
  const [bag, setBag] = useState<ItemId[]>([]),
    [equipment, setEquipment] = useState(freshEquipment);
  const [command, setCommand] = useState<Command | null>(null),
    [targeted, setTargeted] = useState(false);
  const [run, setRun] = useState<RunState>("idle"),
    [runStep, setRunStep] = useState(0);
  const [checkState, setCheckState] = useState<CheckState>("idle"),
    [checkStep, setCheckStep] = useState(0);
  const [results, setResults] = useState<CheckResult[]>([]),
    [checkedPatch, setCheckedPatch] = useState(false);
  const [inspected, setInspected] = useState(false),
    [patched, setPatched] = useState(false);
  const [documentKind, setDocumentKind] = useState<DocumentKind | null>(null),
    [won, setWon] = useState(false),
    [celebrate, setCelebrate] = useState(false);
  const [notice, setNotice] = useState(
    "Walk to a file and take it into your context inventory.",
  );
  const [hover, setHover] = useState<ObjectId | null>(null);
  const checkVersion = useRef(false);
  const busy = run === "moving" || run === "working" || run === "paused";
  const checking = checkState !== "idle";
  const canImplement =
    equipment.implementer.source &&
    equipment.implementer.tests &&
    equipment.implementer.read &&
    equipment.implementer.write &&
    !busy &&
    !patchAvailable &&
    !patched;
  const canVerify =
    equipment.verifier.tests && equipment.verifier.check && !checking && !won;
  const passed = results.filter((r) => r.passed).length;
  const liveObjects = objects
    .filter((o) => o.id !== "patch" || patchAvailable)
    .map((o) =>
      o.id === "implementer"
        ? { ...o, ...implementer.position }
        : o.id === "verifier"
          ? { ...o, ...verifier.position }
          : o,
    );
  const nearest = liveObjects
    .map((o) => ({ object: o, d: distance(player.position, o) }))
    .filter((o) => o.d < 13)
    .sort((a, b) => a.d - b.d)
    .at(0)?.object;
  const selected = liveObjects.find((o) => o.id === active);
  const selectedActor: ActorId =
    active === "implementer" || active === "verifier" ? active : "operator";
  const goal = won
    ? "Encounter complete"
    : patched
      ? "Verify the applied patch"
      : patchAvailable
        ? "Collect and inspect the patch"
        : busy
          ? "Your implementer is working"
          : bag.includes("source") && bag.includes("tests")
            ? "Equip the implementer, then target the task"
            : "Collect the two context files";
  const phaseLabel =
    command !== null
      ? targeted
        ? "Confirm command"
        : "Choose a target"
      : tray === "equipment"
        ? "Equipment"
        : tray === "inventory"
          ? "Inventory"
          : busy
            ? "Agent running"
            : "Explore";
  const activeFile = active === "source" || active === "tests";
  const inventoryContains = (id: ItemId): boolean => bag.includes(id);

  useEffect(() => {
    field.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = (): void => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const held = keys.current;
    const up = (e: KeyboardEvent): void => {
      held.delete(e.key.toLowerCase());
    };
    const clear = (): void => {
      held.clear();
    };
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, []);
  useEffect(() => {
    if (run !== "working" || menuOpen) return;
    const timer = window.setTimeout(() => {
      if (runStep < runSteps.length - 1) {
        setRunStep(runStep + 1);
        setNotice(runSteps[runStep + 1].detail);
      } else {
        setRun("ready");
        setPatchAvailable(true);
        setNotice(
          "A proposed patch appeared beside the task. Collect it and inspect the diff.",
        );
        implementer.go(homePoints.implementer);
      }
    }, 1100);
    return () => clearTimeout(timer);
  }, [run, runStep, menuOpen]);
  useEffect(() => {
    if (checkState !== "working" || menuOpen) return;
    const timer = window.setTimeout(() => {
      const all = runChecks(checkVersion.current),
        visible = all.slice(0, checkStep + 1);
      setResults(visible);
      setCheckedPatch(checkVersion.current);
      if (checkStep < all.length - 1) {
        setCheckStep(checkStep + 1);
        setNotice(
          `${all[checkStep].passed ? "PASS" : "FAIL"} · ${all[checkStep].name}`,
        );
      } else {
        setCheckState("idle");
        verifier.go(homePoints.verifier);
        const success = all.every((r) => r.passed);
        if (success && checkVersion.current) {
          setWon(true);
          setCelebrate(true);
          setNotice(
            "Encounter complete. Your applied patch passed all four checks.",
          );
        } else
          setNotice(
            "Baseline verified: 3 failures, 1 pass. Inspect the evidence or prepare a patch.",
          );
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [checkState, checkStep, menuOpen]);
  useEffect(() => {
    if (documentKind !== null) {
      keys.current.clear();
      player.stop();
      opener.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      dialog.current?.showModal();
    }
  }, [documentKind]);

  function getObject(id: ObjectId): FieldObject | undefined {
    return liveObjects.find((o) => o.id === id);
  }
  function closeCommand(): void {
    setCommand(null);
    setTargeted(false);
    setTray("none");
  }
  function chooseObject(id: ObjectId): void {
    if (command !== null) {
      if (id !== "task") {
        setNotice(
          `${commandNames[command]} targets the Search guard task. Select its folio.`,
        );
        return;
      }
      setTargeted(true);
      setNotice(
        `Target selected. Confirm ${commandNames[command].toLowerCase()} to execute.`,
      );
      return;
    }
    const object = getObject(id);
    if (!object) return;
    setTray("none");
    setCelebrate(false);
    setActive(null);
    keys.current.clear();
    const open = (): void => {
      setActive(id);
      setNotice(
        id === "implementer"
          ? "Equip context and tools, then choose Implement."
          : id === "verifier"
            ? "Equip the test file, then choose Verify."
            : id === "task"
              ? "Target this task with an agent command."
              : id === "patch"
                ? "The agent’s proposed patch is ready to collect."
                : `${object.label} · inspect it or take a context reference.`,
      );
    };
    if (distance(player.position, object) < 13) {
      player.stop();
      open();
    } else {
      setNotice(`Walking to ${object.label}…`);
      player.go(approach(object), open);
    }
  }
  function walkTo(event: React.MouseEvent<HTMLButtonElement>): void {
    if (command !== null) {
      setNotice("Choose the highlighted task, or cancel targeting.");
      return;
    }
    const bounds = field.current?.getBoundingClientRect();
    if (!bounds) return;
    setActive(null);
    setTray("none");
    setCelebrate(false);
    keys.current.clear();
    player.go({
      x: clamp(((event.clientX - bounds.left) / bounds.width) * 100, 8, 92),
      y: clamp(((event.clientY - bounds.top) / bounds.height) * 100, 25, 88),
    });
  }
  function take(id: ItemId): void {
    const object = getObject(id);
    if (!object || distance(player.position, object) >= 13) {
      setNotice("Approach the object to collect it.");
      return;
    }
    if (bag.includes(id)) return;
    setBag([...bag, id]);
    setNotice(
      id === "patch"
        ? "Patch collected. Inspect the diff, then use it on Search guard."
        : `${itemNames[id]} added to inventory. Equip it on an agent.`,
    );
  }
  function equip(key: keyof Equipment, value: boolean): void {
    if (active !== "implementer" && active !== "verifier") return;
    if (
      (active === "implementer" && busy) ||
      (active === "verifier" && checking)
    )
      return;
    if ((key === "source" || key === "tests") && value && !bag.includes(key))
      return;
    setEquipment({
      ...equipment,
      [active]: { ...equipment[active], [key]: value },
    });
    setNotice(
      `${key === "source" || key === "tests" ? itemNames[key] : key === "write" ? "Propose patch" : key === "read" ? "Read files" : "Run checks"} ${value ? "equipped" : "removed"} on ${active}.`,
    );
  }
  function arm(next: Command): void {
    if (next === "implement" && !canImplement) return;
    if (next === "verify" && !canVerify) return;
    if (
      next === "apply" &&
      (!inventoryContains("patch") || !inspected || patched || checking)
    )
      return;
    setTray("none");
    setCommand(next);
    setTargeted(false);
    player.stop();
    keys.current.clear();
    setNotice(
      `Choose a target for ${commandNames[next]}. The Search guard folio is highlighted.`,
    );
  }
  function confirm(): void {
    if (!targeted || command === null) return;
    const currentCommand = command;
    closeCommand();
    if (currentCommand === "implement" && canImplement) {
      setRun("moving");
      setRunStep(0);
      setNotice("Implementer is approaching Search guard.");
      implementer.go(workPoints.implementer, () => {
        setRun("working");
        setNotice(runSteps[0].detail);
      });
    } else if (currentCommand === "verify" && canVerify) {
      setResults([]);
      setCheckStep(0);
      checkVersion.current = patched;
      setCheckState("moving");
      setNotice("Verifier is approaching the task.");
      verifier.go(workPoints.verifier, () => {
        setCheckState("working");
        setNotice("Executing the four local checks.");
      });
    } else if (
      currentCommand === "apply" &&
      inventoryContains("patch") &&
      inspected &&
      !patched &&
      !checking
    ) {
      setPatched(true);
      setResults([]);
      setCheckedPatch(false);
      setNotice(
        "Patch applied to Search guard. Equip the verifier and check the result.",
      );
      setActive("task");
    }
  }
  function pause(): void {
    implementer.stop();
    setRun("paused");
    setNotice("Implementer paused. Resume or cancel the command.");
  }
  function resume(): void {
    if (run !== "paused") return;
    setRun("moving");
    implementer.go(workPoints.implementer, () => setRun("working"));
    setNotice("Implementer is resuming the command.");
  }
  function cancelRun(): void {
    setRun("idle");
    setRunStep(0);
    implementer.stop();
    implementer.go(homePoints.implementer);
    setNotice("Command cancelled. No patch was produced.");
  }
  function cancelChecks(): void {
    setCheckState("idle");
    verifier.stop();
    verifier.go(homePoints.verifier);
    setResults([]);
    setNotice("Verification cancelled. No completed evidence was recorded.");
  }
  function reject(): void {
    if (patched) return;
    setPatchAvailable(false);
    setRun("idle");
    setRunStep(0);
    setBag(bag.filter((i) => i !== "patch"));
    setInspected(false);
    setActive(null);
    setNotice(
      "Patch rejected. Reconfigure the implementer or issue a new command.",
    );
  }
  function reset(): void {
    keys.current.clear();
    player.reset(spawn);
    implementer.reset(homePoints.implementer);
    verifier.reset(homePoints.verifier);
    setRun("idle");
    setRunStep(0);
    setCheckState("idle");
    setCheckStep(0);
    setResults([]);
    setBag([]);
    setEquipment(freshEquipment());
    setPatchAvailable(false);
    setPatched(false);
    setInspected(false);
    setCheckedPatch(false);
    setWon(false);
    setCelebrate(false);
    setActive(null);
    setHover(null);
    closeCommand();
    dialog.current?.close();
    setNotice("New encounter. Collect the two context files to begin.");
  }
  function inspect(kind: DocumentKind): void {
    if (kind === "diff") setInspected(true);
    setDocumentKind(kind);
  }
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    const element = event.target as HTMLElement;
    if (element.closest("dialog,input,textarea,select") !== null) return;
    const key = event.key.toLowerCase();
    if (moveKeys.has(key) && command === null) {
      event.preventDefault();
      keys.current.add(key);
      setActive(null);
      setTray("none");
      setCelebrate(false);
    } else if (key === "e" && !event.repeat) {
      event.preventDefault();
      if (command !== null && !targeted) {
        setTargeted(true);
        setNotice("Search guard targeted. Confirm the command.");
      } else if (nearest) chooseObject(nearest.id);
      else
        setNotice("Move closer to a file, agent, task, or output to interact.");
    } else if (key === "i" && !event.repeat) {
      event.preventDefault();
      closeCommand();
      setTray(tray === "inventory" ? "none" : "inventory");
    } else if (key === "escape") {
      if (command !== null || tray !== "none") event.preventDefault();
      player.stop();
      keys.current.clear();
      closeCommand();
      setActive(null);
      setCelebrate(false);
      setNotice("Command cancelled. Explore the field.");
    }
  }
  function cmd(
    label: string,
    action: () => void,
    disabled = false,
  ): React.JSX.Element {
    return (
      <button className="r-command" onClick={action} disabled={disabled}>
        <span className="r-command-arrow" aria-hidden="true">
          ▸
        </span>
        {label}
      </button>
    );
  }
  function partyButton(id: "implementer" | "verifier"): React.JSX.Element {
    return (
      <button
        className="r-party-member"
        onClick={() => chooseObject(id)}
        aria-label={`Approach ${id}`}
        aria-pressed={active === id}
      >
        <span className={`r-party-mini r-${id}`}>
          <Person kind={id} />
        </span>
        <span>
          {id === "implementer" ? "Implementer" : "Verifier"}
          <small>
            {id === "implementer"
              ? busy
                ? run === "paused"
                  ? "Paused"
                  : "Working"
                : patchAvailable
                  ? "Patch ready"
                  : "Ready"
              : checking
                ? "Checking"
                : won
                  ? "Verified"
                  : "Ready"}
          </small>
        </span>
        <span
          className="r-party-pips"
          aria-label={`${Number(equipment[id].source) + Number(equipment[id].tests)} files equipped`}
        >
          <i data-on={equipment[id].source} />
          <i data-on={equipment[id].tests} />
        </span>
      </button>
    );
  }
  const actorTitle =
    selectedActor === "operator"
      ? "You · Operator"
      : selectedActor === "implementer"
        ? "Implementer"
        : "Verifier";
  const commandDescription =
    command === "implement"
      ? "Uses equipped context to propose a patch. You review it before applying."
      : command === "verify"
        ? `Runs all four checks on the ${patched ? "patched" : "original"} function.`
        : "Applies the inspected patch to the local search function.";
  const equipmentLocked = active === "implementer" ? busy : checking;
  const blockers =
    active === "implementer"
      ? !equipment.implementer.source || !equipment.implementer.tests
        ? "Equip both context files to unlock Implement."
        : !equipment.implementer.read || !equipment.implementer.write
          ? "Equip Read files and Propose patch."
          : patched
            ? "The patch is applied. Ask the verifier to check it."
            : patchAvailable
              ? bag.includes("patch")
                ? "Inspect the collected patch, then use it on Search guard."
                : "Collect the patch beside the task."
              : "Choose Implement, then target Search guard."
      : won
        ? "All four checks passed. Review the evidence or restart the encounter."
        : !equipment.verifier.tests
          ? "Equip search.test.ts to unlock Verify."
          : !equipment.verifier.check
            ? "Equip Run checks to unlock Verify."
            : "Choose Verify, then target Search guard.";

  return (
    <div className="r-page" onKeyDown={onKeyDown}>
      <header className="r-site">
        <a href="/design/saas-game-ui">
          <ArrowLeft size={14} />
          Design system
        </a>
        <span>01 / Embodied interaction</span>
        <GameMenu
          onOpenChange={(open) => {
            keys.current.clear();
            setMenuOpen(open);
          }}
        />
      </header>
      <main className="r-game" aria-label="Fieldwork playable AI harness">
        <div className="r-topbar">
          <strong>
            <Sparkle size={19} weight="thin" />
            FIELDWORK
          </strong>
          <span>Project / search</span>
          <div>
            <button
              onClick={() => {
                closeCommand();
                setTray("controls");
              }}
              aria-label="Game controls"
            >
              <Question size={19} />
            </button>
            <button onClick={reset} aria-label="Restart encounter">
              <ArrowCounterClockwise size={18} />
            </button>
          </div>
        </div>
        <div
          className="r-field"
          ref={field}
          tabIndex={0}
          aria-label="Game field. WASD or arrow keys to move. E to interact. I for inventory."
          data-targeting={command !== null}
        >
          <FieldArt />
          <button
            className="r-ground"
            onClick={walkTo}
            aria-label="Walk on the field"
          />
          <div className="r-objective">
            <span>
              <Flag size={13} />
              SEARCH-012
            </span>
            <h1>Prevent empty searches</h1>
            <p>{goal}</p>
          </div>
          <span className="r-phase">{phaseLabel}</span>
          {command !== null && (
            <svg
              className="r-target-line"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d={`M${command === "implement" ? implementer.position.x : command === "verify" ? verifier.position.x : player.position.x} ${command === "implement" ? implementer.position.y - 6 : command === "verify" ? verifier.position.y - 6 : player.position.y - 6} Q62 12 79 35`}
                fill="none"
                stroke="currentColor"
                strokeWidth=".3"
                strokeDasharray={targeted ? undefined : "1 1"}
              />
            </svg>
          )}
          {liveObjects.map((object) => {
            const isAgent = object.kind === "agent",
              collected =
                (object.id === "source" ||
                  object.id === "tests" ||
                  object.id === "patch") &&
                bag.includes(object.id);
            const reachable = distance(player.position, object) < 13;
            const cursor =
              command !== null
                ? object.id === "task"
                  ? "target"
                  : "blocked"
                : collected
                  ? "inspect"
                  : reachable
                    ? "interact"
                    : "approach";
            return (
              <button
                key={object.id}
                className={`r-object r-object--${object.kind}`}
                style={{
                  left: `${object.x}%`,
                  top: `${object.y}%`,
                  zIndex: Math.round(object.y),
                }}
                data-id={object.id}
                data-near={reachable}
                data-selected={active === object.id}
                data-target={command !== null && object.id === "task"}
                data-collected={collected}
                data-cursor={cursor}
                onClick={() => chooseObject(object.id)}
                onMouseEnter={() => setHover(object.id)}
                onMouseLeave={() => setHover(null)}
                aria-label={`${object.label}${collected ? " · collected" : ""}${object.id === "task" && patched ? " · patched" : ""}`}
              >
                <span className="r-selection" aria-hidden="true">
                  ▼
                </span>
                <span className="r-object-shadow" />
                {isAgent ? (
                  <Person
                    kind={object.id as "implementer" | "verifier"}
                    walking={
                      object.id === "implementer"
                        ? implementer.walking
                        : verifier.walking
                    }
                    facing={
                      object.id === "implementer"
                        ? implementer.facing
                        : verifier.facing
                    }
                    carrying={object.id === "implementer" && patchAvailable}
                  />
                ) : (
                  <Folio
                    kind={object.id as "source" | "tests" | "task" | "patch"}
                    complete={object.id === "task" ? won : collected}
                  />
                )}
                {isAgent &&
                  ((object.id === "implementer" && busy) ||
                    (object.id === "verifier" && checking)) && (
                    <span className="r-working">
                      {object.id === "implementer"
                        ? run === "paused"
                          ? "Paused"
                          : run === "moving"
                            ? "Approaching"
                            : runSteps[runStep].title
                        : checkState === "moving"
                          ? "Approaching"
                          : `Checking ${checkStep + 1}/4`}
                    </span>
                  )}
                <span className="r-object-label">
                  {collected && <Check size={11} />} {object.label}
                  {object.id === "task" && (
                    <small>
                      {won
                        ? "Verified"
                        : patched
                          ? "Patch applied"
                          : results.length === 4
                            ? `${4 - passed} checks failing`
                            : "Task · needs a fix"}
                    </small>
                  )}
                </span>
                {object.id === "task" && (
                  <span
                    className="r-test-sigils"
                    aria-label={`${passed} of 4 checks passing`}
                  >
                    {checkCases.map((t, i) => (
                      <i
                        key={t.name}
                        data-result={
                          results[i] === undefined
                            ? "unknown"
                            : results[i].passed
                              ? "pass"
                              : "fail"
                        }
                      >
                        {results[i] === undefined
                          ? "·"
                          : results[i].passed
                            ? "✓"
                            : "×"}
                      </i>
                    ))}
                  </span>
                )}
              </button>
            );
          })}
          <div
            className="r-player"
            style={{
              left: `${player.position.x}%`,
              top: `${player.position.y}%`,
              zIndex: Math.round(player.position.y),
            }}
            data-x={player.position.x.toFixed(2)}
            data-y={player.position.y.toFixed(2)}
            data-walking={player.walking}
            aria-hidden="true"
          >
            <span className="r-player-marker">◆</span>
            <span className="r-object-shadow" />
            <Person
              walking={player.walking}
              facing={player.facing}
              carrying={bag.length > 0}
            />
          </div>
          {nearest &&
            command === null &&
            !player.walking &&
            active === null && (
              <button
                className="r-near-hint"
                onClick={() => chooseObject(nearest.id)}
              >
                <kbd>E</kbd> {nearest.label}
              </button>
            )}
          <div className="r-dpad" aria-label="Movement controls">
            {[
              ["up", "w", "↑"],
              ["left", "a", "←"],
              ["down", "s", "↓"],
              ["right", "d", "→"],
            ].map(([name, key, arrow]) => (
              <button
                key={key}
                className={`r-dpad-${name}`}
                aria-label={`Move ${name}`}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  keys.current.add(key);
                  setActive(null);
                  setTray("none");
                }}
                onPointerUp={() => keys.current.delete(key)}
                onPointerCancel={() => keys.current.delete(key)}
                onLostPointerCapture={() => keys.current.delete(key)}
              >
                {arrow}
              </button>
            ))}
          </div>
          {celebrate && (
            <div className="r-victory" role="status">
              <ShieldCheck size={33} weight="thin" />
              <span>ENCOUNTER COMPLETE</span>
              <h2>Search guard restored.</h2>
              <p>1 patch applied · 4 checks passed</p>
              <div>
                <button onClick={() => inspect("checks")}>
                  Review evidence
                </button>
                <button onClick={() => setCelebrate(false)}>
                  Return to field
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="r-party-bar">
          <div className="r-party">
            {partyButton("implementer")}
            {partyButton("verifier")}
          </div>
          <button
            className="r-bag-button"
            aria-expanded={tray === "inventory"}
            onClick={() => {
              closeCommand();
              setTray(tray === "inventory" ? "none" : "inventory");
            }}
          >
            <Backpack size={19} />
            <span>Inventory</span>
            <b>{bag.length}</b>
            <kbd>I</kbd>
          </button>
        </div>
        <div className="r-hud">
          <section className="r-identity">
            <div className="r-portrait">
              <Person
                kind={selectedActor}
                carrying={selectedActor === "operator" && bag.length > 0}
              />
            </div>
            <div>
              <span className="r-caption">
                {selected?.kind === "agent" ? "PARTY MEMBER" : "OPERATOR"}
              </span>
              <h2>{actorTitle}</h2>
              <p>
                {selectedActor === "operator"
                  ? "Explore · collect · direct"
                  : selectedActor === "implementer"
                    ? busy
                      ? run === "paused"
                        ? "Command paused"
                        : "Executing command"
                      : "Proposes changes"
                    : checking
                      ? "Executing checks"
                      : "Verifies evidence"}
              </p>
              <div className="r-equip-icons">
                {["source", "tests"].map((id) => (
                  <span
                    key={id}
                    data-filled={
                      selectedActor === "operator"
                        ? bag.includes(id as ItemId)
                        : equipment[selectedActor][id as "source" | "tests"]
                    }
                    title={itemNames[id as ItemId]}
                  >
                    <FileCode size={17} />
                  </span>
                ))}
              </div>
            </div>
          </section>
          <section
            className="r-command-menu"
            aria-label="Available game commands"
          >
            {command !== null ? (
              <>
                {targeted
                  ? cmd("Confirm command", confirm)
                  : cmd("Target Search guard", () => {
                      setTargeted(true);
                      setNotice("Search guard targeted. Confirm the command.");
                    })}
                {cmd("Cancel targeting", closeCommand)}
              </>
            ) : tray === "inventory" || tray === "controls" ? (
              <>
                {cmd("Return to field", () => {
                  setTray("none");
                  setActive(null);
                  field.current?.focus();
                })}
                {cmd("Restart encounter", reset)}
              </>
            ) : tray === "equipment" ? (
              <>
                {cmd("Finish equipping", () => setTray("none"))}
                {cmd("Inventory", () => setTray("inventory"))}
              </>
            ) : activeFile ? (
              <>
                {cmd(
                  inventoryContains(active as ItemId)
                    ? "Context collected"
                    : "Take context",
                  () => take(active as ItemId),
                  inventoryContains(active as ItemId),
                )}
                {cmd("Inspect file", () => inspect(active))}
                {cmd("Leave", () => setActive(null))}
              </>
            ) : active === "implementer" ? (
              <>
                {busy ? (
                  <>
                    {run === "paused"
                      ? cmd("Resume command", resume)
                      : cmd("Pause command", pause)}
                    {cmd("Cancel command", cancelRun)}
                  </>
                ) : (
                  <>
                    {cmd("Equip", () => setTray("equipment"))}
                    {cmd("Implement", () => arm("implement"), !canImplement)}
                  </>
                )}
                {cmd("Leave", () => setActive(null))}
              </>
            ) : active === "verifier" ? (
              <>
                {checking ? (
                  cmd("Cancel verification", cancelChecks)
                ) : (
                  <>
                    {cmd("Equip", () => setTray("equipment"))}
                    {cmd("Verify", () => arm("verify"), !canVerify)}
                  </>
                )}
                {cmd(
                  "Review evidence",
                  () => inspect("checks"),
                  results.length === 0,
                )}
              </>
            ) : active === "patch" ? (
              <>
                {!inventoryContains("patch") &&
                  cmd("Collect patch", () => take("patch"))}
                {cmd("Inspect diff", () => inspect("diff"))}
                {cmd(
                  patched ? "Patch applied" : "Use on task",
                  () => arm("apply"),
                  !inventoryContains("patch") ||
                    !inspected ||
                    patched ||
                    checking,
                )}
                {!patched && cmd("Reject patch", reject)}
              </>
            ) : active === "task" ? (
              <>
                {cmd("Inspect source", () => inspect("source"))}
                {cmd(
                  "Review evidence",
                  () => inspect("checks"),
                  results.length === 0,
                )}
                {patchAvailable &&
                  cmd("Review patch", () => {
                    if (inventoryContains("patch")) setActive("patch");
                    else chooseObject("patch");
                  })}
              </>
            ) : (
              <>
                {cmd(
                  nearest ? `Interact · ${nearest.label}` : "Interact",
                  () => {
                    if (nearest) chooseObject(nearest.id);
                  },
                  nearest === undefined,
                )}
                {cmd("Inventory", () => setTray("inventory"))}
                {cmd("Controls", () => setTray("controls"))}
              </>
            )}
          </section>
          <section className="r-detail" aria-label="Current interaction">
            {command !== null ? (
              <>
                <span className="r-caption">
                  {targeted ? "TARGET CONFIRMED" : "SELECT A TARGET"}
                </span>
                <h2>
                  {commandNames[command]} {targeted ? "→ Search guard" : ""}
                </h2>
                <p>{commandDescription}</p>
                <span className="r-command-scope">
                  {command === "implement"
                    ? "Context: search.ts + search.test.ts"
                    : command === "verify"
                      ? `Version: ${patched ? "applied patch" : "baseline"}`
                      : "Scope: local sample only"}
                </span>
              </>
            ) : tray === "equipment" &&
              (active === "implementer" || active === "verifier") ? (
              <>
                <span className="r-caption">{active} / EQUIPMENT</span>
                <div className="r-equipment">
                  <label>
                    <input
                      aria-label="Equip search.ts"
                      type="checkbox"
                      checked={equipment[active].source}
                      disabled={!inventoryContains("source") || equipmentLocked}
                      onChange={(e) => equip("source", e.target.checked)}
                    />
                    <FileCode size={17} />
                    <span>
                      search.ts
                      <small>
                        {inventoryContains("source")
                          ? "Context reference"
                          : "Collect from the field"}
                      </small>
                    </span>
                  </label>
                  <label>
                    <input
                      aria-label="Equip search.test.ts"
                      type="checkbox"
                      checked={equipment[active].tests}
                      disabled={!inventoryContains("tests") || equipmentLocked}
                      onChange={(e) => equip("tests", e.target.checked)}
                    />
                    <FileCode size={17} />
                    <span>
                      search.test.ts
                      <small>
                        {inventoryContains("tests")
                          ? "Acceptance criteria"
                          : "Collect from the field"}
                      </small>
                    </span>
                  </label>
                </div>
                <div className="r-tool-slots">
                  {active === "implementer" ? (
                    <>
                      <label>
                        <input
                          type="checkbox"
                          checked={equipment.implementer.read}
                          disabled={equipmentLocked}
                          onChange={(e) => equip("read", e.target.checked)}
                        />
                        Read files
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={equipment.implementer.write}
                          disabled={equipmentLocked}
                          onChange={(e) => equip("write", e.target.checked)}
                        />
                        Propose patch
                      </label>
                    </>
                  ) : (
                    <label>
                      <input
                        type="checkbox"
                        checked={equipment.verifier.check}
                        disabled={equipmentLocked}
                        onChange={(e) => equip("check", e.target.checked)}
                      />
                      Run checks
                    </label>
                  )}
                </div>
              </>
            ) : tray === "inventory" ? (
              <>
                <span className="r-caption">CONTEXT & OUTPUTS</span>
                <div className="r-inventory">
                  {(["source", "tests", "patch"] as ItemId[]).map((id) => (
                    <button
                      key={id}
                      disabled={!inventoryContains(id)}
                      aria-label={`Use ${itemNames[id]}`}
                      onClick={() => {
                        setTray("none");
                        setActive(id);
                        if (id !== "patch") inspect(id);
                      }}
                    >
                      <span>
                        <FileCode size={25} />
                      </span>
                      <strong>{itemNames[id]}</strong>
                      <small>
                        {inventoryContains(id)
                          ? id === "patch"
                            ? "Inspect / use"
                            : "Collected"
                          : "Empty slot"}
                      </small>
                    </button>
                  ))}
                </div>
              </>
            ) : tray === "controls" ? (
              <>
                <span className="r-caption">HOW TO PLAY</span>
                <p>
                  Click ground or hold <kbd>WASD</kbd> / arrow keys to walk.
                  Click an object to approach it. Press <kbd>E</kbd> nearby to
                  interact.
                </p>
                <p>
                  <kbd>I</kbd> inventory · <kbd>Esc</kbd> cancel. Select an
                  agent, equip context, choose a command, then target the task.
                </p>
                <label className="r-instant">
                  <input
                    type="checkbox"
                    checked={instant}
                    onChange={(e) => setInstant(e.target.checked)}
                  />
                  Instant approach
                </label>
              </>
            ) : activeFile ? (
              <>
                <span className="r-caption">
                  {inventoryContains(active as ItemId)
                    ? "IN YOUR INVENTORY"
                    : "CONTEXT OBJECT"}
                </span>
                <h2>{itemNames[active as ItemId]}</h2>
                <p>
                  {active === "source"
                    ? "The current search function. Take a reference, then equip it on the implementer."
                    : "Four executable expectations. Equip this file on the implementer and verifier."}
                </p>
              </>
            ) : active === "implementer" || active === "verifier" ? (
              <>
                <span className="r-caption">
                  {active === "implementer" ? "IMPLEMENTER" : "VERIFIER"} /
                  COMMANDS
                </span>
                <h2>
                  {busy && active === "implementer"
                    ? run === "paused"
                      ? "Command paused"
                      : run === "moving"
                        ? "Approaching target"
                        : runSteps[runStep].title
                    : checking && active === "verifier"
                      ? "Verifying Search guard"
                      : active === "implementer"
                        ? "Equip. Target. Implement."
                        : won
                          ? "Encounter complete."
                          : "Verify the result."}
                </h2>
                <p>{blockers}</p>
              </>
            ) : active === "patch" ? (
              <>
                <span className="r-caption">AGENT OUTPUT</span>
                <h2>{patched ? "Patch applied." : "A proposed change."}</h2>
                <p>
                  Trim the query and return null for blank input. Collect and
                  inspect this patch before using it on the task.
                </p>
                <span className="r-command-scope">
                  {inspected ? "Diff inspected" : "Awaiting inspection"} · +2 /
                  −1 lines
                </span>
              </>
            ) : active === "task" ? (
              <>
                <span className="r-caption">SEARCH-012 / TASK</span>
                <h2>
                  {won ? "Search guard restored." : "Prevent empty searches."}
                </h2>
                <p>
                  Reject blank input, trim surrounding spaces, and keep valid
                  queries working.
                </p>
                <span className="r-command-scope">
                  {results.length > 0
                    ? `${passed}/${results.length} checks passed · ${checkedPatch ? "patch" : "baseline"}`
                    : patched
                      ? "Patch applied · verification needed"
                      : "4 acceptance checks"}
                </span>
              </>
            ) : (
              <>
                <span className="r-caption">
                  {hover !== null ? "APPROACH & INTERACT" : "CURRENT OBJECTIVE"}
                </span>
                <h2>{hover !== null ? getObject(hover)?.label : goal}</h2>
                <p>
                  {hover !== null
                    ? "Select the object to walk over. Its commands appear when you arrive."
                    : "Files become context. Agents use their equipment. Commands act on targets."}
                </p>
              </>
            )}
          </section>
        </div>
        <div className="r-notice" role="status">
          <span aria-hidden="true">◆</span>
          {notice}
        </div>
        <div className="r-controls-line">
          <span>
            <kbd>WASD</kbd> move <kbd>E</kbd> interact <kbd>I</kbd> inventory
          </span>
          <span>Local encounter · scripted agent · executable checks</span>
        </div>
      </main>
      <details className="r-about">
        <summary>About this playable study</summary>
        <p>
          Movement, proximity, inventory, equipment, targeting, cancellation,
          patch application, and test results are interactive. The coding agent
          follows an authored sequence; it does not call a model or access your
          repositories. Checks execute the original or patched sample function
          in your browser. Progress lasts for this visit. Controls use native
          buttons and support keyboard, touch, and reduced motion.
        </p>
      </details>
      <dialog
        ref={dialog}
        className="r-dialog"
        aria-labelledby="r-document-title"
        onClose={() => {
          setDocumentKind(null);
          opener.current?.focus();
        }}
      >
        <header>
          <div>
            <span className="r-caption">
              {documentKind === "checks"
                ? "VERIFICATION EVIDENCE"
                : "INSPECT OBJECT"}
            </span>
            <h2 id="r-document-title">
              {documentKind === "source"
                ? "search.ts"
                : documentKind === "tests"
                  ? "search.test.ts"
                  : documentKind === "diff"
                    ? "search.patch"
                    : "Search guard · checks"}
            </h2>
          </div>
          <button
            onClick={() => dialog.current?.close()}
            aria-label="Close inspection"
          >
            <X size={22} />
          </button>
        </header>
        {documentKind === "checks" ? (
          <>
            <p>
              {results.length === 0
                ? "No checks have run yet."
                : `${passed}/${results.length} passed · ${checkedPatch ? "patched function" : "baseline"}`}
            </p>
            <ul className="r-evidence">
              {results.map((result) => (
                <li key={result.name} data-pass={result.passed}>
                  <strong>
                    {result.passed ? "PASS" : "FAIL"} · {result.name}
                  </strong>
                  <code>
                    Input: {JSON.stringify(result.input)}
                    <br />
                    Expected: {JSON.stringify(result.expected)}
                    <br />
                    Received: {JSON.stringify(result.actual)}
                  </code>
                </li>
              ))}
            </ul>
          </>
        ) : documentKind === "diff" ? (
          <>
            <p>Proposed change · requires your approval</p>
            <pre className="r-diff">
              <code>
                <span>
                  {" "}
                  export function prepareSearch(query: string): string | null{" "}
                  {"{"}
                </span>
                <span className="r-removed">− return query;</span>
                <span className="r-added">+ const value = query.trim();</span>
                <span className="r-added">
                  + return value.length ? value : null;
                </span>
                <span>{" }"}</span>
              </code>
            </pre>
            <button
              className="r-dialog-done"
              onClick={() => dialog.current?.close()}
            >
              Finish inspection
            </button>
          </>
        ) : (
          <pre>
            <code>
              {documentKind === "source"
                ? patched
                  ? patchCode
                  : sourceCode
                : checkCases
                    .map(
                      (test) =>
                        `expect(prepareSearch(${JSON.stringify(test.input)})).toBe(${JSON.stringify(test.expected)});`,
                    )
                    .join("\n")}
            </code>
          </pre>
        )}
      </dialog>
    </div>
  );
}
