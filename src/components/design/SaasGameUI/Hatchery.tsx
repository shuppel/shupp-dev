import React, { useEffect, useState } from "react";
import DinoPortrait from "./DinoPortrait";
import { species } from "./dinoScene";
import {
  hatchSeed,
  phenotype,
  rollHatch,
  type Hatchling,
} from "./creatureGenetics";
import type { CreatureKind } from "./creatureEngine";

const nests = [
  { value: "surprise", label: "Surprise egg" },
  { value: "sprout", label: "Frilled grazer" },
  { value: "finch", label: "Feathered runner" },
  { value: "moth", label: "Long-necked browser" },
] as const;

export default function Hatchery({
  count,
  initialName,
  onAdopt,
}: {
  count: number;
  initialName: string;
  onAdopt: (name: string, hatchling: Hatchling) => void;
}): React.JSX.Element {
  const [nest, setNest] = useState<CreatureKind | "surprise">("surprise"),
    [phase, setPhase] = useState<"egg" | "hatching" | "reveal">("egg"),
    [hatchling, setHatchling] = useState<Hatchling | null>(null),
    [name, setName] = useState(initialName);
  const traits = hatchling === null ? null : phenotype(hatchling.genome);
  useEffect(() => {
    if (phase !== "hatching") return;
    const timer = window.setTimeout(
      () => setPhase("reveal"),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1100,
    );
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (count >= 6)
    return (
      <div className="ct-empty">
        <h3>A full little company.</h3>
        <p>Your six companions are waiting for their next adventure.</p>
      </div>
    );
  return (
    <div className={`ct-hatchery ct-hatch-phase-${phase}`}>
      {phase !== "reveal" || hatchling === null || traits === null ? (
        <div className="ct-egg-stage" aria-busy={phase === "hatching"}>
          <div className="ct-nest-art" aria-hidden="true">
            <svg viewBox="0 0 360 260">
              <defs>
                <radialGradient id="ct-shell" cx="35%" cy="28%" r="76%">
                  <stop stopColor="#fff6df" />
                  <stop offset=".65" stopColor="#ddcfac" />
                  <stop offset="1" stopColor="#a99c7f" />
                </radialGradient>
                <radialGradient id="ct-nest-glow">
                  <stop stopColor="#d5dac0" stopOpacity=".65" />
                  <stop offset="1" stopColor="#d5dac0" stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse
                cx="180"
                cy="142"
                rx="145"
                ry="113"
                fill="url(#ct-nest-glow)"
              />
              <ellipse
                cx="180"
                cy="216"
                rx="92"
                ry="13"
                fill="#47523b"
                opacity=".12"
              />
              <path d="M92 196q84-43 180 1l-25 29H118Z" fill="#8e8466" />
              <g className="ct-egg-shell">
                <path
                  d="M180 48c-37 0-68 68-68 110 0 36 27 55 68 55s68-19 68-55c0-42-31-110-68-110Z"
                  fill="url(#ct-shell)"
                  stroke="#b7aa8a"
                  strokeWidth="1.5"
                />
                {Array.from({ length: 38 }, (_, i) => (
                  <ellipse
                    key={i}
                    cx={142 + ((i * 47) % 82)}
                    cy={94 + ((i * 31) % 98)}
                    rx={1.1 + (i % 3)}
                    ry={0.8 + (i % 2)}
                    fill="#7b7359"
                    opacity={0.12 + (i % 4) * 0.05}
                    transform={`rotate(${i * 17} ${142 + ((i * 47) % 82)} ${94 + ((i * 31) % 98)})`}
                  />
                ))}
                <path
                  className="ct-egg-crack"
                  d="m176 51 9 29-13 13 18 23-22 17 13 23-12 25 14 28"
                  fill="none"
                  stroke="#6c684e"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
              </g>
              <g fill="none" strokeLinecap="round">
                <path
                  d="m93 196 146 28M104 211l147-17M117 225l151-24M104 202l137 30M119 231l131-22"
                  stroke="#aa9871"
                  strokeWidth="5"
                />
                <path
                  d="m114 205 125 18m-112-4 122-19m-126-1 101 28"
                  stroke="#c5b188"
                  strokeWidth="2"
                />
                <path
                  d="M110 214q-31-15-35-46m31 37-23-7m18 0-6-22M251 216q32-21 29-44m-16 32 22-5m-16-6 0-16"
                  stroke="#7c8b66"
                  strokeWidth="3"
                />
              </g>
            </svg>
          </div>
          <span className="ct-eyebrow">
            {phase === "hatching"
              ? "Something is stirring"
              : "One egg. Someone new."}
          </span>
          <h3>
            {phase === "hatching"
              ? "A little tap from inside…"
              : "Who will you meet?"}
          </h3>
          <p>
            Every hatch has its own colors, markings, build, and personality.
          </p>
          <label className="ct-nest-choice">
            Choose a nest
            <select
              aria-label="Choose a nest"
              value={nest}
              disabled={phase === "hatching"}
              onChange={(e) =>
                setNest(e.target.value as CreatureKind | "surprise")
              }
            >
              {nests.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="ct-primary"
            disabled={phase === "hatching"}
            onClick={() => {
              setHatchling(rollHatch(hatchSeed(), nest));
              setPhase("hatching");
            }}
          >
            {phase === "hatching" ? "Hatching…" : "Hatch this egg"}
          </button>
          <small className="ct-hatch-note">
            Free to hatch. Every companion starts on equal footing.
          </small>
          <span role="status" className="ct-sr-notice">
            {phase === "hatching" ? "Your egg is hatching." : ""}
          </span>
        </div>
      ) : (
        <form
          className="ct-hatch-reveal"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) onAdopt(name.trim(), hatchling);
          }}
        >
          <div className="ct-hatch-portrait">
            <DinoPortrait kind={hatchling.kind} genome={hatchling.genome} />
            <span>{species[hatchling.kind].family} · Hatchling</span>
          </div>
          <div className="ct-hatch-record">
            <span className="ct-eyebrow" role="status">
              A new companion has hatched
            </span>
            <h3>{species[hatchling.kind].name}</h3>
            <p>{species[hatchling.kind].description}</p>
            <dl className="ct-field-notes">
              <div>
                <dt>Coat</dt>
                <dd>{traits.palette.name}</dd>
              </div>
              <div>
                <dt>Markings</dt>
                <dd>{traits.marking}</dd>
              </div>
              <div>
                <dt>Build</dt>
                <dd>{traits.build}</dd>
              </div>
              <div>
                <dt>Personality</dt>
                <dd>{hatchling.temperament}</dd>
              </div>
            </dl>
            <label>
              Their name
              <input
                autoFocus
                aria-label="Companion name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                required
              />
            </label>
            <button
              type="submit"
              className="ct-primary"
              disabled={!name.trim()}
            >
              Adopt {name.trim() || "companion"}
            </button>
            <button
              type="button"
              className="ct-hatch-again"
              onClick={() => {
                setHatchling(null);
                setPhase("egg");
              }}
            >
              Try another egg
            </button>
            <small className="ct-hatch-note">
              Level 1 · 12 buttons · A look that stays theirs.
            </small>
          </div>
        </form>
      )}
    </div>
  );
}
