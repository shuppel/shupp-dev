import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  ArrowCounterClockwise,
  X,
} from "@phosphor-icons/react";

type Direction = "command" | "map" | "party" | "dialogue";
type Phase = 0 | 1 | 2 | 3;
type DocumentKind = "notes" | "brief";

const directions: {
  id: Direction;
  name: string;
  focus: string;
  pitch: string;
  benefit: string;
  tradeoff: string;
  patterns: string[];
}[] = [
  {
    id: "command",
    name: "Command Desk",
    focus: "Act with focus",
    pitch:
      "A familiar RPG command window puts the next useful action within reach.",
    benefit: "Fast, repeatable work. Best for tools people use every day.",
    tradeoff: "Larger workflows need a separate overview.",
    patterns: [
      "Command menu → available actions",
      "Inventory → source files",
      "Message window → action result",
    ],
  },
  {
    id: "map",
    name: "Workflow Map",
    focus: "See the sequence",
    pitch:
      "A small overworld makes the path from input to finished work visible.",
    benefit:
      "Understand order and dependencies. Best for multi-step automations.",
    tradeoff: "Large workflows need grouping to keep the map readable.",
    patterns: [
      "Locations → workflow steps",
      "Path → dependencies",
      "Current marker → active work",
    ],
  },
  {
    id: "party",
    name: "Party Console",
    focus: "Know who owns it",
    pitch: "A party roster shows each agent’s role, assignment, and handoff.",
    benefit: "Coordinate agents and people. Best for work shared across roles.",
    tradeoff: "A roster adds little when one person does everything.",
    patterns: [
      "Party → agents and people",
      "Role panel → current assignment",
      "Handoff → next responsible role",
    ],
  },
  {
    id: "dialogue",
    name: "Dialogue Review",
    focus: "Make a clear decision",
    pitch:
      "A dialogue window presents one decision with the evidence needed to make it.",
    benefit: "Confident approvals. Best for guided work and human review.",
    tradeoff: "Sequential prompts are slower for expert batch work.",
    patterns: [
      "Speaker → responsible role",
      "Dialogue → context and evidence",
      "Response → explicit decision",
    ],
  },
];
const notes = [
  "Two customers missed changes to their task status.",
  "Three customers asked for a single daily summary.",
  "The support team manually combines updates every Friday.",
  "Reviewers want to see which notes support each recommendation.",
  "The team wants to approve summaries before they are shared.",
  "A draft-only pilot is planned for next week.",
];
const brief = [
  "Combine task updates into a daily summary to make status changes easier to follow.",
  "Keep source notes alongside recommendations so reviewers can check the evidence.",
  "Pilot a draft-only summary next week, with a person reviewing every draft.",
];
const steps = [
  {
    title: "Collect notes",
    short: "Collect",
    role: "Scout",
    type: "Research agent",
    detail: "Gather the six customer notes supplied with this sample.",
    result: "6 source notes collected.",
    pending: "Collecting the sample notes…",
  },
  {
    title: "Prepare brief",
    short: "Draft",
    role: "Scribe",
    type: "Writing agent",
    detail:
      "Turn the collected notes into a short brief with three recommendations.",
    result: "1 brief prepared. Ready for your review.",
    pending: "Preparing the sample brief…",
  },
  {
    title: "Review brief",
    short: "Review",
    role: "You",
    type: "Human reviewer",
    detail: "Read the brief and mark this sample as reviewed.",
    result: "Sample reviewed. The brief stays here.",
    pending: "Recording your sample decision…",
  },
];

