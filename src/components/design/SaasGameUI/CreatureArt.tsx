import React from "react";
import type { CreatureKind, Upgrade } from "./creatureEngine";
import type { GearId } from "./companions";

export function Creature({
  kind = "sprout",
  upgrades = [],
  active = false,
  equipment = [],
  level = 1,
}: {
  kind?: CreatureKind;
  upgrades?: Upgrade[];
  active?: boolean;
  equipment?: GearId[];
  level?: number;
}): React.JSX.Element {
  const body =
    kind === "sprout" ? "#90aa7f" : kind === "finch" ? "#cf9470" : "#a8b4cc";
  return (
    <svg
      viewBox="0 0 120 130"
      aria-hidden="true"
      className={`g-creature-art ${active ? "is-busy" : ""}`}
    >
      <ellipse cx="60" cy="116" rx="34" ry="8" fill="#142d2e" opacity=".22" />
      <g
        className="g-creature-body"
        stroke="#354647"
        strokeWidth="2.5"
        strokeLinejoin="round"
      >
        {kind === "moth" && (
          <>
            <path
              d="M51 53Q-3 7 10 66Q12 88 42 88M70 53Q121 7 111 65Q108 90 77 88"
              fill="#cbd2d7"
            />
            <path d="m22 40 19 28M97 40 81 67" stroke="#95a5b7" />
          </>
        )}
        {upgrades.includes("wings") && (
          <>
            <path d="M33 57Q-5 38 8 67L0 68Q9 89 36 80" fill="#ede6c6" />
            <path d="M87 57Q125 38 112 67L120 68Q110 89 84 80" fill="#ede6c6" />
          </>
        )}
        <path d="m39 103-7 12 19-1 5-9m21-2 10 12-20-1-5-9" fill="#d6b889" />
        {kind === "finch" && (
          <path d="M37 40Q22 14 44 29L57 14 62 34" fill={body} />
        )}
        {kind === "sprout" && (
          <>
            <path d="M57 39Q24 10 34 5Q63 4 61 37" fill="#617e59" />
            <path d="M60 30Q63 1 89 12Q87 35 60 39" fill="#9fb985" />
          </>
        )}
        {kind === "moth" && <path d="M47 37 37 14m36 23 9-23" fill="none" />}
        <path
          d="M28 59Q27 30 59 32Q94 31 94 60L99 88Q99 113 61 114Q22 113 23 87Z"
          fill={body}
        />
        <ellipse cx="61" cy="87" rx="25" ry="24" fill="#ede4c6" stroke="none" />
        <path d="M32 67 23 84m64-17 12 17" fill="none" />
        <ellipse cx="46" cy="61" rx="3" ry="5" fill="#243637" stroke="none" />
        <ellipse cx="75" cy="61" rx="3" ry="5" fill="#243637" stroke="none" />
        {kind === "finch" ? (
          <path d="m53 68 9 8 8-8Z" fill="#e2bb73" />
        ) : (
          <path d="M54 73q7 6 13 0" fill="none" />
        )}
        <path d="m32 75 52 27" stroke="#6c644b" strokeWidth="5" />
        <rect x="68" y="91" width="22" height="18" rx="4" fill="#987c58" />
        <path d="m70 94 9 6 9-6" fill="none" />
        {upgrades.includes("retry") && (
          <>
            <path d="M44 89v13" stroke="#c8a250" />
            <circle cx="44" cy="106" r="7" fill="#edcf7d" />
            <path d="m46 103-5 3 4 3" fill="none" strokeWidth="1.5" />
          </>
        )}
        {equipment.includes("scarf") && (
          <>
            <path d="M29 76Q59 89 93 76L91 87Q60 98 28 86Z" fill="#bd6d4e" />
            <path d="m36 89-5 24 12-3 7-18" fill="#d29168" />
          </>
        )}
        {equipment.includes("lens") && (
          <>
            <circle
              cx="75"
              cy="61"
              r="11"
              fill="#bcd6d04d"
              stroke="#c4a36c"
              strokeWidth="4"
            />
            <path
              d="M86 64q16 10 6 29"
              fill="none"
              stroke="#c4a36c"
              strokeWidth="2"
            />
            <path d="m71 55 7 2" stroke="#eef4d8" strokeWidth="2" />
          </>
        )}
        {equipment.includes("planner") && (
          <>
            <rect x="32" y="91" width="22" height="18" rx="3" fill="#eed29b" />
            <path
              d="M37 95h12m-12 5h4m4 0h4m-12 5h4m4 0h4"
              stroke="#506c66"
              strokeWidth="1.5"
            />
          </>
        )}
        {level >= 3 && (
          <path
            d="m59 83 2-5 2 5 5 1-4 4 1 5-4-3-4 3 1-5-4-4Z"
            fill="#f0cb72"
            stroke="#907047"
            strokeWidth="1"
          />
        )}
      </g>
    </svg>
  );
}

