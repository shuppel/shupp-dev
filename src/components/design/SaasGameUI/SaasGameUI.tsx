import React, { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  DotsThree,
  FileText,
  GearSix,
  Moon,
  Play,
  Plus,
  SquaresFour,
  Sun,
  Trash,
  Warning,
  X,
} from "@phosphor-icons/react";

type Treatment = "toybox" | "cartridge" | "tactics";
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
const treatments: { id: Treatment; title: string; detail: string }[] = [
  {
    id: "toybox",
    title: "Toybox",
    detail: "Warm surfaces. Soft corners. Objects with a little weight.",
  },
  {
    id: "cartridge",
    title: "Cartridge",
    detail: "Square edges. A compact palette. Deliberate, stepped movement.",
  },
  {
    id: "tactics",
    title: "Tactics",
    detail: "Precise outlines. Quiet depth. Clear selection and commands.",
  },
];

export default function SaasGameUI(): React.JSX.Element {
  const [treatment, setTreatment] = useState<Treatment>("toybox");
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
  const activeTreatment =
    treatments.find((item) => item.id === treatment) ?? treatments[0];
  const displayName = name.trim() || "Untitled routine";

  useEffect(() => {
    setNight(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

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
    <div
      className="sg sg-study"
      data-treatment={treatment}
      data-mode={night ? "night" : "day"}
    >
      <a className="sg-skip" href="#main">
        Skip to design study
      </a>
      <header className="sg-header">
        <a href="/" className="sg-wordmark">
          shupp<span>.dev</span>
        </a>
        <a href="/portfolio" className="sg-back">
          <ArrowLeft aria-hidden="true" size={15} /> Design studies
        </a>
        <span className="sg-edition">EXPLORATION / 01</span>
        <button
          className="sg-icon-button"
          onClick={() => setNight(!night)}
          aria-label={night ? "Use day colors" : "Use night colors"}
        >
          {night ? (
            <Sun aria-hidden="true" size={20} />
          ) : (
            <Moon aria-hidden="true" size={20} />
          )}
        </button>
      </header>

      <main id="main" className="sg-main">
        <section className="sg-hero" aria-labelledby="study-title">
          <div className="sg-hero-copy">
            <div className="sg-eyebrow">
              <span className="sg-dot" /> SAAS GAME UI / A DESIGN LANGUAGE
            </div>
            <h1 id="study-title">
              Serious tools.
              <br />
              <span>A playful surface.</span>
            </h1>
            <p className="sg-lead">
              Borrow the clarity, tactility, and small satisfactions of 2D
              games. Give everyday software something you can pick up, place,
              and put to work.
            </p>
            <div className="sg-hero-actions">
              <a className="sg-button sg-button--primary" href="#playground">
                Enter the playground <ArrowDown aria-hidden="true" size={18} />
              </a>
              <a className="sg-text-link" href="#components">
                Explore the components{" "}
                <ArrowRight aria-hidden="true" size={17} />
              </a>
            </div>
          </div>
          <div
            className="sg-cover"
            aria-label="An action tile selected from a tray, illustrating the design language"
          >
            <div className="sg-cover-grid" />
            <span className="sg-cover-label sg-eyebrow">
              OBJECTS YOU CAN WORK WITH
            </span>
            <div className="sg-cover-tray">
              <span />
              <span />
              <span />
            </div>
            <div className="sg-cover-tile">
              <div className="sg-cover-icon">
                <SquaresFour weight="duotone" size={48} aria-hidden="true" />
              </div>
              <span className="sg-eyebrow">ACTION / 01</span>
              <strong>
                Make it
                <br />
                happen.
              </strong>
              <div>
                <span className="sg-status">Ready</span>
                <ArrowRight size={22} aria-hidden="true" />
              </div>
            </div>
            <span className="sg-cover-note">Select. Place. Inspect.</span>
            <span className="sg-cover-cross" aria-hidden="true">
              +
            </span>
          </div>
        </section>

        <section className="sg-treatment-bar" aria-label="Visual treatment">
          <div>
            <span className="sg-eyebrow">CHOOSE YOUR MATERIAL</span>
            <p>{activeTreatment.detail}</p>
          </div>
          <div className="sg-segmented">
            {treatments.map((item) => (
              <button
                key={item.id}
                aria-pressed={item.id === treatment}
                onClick={() => setTreatment(item.id)}
              >
                <span
                  className={`sg-treatment-dot sg-treatment-dot--${item.id}`}
                />
                {item.title}
              </button>
            ))}
          </div>
        </section>

        <section
          id="playground"
          className="sg-section"
          aria-labelledby="playground-title"
        >
          <div className="sg-section-heading">
            <div>
              <span className="sg-eyebrow">01 / THE PLAYING FIELD</span>
              <h2 id="playground-title">A workflow you can handle.</h2>
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
                <SquaresFour size={20} weight="duotone" aria-hidden="true" />
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
                      <Icon size={22} weight="duotone" aria-hidden="true" />
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
                              weight="duotone"
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
              <span className="sg-eyebrow">02 / THE COMPONENT KIT</span>
              <h2 id="components-title">Small parts. A consistent feel.</h2>
            </div>
            <p>
              One grammar across the everyday interface.
              <br />
              Try the controls. Change the material above.
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
                Recessed surfaces invite input. This name also updates the
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
                  <FileText aria-hidden="true" size={24} weight="duotone" />
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
                <progress className="sg-progress" aria-label="Review checklist" max={3} value={checkpoint}>
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
              <span className="sg-eyebrow">03 / A VOCABULARY OF STATES</span>
              <h2 id="states-title">You can see what happens next.</h2>
            </div>
            <p>
              One object across seven states.
              <br />
              Color always travels with a label or shape.
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
                  <FileText weight="duotone" size={27} aria-hidden="true" />
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
          className="sg-section sg-principles"
          aria-labelledby="principles-title"
        >
          <div>
            <span className="sg-eyebrow">04 / THE RULES OF PLAY</span>
            <h2 id="principles-title">
              Make the work
              <br />
              feel tangible.
            </h2>
            <p>
              Use space to create calm. Use detail to reward attention. Let the
              useful action be the satisfying action.
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
          id="build"
          className="sg-section sg-build"
          aria-labelledby="build-title"
        >
          <div>
            <span className="sg-eyebrow">05 / THE STARTING MATERIAL</span>
            <h2 id="build-title">Simple enough to build.</h2>
            <p>
              Flat color. Two-dimensional geometry. Native controls. The same
              components work across all three treatments, with CSS variables
              defining their material.
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
            <div className="sg-eyebrow">A SMALL SURFACE API</div>
            <pre>
              <code>{`<section class="sg"\n  data-treatment="${treatment}"\n  data-mode="${night ? "night" : "day"}">\n  <button class="sg-button\n    sg-button--primary">\n    Save draft\n  </button>\n</section>`}</code>
            </pre>
            <div className="sg-token-row">
              <span>8px spacing base</span>
              <span>3 depth levels</span>
              <span>120–240ms feedback</span>
            </div>
          </div>
        </section>
      </main>
      <footer className="sg-footer">
        <a className="sg-wordmark" href="/">
          shupp<span>.dev</span>
        </a>
        <span>SaaS Game UI · A design study by Erikk Shupp</span>
        <nav aria-label="Other design studies">
          <a href="/design/prismatic">PRISM</a>
          <a href="/design/void">VOID</a>
          <a href="/portfolio">
            All work <ArrowRight size={14} aria-hidden="true" />
          </a>
        </nav>
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
