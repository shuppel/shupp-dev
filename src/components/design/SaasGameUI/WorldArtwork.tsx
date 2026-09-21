import React from "react";

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

export const Person = React.memo(PersonArt);
