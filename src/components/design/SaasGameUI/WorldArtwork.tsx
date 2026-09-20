import React from "react";

function WorkroomArt(): React.JSX.Element {
  return (
    <svg
      className="world-room"
      viewBox="0 0 1000 600"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="room-wall" x2="0" y2="1">
          <stop stopColor="#d2d7c8" />
          <stop offset="1" stopColor="#ece9d8" />
        </linearGradient>
        <linearGradient id="room-floor" x2="0" y2="1">
          <stop stopColor="#dfd6bc" />
          <stop offset="1" stopColor="#f3e9d3" />
        </linearGradient>
        <linearGradient id="room-sky" x2="0" y2="1">
          <stop stopColor="#a5c4ce" />
          <stop offset="1" stopColor="#e4e8d5" />
        </linearGradient>
        <radialGradient id="room-light">
          <stop stopColor="#fffce6" stopOpacity=".8" />
          <stop offset="1" stopColor="#fffce6" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1000" height="600" fill="url(#room-wall)" />
      <path d="M0 305Q500 265 1000 305V600H0Z" fill="url(#room-floor)" />
      <path
        d="M0 309Q500 269 1000 309"
        fill="none"
        stroke="#afad94"
        strokeWidth="9"
      />
      <path
        d="M0 322Q500 282 1000 322"
        fill="none"
        stroke="#f6f0da"
        strokeWidth="4"
      />
      <g stroke="#baad8b" strokeWidth="1.4" opacity=".3">
        <path d="M500 285L-120 600M500 285L120 600M500 285L370 600M500 285L630 600M500 285L880 600M500 285L1120 600M0 379H1000M0 458H1000M0 553H1000" />
      </g>
      <ellipse cx="515" cy="290" rx="430" ry="260" fill="url(#room-light)" />
      <g fill="none" stroke="#9d9f8a" strokeWidth="9">
        <path d="M363 265V133C363 27 637 27 637 133V265Z" />
      </g>
      <path d="M374 260V135C374 40 626 40 626 135V260Z" fill="url(#room-sky)" />
      <path
        d="M374 209Q415 139 468 187Q537 100 626 191V260H374Z"
        fill="#95afa5"
      />
      <path
        d="M374 240Q435 200 491 226Q559 168 626 228V260H374Z"
        fill="#78998a"
      />
      <path
        d="M500 54V264M371 155H629M371 209H629"
        stroke="#c2bea4"
        strokeWidth="7"
      />
      <path
        d="M350 50Q338 155 317 254L366 278Q391 164 371 57Z"
        fill="#76958c"
      />
      <path
        d="M650 50Q662 155 683 254L634 278Q609 164 629 57Z"
        fill="#76958c"
      />
      <path
        d="M352 57Q361 165 337 257M650 57Q639 165 663 257"
        fill="none"
        stroke="#aec0a9"
        strokeWidth="5"
        opacity=".55"
      />
      <path
        d="M342 49Q500 8 658 49"
        fill="none"
        stroke="#b9aa7f"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <g transform="translate(70 87)">
        <rect width="142" height="194" rx="6" fill="#9c9f84" />
        <rect x="9" y="9" width="124" height="176" rx="3" fill="#798a79" />
        {[42, 95, 148].map((y, i) => (
          <g key={y}>
            <path d={`M5 ${y + 25}H137`} stroke="#b8b395" strokeWidth="8" />
            {[17, 34, 48, 64, 83, 103].map((x, j) => (
              <rect
                key={x}
                x={x}
                y={y - 14 + (j % 2) * 5}
                width={j === 3 ? 14 : 10}
                height={34 - (j % 2) * 5}
                rx="2"
                fill={["#c1b994", "#d5d0b8", "#859c9a", "#b39777"][(i + j) % 4]}
                transform={`rotate(${j === 4 ? 8 : 0} ${x} ${y + 20})`}
              />
            ))}
          </g>
        ))}
      </g>
      <g transform="translate(806 91)">
        <rect x="0" y="0" width="110" height="133" rx="48" fill="#b7b69e" />
        <rect x="9" y="9" width="92" height="115" rx="40" fill="#e4dfc5" />
        <path d="M29 88Q56 24 80 86Q49 61 29 88" fill="#99a991" />
        <path d="M50 97V47" stroke="#7f937c" strokeWidth="2" />
        <path
          d="M5 145H108"
          stroke="#a3a289"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path d="M20 154V197M96 154V197" stroke="#92947d" strokeWidth="5" />
      </g>
      <g transform="translate(916 293)">
        <ellipse cy="23" rx="34" ry="10" fill="#71816a" opacity=".13" />
        <path d="M-21-24H21L15 19Q0 27-15 19Z" fill="#b29d7c" />
        <path
          d="M0-20Q-17-58-34-55Q-31-25 0-20M0-29Q15-81 34-72Q38-39 0-29M0-34Q-21-98-27-85Q-37-64 0-34M0-15Q38-51 43-30Q33-9 0-15"
          fill="#719180"
        />
        <path d="M0-14V-66" stroke="#5c7e6a" strokeWidth="3" />
      </g>
      <path
        d="M372 276L186 495L661 540L624 277Z"
        fill="#fff6d9"
        opacity=".18"
      />
      <path
        d="M20 568Q260 552 397 574M787 566Q894 551 980 568"
        fill="none"
        stroke="#d6c8a6"
        strokeWidth="2"
        opacity=".5"
      />
    </svg>
  );
}

function PersonArt({
  walking,
  carrying,
  facing,
}: {
  walking: boolean;
  carrying: boolean;
  facing: number;
}): React.JSX.Element {
  return (
    <svg
      className="world-person-art"
      viewBox="0 0 70 128"
      aria-hidden="true"
      data-walking={walking}
      style={{ transform: `scaleX(${facing})` }}
    >
      <g className="person-leg person-leg--left">
        <path d="M24 84Q21 98 22 112L30 113L34 86" fill="#40465a" />
        <path d="M22 109L30 109L31 120Q27 126 15 122L16 117Z" fill="#535250" />
        <path
          d="M16 122Q25 126 32 121"
          stroke="#c4b398"
          strokeWidth="2"
          fill="none"
        />
      </g>
      <g className="person-leg person-leg--right">
        <path d="M36 84L39 113L47 112Q50 98 44 85" fill="#515970" />
        <path d="M39 110L47 110L53 118Q57 126 39 123Z" fill="#5b5953" />
        <path
          d="M39 123Q49 126 55 122"
          stroke="#c4b398"
          strokeWidth="2"
          fill="none"
        />
      </g>
      <g className="person-body">
        <path
          d="M22 47Q11 53 10 80L18 84L25 62M43 47Q57 52 61 73L53 78L44 61"
          fill="#617c8d"
          stroke="#425767"
          strokeWidth="1.2"
        />
        <path
          d="M10 79Q8 92 15 90Q22 87 18 80M54 74Q62 72 64 79Q61 86 54 82"
          fill="#ecc3a2"
          stroke="#ba9176"
          strokeWidth="1"
        />
        <path
          d="M24 43L45 43Q49 63 51 91Q33 99 17 90Z"
          fill="#506d80"
          stroke="#3d5462"
          strokeWidth="1.5"
        />
        <path d="M30 46L40 46L40 81L29 84Z" fill="#efdfbd" />
        <path
          d="M21 51L29 56L25 66L17 89M44 49L38 57L43 66L50 90"
          fill="#67899a"
        />
        <path d="M31 59L33 75" stroke="#b5a179" strokeWidth="2" />
        <path d="M26 43Q34 50 45 44L48 48Q36 58 24 48Z" fill="#b09a67" />
        <path d="M44 51Q43 62 53 73L49 78Q38 65 39 53Z" fill="#cab481" />
        <path d="M27 33L42 33L43 47Q35 53 27 45Z" fill="#d8ac8b" />
        <path
          d="M22 19Q20 5 34 4Q52 5 51 23L49 35Q43 47 32 43Q20 37 22 19"
          fill="#edc7a8"
          stroke="#a7816a"
          strokeWidth="1"
        />
        <path
          d="M19 28Q9 8 26 3Q47-6 55 15L50 32L47 19Q39 25 39 13Q31 23 24 19L24 33Z"
          fill="#45434b"
        />
        <path
          d="M19 13Q28 1 43 5M23 16Q34 3 49 12"
          stroke="#69616a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M29 28L32 27M42 27L46 28"
          stroke="#574b49"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <ellipse cx="31" cy="30" rx="1.5" ry="2" fill="#343e4b" />
        <ellipse cx="44" cy="30" rx="1.5" ry="2" fill="#343e4b" />
        <path
          d="M37 31L36 35L38 35M33 39Q37 41 41 38"
          stroke="#b8876d"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M18 52L43 83" stroke="#b6a17b" strokeWidth="4" />
        <rect
          x="38"
          y="74"
          width="18"
          height="20"
          rx="5"
          fill="#a78e67"
          stroke="#816f55"
          strokeWidth="1.2"
        />
        <path
          d="M39 80Q47 85 55 80"
          stroke="#d5bd8d"
          fill="none"
          strokeWidth="2"
        />
        {carrying && (
          <g transform="rotate(-12 58 78)">
            <rect
              x="52"
              y="66"
              width="16"
              height="22"
              rx="2"
              fill="#f6ead0"
              stroke="#b5a381"
            />
            <path
              d="M56 71H64M56 75H64M56 79H62"
              stroke="#91a3a0"
              strokeWidth="1"
            />
          </g>
        )}
      </g>
    </svg>
  );
}

export type ObjectAction = "collect" | "draft" | "review";
function WorkObjectArt({
  action,
  complete,
}: {
  action: ObjectAction;
  complete: boolean;
}): React.JSX.Element {
  return (
    <svg viewBox="0 0 180 165" className="world-prop" aria-hidden="true">
      <ellipse cx="90" cy="151" rx="67" ry="11" fill="#565f50" opacity=".14" />
      {action === "collect" ? (
        <g stroke="#65736f" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M35 85L124 65L150 87L61 111Z" fill="#99b3ad" />
          <path d="M35 85L61 108V149L35 124Z" fill="#6f8b87" />
          <path d="M61 108L150 87V127L61 149Z" fill="#87a49c" />
          <path d="M65 119L143 102" stroke="#b9cdc0" />
          <path d="M65 137L143 120" stroke="#b9cdc0" />
          <path
            d="M100 113L114 110V117L100 120Z"
            fill="#dfc99d"
            stroke="#9a8c6d"
          />
          <path
            d="M49 85L116 71L132 87L67 100Z"
            fill="#f3ecd9"
            stroke="#b7ad91"
          />
          <path
            d="M53 78L114 63L126 78L65 93Z"
            fill="#e0d8ba"
            stroke="#b7ad91"
          />
          <path
            d="M58 66L99 58L111 75L72 86Z"
            fill="#faf0d8"
            stroke="#c2b596"
          />
          <path d="M69 70L97 65M73 75L100 69" stroke="#9daea5" />
          <path
            d="M110 68L113 38Q114 31 121 36L134 72"
            fill="#d8ba82"
            stroke="#a38b69"
          />
          {complete && (
            <path
              d="M54 107L63 115L80 96"
              stroke="#d7e5cb"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          )}
        </g>
      ) : action === "draft" ? (
        <g stroke="#998867" strokeWidth="1.5" strokeLinejoin="round">
          <path
            d="M36 93L45 94L40 149L33 147ZM127 79L136 80L144 137L137 139Z"
            fill="#a18f70"
          />
          <path d="M67 111L76 111L80 155L72 156Z" fill="#a18f70" />
          <path d="M23 78L120 58L157 89L66 115Z" fill="#e1cba3" />
          <path
            d="M23 78V87L66 124V114ZM66 114L157 89V97L66 124Z"
            fill="#baa17a"
          />
          <path
            d="M55 76L111 64L135 86L82 101Z"
            fill="#fbf4de"
            stroke="#c3b498"
          />
          <path
            d="M71 79L112 70M77 85L120 76M83 91L113 84"
            stroke="#a3b2ad"
            strokeWidth="1.5"
          />
          <path
            d="M111 76Q135 47 139 38Q151 58 111 76"
            fill="#829f9e"
            stroke="#647f82"
          />
          <path d="M132 92L139 91L142 99L134 101Z" fill="#6d8588" />
          {complete && (
            <g>
              <path d="M39 92L61 87L76 99L54 105Z" fill="#eaf0dc" />
              <path
                d="M47 96L54 99L65 92"
                fill="none"
                stroke="#718a6d"
                strokeWidth="2"
              />
            </g>
          )}
        </g>
      ) : (
        <g stroke="#958569" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M86 77H98L110 143L73 151Z" fill="#b29d78" />
          <path d="M63 144L104 136L127 149L84 161L61 152Z" fill="#c4ae84" />
          <path d="M54 62L114 50L144 91L82 108Z" fill="#b79f78" />
          <path d="M54 62L49 69L79 114L144 97V91L82 108Z" fill="#988567" />
          <path
            d="M60 62L111 54L134 86L84 99Z"
            fill="#fff3d7"
            stroke="#d3bf98"
          />
          <path d="M72 67L110 60M77 74L115 67M81 81L108 75" stroke="#a3b2aa" />
          {complete ? (
            <g>
              <circle cx="106" cy="85" r="10" fill="#739986" stroke="#618470" />
              <path
                d="M101 85L105 89L112 80"
                stroke="#fcf4dd"
                strokeWidth="2"
                fill="none"
              />
            </g>
          ) : (
            <circle cx="106" cy="85" r="9" fill="#d9bb79" stroke="#bda16a" />
          )}
        </g>
      )}
    </svg>
  );
}

// Movement updates position frequently; unchanged artwork can retain its render.
export const Workroom = React.memo(WorkroomArt);
export const Person = React.memo(PersonArt);
export const WorkObject = React.memo(WorkObjectArt);