export function NurseryArt(): React.JSX.Element {
  return (
    <svg
      className="g-world-art"
      viewBox="0 0 900 600"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="nursery-sky" x2="0" y2="1">
          <stop stopColor="#b6c7bd" />
          <stop offset="1" stopColor="#e4dfbe" />
        </linearGradient>
      </defs>
      <rect width="900" height="600" fill="url(#nursery-sky)" />
      <circle cx="718" cy="87" r="44" fill="#e9dfb4" />
      <path
        d="M0 153 94 75 183 148 268 60 385 151 489 87 613 156 755 66 900 145V330H0"
        fill="#7f9d90"
      />
      <path d="M0 232Q200 153 435 201T900 215V600H0" fill="#809373" />
      <path d="M38 284Q414 200 861 282L897 589H0Z" fill="#c9c4a6" />
      <path
        d="M149 298 110 600M355 273 347 600M555 268 575 600M751 279 816 600M23 376H878M12 487H890"
        stroke="#ebe4c7"
        strokeWidth="2"
        opacity=".55"
      />
      <g stroke="#5d705c" strokeWidth="3">
        <path d="M85 250V172h172v78" fill="#e7dcb9" />
        <path d="m68 175 102-75 105 75Z" fill="#a97056" />
        <rect x="142" y="197" width="53" height="53" fill="#69755b" />
        <rect x="90" y="191" width="27" height="32" fill="#bdc9b6" />
        <path d="M368 245V150h168v95" fill="#e7dcb9" />
        <path d="m350 152 103-71 103 71Z" fill="#6e918b" />
        <path
          d="M392 242v-67h120v67M431 175v67M470 175v67M392 205h120"
          fill="#a2b3a1"
        />
        <path d="M708 246V117h65v129" fill="#e7dcb9" />
        <path d="m687 119 53-58 54 58Z" fill="#7c8e9c" />
        <path d="M716 135h49v36h-49Z" fill="#a4b9b0" />
        <path d="M741 144v19m-10-9h20" />
      </g>
      <g fill="#657e60">
        <ellipse cx="23" cy="314" rx="60" ry="43" />
        <ellipse cx="884" cy="308" rx="62" ry="48" />
        <ellipse cx="44" cy="586" rx="118" ry="45" />
        <ellipse cx="864" cy="592" rx="110" ry="39" />
      </g>
      <g fill="none" stroke="#dfd4b4" strokeWidth="3" opacity=".8">
        <ellipse cx="192" cy="409" rx="58" ry="21" />
        <ellipse cx="448" cy="409" rx="58" ry="21" />
        <ellipse cx="710" cy="409" rx="58" ry="21" />
        <ellipse cx="192" cy="520" rx="58" ry="21" />
        <ellipse cx="448" cy="520" rx="58" ry="21" />
        <ellipse cx="710" cy="520" rx="58" ry="21" />
      </g>
    </svg>
  );
}