// Original vector sprites: decorative, sharp at integer scales, no image requests.
function Actor({
  role = 0,
  className = "",
}: {
  role?: number;
  className?: string;
}): React.JSX.Element {
  const coat = ["#6aa78f", "#cfad72", "#91a0c8"][role];
  return (
    <svg
      viewBox="0 0 24 32"
      className={`rpg-actor ${className}`}
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <path d="M5 29h14v2H5z" fill="#17263c" opacity=".2" />
      <path d="M7 23h4v7H6v-3h1zm6 0h4v4h1v3h-5z" fill="#273246" />
      <path d="M6 14h12v3h3v8h-5v-3H8v3H3v-8h3z" fill={coat} />
      <path d="M8 14h8v10H8z" fill={coat} />
      <path
        d="M3 23h4v3H3zm14 0h4v3h-4zM7 6h11v8H7zm3 8h5v3h-5z"
        fill="#e8c79d"
      />
      <path
        d="M6 3h12v3h2v6h-3V7H8v4H5V6h1z"
        fill={role === 1 ? "#7b503c" : "#343647"}
      />
      <path d="M9 9h2v2H9zm6 0h2v2h-2z" fill="#293144" />
      <path d="M11 13h3v1h-3z" fill="#a96853" />
      {role === 0 && (
        <>
          <path d="M7 1h10v2h3v3H4V3h3z" fill="#4d806f" />
          <path d="M7 5h13v2H7z" fill="#91bba2" />
          <path d="M6 16h2v8H6zm2 3h4v7H8z" fill="#997951" />
        </>
      )}
      {role === 1 && (
        <>
          <path d="M4 4h4v12H4zM16 3h3v13h-3z" fill="#7b503c" />
          <path d="M14 18h7v9h-7z" fill="#f4e8c6" />
          <path d="M14 18h2v9h-2z" fill="#667999" />
        </>
      )}
      {role === 2 && (
        <>
          <path d="M7 5h11v2H7z" fill="#566889" />
          <path d="M10 17h4v3h-4z" fill="#e8e5d5" />
          <path d="M10 20h4v4h-4z" fill="#637494" />
        </>
      )}
    </svg>
  );
}

