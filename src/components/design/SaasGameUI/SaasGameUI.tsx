import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowCounterClockwise,
  Check,
  CheckCircle,
  Code,
  Diamond,
  FileCode,
  Flag,
  Hand,
  Pause,
  Play,
  PersonSimpleWalk,
  Sparkle,
  X,
  XCircle,
} from "@phosphor-icons/react";
import { Person } from "./WorldArtwork";
import {
  checkCases,
  patchCode,
  runChecks,
  runSteps,
  sourceCode,
  surfaces,
  type CheckResult,
  type Surface,
} from "./harness";

type Phase = "idle" | "running" | "paused" | "review" | "applied" | "done";
interface Point {
  x: number;
  y: number;
}
interface DocumentView {
  title: string;
  code: string;
}

export default function SaasGameUI(): React.JSX.Element {
  const [mode, setMode] = useState<"character" | "pointer">("character");
  const [active, setActive] = useState<Surface>("task");
  const [position, setPosition] = useState<Point | null>(null);
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState(1);
  const [assigned, setAssigned] = useState(false);
  const [sourceEquipped, setSourceEquipped] = useState(true);
  const [testsEquipped, setTestsEquipped] = useState(false);
  const [canRead, setCanRead] = useState(true);
  const [canPropose, setCanPropose] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [inspected, setInspected] = useState(false);
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [checkedVersion, setCheckedVersion] = useState<
    "baseline" | "patch" | null
  >(null);
  const [dragging, setDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState(false);
  const [notice, setNotice] = useState(
    "Start by assigning the task to your implementer.",
  );
  const [hint, setHint] = useState("");
  const [documentView, setDocumentView] = useState<DocumentView | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const workspace = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const cards = useRef<Partial<Record<Surface, HTMLElement | null>>>({});
  const moveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const documentOpener = useRef<HTMLElement | null>(null);
  const patched = phase === "applied" || phase === "done";
  const hasPatch = phase === "review" || patched;
  const configLocked = phase !== "idle";
  const equipped = Number(sourceEquipped) + Number(testsEquipped);
  const ready = assigned && equipped === 2 && canRead && canPropose;
  const passed = results?.filter((test) => test.passed).length ?? 0;
  const verified =
    patched && checkedVersion === "patch" && passed === checkCases.length;
  const blocker = !assigned
    ? "Assign the task first."
    : equipped < 2
      ? "Equip both context files."
      : !canRead || !canPropose
        ? "Enable Read files and Propose patch."
        : "Ready when you are.";

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = (): void => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const board = workspace.current;
    if (!board) return;
    const update = (): void => {
      const dock = cards.current[active]?.querySelector(".h-dock");
      if (!dock) return;
      const b = board.getBoundingClientRect();
      const d = dock.getBoundingClientRect();
      setPosition({ x: d.left - b.left, y: d.top - b.top });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(board);
    for (const card of Object.values(cards.current))
      if (card) observer.observe(card);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [active, mode]);

  useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setTimeout(() => {
      if (step < runSteps.length) {
        setStep(step + 1);
      } else {
        setPhase("review");
        setNotice(
          "The implementer proposed a patch. Inspect the diff before applying it.",
        );
      }
    }, 950);
    return () => window.clearTimeout(timer);
  }, [phase, step]);

  useEffect(
    () => () => {
      if (moveTimer.current !== null) clearTimeout(moveTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (documentView !== null && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [documentView]);

  function moveTo(id: Surface): void {
    const before = cards.current[active]?.getBoundingClientRect();
    const after = cards.current[id]?.getBoundingClientRect();
    if (before && after) setFacing(after.left < before.left ? -1 : 1);
    setActive(id);
    if (moveTimer.current !== null) clearTimeout(moveTimer.current);
    setWalking(!reducedMotion && id !== active);
    moveTimer.current = setTimeout(() => setWalking(false), 420);
  }
  function interact(id: Surface, action: () => void): void {
    moveTo(id);
    action();
  }
  function assign(): void {
    setAssigned(true);
    setDragging(false);
    setDropTarget(false);
    setNotice(
      equipped === 2
        ? "Task assigned. Your agent has both context files."
        : "Task assigned. Equip both files to complete the agent’s context.",
    );
  }
  function startRun(): void {
    if (!ready || phase !== "idle") return;
    setStep(0);
    setInspected(false);
    setPhase("running");
    setNotice("The sample agent is reading its equipped files.");
  }
  function inspect(): void {
    if (!hasPatch) return;
    setInspected(true);
    setNotice("Diff opened. Applying it changes only the local sample.");
  }
  function apply(): void {
    if (phase !== "review" || !inspected) return;
    setPhase("applied");
    setResults(null);
    setCheckedVersion(null);
    setNotice("Patch applied to the local sample. Run checks to verify it.");
  }
  function verify(): void {
    setResults(runChecks(patched));
    setCheckedVersion(patched ? "patch" : "baseline");
    setNotice(
      patched
        ? "All four checks passed against the patched function."
        : "Baseline: one check passed, three failed. The task has a reproducible failure.",
    );
  }
  function reset(): void {
    setPhase("idle");
    setStep(0);
    setAssigned(false);
    setSourceEquipped(true);
    setTestsEquipped(false);
    setCanRead(true);
    setCanPropose(true);
    setInspected(false);
    setResults(null);
    setCheckedVersion(null);
    setDragging(false);
    setDropTarget(false);
    setHint("");
    moveTo("task");
    setNotice("Sample reset. Assign the task to begin again.");
  }
  function openDocument(title: string, code: string): void {
    documentOpener.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setDocumentView({ title, code });
  }
  function onBoardKey(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.target !== event.currentTarget || mode !== "character") return;
    const key = event.key.toLowerCase();
    const direction = ["arrowright", "arrowdown", "d", "s"].includes(key)
      ? 1
      : ["arrowleft", "arrowup", "a", "w"].includes(key)
        ? -1
        : 0;
    if (direction !== 0) {
      event.preventDefault();
      const index = surfaces.findIndex((item) => item.id === active);
      moveTo(
        surfaces[(index + direction + surfaces.length) % surfaces.length].id,
      );
    } else if (key === "e" || key === "enter") {
      event.preventDefault();
      cards.current[active]
        ?.querySelector<HTMLElement>(
          "[data-primary]:not(:disabled), input:not(:disabled)",
        )
        ?.focus();
    }
  }
  function heading(
    id: Surface,
    number: string,
    label: string,
    status: string,
  ): React.JSX.Element {
    return (
      <div className="h-card-heading">
        <button
          className="h-card-title"
          onClick={() => moveTo(id)}
          aria-label={`Approach ${label}`}
          aria-pressed={active === id && mode === "character"}
        >
          <span className="h-number">{number}</span>
          <span>
            <span className="h-eyebrow">{label}</span>
            <small>{status}</small>
          </span>
        </button>
        <span className="h-dock" aria-hidden="true">
          <Diamond size={16} weight="thin" />
        </span>
      </div>
    );
  }
  function command(
    id: Surface,
    label: string,
    action: () => void,
    options: { disabled?: boolean; quiet?: boolean; cursor?: string } = {},
  ): React.JSX.Element {
    return (
      <button
        className={`h-button ${options.quiet === true ? "h-button--quiet" : ""}`}
        data-primary
        data-command={options.cursor ?? "use"}
        disabled={options.disabled ?? false}
        onClick={() => interact(id, action)}
        onMouseEnter={() =>
          setHint(
            `${surfaces.find((item) => item.id === id)?.title ?? id} · ${label}`,
          )
        }
        onMouseLeave={() => setHint("")}
        onFocus={() =>
          setHint(
            `${surfaces.find((item) => item.id === id)?.title ?? id} · ${label}`,
          )
        }
        onBlur={() => setHint("")}
      >
        <span>{label}</span>
        <ArrowRight size={16} aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="h-study">
      <header className="h-site-header">
        <a href="/portfolio">
          <ArrowLeft size={15} /> shupp.dev
        </a>
        <span>
          Design studies <span className="h-slash">/</span> SaaS Game UI
        </span>
        <span className="h-edition">No. 03</span>
      </header>
      <main>
        <section className="h-intro">
          <div>
            <p className="h-eyebrow">An interface you can inhabit</p>
            <h1>Put your agent to work.</h1>
          </div>
          <p>
            Your task, context, agent, and output are the game objects.
            <br className="h-desktop-break" /> Every interaction does something
            in the app.
          </p>
        </section>
        <section className="h-harness" aria-label="Interactive AI harness">
          <div className="h-appbar">
            <div className="h-brand">
              <span className="h-crest">
                <Diamond weight="duotone" size={25} />
              </span>
              <div>
                <strong>FIELDWORK</strong>
                <span>AI harness</span>
              </div>
            </div>
            <span className="h-sandbox">
              <span /> Local sandbox
            </span>
          </div>
          <div className="h-toolbar">
            <div>
              <span className="h-run-id">RUN / 001</span>
              <span className="h-run-name">Search guard</span>
            </div>
            <div className="h-controls">
              <div className="h-mode" aria-label="Interaction mode">
                <button
                  aria-pressed={mode === "character"}
                  onClick={() => {
                    setMode("character");
                    setWalking(false);
                  }}
                >
                  <PersonSimpleWalk size={16} />
                  Character
                </button>
                <button
                  aria-pressed={mode === "pointer"}
                  onClick={() => {
                    setMode("pointer");
                    setWalking(false);
                  }}
                >
                  <Hand size={16} />
                  Pointer
                </button>
              </div>
              <button
                className="h-icon-button"
                onClick={reset}
                aria-label="Reset sample"
                title="Reset sample"
              >
                <ArrowCounterClockwise size={18} />
              </button>
            </div>
          </div>
          <div
            className="h-workspace"
            ref={workspace}
            tabIndex={mode === "character" ? 0 : -1}
            onKeyDown={onBoardKey}
            aria-label="Harness workspace. Arrow keys or WASD move between components. E focuses the current component’s action."
            data-mode={mode}
          >
            <section
              className="h-card h-task"
              ref={(el) => {
                cards.current.task = el;
              }}
              data-active={active === "task" && mode === "character"}
            >
              {heading(
                "task",
                "01",
                "Task",
                phase === "done"
                  ? "Completed"
                  : assigned
                    ? "Assigned to implementer"
                    : "Ready to assign",
              )}
              <div
                className="h-task-content"
                draggable={!assigned}
                onDragStart={(event) => {
                  event.dataTransfer.setData(
                    "text/plain",
                    "fieldwork:search-guard",
                  );
                  event.dataTransfer.effectAllowed = "move";
                  setDragging(true);
                }}
                onDragEnd={() => {
                  setDragging(false);
                  setDropTarget(false);
                }}
              >
                <span className="h-label">
                  <Flag size={12} /> FIX · SEARCH-012
                </span>
                <h2>Stop empty searches.</h2>
                <p>
                  Reject blank input. Trim spaces.
                  <br />
                  Keep valid queries working.
                </p>
                <div className="h-task-meta">
                  <span>src/search.ts</span>
                  <span>4 checks</span>
                </div>
              </div>
              {command(
                "task",
                phase === "done"
                  ? "Task completed"
                  : assigned
                    ? "Assigned to implementer"
                    : "Assign to implementer",
                assign,
                { disabled: assigned, cursor: "assign" },
              )}
              {!assigned && (
                <p className="h-micro">Or drag this task onto the agent.</p>
              )}
            </section>

            <section
              className="h-card h-context"
              ref={(el) => {
                cards.current.context = el;
              }}
              data-active={active === "context" && mode === "character"}
            >
              {heading(
                "context",
                "02",
                "Context",
                `${equipped} / 2 files equipped`,
              )}
              <p className="h-card-description">
                Give the agent what it needs.
              </p>
              <div className="h-file">
                <label>
                  <input
                    type="checkbox"
                    checked={sourceEquipped}
                    disabled={configLocked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      interact("context", () => {
                        setSourceEquipped(checked);
                        setNotice(
                          checked
                            ? "Source file equipped."
                            : "Source file removed from the agent’s context.",
                        );
                      });
                    }}
                  />
                  <FileCode size={19} />
                  <span>
                    src/search.ts<small>Current implementation</small>
                  </span>
                </label>
                <button
                  className="h-file-open"
                  aria-label="Inspect source file"
                  title="Inspect source file"
                  onClick={() =>
                    interact("context", () =>
                      openDocument(
                        "src/search.ts",
                        patched ? patchCode : sourceCode,
                      ),
                    )
                  }
                >
                  <Code size={17} />
                </button>
              </div>
              <div className="h-file">
                <label>
                  <input
                    type="checkbox"
                    checked={testsEquipped}
                    disabled={configLocked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      interact("context", () => {
                        setTestsEquipped(checked);
                        setNotice(
                          checked
                            ? "Test file equipped. Your agent is ready once the task is assigned."
                            : "Test file removed from the agent’s context.",
                        );
                      });
                    }}
                  />
                  <FileCode size={19} />
                  <span>
                    search.test.ts<small>Acceptance criteria</small>
                  </span>
                </label>
                <button
                  className="h-file-open"
                  aria-label="Inspect test file"
                  title="Inspect test file"
                  onClick={() =>
                    interact("context", () =>
                      openDocument(
                        "search.test.ts",
                        checkCases
                          .map(
                            (test) =>
                              `expect(prepareSearch(${JSON.stringify(test.input)})).toBe(${JSON.stringify(test.expected)});`,
                          )
                          .join("\n"),
                      ),
                    )
                  }
                >
                  <Code size={17} />
                </button>
              </div>
              <p className="h-micro">
                {configLocked
                  ? "Context is fixed for this run."
                  : "Checked files are equipped for this run."}
              </p>
            </section>

            <section
              className="h-card h-agent"
              ref={(el) => {
                cards.current.agent = el;
              }}
              data-active={active === "agent" && mode === "character"}
              data-dragging={dragging}
              data-drop={dropTarget}
              onDragOver={(e) => {
                if (dragging && !assigned) {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDropTarget(true);
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                  setDropTarget(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDropTarget(false);
                if (
                  e.dataTransfer.getData("text/plain") ===
                    "fieldwork:search-guard" &&
                  !assigned
                )
                  interact("agent", assign);
              }}
            >
              {heading(
                "agent",
                "03",
                "Agent",
                phase === "running"
                  ? "Working"
                  : phase === "paused"
                    ? "Paused"
                    : phase === "done"
                      ? "Task complete"
                      : hasPatch
                        ? "Run finished"
                        : ready
                          ? "Ready"
                          : "Setting up",
              )}
              <div className="h-agent-profile">
                <div className="h-agent-emblem">
                  <Sparkle size={35} weight="thin" />
                  <span>I</span>
                </div>
                <div>
                  <h2>Implementer</h2>
                  <p>One task. One focused patch.</p>
                  <span className="h-simulation">Simulated agent</span>
                </div>
              </div>
              <div className="h-assignment" data-filled={assigned}>
                <Flag size={15} />
                <span>
                  {assigned
                    ? "SEARCH-012 · Stop empty searches"
                    : dragging
                      ? "Drop the task here"
                      : "No task assigned"}
                </span>
                {assigned && <Check size={15} />}
              </div>
              <details className="h-tools">
                <summary>
                  Tool access{" "}
                  <span>{Number(canRead) + Number(canPropose)} enabled</span>
                </summary>
                <label>
                  <input
                    type="checkbox"
                    checked={canRead}
                    disabled={configLocked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      interact("agent", () => setCanRead(checked));
                    }}
                  />
                  Read files
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={canPropose}
                    disabled={configLocked}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      interact("agent", () => setCanPropose(checked));
                    }}
                  />
                  Propose patch
                </label>
                <p className="h-micro">Applying a patch stays with you.</p>
              </details>
              <div className="h-activity" aria-label="Agent activity">
                {phase === "idle" ? (
                  <div className="h-idle">
                    <Diamond size={22} weight="thin" />
                    <p>
                      {ready ? "Everything is equipped." : "Prepare the run."}
                    </p>
                    <span>{blocker}</span>
                  </div>
                ) : (
                  <ol>
                    {runSteps.map((item, index) => (
                      <li
                        key={item.title}
                        data-state={
                          step > index
                            ? "complete"
                            : step === index && phase === "running"
                              ? "current"
                              : "pending"
                        }
                      >
                        <span className="h-step-mark">
                          {step > index ? <Check size={13} /> : index + 1}
                        </span>
                        <div>
                          <strong>{item.title}</strong>
                          {step > index && <p>{item.detail}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              {phase === "running" ? (
                <button
                  className="h-button h-button--quiet"
                  data-primary
                  onClick={() =>
                    interact("agent", () => {
                      setPhase("paused");
                      setNotice(
                        "Run paused. Resume to continue from this step.",
                      );
                    })
                  }
                >
                  <span>Pause run</span>
                  <Pause size={17} />
                </button>
              ) : phase === "paused" ? (
                <button
                  className="h-button"
                  data-primary
                  onClick={() =>
                    interact("agent", () => {
                      setPhase("running");
                      setNotice("Run resumed.");
                    })
                  }
                >
                  <span>Resume run</span>
                  <Play size={17} />
                </button>
              ) : (
                command(
                  "agent",
                  hasPatch ? "Patch proposed" : "Run agent",
                  startRun,
                  { disabled: !ready || phase !== "idle", cursor: "run" },
                )
              )}
            </section>

            <section
              className="h-card h-patch"
              ref={(el) => {
                cards.current.patch = el;
              }}
              data-active={active === "patch" && mode === "character"}
            >
              {heading(
                "patch",
                "04",
                "Patch",
                patched
                  ? "Applied locally"
                  : hasPatch
                    ? "Your review needed"
                    : "Waiting for the agent",
              )}
              {hasPatch ? (
                <>
                  <div className="h-output-title">
                    <FileCode size={18} />
                    <span>src/search.ts</span>
                    <span className="h-diff-count">
                      +2 <i>−1</i>
                    </span>
                  </div>
                  {inspected ? (
                    <div className="h-diff" aria-label="Proposed code diff">
                      <div> function prepareSearch(query)</div>
                      <div className="h-deleted">− return query;</div>
                      <div className="h-added">
                        + const value = query.trim();
                      </div>
                      <div className="h-added">
                        + return value.length ? value : null;
                      </div>
                    </div>
                  ) : (
                    <p className="h-card-description">
                      Trim the query and guard against blank input. One function
                      changed.
                    </p>
                  )}
                  {inspected && (
                    <button
                      className="h-text-button"
                      onClick={() =>
                        interact("patch", () =>
                          openDocument("Proposed src/search.ts", patchCode),
                        )
                      }
                    >
                      View complete function <ArrowRight size={13} />
                    </button>
                  )}
                  {patched ? (
                    <div className="h-applied">
                      <CheckCircle size={17} />
                      Applied to this sample
                    </div>
                  ) : (
                    <>
                      <div className="h-patch-actions">
                        {inspected
                          ? command("patch", "Approve & apply", apply, {
                              cursor: "apply",
                            })
                          : command("patch", "Inspect diff", inspect, {
                              cursor: "inspect",
                            })}
                        <button
                          className="h-icon-button"
                          aria-label="Reject patch"
                          title="Reject patch"
                          onClick={() =>
                            interact("patch", () => {
                              setPhase("idle");
                              setStep(0);
                              setInspected(false);
                              setNotice(
                                "Patch rejected. Adjust the agent’s context or run it again.",
                              );
                            })
                          }
                        >
                          <X size={18} />
                        </button>
                      </div>
                      <p className="h-micro">Changes the local sample only.</p>
                    </>
                  )}
                </>
              ) : (
                <div className="h-empty">
                  <Code size={24} weight="thin" />
                  <p>The proposed change appears here.</p>
                  <span>You review it before it is applied.</span>
                </div>
              )}
            </section>

            <section
              className="h-card h-checks"
              ref={(el) => {
                cards.current.checks = el;
              }}
              data-active={active === "checks" && mode === "character"}
            >
              {heading(
                "checks",
                "05",
                "Checks",
                results === null
                  ? "Not run yet"
                  : `${passed} / 4 passed · ${checkedVersion === "patch" ? "patch" : "baseline"}`,
              )}
              {results === null ? (
                <div className="h-check-intro">
                  <div className="h-check-rings">
                    <Check size={21} />
                  </div>
                  <p>
                    Four checks.
                    <br />
                    <span>One clear result.</span>
                  </p>
                </div>
              ) : (
                <ul className="h-test-results">
                  {results.map((test) => (
                    <li key={test.name} data-pass={test.passed}>
                      {test.passed ? (
                        <CheckCircle size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      <details>
                        <summary>{test.name}</summary>
                        <code>
                          Input: {JSON.stringify(test.input)}
                          <br />
                          Expected: {JSON.stringify(test.expected)}
                          <br />
                          Received: {JSON.stringify(test.actual)}
                        </code>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
              {verified
                ? command(
                    "checks",
                    phase === "done" ? "Task complete" : "Complete task",
                    () => {
                      setPhase("done");
                      setNotice(
                        "Task complete. The patch passed all four checks and is ready in this local sample.",
                      );
                    },
                    { disabled: phase === "done" },
                  )
                : command(
                    "checks",
                    patched ? "Run checks on patch" : "Run baseline checks",
                    verify,
                    { quiet: !patched, cursor: "verify" },
                  )}
              <p className="h-micro">Real checks, executed in your browser.</p>
            </section>
            {mode === "character" && position !== null && (
              <div
                className="h-operator"
                aria-hidden="true"
                data-surface={active}
                data-walking={walking}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px)`,
                }}
              >
                <Person walking={walking} carrying={hasPatch} facing={facing} />
                <span />
              </div>
            )}
          </div>
          <div className="h-status" role="status">
            <span
              className={`h-status-dot ${phase === "running" ? "h-status-dot--working" : ""}`}
            />
            {notice}
          </div>
          <div className="h-commandbar">
            <span>
              <Diamond size={12} />
              {hint !== ""
                ? hint
                : mode === "character"
                  ? "Select a card to move. Use its controls to act."
                  : "Use any component directly."}
            </span>
            <span className="h-key-hint">
              {mode === "character" ? (
                <>
                  <kbd>↑↓←→</kbd> move <kbd>E</kbd> interact
                </>
              ) : (
                "Same actions. Direct input."
              )}
            </span>
          </div>
        </section>
        <div className="h-study-note">
          <p>
            <strong>A working interaction study.</strong> Agent activity and its
            patch are authored examples. Checks execute the sample function
            locally. Nothing connects to your repositories.
          </p>
          <details>
            <summary>
              How this becomes a design system <ArrowRight size={14} />
            </summary>
            <div className="h-system-detail">
              <p>
                Bind each interface component to a command, its prerequisites,
                and its result. The character, pointer, and keyboard all operate
                those same controls.
              </p>
              <dl>
                {surfaces.map((surface) => (
                  <div key={surface.id}>
                    <dt>{surface.title}</dt>
                    <dd>{surface.command}</dd>
                  </div>
                ))}
              </dl>
              <p>
                Configure the agent through Context and Tool access. Character
                mode moves your operator between components; pointer mode uses
                them directly. Focus the workspace for arrow keys or WASD, then
                press E to focus an action. Reduced motion places the character
                immediately.
              </p>
            </div>
          </details>
        </div>
      </main>
      <footer className="h-footer">
        <span>SaaS Game UI</span>
        <span>RPG interaction × useful software</span>
        <a href="https://github.com/shuppel/shupp-dev/pull/55">
          View the study <ArrowRight size={13} />
        </a>
      </footer>
      <dialog
        className="h-dialog"
        ref={dialog}
        onClose={() => {
          setDocumentView(null);
          documentOpener.current?.focus();
        }}
        aria-labelledby="h-document-title"
      >
        <div className="h-dialog-heading">
          <h2 id="h-document-title">{documentView?.title}</h2>
          <button
            className="h-icon-button"
            aria-label="Close document"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} />
          </button>
        </div>
        <pre>
          <code>{documentView?.code}</code>
        </pre>
        <p>Local sample file · read only</p>
      </dialog>
    </div>
  );
}
