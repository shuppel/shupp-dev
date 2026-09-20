import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  DotsThree,
  FileText,
  GearSix,
  CircleHalf,
  Play,
  Plus,
  SquaresFour,
  Trash,
  Warning,
  X,
} from "@phosphor-icons/react";

type Step = "discover" | "compose" | "review";
type RunState = "idle" | "working" | "complete" | "error";

const steps: Record<
  Step,
  {
    title: string;
    verb: string;
    detail: string;
    output: string;
    icon: typeof FileText;
  }
> = {
  discover: {
    title: "Discover",
    verb: "Collect the material",
    detail:
      "Gather the six sample research notes already included in this demo.",
    output: "6 sample notes collected",
    icon: SquaresFour,
  },
  compose: {
    title: "Compose",
    verb: "Make something useful",
    detail: "Group the sample notes into a predefined weekly brief.",
    output: "1 sample brief prepared",
    icon: FileText,
  },
  review: {
    title: "Review",
    verb: "Create a decision point",
    detail:
      "Package the draft for a person to review. The demo stops at that handoff.",
    output: "Draft queued for human review",
    icon: Check,
  },
};
const order: Step[] = ["discover", "compose", "review"];
export default function SaasGameUI(): React.JSX.Element {
  const [night, setNight] = useState(false);
  const [slots, setSlots] = useState<(Step | null)[]>([
    "discover",
    "compose",
    null,
  ]);
  const [selected, setSelected] = useState(0);
  const [runState, setRunState] = useState<RunState>("idle");
  const [completed, setCompleted] = useState(0);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [notice, setNotice] = useState(
    "Add Review to the last slot, then run the sample.",
  );
  const [name, setName] = useState("Weekly brief");
  const [saved, setSaved] = useState(false);
  const [tileSelected, setTileSelected] = useState(true);
  const [included, setIncluded] = useState(true);
  const [checkpoint, setCheckpoint] = useState(1);
  const dialog = useRef<HTMLDialogElement>(null);
  const running = runState === "working";
  const selectedStep = slots[selected];
  const current = selectedStep !== null ? steps[selectedStep] : null;
  const displayName = name.trim() || "Untitled routine";

  // A bounded, deterministic sample sequence. No inference or network requests.
  useEffect(() => {
    if (runState !== "working") return;
    const timer = window.setTimeout(() => {
      if (simulateFailure && slots[completed] === "compose") {
        setRunState("error");
        setSelected(completed);
        setNotice(
          "Sample interruption: Compose could not finish. Try again to replay with the interruption cleared.",
        );
        return;
      }
      const next = completed + 1;
      setCompleted(next);
      if (next === slots.length) {
        setRunState("complete");
        setNotice(
          "Draft prepared and queued for human review. Nothing was sent or published.",
        );
      } else {
        setSelected(next);
        setNotice(`${steps[order[next]].title} is running in this sample.`);
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [runState, completed, simulateFailure, slots]);

  function placeStep(step: Step, target?: number): void {
    if (running) return;
    const destination = target ?? slots.indexOf(null);
    if (destination < 0) return;
    const next = [...slots];
    const source = next.indexOf(step);
    if (source !== -1) next[source] = next[destination];
    next[destination] = step;
    setSlots(next);
    setSelected(destination);
    setRunState("idle");
    setCompleted(0);
    setNotice(`${steps[step].title} placed in slot ${destination + 1}.`);
  }

  function startRun(): void {
    if (running) return;
    if (slots.some((step, index) => step !== order[index])) {
      setRunState("error");
      setNotice(
        "Use Discover, Compose, then Review. Choose a tool or drag tiles to arrange the sample.",
      );
      return;
    }
    if (runState === "error") setSimulateFailure(false);
    setCompleted(0);
    setSelected(0);
    setRunState("working");
    setNotice("Discover is collecting the included sample notes.");
  }

  function removeStep(): void {
    if (running) return;
    setSlots(slots.map((step, index) => (index === selected ? null : step)));
    setRunState("idle");
    setCompleted(0);
    setNotice(`Slot ${selected + 1} is ready for another tool.`);
  }

  function handleDrop(
    event: React.DragEvent<HTMLDivElement>,
    index: number,
  ): void {
    event.preventDefault();
    const step = event.dataTransfer.getData("text/plain");
    if (order.some((item) => item === step)) placeStep(step as Step, index);
  }

  return (
    <div className="sg sg-study" data-mode={night ? "night" : "day"}>
      <a className="sg-skip" href="#main">
        Skip to design study
      </a>
      <header className="sg-header">
        <a href="/" className="sg-wordmark">
          shupp.dev<span> / Design</span>
        </a>
        <nav aria-label="Study sections">
          <a href="#playground">Playground</a>
          <a href="#components">Components</a>
          <a href="#principles">Principles</a>
        </nav>
        <button
          className="sg-invert"
          onClick={() => setNight(!night)}
          aria-pressed={night}
          aria-label={night ? "Use white canvas" : "Use black canvas"}
        >
          <CircleHalf size={18} aria-hidden="true" />
          <span>Invert</span>
        </button>
      </header>
      <main id="main" className="sg-main">
        <section className="sg-hero" aria-labelledby="study-title">
          <div className="sg-hero-heading">
            <div className="sg-eyebrow">
              SAAS GAME UI <span>DESIGN EXPLORATION / 02</span>
            </div>
            <h1 id="study-title">
              Software.
              <br />
              With a sense
              <br />
              of <span>play.</span>
            </h1>
          </div>
          <div className="sg-hero-aside">
            <div className="sg-hero-symbol" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
            <h2>
              Simple moves.
              <br />
              Useful outcomes.
            </h2>
            <p>
              A visual language for SaaS, built around the directness of 2D
              games. Select an object. Give it an action. See what changed.
            </p>
            <a className="sg-button sg-button--primary" href="#playground">
              Try the playground <ArrowDown aria-hidden="true" size={17} />
            </a>
            <span className="sg-hero-note">
              Black + white. Inter throughout. Native controls.
            </span>
          </div>
        </section>
        <div className="sg-intro-rule">
          <span>01 — SELECT</span>
          <span>02 — PLACE</span>
          <span>03 — ACT</span>
          <span>04 — OBSERVE</span>
        </div>
        <section
          id="playground"
          className="sg-section"
          aria-labelledby="playground-title"
        >
          <div className="sg-section-heading">
            <div>
              <span className="sg-eyebrow">01 / INTERACTION</span>
              <h2 id="playground-title">Arrange. Run. Understand.</h2>
            </div>
            <p>
              Tools live in a tray. Work lives on the board.
              <br />
              Details appear when you select an object.
            </p>
          </div>
          <div className="sg-workspace sg-panel">
            <div className="sg-workspace-bar">
              <div className="sg-workspace-name">
                <SquaresFour size={20} weight="regular" aria-hidden="true" />
                <strong>{displayName}</strong>
                <span className="sg-muted">/ Automation</span>
              </div>
              <span className="sg-status">Sample data · local demo</span>
            </div>
            <div className="sg-workspace-body">
              <aside
                className="sg-tool-tray"
                aria-label="Available action tools"
              >
                <span className="sg-eyebrow">YOUR TOOLS</span>
                {order.map((step) => {
                  const item = steps[step];
                  const Icon = item.icon;
                  return (
                    <button
                      key={step}
                      className="sg-tool"
                      disabled={running || slots.includes(step)}
                      draggable={!running && !slots.includes(step)}
                      onDragStart={(event) =>
                        event.dataTransfer.setData("text/plain", step)
                      }
                      onClick={() => placeStep(step)}
                    >
                      <Icon size={22} weight="regular" aria-hidden="true" />
                      <span>
                        {item.title}
                        <small>
                          {slots.includes(step)
                            ? "On the board"
                            : "Click or drag to add"}
                        </small>
                      </span>
                      <Plus aria-hidden="true" size={14} />
                    </button>
                  );
                })}
                <p>
                  Click to add a tool. Drag placed tiles to swap their
                  positions.
                </p>
              </aside>
              <div className="sg-board">
                <div className="sg-board-caption">
                  <span className="sg-eyebrow">WORKSPACE / 3 SLOTS</span>
                  <span>{completed} / 3 checkpoints</span>
                </div>
                <div className="sg-slots">
                  {slots.map((step, index) => {
                    const item = step !== null ? steps[step] : null;
                    const Icon = item?.icon ?? Plus;
                    const finished = index < completed;
                    const active = running && index === completed;
                    const failed =
                      runState === "error" &&
                      step === "compose" &&
                      completed === 1;
                    const missing = order.find(
                      (candidate) => !slots.includes(candidate),
                    );
                    return (
                      <React.Fragment key={index}>
                        {index > 0 && (
                          <ArrowRight
                            className="sg-connector"
                            size={18}
                            aria-hidden="true"
                          />
                        )}
                        <div
                          className="sg-slot-target"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => handleDrop(event, index)}
                        >
                          <button
                            className={`sg-action-tile ${step === null ? "sg-action-tile--empty" : ""}`}
                            aria-label={
                              item !== null
                                ? `Inspect ${item.title}, slot ${index + 1}`
                                : `Add ${missing !== undefined ? steps[missing].title : "tool"} to slot ${index + 1}`
                            }
                            aria-pressed={step !== null && selected === index}
                            data-state={
                              failed
                                ? "error"
                                : finished
                                  ? "complete"
                                  : active
                                    ? "working"
                                    : "idle"
                            }
                            disabled={running}
                            draggable={step !== null && !running}
                            onDragStart={(event) => {
                              if (step !== null)
                                event.dataTransfer.setData("text/plain", step);
                            }}
                            onClick={() => {
                              if (step === null && missing !== undefined)
                                placeStep(missing, index);
                              else setSelected(index);
                            }}
                          >
                            <span className="sg-tile-number">0{index + 1}</span>
                            <Icon
                              size={30}
                              weight="regular"
                              aria-hidden="true"
                            />
                            <strong>{item?.title ?? "Place a tool"}</strong>
                            <span className="sg-tile-state">
                              {failed
                                ? "Interrupted"
                                : finished
                                  ? "Complete"
                                  : active
                                    ? "Working"
                                    : item !== null
                                      ? "Ready"
                                      : "Click to add"}
                            </span>
                          </button>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="sg-run-strip">
                  <span className="sg-run-light" data-state={runState} />
                  <p role={runState === "error" ? "alert" : "status"}>
                    {notice}
                  </p>
                </div>
              </div>
              <aside
                className="sg-inspector"
                aria-label="Selected action details"
              >
                <span className="sg-eyebrow">INSPECTOR / 0{selected + 1}</span>
                <h3>{current?.title ?? "Empty slot"}</h3>
                <p>
                  {current?.detail ??
                    "Choose a tool to define what happens here."}
                </p>
                <dl>
                  <dt>Action</dt>
                  <dd>{current?.verb ?? "Awaiting a tool"}</dd>
                  <dt>Output</dt>
                  <dd>{current?.output ?? "None yet"}</dd>
                </dl>
                <button
                  className="sg-text-link"
                  disabled={selectedStep === null || running}
                  onClick={removeStep}
                >
                  <Trash size={15} aria-hidden="true" /> Remove from board
                </button>
              </aside>
            </div>
            <div className="sg-workspace-footer">
              <label className="sg-check-label">
                <input
                  type="checkbox"
                  checked={simulateFailure}
                  disabled={running}
                  onChange={(event) => setSimulateFailure(event.target.checked)}
                />{" "}
                Include a sample interruption
              </label>
              <div className="sg-run-actions">
                {running && (
                  <button
                    className="sg-button"
                    onClick={() => {
                      setRunState("idle");
                      setCompleted(0);
                      setNotice("Sample stopped. The board is ready to edit.");
                    }}
                  >
                    Stop
                  </button>
                )}
                <button
                  className="sg-button sg-button--primary"
                  onClick={startRun}
                  disabled={running}
                >
                  <Play weight="fill" aria-hidden="true" size={16} />
                  {running
                    ? "Running sample…"
                    : runState === "error"
                      ? "Try again"
                      : runState === "complete"
                        ? "Run again"
                        : "Run sample"}
                </button>
              </div>
            </div>
          </div>
          <div className="sg-caption">
            <span>THE INTERACTION CONTRACT</span>
            <p>
              A selection reveals options. A placement changes the sequence. A
              completed step leaves a readable result. This sample uses
              predefined content; it makes no external calls.
            </p>
          </div>
        </section>

        <section
          id="components"
          className="sg-section"
          aria-labelledby="components-title"
        >
          <div className="sg-section-heading">
            <div>
              <span className="sg-eyebrow">02 / COMPONENTS</span>
              <h2 id="components-title">The everyday, redrawn.</h2>
            </div>
            <p>
              One grammar across the everyday interface.
              <br />
              Each control responds to a real interaction.
            </p>
          </div>
          <div className="sg-specimens">
            <article className="sg-specimen">
              <div className="sg-specimen-label">01 / BUTTON</div>
              <div className="sg-specimen-stage">
                <button
                  className="sg-button sg-button--primary"
                  onClick={() => setSaved(true)}
                >
                  {saved ? (
                    <Check size={18} aria-hidden="true" />
                  ) : (
                    <Plus size={18} aria-hidden="true" />
                  )}
                  {saved ? "Draft saved" : "Save draft"}
                </button>
              </div>
              <p role="status">
                {saved
                  ? `“${displayName}” saved in this page session.`
                  : "A short press. A clear, named outcome."}
              </p>
            </article>
            <article className="sg-specimen">
              <div className="sg-specimen-label">02 / INPUT</div>
              <div className="sg-specimen-stage">
                <label className="sg-input-label">
                  Routine name
                  <input
                    className="sg-input"
                    value={name}
                    maxLength={48}
                    onChange={(event) => {
                      setName(event.target.value);
                      setSaved(false);
                    }}
                  />
                </label>
              </div>
              <p>
                A clear boundary invites input. This name also updates the
                board.
              </p>
            </article>
            <article className="sg-specimen">
              <div className="sg-specimen-label">03 / CONTEXT MENU</div>
              <div className="sg-specimen-stage">
                <details className="sg-menu">
                  <summary className="sg-button">
                    Routine actions <DotsThree aria-hidden="true" size={24} />
                  </summary>
                  <div className="sg-menu-options">
                    <button
                      onClick={(event) => {
                        setName(`${displayName.slice(0, 43)} copy`);
                        setSaved(false);
                        event.currentTarget
                          .closest("details")
                          ?.removeAttribute("open");
                      }}
                    >
                      Duplicate routine
                    </button>
                    <button
                      onClick={(event) => {
                        dialog.current?.showModal();
                        event.currentTarget
                          .closest("details")
                          ?.removeAttribute("open");
                      }}
                    >
                      Inspect settings
                    </button>
                  </div>
                </details>
              </div>
              <p>Commands stay close to the object they act on.</p>
            </article>
            <article className="sg-specimen">
              <div className="sg-specimen-label">04 / SELECTABLE OBJECT</div>
              <div className="sg-specimen-stage">
                <button
                  className="sg-inventory-tile"
                  aria-pressed={tileSelected}
                  onClick={() => setTileSelected(!tileSelected)}
                >
                  <FileText aria-hidden="true" size={24} weight="regular" />
                  <span>
                    Research notes
                    <small>
                      {tileSelected ? "Selected · 6 items" : "6 items"}
                    </small>
                  </span>
                  {tileSelected && <Check size={17} aria-hidden="true" />}
                </button>
              </div>
              <p>Selection has a boundary, a label, and a next action.</p>
            </article>
            <article className="sg-specimen">
              <div className="sg-specimen-label">05 / DATA ROW</div>
              <div className="sg-specimen-stage">
                <table className="sg-table">
                  <caption className="sg-sr-only">
                    Sample sources included in a brief
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Include</th>
                      <th scope="col">Source</th>
                      <th scope="col">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr data-selected={included}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label="Include customer notes"
                          checked={included}
                          onChange={(event) =>
                            setIncluded(event.target.checked)
                          }
                        />
                      </td>
                      <th scope="row">Customer notes</th>
                      <td>{included ? "Included" : "Skipped"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>Dense information keeps its familiar structure.</p>
            </article>
            <article className="sg-specimen">
              <div className="sg-specimen-label">06 / DIALOG</div>
              <div className="sg-specimen-stage">
                <button
                  className="sg-button"
                  onClick={() => dialog.current?.showModal()}
                >
                  <GearSix aria-hidden="true" size={18} /> Open settings
                </button>
              </div>
              <p>
                A focused foreground layer. Escape returns you to your work.
              </p>
            </article>
            <article className="sg-specimen">
              <div className="sg-specimen-label">07 / PROGRESS</div>
              <div className="sg-specimen-stage sg-progress-stage">
                <div className="sg-progress-label">
                  <span>Review checklist</span>
                  <span>{checkpoint} / 3</span>
                </div>
                <progress
                  className="sg-progress"
                  aria-label="Review checklist"
                  max={3}
                  value={checkpoint}
                >
                  {checkpoint} of 3
                </progress>
                <button
                  className="sg-text-link"
                  onClick={() =>
                    setCheckpoint(checkpoint === 3 ? 0 : checkpoint + 1)
                  }
                >
                  {checkpoint === 3
                    ? "Reset checklist"
                    : "Complete a checkpoint"}{" "}
                  <ArrowRight size={15} aria-hidden="true" />
                </button>
                <span className="sg-sr-only" role="status">
                  {checkpoint} of 3 review checkpoints complete.
                </span>
              </div>
              <p>Progress counts known work, with an explicit denominator.</p>
            </article>
            <article className="sg-specimen">
              <div className="sg-specimen-label">08 / RECOVERY</div>
              <div className="sg-specimen-stage">
                <div className="sg-error-example">
                  <Warning aria-hidden="true" size={21} />
                  <span>
                    Connection interrupted
                    <small>Your draft is still here.</small>
                  </span>
                </div>
              </div>
              <p>Explain what happened, what survived, and how to continue.</p>
            </article>
          </div>
        </section>

        <section className="sg-section" aria-labelledby="states-title">
          <div className="sg-section-heading">
            <div>
              <span className="sg-eyebrow">03 / STATE</span>
              <h2 id="states-title">Meaning without color.</h2>
            </div>
            <p>
              One object across seven states.
              <br />
              Shape, line, and language carry the signal.
            </p>
          </div>
          <div className="sg-states">
            {[
              "Idle",
              "Hover",
              "Selected",
              "Working",
              "Complete",
              "Error",
              "Disabled",
            ].map((state, index) => (
              <div className="sg-state-specimen" key={state}>
                <div
                  className="sg-state-object"
                  data-example={state.toLowerCase()}
                >
                  <FileText weight="regular" size={27} aria-hidden="true" />
                  {state === "Complete" ? (
                    <Check aria-hidden="true" size={14} />
                  ) : state === "Error" ? (
                    <Warning aria-hidden="true" size={14} />
                  ) : (
                    <span className="sg-state-marker" />
                  )}
                </div>
                <strong>{state}</strong>
                <span>
                  {
                    [
                      "Available",
                      "Within reach",
                      "In focus",
                      "In progress",
                      "Result ready",
                      "Needs attention",
                      "Unavailable",
                    ][index]
                  }
                </span>
              </div>
            ))}
          </div>
        </section>

        <section
          id="principles"
          className="sg-section sg-principles"
          aria-labelledby="principles-title"
        >
          <div>
            <span className="sg-eyebrow">04 / PRINCIPLES</span>
            <h2 id="principles-title">
              Less decoration.
              <br />
              More response.
            </h2>
            <p>
              The game is in the interaction. Clear objects, direct actions, and
              visible consequences give the interface its character.
            </p>
          </div>
          <div className="sg-rule-list">
            {[
              [
                "01",
                "Give objects a job.",
                "A tile represents something a person can work with: a document, a task, a tool, or a record. Its shape suggests its role.",
              ],
              [
                "02",
                "Spend motion on meaning.",
                "Press confirms input. Lift suggests movement. Snap confirms placement. Settle confirms a handoff. Honor reduced motion.",
              ],
              [
                "03",
                "Keep a familiar way in.",
                "Every drag has a click or keyboard alternative. Forms use real inputs. Dialogs keep focus and close with Escape.",
              ],
              [
                "04",
                "Let evidence drive the state.",
                "Working, complete, and failed come from the operation itself. Unknown progress stays unknown. Results remain inspectable.",
              ],
            ].map(([number, title, description]) => (
              <article key={number}>
                <span className="sg-eyebrow">{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="typography"
          className="sg-section sg-typography"
          aria-labelledby="type-title"
        >
          <div className="sg-section-heading">
            <div>
              <span className="sg-eyebrow">05 / TYPOGRAPHY</span>
              <h2 id="type-title">One family. Clear roles.</h2>
            </div>
            <p>
              Fontjoy guided the contrast between display and reading roles. The
              final system uses Inter throughout.
            </p>
          </div>
          <div className="sg-type-grid">
            <article className="sg-type-display">
              <span className="sg-eyebrow">INTER / DISPLAY</span>
              <div className="sg-type-sample" aria-hidden="true">
                Aa
              </div>
              <h3>
                Give the idea
                <br />a little presence.
              </h3>
              <p>
                Large scale, tighter spacing, and medium weight give titles
                their presence. One family, a clear display role.
              </p>
            </article>
            <article className="sg-type-body">
              <span className="sg-eyebrow">INTER / INTERFACE</span>
              <div className="sg-type-sample" aria-hidden="true">
                Aa
              </div>
              <h3>Keep the work easy to read.</h3>
              <p>
                Regular weight, comfortable line spacing, and tabular numbers
                keep controls, descriptions, and data easy to read. Weights
                400–600.
              </p>
              <div className="sg-type-data">
                <span>Queued</span>
                <span>03 / 12</span>
                <span>00:48</span>
              </div>
            </article>
          </div>
          <div className="sg-type-credit">
            <span>
              Typography direction informed by Fontjoy. Final typeface: Inter.
            </span>
            <a
              href="https://fontjoy.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Explore Fontjoy <ArrowRight size={15} aria-hidden="true" />
            </a>
          </div>
        </section>
        <section
          id="build"
          className="sg-section sg-build"
          aria-labelledby="build-title"
        >
          <div>
            <span className="sg-eyebrow">06 / BUILD</span>
            <h2 id="build-title">A small vocabulary.</h2>
            <p>
              Flat surfaces, native controls, and a few CSS variables. Selection
              inverts the object. Focus adds an outline. Movement confirms an
              action.
            </p>
            <a
              className="sg-button"
              href="/saas-game-ui/saas-game-ui.css"
              download
            >
              Get the stylesheet <ArrowDown size={17} aria-hidden="true" />
            </a>
          </div>
          <div className="sg-code-panel">
            <div className="sg-eyebrow">THE SURFACE CONTRACT</div>
            <pre>
              <code>{`<section class="sg"
  data-mode="${night ? "night" : "day"}">
  <button class="sg-button
    sg-button--primary">
    Save draft
  </button>
</section>`}</code>
            </pre>
            <div className="sg-token-row">
              <span>1px boundaries</span>
              <span>1 typeface</span>
              <span>120ms feedback</span>
            </div>
          </div>
        </section>
      </main>
      <footer className="sg-footer">
        <a href="/" className="sg-wordmark">
          shupp.dev
        </a>
        <span>SaaS Game UI / An exploration by Erikk Shupp</span>
        <a href="/portfolio">
          All design studies <ArrowRight size={15} aria-hidden="true" />
        </a>
      </footer>

      <dialog
        ref={dialog}
        className="sg-dialog"
        aria-labelledby="settings-title"
      >
        <div className="sg-dialog-heading">
          <span className="sg-eyebrow">ROUTINE SETTINGS</span>
          <form method="dialog">
            <button className="sg-icon-button" aria-label="Close settings">
              <X size={20} aria-hidden="true" />
            </button>
          </form>
        </div>
        <h2 id="settings-title">{displayName}</h2>
        <p>This sample routine prepares a draft and stops at human review.</p>
        <dl>
          <dt>Tools placed</dt>
          <dd>{slots.filter((step) => step !== null).length} of 3</dd>
          <dt>Execution</dt>
          <dd>Predefined local sample</dd>
          <dt>Delivery</dt>
          <dd>Draft only</dd>
        </dl>
        <form method="dialog">
          <button className="sg-button sg-button--primary">
            Back to the study <ArrowRight size={17} aria-hidden="true" />
          </button>
        </form>
      </dialog>
    </div>
  );
}
