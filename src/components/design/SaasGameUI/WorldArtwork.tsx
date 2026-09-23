import React from "react";
import type { ActorId } from "./field";

function PersonArt({
  kind = "operator",
  walking = false,
  facing = 1,
  carrying = false,
}: {
  kind?: ActorId;
  walking?: boolean;
  facing?: number;
  carrying?: boolean;
}): React.JSX.Element {
  const coat =
    kind === "implementer"
      ? "#a35f48"
      : kind === "verifier"
        ? "#6e8370"
        : "#496b85";
  const light =
    kind === "implementer"
      ? "#d99369"
      : kind === "verifier"
        ? "#a3b391"
        : "#85a2b1";
  const hair =
    kind === "implementer"
      ? "#8b4a31"
      : kind === "verifier"
        ? "#d0bea0"
        : "#303b49";
  return (
    <svg
      className="r-person-art"
      viewBox="0 0 90 170"
      aria-hidden="true"
      data-walking={walking}
      style={{ transform: `scaleX(${facing})` }}
    >
      <g className="r-leg r-leg-a">
        <path
          d="M31 102L30 145L39 149L46 108"
          fill="#353c48"
          stroke="#25313d"
          strokeWidth="2"
        />
        <path d="M29 143L40 143L41 161Q29 166 18 160L19 155Z" fill="#40444c" />
        <path d="M19 161L40 162" stroke="#c2ac85" strokeWidth="2" />
      </g>
      <g className="r-leg r-leg-b">
        <path
          d="M46 104L51 148L63 147L60 102"
          fill="#424957"
          stroke="#293745"
          strokeWidth="2"
        />
        <path d="M50 143L62 143L73 156Q73 165 51 163Z" fill="#444650" />
        <path d="M52 163L73 161" stroke="#c2ac85" strokeWidth="2" />
      </g>
      <g className="r-torso">
        <path
          d="M31 50Q14 50 12 89L21 94L34 65M57 50Q74 53 80 82L70 89L54 65"
          fill={coat}
          stroke="#34414a"
          strokeWidth="2"
        />
        <path
          d="M12 88Q7 100 16 100L23 91M70 85Q78 80 83 90Q82 99 73 96"
          fill="#dfb495"
          stroke="#9d765f"
          strokeWidth="1.5"
        />
        <path
          d="M32 47L58 47Q63 78 69 120L49 125L43 104L34 125L18 118Z"
          fill={coat}
          stroke="#34414a"
          strokeWidth="2"
        />
        <path d="M37 50L51 50L56 98L35 100Z" fill="#eddec0" />
        <path
          d="M31 49L40 57L35 73L24 112M58 48L49 58L55 73L65 114"
          fill={light}
        />
        <path d="M32 92L59 91L59 99L32 100Z" fill="#534b40" />
        <rect x="42" y="92" width="7" height="6" rx="1" fill="#c6a56c" />
        <path
          d="M29 47L56 44L61 51Q44 67 28 54Z"
          fill="#c6ae77"
          stroke="#8a7651"
        />
        <path d="M55 53Q57 73 68 76L64 85Q49 77 49 55" fill="#dfc78d" />
        <path d="M36 34L53 34L55 49Q44 55 36 48Z" fill="#c99b7d" />
        {kind === "implementer" && (
          <path
            d="M58 18Q78 13 79 40L69 67L60 62L69 43L59 28Z"
            fill={hair}
            stroke="#633b30"
            strokeWidth="2"
          />
        )}
        <path
          d="M28 15Q26 2 42 3Q63 3 64 20L60 37Q52 49 40 43Q28 38 28 15"
          fill="#edc4a3"
          stroke="#9e7c69"
          strokeWidth="1.5"
        />
        <path
          d="M26 29Q14 5 35 1Q60-6 68 15L61 32L58 17L48 23L45 11L33 21L32 33Z"
          fill={hair}
          stroke="#514137"
          strokeWidth="1.5"
        />
        <path
          d="M27 11Q42 0 59 8M30 16Q43 6 62 14"
          fill="none"
          stroke={kind === "implementer" ? "#bf7c51" : "#8b8070"}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M36 29L41 28M51 28L56 29"
          stroke="#624a3d"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <ellipse cx="39" cy="32" rx="1.8" ry="2.4" fill="#31414a" />
        <ellipse cx="54" cy="32" rx="1.8" ry="2.4" fill="#31414a" />
        <path
          d="M47 32L46 37L49 37M41 41Q46 43 51 40"
          fill="none"
          stroke="#aa765e"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path d="M23 60L59 100" stroke="#c5af80" strokeWidth="5" />
        <path d="M23 60L59 100" stroke="#827457" strokeWidth="1" />
        <rect
          x="56"
          y="96"
          width="22"
          height="24"
          rx="4"
          fill="#8e7859"
          stroke="#5e584a"
          strokeWidth="2"
        />
        <path
          d="M57 103L67 108L77 103"
          fill="none"
          stroke="#c7b285"
          strokeWidth="2"
        />
        {(carrying || kind === "verifier") && (
          <g transform="rotate(-12 75 90)">
            <rect
              x="67"
              y="73"
              width="19"
              height="28"
              rx="2"
              fill="#eee1bd"
              stroke="#9f8a60"
              strokeWidth="1.5"
            />
            <path
              d="M71 79H81M71 84H81M71 89H78"
              stroke="#7d8e82"
              strokeWidth="1.5"
            />
          </g>
        )}
      </g>
    </svg>
  );
}
function FolioArt({
  kind,
  complete = false,
}: {
  kind: "source" | "tests" | "task" | "patch";
  complete?: boolean;
}): React.JSX.Element {
  const color =
    kind === "source"
      ? "#66859a"
      : kind === "tests"
        ? "#80956e"
        : kind === "patch"
          ? "#be9862"
          : "#b2815c";
  return (
    <svg className="r-folio" viewBox="0 0 120 110" aria-hidden="true">
      <ellipse cx="60" cy="101" rx="41" ry="7" fill="#1f343633" />
      <path d="M17 97L60 81L103 97L60 109Z" fill="#b6ac95" />
      <path
        d="M17 87L60 73L103 87L60 102L17 97ZM103 87V97L60 110V102"
        fill="#dfd4b6"
        stroke="#9b977f"
        strokeWidth="1"
      />
      <g className={complete ? "r-folio-complete" : ""}>
        <path
          d="M21 22L56 29L63 22L100 29L95 81L61 74L55 80L16 72Z"
          fill={color}
          stroke="#625e53"
          strokeWidth="2"
        />
        <path d="M26 15L57 22L61 71L22 64Z" fill="#e9ddbb" stroke="#aaa080" />
        <path d="M60 22L94 17L89 66L62 71Z" fill="#f5e9c8" stroke="#aaa080" />
        <path d="M57 22L61 71" stroke="#a2906e" strokeWidth="3" />
        <path
          d="M31 29L49 33M29 37L50 41M28 45L45 49M27 54L49 58M66 30L85 27M67 38L85 35M67 46L80 44M66 55L83 52"
          stroke="#8a9989"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {kind === "tests" && (
          <path
            d="M69 43L73 47L82 36"
            stroke="#647b52"
            strokeWidth="3"
            fill="none"
          />
        )}
        {kind === "patch" && (
          <path d="M73 36V52M65 44H81" stroke="#9a743e" strokeWidth="3" />
        )}
        {complete && (
          <path
            d="M42 48L55 60L78 34"
            fill="none"
            stroke="#5d7a58"
            strokeWidth="5"
            strokeLinecap="round"
          />
        )}
      </g>
    </svg>
  );
}
function FieldArtwork(): React.JSX.Element {
  return (
    <svg
      className="r-field-art"
      viewBox="0 0 1200 640"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="r-sky" x2="0" y2="1">
          <stop stopColor="#497388" />
          <stop offset="1" stopColor="#b4c9b3" />
        </linearGradient>
        <linearGradient id="r-ground" x2=".7" y2="1">
          <stop stopColor="#d4cbb3" />
          <stop offset="1" stopColor="#a4a38d" />
        </linearGradient>
        <linearGradient id="r-water" x2="0" y2="1">
          <stop stopColor="#80a7a5" />
          <stop offset="1" stopColor="#4e7d83" />
        </linearGradient>
        <pattern
          id="r-tiles"
          width="160"
          height="84"
          patternUnits="userSpaceOnUse"
          patternTransform="skewX(-18)"
        >
          <path
            d="M0 0H160V84H0Z"
            fill="none"
            stroke="#776f551e"
            strokeWidth="2"
          />
          <path d="M0 2H158" stroke="#f2ead450" strokeWidth="2" />
        </pattern>
        <filter id="r-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".65"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope=".07" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </defs>
      <path d="M0 0H1200V640H0Z" fill="url(#r-sky)" />
      <path
        d="M0 102L93 53L142 78L214 27L276 80L342 55L430 111L541 18L628 86L725 42L854 112L961 30L1050 95L1127 48L1200 93V290H0Z"
        fill="#6d9296"
      />
      <path
        d="M0 162L147 118L225 154L370 111L457 148L577 106L709 171L875 117L990 176L1120 124L1200 156V330H0Z"
        fill="#527b7c"
      />
      <path
        d="M0 194Q150 129 277 182T515 171Q654 149 780 194T1200 169V357H0Z"
        fill="#829c88"
      />
      <path
        d="M550 195Q706 146 849 188Q1005 222 1200 185V345L408 348Z"
        fill="url(#r-water)"
      />
      <g fill="#c3c2a5" stroke="#718779" strokeWidth="2">
        <path d="M708 160V108H725V79H742V109H758V160M762 167V131H789V115H807V171M666 158V127H688V104H704V161" />
        <path d="M823 175V130H842V117H854V129H879V180" />
      </g>
      <g fill="#6d8881">
        <path d="M700 111L733 62L767 112M655 129L680 95L708 129M813 135L848 100L888 135" />
      </g>
      <path d="M895 181Q969 132 1050 162V176Q969 151 895 197Z" fill="#b1b79d" />
      <path
        d="M914 177V202M949 163V193M984 160V188M1021 165V196"
        stroke="#b1b79d"
        strokeWidth="10"
      />
      <path d="M0 177Q250 121 494 182L1200 155V640H0Z" fill="url(#r-ground)" />
      <path
        d="M0 183Q250 128 494 188L1200 163"
        fill="none"
        stroke="#eee5c8"
        strokeWidth="14"
      />
      <path d="M0 210H1200V640H0Z" fill="url(#r-tiles)" />
      <path
        d="M0 612Q130 570 270 612T560 601T856 613T1200 592V640H0Z"
        fill="#737c65"
      />
      <path
        d="M0 151L85 135L103 169L95 534L44 547L0 518ZM1200 141L1144 159L1131 528L1200 551Z"
        fill="#b7b399"
      />
      <path
        d="M17 0H90L90 176L18 193ZM1144 0H1200V196L1138 178Z"
        fill="#c9c2a7"
      />
      <path
        d="M18 68H88M18 132H89M46 0V68M64 68V132M32 132V188M1146 69H1200M1144 132H1200M1164 0V67M1180 70V130"
        stroke="#a59f88"
        strokeWidth="3"
      />
      <path
        d="M0 0H212Q158 40 137 117L92 155V0M1200 0H1013Q1080 48 1098 115L1142 163V0"
        fill="#bdb79c"
      />
      <path
        d="M27 0Q75 133 25 207M1160 0Q1118 126 1173 196"
        fill="none"
        stroke="#546e55"
        strokeWidth="6"
      />
      <g fill="#687e57">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <g key={i}>
            <ellipse
              cx={31 + (i % 2) * 22}
              cy={i * 29 + 11}
              rx="20"
              ry="10"
              transform={`rotate(-25 ${31 + (i % 2) * 22} ${i * 29 + 11})`}
            />
            <ellipse
              cx={1160 - (i % 2) * 22}
              cy={i * 26 + 9}
              rx="20"
              ry="10"
              transform={`rotate(30 ${1160 - (i % 2) * 22} ${i * 26 + 9})`}
            />
          </g>
        ))}
      </g>
      <g fill="#879277">
        <path d="M0 554Q29 502 64 550Q80 511 98 564Q131 536 143 590L0 640ZM1044 611Q1085 537 1114 574Q1140 530 1165 566Q1190 519 1200 541V640Z" />
      </g>
      <path d="M0 0H1200V640H0Z" fill="transparent" filter="url(#r-grain)" />
    </svg>
  );
}

export const Person = React.memo(PersonArt);
export const Folio = React.memo(FolioArt);
export const FieldArt = React.memo(FieldArtwork);
