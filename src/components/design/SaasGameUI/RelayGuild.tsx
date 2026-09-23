import React, { useEffect, useRef, useState } from "react";
import { Person } from "./WorldArtwork";
import GameMenu from "./GameMenu";
import {
  advanceGuild,
  artifactNames,
  assignOrder,
  controlUnit,
  freshGuild,
  latestItem,
  orderNames,
  stations,
  unitCommands,
  validTarget,
  type OrderKind,
  type StationId,
  type UnitId,
} from "./relayEngine";

const appearances = {
  scout: "operator",
  author: "implementer",
  reviewer: "verifier",
} as const;
export default function RelayGuild(): React.JSX.Element {
  const [state, setState] = useState(freshGuild),
    [selected, setSelected] = useState<UnitId>("scout");
  const [command, setCommand] = useState<OrderKind | null>(null),
    [target, setTarget] = useState<UnitId | StationId | null>(null);
  const [auto, setAuto] = useState(false),
    [menu, setMenu] = useState(false),
    [tab, setTab] = useState<"orders" | "context" | "log">("orders");
  const [notice, setNotice] = useState(
    "Select Sora. Choose Research, then target the Archive.",
  );
  const resetDialog = useRef<HTMLDialogElement>(null);
  const unit = state.units.find((u) => u.id === selected) ?? state.units[0];
  useEffect(() => {
    if (!auto || menu || state.won) return;
    const id = window.setInterval(() => {
      if (!document.hidden) setState(advanceGuild);
    }, 600);
    return () => clearInterval(id);
  }, [auto, menu, state.won]);
  function choose(id: UnitId): void {
    setSelected(id);
    setCommand(null);
    setTarget(null);
    setTab("orders");
  }
  function chooseTarget(id: UnitId | StationId): void {
    if (command === null) {
      if (state.units.some((u) => u.id === id)) choose(id as UnitId);
      else setNotice("Select a party member and choose an order first.");
      return;
    }
    if (!validTarget(state, selected, command, id)) {
      setNotice(
        command === "handoff"
          ? "Target another party member to receive the artifact."
          : "That destination does not support this command. Choose the highlighted station.",
      );
      return;
    }
    setTarget(id);
    setNotice(
      `${orderNames[command]} → ${stations.find((n) => n.id === id)?.name ?? state.units.find((u) => u.id === id)?.name ?? id}. Confirm to queue the order.`,
    );
  }
  function confirm(): void {
    if (command === null || target === null) return;
    setState((s) => assignOrder(s, selected, command, target));
    setNotice(
      "Order queued. Advance a turn or start Auto run. Other party members can work at the same time.",
    );
    setCommand(null);
    setTarget(null);
  }
  const scout = state.units[0],
    author = state.units[1],
    reviewer = state.units[2];
  const step = state.won
    ? "Mission complete. A reviewed brief reached the gate."
    : reviewer.items.some((a) => a.kind === "approved")
      ? "Aki: deliver the approved brief to the gate."
      : reviewer.items.some((a) => a.kind === "draft")
        ? "Aki: review the draft at the tower."
        : author.items.some((a) => a.kind === "draft")
          ? "Ren: hand the draft to Aki."
          : author.items.some((a) => a.kind === "facts")
            ? "Ren: write a brief at the writing desk."
            : scout.items.some((a) => a.kind === "facts")
              ? "Sora: hand the source notes to Ren."
              : "Sora: research at the Archive.";
  const percent = (n: number, axis: "x" | "y"): number =>
    axis === "x" ? ((n + 0.5) / 9) * 100 : ((n + 0.5) / 6) * 100;
  return (
    <div
      className="g-page"
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).closest("dialog") !== null) return;
        if (e.key === "Escape" && command !== null) {
          e.preventDefault();
          setCommand(null);
          setTarget(null);
          setNotice("Targeting cancelled.");
        }
      }}
    >
      <header className="g-site">
        <a href="/design/saas-game-ui">← Design system</a>
        <span>03 / Agent coordination</span>
        <GameMenu onOpenChange={setMenu} />
      </header>
      <main className="g-shell">
        <header className="g-game-title">
          <div>
            <span className="g-eyebrow">A party is a workflow</span>
            <h1>Relay Guild</h1>
          </div>
          <div className="g-clock">
            <b>Turn {state.turn}</b>
            <span>Every turn advances all active agents</span>
          </div>
        </header>
        <div className="g-toolbar">
          <p>{step}</p>
          <div className="g-button-row">
            <button onClick={() => setState(advanceGuild)} disabled={state.won}>
              Advance turn
            </button>
            <button
              className="g-primary"
              onClick={() => setAuto(!auto)}
              disabled={state.won}
            >
              {auto && !state.won ? "Pause auto" : "Auto run"}
            </button>
          </div>
        </div>
        <div className="g-play-layout">
          <section className="g-relay-world" aria-label="Tactical agent board">
            <div className="g-mission">
              <span className="g-eyebrow">Guild request 003</span>
              <h2>Deliver a morning brief.</h2>
              <p>Two sources. One proposal. Independent review.</p>
            </div>
            <div className="g-board" data-targeting={command !== null}>
              <div className="g-board-grid" aria-hidden="true">
                {Array.from({ length: 54 }, (_, i) => (
                  <span key={i} />
                ))}
              </div>
              <svg
                className="g-relay-paths"
                viewBox="0 0 900 600"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {state.units
                  .filter((u) => u.order !== null)
                  .map((u) => {
                    const point =
                      stations.find((n) => n.id === u.order?.target) ??
                      state.units.find((a) => a.id === u.order?.target);
                    return point ? (
                      <path
                        key={u.id}
                        d={`M${percent(u.x, "x") * 9} ${percent(u.y, "y") * 6}L${percent(point.x, "x") * 9} ${percent(point.y, "y") * 6}`}
                        stroke={u.paused ? "#819092" : "#e6c786"}
                      />
                    ) : null;
                  })}
              </svg>
              {stations.map((station) => (
                <button
                  key={station.id}
                  className="g-relay-station"
                  data-station={station.id}
                  data-valid={
                    command !== null &&
                    validTarget(state, selected, command, station.id)
                  }
                  aria-label={`Target ${station.name}`}
                  aria-pressed={target === station.id}
                  style={{
                    left: `${percent(station.x, "x")}%`,
                    top: `${percent(station.y, "y")}%`,
                  }}
                  onClick={() => chooseTarget(station.id)}
                >
                  <span>{station.glyph}</span>
                  <b>{station.name}</b>
                </button>
              ))}
              {state.units.map((u) => (
                <button
                  key={u.id}
                  className="g-relay-unit"
                  data-unit={u.id}
                  data-valid={
                    command === "handoff" &&
                    validTarget(state, selected, command, u.id)
                  }
                  data-paused={u.paused}
                  aria-label={`Select ${u.name}`}
                  aria-pressed={
                    command === "handoff" ? target === u.id : selected === u.id
                  }
                  style={{
                    left: `${percent(u.x + (state.units.some((other) => other.id !== u.id && other.x === u.x && Math.abs(other.y - u.y) <= 1) ? (u.id === "author" ? 0.4 : -0.4) : stations.some((station) => station.x === u.x && station.y === u.y) ? 0.4 : 0), "x")}%`,
                    top: `${percent(u.y, "y")}%`,
                    zIndex: 10 + u.y,
                  }}
                  onClick={() => chooseTarget(u.id)}
                >
                  <Person
                    kind={appearances[u.id]}
                    walking={
                      u.order !== null &&
                      !u.paused &&
                      !menu &&
                      auto &&
                      (u.status.startsWith("Moving") ||
                        u.status.startsWith("Carrying"))
                    }
                    carrying={u.items.length > 0}
                  />
                  <span>
                    {u.name}
                    <small>
                      {u.paused
                        ? "Paused"
                        : u.status.startsWith("Waiting")
                          ? "Waiting"
                          : u.order !== null
                            ? "On task"
                            : "Ready"}
                    </small>
                  </span>
                  {u.items.length > 0 && (
                    <i
                      title={
                        latestItem(u)
                          ? artifactNames[latestItem(u)?.kind ?? "facts"]
                          : "Context"
                      }
                    >
                      ▤
                    </i>
                  )}
                </button>
              ))}
            </div>
            <div className="g-party">
              {state.units.map((u) => (
                <button
                  key={u.id}
                  aria-pressed={selected === u.id}
                  onClick={() =>
                    command === "handoff" ? chooseTarget(u.id) : choose(u.id)
                  }
                >
                  <span className={`g-party-dot g-${u.id}`} />
                  <span>
                    <b>{u.name}</b>
                    <small>{u.role}</small>
                  </span>
                  <span>{u.paused ? "Ⅱ" : u.items.length > 0 ? "▤" : "◇"}</span>
                </button>
              ))}
            </div>
          </section>
          <aside className="g-inspector" aria-label="Agent command panel">
            <div className="g-inspector-heading">
              <div className="g-agent-portrait">
                <Person kind={appearances[unit.id]} />
              </div>
              <div>
                <span className="g-eyebrow">{unit.role}</span>
                <h2>{unit.name}</h2>
                <p>{unit.paused ? "Paused" : unit.status}</p>
              </div>
            </div>
            <div className="g-tabs" aria-label="Agent views">
              {(["orders", "context", "log"] as const).map((t) => (
                <button
                  key={t}
                  aria-pressed={tab === t}
                  onClick={() => setTab(t)}
                >
                  {t === "orders"
                    ? "Commands"
                    : t === "context"
                      ? "Context"
                      : "Run log"}
                </button>
              ))}
            </div>
            <div className="g-inspector-content">
              {tab === "orders" &&
                (state.won ? (
                  <div className="g-complete">
                    <span>✧</span>
                    <h2>Delivered with evidence.</h2>
                    <p>
                      Three party members turned two sources into a reviewed
                      brief.
                    </p>
                    <button onClick={() => setTab("context")}>
                      Inspect the result
                    </button>
                  </div>
                ) : command !== null ? (
                  <div className="g-order-target">
                    <span className="g-eyebrow">
                      {unit.name} → {orderNames[command]}
                    </span>
                    <h3>
                      {target === null ? "Choose a target." : "Ready to queue."}
                    </h3>
                    <p>
                      {command === "handoff"
                        ? `Share ${latestItem(unit) ? artifactNames[latestItem(unit)?.kind ?? "facts"] : "context"} with another agent. The sender keeps a reference.`
                        : "Select the highlighted station in the field. The agent will walk there and perform its command."}
                    </p>
                    <div className="g-button-row">
                      {command === "handoff"
                        ? state.units
                            .filter((u) => u.id !== selected)
                            .map((u) => (
                              <button
                                key={u.id}
                                onClick={() => chooseTarget(u.id)}
                                aria-pressed={target === u.id}
                              >
                                Target {u.name}
                              </button>
                            ))
                        : stations
                            .filter((n) => n.command === command)
                            .map((n) => (
                              <button
                                key={n.id}
                                onClick={() => chooseTarget(n.id)}
                                aria-pressed={target === n.id}
                              >
                                Target {n.name}
                              </button>
                            ))}
                    </div>
                    <button
                      className="g-primary"
                      disabled={target === null}
                      onClick={confirm}
                    >
                      Confirm order
                    </button>
                    <button
                      onClick={() => {
                        setCommand(null);
                        setTarget(null);
                      }}
                    >
                      Cancel targeting
                    </button>
                  </div>
                ) : unit.order !== null ? (
                  <>
                    <div className="g-status">
                      {unit.paused ? "Order paused" : unit.status}
                    </div>
                    <p>
                      {orderNames[unit.order.kind]} →{" "}
                      {stations.find((n) => n.id === unit.order?.target)
                        ?.name ??
                        state.units.find((u) => u.id === unit.order?.target)
                          ?.name}
                    </p>
                    <p className="g-small">
                      An agent waits at its destination until the required
                      context arrives. Handoff resumes it automatically.
                    </p>
                    <div className="g-button-row">
                      <button
                        onClick={() =>
                          setState((s) => controlUnit(s, selected, "pause"))
                        }
                      >
                        {unit.paused ? "Resume order" : "Pause order"}
                      </button>
                      <button
                        onClick={() =>
                          setState((s) => controlUnit(s, selected, "cancel"))
                        }
                      >
                        Cancel order
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="g-small">
                      Choose a command, target its destination, then advance
                      time. You can queue the other agents before their inputs
                      arrive.
                    </p>
                    {unitCommands[selected].map((kind) => (
                      <button
                        className="g-command"
                        key={kind}
                        disabled={kind === "handoff" && unit.items.length === 0}
                        onClick={() => {
                          setCommand(kind);
                          setTarget(null);
                          setNotice(`Choose a target for ${orderNames[kind]}.`);
                        }}
                      >
                        <span>▸</span>
                        <b>{orderNames[kind]}</b>
                        <small>
                          {kind === "research"
                            ? "Collect two source notes"
                            : kind === "draft"
                              ? "Requires Source notes"
                              : kind === "review"
                                ? "Requires Draft brief"
                                : kind === "deliver"
                                  ? "Requires Approved brief"
                                  : "Pass an artifact to a teammate"}
                        </small>
                      </button>
                    ))}
                  </>
                ))}
              {tab === "context" && (
                <>
                  <p className="g-small">
                    {unit.completed} orders completed · {unit.items.length}{" "}
                    context artifacts
                  </p>
                  {unit.items.length === 0 ? (
                    <p>
                      No context yet. Artifacts arrive through research or a
                      handoff.
                    </p>
                  ) : (
                    unit.items.map((item) => (
                      <details
                        className="g-artifact"
                        key={item.kind}
                        open={item.kind === "approved"}
                      >
                        <summary>
                          {artifactNames[item.kind]}{" "}
                          <span>{item.sources} sources</span>
                        </summary>
                        <pre>{item.text}</pre>
                      </details>
                    ))
                  )}
                  {selected === "reviewer" && state.checks.length > 0 && (
                    <ul className="g-evidence">
                      {state.checks.map((c) => (
                        <li key={c.name}>
                          {c.passed ? "✓" : "×"} {c.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              {tab === "log" && (
                <ol className="g-log">
                  {unit.log.map((l, i) => (
                    <li key={`${l.turn}-${i}`}>
                      <time>Turn {l.turn}</time>
                      <span>{l.text}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </aside>
        </div>
        <div className="g-announcement" role="status">
          {state.won
            ? "Mission complete. Open Context to inspect the delivered brief and its checks."
            : notice}
        </div>
        <footer className="g-game-footer">
          <span>
            Local session · Authored agent outputs · Executable review checks
          </span>
          <button
            onClick={() => {
              setAuto(false);
              resetDialog.current?.showModal();
            }}
          >
            Restart mission
          </button>
        </footer>
      </main>
      <p className="g-under-note">
        Party = agents · Orders = queued work · Handoff = explicit context
        transfer · Turns = observable execution.{" "}
        <a href="/design/saas-game-ui#language">Read the design language ↗</a>
      </p>
      <dialog
        ref={resetDialog}
        className="g-dialog"
        aria-labelledby="relay-reset"
      >
        <h2 id="relay-reset">Restart the mission?</h2>
        <p>This clears the party’s orders, artifacts, and logs.</p>
        <div className="g-button-row">
          <button onClick={() => resetDialog.current?.close()}>
            Keep playing
          </button>
          <button
            onClick={() => {
              setState(freshGuild());
              choose("scout");
              setNotice(
                "Select Sora. Choose Research, then target the Archive.",
              );
              resetDialog.current?.close();
            }}
          >
            Start fresh
          </button>
        </div>
      </dialog>
    </div>
  );
}