function Landscape({
  compact = false,
}: {
  compact?: boolean;
}): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 600 300"
      className={`rpg-landscape ${compact ? "is-compact" : ""}`}
      aria-hidden="true"
      shapeRendering="crispEdges"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width="600" height="300" fill="#bfcdb1" />
      <path
        d="M0 0h600v54H480v20H360V48H220v35H100V57H0zM0 250h150v-20h105v35h125v-25h220v60H0z"
        fill="#a8bd9c"
      />
      <path
        d="M435 0h58v55h-20v65h30v75h-21v68h18v37h-64v-65h20v-48h-28v-73h20V62h-13z"
        fill="#82aaa7"
      />
      <path
        d="M452 0h8v76h-14v39h8M465 143h8v37h-12v51M454 275h26v6h-26"
        fill="none"
        stroke="#bfd5c4"
        strokeWidth="4"
      />
      <path
        d="M48 179h146v-43h150v44h198"
        stroke="#a6a382"
        strokeWidth="35"
        fill="none"
      />
      <path
        d="M48 172h146v-43h150v44h198"
        stroke="#dfd6b3"
        strokeWidth="29"
        fill="none"
      />
      <path d="M421 154h83v39h-83z" fill="#937c5b" />
      <path
        d="M423 159h79m-79 9h79m-79 9h79m-79 9h79"
        stroke="#cfb68a"
        strokeWidth="4"
      />
      {[
        [34, 33],
        [78, 20],
        [123, 39],
        [272, 34],
        [310, 24],
        [532, 40],
        [568, 64],
        [29, 218],
        [77, 246],
        [242, 248],
        [366, 238],
        [542, 238],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M12 30h7v14h-7z" fill="#8b7a58" />
          <path d="M8 0h14v8h7v9h5v14H-4V17H1V8h7z" fill="#648c72" />
          <path d="M8 0h14v8h7v9H1V8h7z" fill="#7a9e7c" />
          <path d="M1 25h28v5H1z" fill="#517b65" />
        </g>
      ))}
      {[
        [135, 221],
        [205, 50],
        [358, 100],
        [510, 102],
        [328, 256],
        [21, 114],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y}h3v6h-3zm7 3h3v6h-3z`} fill="#7e9b77" />
      ))}
      <path d="M220 178h8v5h-8zm-65-62h8v5h-8zm202 24h8v5h-8z" fill="#b1af8e" />
    </svg>
  );
}

function StepState({
  index,
  phase,
  busy,
}: {
  index: number;
  phase: Phase;
  busy: boolean;
}): React.JSX.Element {
  return (
    <span className="rpg-step-state">
      {index < phase ? (
        <>
          <Check size={13} aria-hidden="true" /> Done
        </>
      ) : index === phase ? (
        busy ? (
          "Working"
        ) : (
          "Ready"
        )
      ) : (
        "Waiting"
      )}
    </span>
  );
}

export default function SaasGameUI(): React.JSX.Element {
  const [direction, setDirection] = useState<Direction>("command");
  const [phase, setPhase] = useState<Phase>(0);
  const [selected, setSelected] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(
    "Start by collecting the six sample notes.",
  );
  const [documentKind, setDocumentKind] = useState<DocumentKind>("notes");
  const dialog = useRef<HTMLDialogElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const current =
    directions.find((item) => item.id === direction) ?? directions[0];

  useEffect(() => {
    function readDirection(): void {
      const value = new URLSearchParams(window.location.search).get(
        "direction",
      );
      setDirection(
        directions.some((item) => item.id === value)
          ? (value as Direction)
          : "command",
      );
    }
    readDirection();
    window.addEventListener("popstate", readDirection);
    return () => window.removeEventListener("popstate", readDirection);
  }, []);

  useEffect(() => {
    if (!busy || phase === 3) return;
    // Deliberately paced local sample; this is not a backend progress estimate.
    const timer = window.setTimeout(() => {
      const next = (phase + 1) as Phase;
      setNotice(steps[phase].result);
      setPhase(next);
      setSelected(Math.min(next, 2));
      setBusy(false);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [busy, phase]);

  function chooseDirection(value: Direction): void {
    setDirection(value);
    const url = new URL(window.location.href);
    url.searchParams.set("direction", value);
    window.history.pushState({}, "", url);
  }
  function handleTabKey(
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ): void {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % directions.length;
    else if (event.key === "ArrowLeft")
      next = (index + directions.length - 1) % directions.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = directions.length - 1;
    else return;
    event.preventDefault();
    chooseDirection(directions[next].id);
    tabs.current[next]?.focus();
  }
  function advance(): void {
    if (busy || phase === 3) return;
    setSelected(phase);
    setBusy(true);
    setNotice(steps[phase].pending);
  }
  function reset(): void {
    setBusy(false);
    setPhase(0);
    setSelected(0);
    setNotice("Sample reset. Collect the notes to begin again.");
  }
  function stop(): void {
    setBusy(false);
    setNotice("Paused. Completed work is kept; continue when you’re ready.");
  }
  function openDocument(kind: DocumentKind): void {
    setDocumentKind(kind);
    dialog.current?.showModal();
  }
  function action(index: number = phase): React.JSX.Element {
    if (phase === 3)
      return (
        <button className="rpg-action" onClick={() => openDocument("brief")}>
          <FileText size={17} aria-hidden="true" /> Read reviewed brief
        </button>
      );
    if (busy)
      return (
        <button className="rpg-action rpg-action--secondary" onClick={stop}>
          Pause sample
        </button>
      );
    const available = index === phase;
    return (
      <button className="rpg-action" onClick={advance} disabled={!available}>
        <span aria-hidden="true">▸</span>
        {available
          ? phase === 2
            ? "Mark sample reviewed"
            : steps[phase].title
          : index < phase
            ? "Step complete"
            : `Complete ${steps[phase].short.toLowerCase()} first`}
      </button>
    );
  }
  function sourceLink(): React.JSX.Element {
    return (
      <button className="rpg-text-button" onClick={() => openDocument("notes")}>
        <FileText size={15} aria-hidden="true" /> View 6 source notes
      </button>
    );
  }
  function resultContent(): React.JSX.Element {
    return (
      <div className="rpg-result-content">
        <span className="rpg-kicker">
          {phase >= 2 ? "OUTPUT / WEEKLY BRIEF" : "INPUT / CUSTOMER RESEARCH"}
        </span>
        <h3>
          {phase >= 2
            ? "Three useful next steps."
            : "Good work starts with context."}
        </h3>
        {phase >= 2 ? (
          <ol className="rpg-brief-list">
            {brief.map((line, index) => (
              <li key={line}>
                <span>0{index + 1}</span>
                {line}
              </li>
            ))}
          </ol>
        ) : (
          <>
            <p>
              Six customer notes. One short brief. A person reviews the result.
            </p>
            <div className="rpg-note-stack" aria-hidden="true">
              <div />
              <div />
              <div>
                <FileText size={32} weight="light" />
                <span>Customer notes</span>
                <small>6 items</small>
              </div>
            </div>
          </>
        )}
        {sourceLink()}
      </div>
    );
  }

  return (
    <div className="rpg-study">
      <a className="rpg-skip" href="#main">
        Skip to design options
      </a>
      <header className="rpg-site-header">
        <a className="rpg-wordmark" href="/">
          shupp.dev<span> / design studies</span>
        </a>
        <a href="/portfolio">
          <ArrowLeft size={14} aria-hidden="true" /> All studies
        </a>
      </header>
      <main id="main" className="rpg-main">
        <div className="rpg-intro">
          <div>
            <span className="rpg-kicker">
              SAAS GAME UI · DESIGN EXPLORATION
            </span>
            <h1>
              The spirit of an RPG.
              <br />
              <span>The clarity of a work tool.</span>
            </h1>
          </div>
          <p>
            A design system inspired by 90s Japanese RPGs.
            <br className="rpg-desktop-break" /> Four directions. One real-world
            task.
            <br />
            <strong>Choose an approach to try it.</strong>
          </p>
        </div>
        <div
          className="rpg-options"
          role="tablist"
          aria-label="Design approaches"
        >
          {directions.map((item, index) => (
            <button
              key={item.id}
              id={`tab-${item.id}`}
              role="tab"
              aria-selected={direction === item.id}
              aria-controls="direction-preview"
              tabIndex={direction === item.id ? 0 : -1}
              ref={(el) => {
                tabs.current[index] = el;
              }}
              onKeyDown={(event) => handleTabKey(event, index)}
              onClick={() => chooseDirection(item.id)}
              data-direction={item.id}
            >
              <span className="rpg-option-number">0{index + 1}</span>
              <span
                className={`rpg-mini rpg-mini--${item.id}`}
                aria-hidden="true"
              >
                <i />
                <i />
                <i />
              </span>
              <strong>{item.name}</strong>
              <span>{item.focus}</span>
              <Check
                className="rpg-option-check"
                size={16}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
        <section
          id="direction-preview"
          className="rpg-preview"
          role="tabpanel"
          aria-labelledby={`tab-${direction}`}
          tabIndex={0}
        >
          <div className="rpg-direction-intro">
            <div>
              <span className="rpg-kicker">THE APPROACH</span>
              <h2>{current.name}</h2>
            </div>
            <p>{current.pitch}</p>
          </div>
          <div
            className={`rpg-game rpg-game--${direction}`}
            data-direction={direction}
          >
            <div className="rpg-game-bar">
              <div>
                <span className="rpg-diamond" aria-hidden="true" />
                <strong>Weekly brief</strong>
                <span className="rpg-sample-label">Sample data</span>
              </div>
              <button onClick={reset} className="rpg-reset">
                <ArrowCounterClockwise size={14} aria-hidden="true" /> Reset
                sample
              </button>
            </div>
            {direction === "command" && (
              <div className="rpg-command-layout">
                <div className="rpg-command-scene">
                  <Landscape compact />
                  <div className="rpg-scene-actors">
                    <Actor role={0} />
                    <Actor role={1} />
                    <Actor role={2} />
                  </div>
                  <div className="rpg-location">
                    <span aria-hidden="true">◆</span> Research camp
                  </div>
                </div>
                <div className="rpg-window rpg-command-inventory">
                  {resultContent()}
                </div>
                <aside className="rpg-window rpg-commands">
                  <span className="rpg-kicker">COMMAND</span>
                  <div className="rpg-command-list">
                    {steps.map((step, index) => (
                      <button
                        key={step.short}
                        aria-pressed={selected === index}
                        onClick={() => setSelected(index)}
                      >
                        <span className="rpg-cursor" aria-hidden="true">
                          ▸
                        </span>
                        <span>{step.title}</span>
                        <StepState index={index} phase={phase} busy={busy} />
                      </button>
                    ))}
                  </div>
                  <div className="rpg-command-description">
                    <p>{steps[selected].detail}</p>
                    {selected === 2 && phase >= 2 && (
                      <button
                        className="rpg-text-button"
                        onClick={() => openDocument("brief")}
                      >
                        Read the brief <ArrowRight size={14} />
                      </button>
                    )}
                    {action(selected)}
                  </div>
                </aside>
              </div>
            )}
            {direction === "map" && (
              <div className="rpg-map-layout">
                <div className="rpg-map-surface">
                  <Landscape />
                  <span className="rpg-map-label">RESEARCH ROUTE</span>
                  <div className="rpg-map-nodes">
                    {steps.map((step, index) => (
                      <button
                        className={`rpg-map-node rpg-map-node--${index}`}
                        key={step.short}
                        aria-pressed={selected === index}
                        onClick={() => setSelected(index)}
                      >
                        <span className="rpg-map-building" aria-hidden="true">
                          <span>
                            {index === 0 ? "▤" : index === 1 ? "✎" : "✓"}
                          </span>
                        </span>
                        <strong>
                          0{index + 1} · {step.short}
                        </strong>
                        <StepState index={index} phase={phase} busy={busy} />
                        {index === Math.min(phase, 2) && (
                          <Actor role={index} className="rpg-map-traveler" />
                        )}
                      </button>
                    ))}
                  </div>
                  <span className="rpg-map-legend">
                    <span aria-hidden="true">◆</span> Select a location to
                    inspect its task.
                  </span>
                </div>
                <aside className="rpg-window rpg-map-inspector">
                  <span className="rpg-kicker">LOCATION 0{selected + 1}</span>
                  <Actor role={selected} />
                  <h3>{steps[selected].title}</h3>
                  <p>{steps[selected].detail}</p>
                  <span className="rpg-owner">
                    Assigned to {steps[selected].role}
                  </span>
                  {selected === 2 && phase >= 2 && (
                    <button
                      className="rpg-text-button"
                      onClick={() => openDocument("brief")}
                    >
                      Read the brief <ArrowRight size={14} />
                    </button>
                  )}
                  {action(selected)}
                  {sourceLink()}
                </aside>
              </div>
            )}
            {direction === "party" && (
              <div className="rpg-party-layout">
                <aside className="rpg-window rpg-roster">
                  <span className="rpg-kicker">YOUR PARTY</span>
                  {steps.map((step, index) => (
                    <button
                      key={step.role}
                      className="rpg-party-member"
                      aria-pressed={selected === index}
                      onClick={() => setSelected(index)}
                    >
                      <Actor role={index} />
                      <span>
                        <strong>{step.role}</strong>
                        <small>{step.type}</small>
                        <StepState index={index} phase={phase} busy={busy} />
                      </span>
                      <span className="rpg-cursor" aria-hidden="true">
                        ◂
                      </span>
                    </button>
                  ))}
                </aside>
                <div className="rpg-window rpg-assignment">
                  <div className="rpg-assignment-heading">
                    <div>
                      <span className="rpg-kicker">
                        {steps[selected].role.toUpperCase()} / ASSIGNMENT
                      </span>
                      <h3>{steps[selected].title}</h3>
                    </div>
                    <Actor role={selected} />
                  </div>
                  <p>{steps[selected].detail}</p>
                  <div className="rpg-handoff">
                    <span>
                      Receives
                      <strong>
                        {selected === 0
                          ? "6 customer notes"
                          : selected === 1
                            ? "Collected source notes"
                            : "1 draft brief"}
                      </strong>
                    </span>
                    <ArrowRight size={20} aria-hidden="true" />
                    <span>
                      Hands off
                      <strong>
                        {selected === 0
                          ? "Sources to Scribe"
                          : selected === 1
                            ? "Draft to you"
                            : "Reviewed brief"}
                      </strong>
                    </span>
                  </div>
                  <div className="rpg-assignment-bottom">
                    {action(selected)}
                    {selected === 2 && phase >= 2 ? (
                      <button
                        className="rpg-text-button"
                        onClick={() => openDocument("brief")}
                      >
                        Read the brief <ArrowRight size={14} />
                      </button>
                    ) : (
                      sourceLink()
                    )}
                  </div>
                </div>
                <div className="rpg-party-summary">
                  <span className="rpg-kicker">TEAM PROGRESS</span>
                  <progress
                    max={3}
                    value={phase}
                    aria-label="Completed workflow steps"
                  />
                  <span>{phase} of 3 steps complete</span>
                </div>
              </div>
            )}
            {direction === "dialogue" && (
              <div className="rpg-dialogue-layout">
                <div className="rpg-dialogue-scene">
                  <div className="rpg-dialogue-location">
                    <span className="rpg-kicker">THE REVIEW ROOM</span>
                    <span>One decision at a time.</span>
                  </div>
                  <div className="rpg-room-art" aria-hidden="true">
                    <div className="rpg-room-window">
                      <span />
                    </div>
                    <div className="rpg-room-plant" />
                    <div className="rpg-room-desk" />
                    <Actor role={Math.min(phase, 2)} />
                  </div>
                  <span className="rpg-speaker-tag">
                    {steps[Math.min(phase, 2)].role}
                    <small>{steps[Math.min(phase, 2)].type}</small>
                  </span>
                </div>
                <div className="rpg-window rpg-dialogue-window">
                  <span className="rpg-kicker">
                    {phase === 3 ? "REVIEW COMPLETE" : `STEP ${phase + 1} OF 3`}
                  </span>
                  <h3>
                    {
                      [
                        "Shall we gather the source notes?",
                        "The notes are ready. Prepare a brief?",
                        "Here’s the brief. Does it reflect the notes?",
                        "Reviewed. Ready for your next step.",
                      ][phase]
                    }
                  </h3>
                  {phase < 2 ? (
                    <p>
                      {phase === 0
                        ? "I’ll collect the six supplied notes so we have a shared starting point."
                        : "I’ll turn these notes into three recommendations. You’ll review the result."}
                    </p>
                  ) : (
                    <ul className="rpg-dialogue-brief">
                      {brief.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  )}
                  <div className="rpg-dialogue-actions">
                    {action()}
                    {sourceLink()}
                  </div>
                </div>
              </div>
            )}
            <div className="rpg-message">
              <span className="rpg-message-mark" aria-hidden="true">
                {phase === 3 ? <Check size={17} /> : "▸"}
              </span>
              <p role="status" aria-live="polite">
                {notice}
              </p>
              <span
                className="rpg-progress-count"
                aria-label={`${phase} of 3 steps complete`}
              >
                {phase} / 3
              </span>
            </div>
          </div>
          <div className="rpg-approach-notes">
            <div>
              <span className="rpg-kicker">WHAT IT ACCOMPLISHES</span>
              <p>{current.benefit}</p>
            </div>
            <div>
              <span className="rpg-kicker">THE TRADE-OFF</span>
              <p>{current.tradeoff}</p>
            </div>
          </div>
        </section>
        <details className="rpg-details">
          <summary>
            How this becomes a design system <PlusMark />
          </summary>
          <div className="rpg-details-content">
            <div>
              <h3>Patterns with a purpose.</h3>
              <ul>
                {current.patterns.map((pattern) => (
                  <li key={pattern}>{pattern}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Modern rules, shared by all four.</h3>
              <p>
                Readable Inter typography. Native keyboard controls. Clear
                status labels. One primary action. Progress tied to completed
                work.
              </p>
              <p className="rpg-technical-note">
                This local sample uses predefined notes and results. Changing
                the view keeps progress. Reset starts again.{" "}
                <a href="/saas-game-ui/saas-game-ui.css">View the CSS</a>.
              </p>
            </div>
          </div>
        </details>
        <footer className="rpg-footer">
          <span>
            Four directions for review. One will become the full system.
          </span>
          <span>shupp.dev / SaaS Game UI</span>
        </footer>
      </main>
      <dialog
        ref={dialog}
        className="rpg-document-dialog"
        aria-labelledby="document-title"
      >
        <div className="rpg-document-header">
          <span className="rpg-kicker">SAMPLE DOCUMENT</span>
          <form method="dialog">
            <button aria-label="Close document">
              <X size={20} />
            </button>
          </form>
        </div>
        <h2 id="document-title">
          {documentKind === "notes" ? "Customer notes" : "Weekly brief"}
        </h2>
        {documentKind === "notes" ? (
          <ol className="rpg-source-list">
            {notes.map((line, index) => (
              <li key={line}>
                <span>NOTE 0{index + 1}</span>
                {line}
              </li>
            ))}
          </ol>
        ) : (
          <>
            <p className="rpg-document-status">
              {phase === 3
                ? "Reviewed in this sample"
                : "Draft · awaiting your review"}
            </p>
            <ol className="rpg-source-list">
              {brief.map((line, index) => (
                <li key={line}>
                  <span>RECOMMENDATION 0{index + 1}</span>
                  {line}
                  <small>
                    Source notes{" "}
                    {index === 0 ? "01, 02, 03" : index === 1 ? "04" : "05, 06"}
                  </small>
                </li>
              ))}
            </ol>
          </>
        )}
        <div className="rpg-document-actions">
          <form method="dialog">
            <button className="rpg-action">
              Back to the sample <ArrowRight size={16} />
            </button>
          </form>
          {phase >= 2 && (
            <button
              className="rpg-text-button"
              onClick={() =>
                setDocumentKind(documentKind === "notes" ? "brief" : "notes")
              }
            >
              {documentKind === "notes" ? "View brief" : "View source notes"}
            </button>
          )}
        </div>
      </dialog>
    </div>
  );
}
function PlusMark(): React.JSX.Element {
  return <span aria-hidden="true">+</span>;
}
