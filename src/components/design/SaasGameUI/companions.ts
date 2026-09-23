export type Temperament = "curious" | "cozy" | "bold";
export type GearId = "wings" | "retry" | "lens" | "planner" | "scarf";
export type MissionId = "morning" | "research" | "weekend";
export type Focus = "balanced" | "work" | "life";
export interface Report {
  title: string;
  intro: string;
  sections: { title: string; body: string }[];
  footnote: string;
}
export interface Assignment {
  id: MissionId;
  brief: string;
  focus: Focus;
  duration: number;
  result: Report | null;
  failed: boolean;
}
export interface Companion {
  temperament: Temperament;
  xp: number;
  buttons: number;
  owned: GearId[];
  equipped: GearId[];
  missions: number;
  greetings: number;
  assignment: Assignment | null;
  journal: { mission: MissionId; at: number; brief: string; result: Report }[];
}
export const gear: Record<
  GearId,
  {
    name: string;
    icon: string;
    description: string;
    level: number;
    cost: number;
    cosmetic?: boolean;
  }
> = {
  wings: {
    name: "Swift wings",
    icon: "↗",
    description:
      "Finish routine jobs in 1 minute. Missions take 2 fewer minutes.",
    level: 1,
    cost: 6,
  },
  retry: {
    name: "Retry charm",
    icon: "↻",
    description: "Recover from one simulated timeout with an automatic retry.",
    level: 1,
    cost: 6,
  },
  lens: {
    name: "Research lens",
    icon: "⌕",
    description:
      "Unlock scouting missions and turn sample sources into a useful shortlist.",
    level: 2,
    cost: 18,
  },
  planner: {
    name: "Planner pin",
    icon: "▦",
    description:
      "Unlock planning missions and build an itinerary from sample activities.",
    level: 3,
    cost: 24,
  },
  scarf: {
    name: "Sunset scarf",
    icon: "≈",
    description: "A little warmth, a lot of personality. Appearance only.",
    level: 1,
    cost: 6,
    cosmetic: true,
  },
};
export const missions: Record<
  MissionId,
  {
    title: string;
    tag: string;
    description: string;
    prompt: string;
    duration: number;
    xp: number;
    buttons: number;
    level: number;
    requires?: GearId;
    destination: number;
  }
> = {
  morning: {
    title: "Rescue my morning",
    tag: "Everyday helper",
    description:
      "Sort a sample inbox and bring back three things worth your attention.",
    prompt: "Help me see what matters today.",
    duration: 4,
    xp: 30,
    buttons: 18,
    level: 1,
    destination: 20,
  },
  research: {
    title: "Find my next rabbit hole",
    tag: "Curious scout",
    description:
      "Explore a small sample reading shelf and build a learning shortlist.",
    prompt: "Find something useful I can learn this week.",
    duration: 6,
    xp: 45,
    buttons: 24,
    level: 2,
    requires: "lens",
    destination: 50,
  },
  weekend: {
    title: "Make room for a good day",
    tag: "Little planner",
    description:
      "Build a three-hour plan from sample activities, including a little breathing room.",
    prompt: "Plan a day with one useful thing and something enjoyable.",
    duration: 8,
    xp: 60,
    buttons: 30,
    level: 3,
    requires: "planner",
    destination: 81,
  },
};
export const levelStarts = [0, 30, 75, 135, 210];
export function levelFor(xp: number): number {
  return levelStarts.filter((threshold) => xp >= threshold).length;
}
export function rankFor(xp: number): string {
  return [
    "New companion",
    "Little apprentice",
    "Trusted helper",
    "Seasoned explorer",
    "Kindred companion",
  ][Math.max(0, levelFor(xp) - 1)];
}
export function freshCompanion(
  upgrades: ("wings" | "retry")[] = [],
): Companion {
  return {
    temperament: "curious",
    xp: 0,
    buttons: 12,
    owned: [...upgrades],
    equipped: [...upgrades],
    missions: 0,
    greetings: 0,
    assignment: null,
    journal: [],
  };
}
export function missionLock(pet: Companion, id: MissionId): string | null {
  const mission = missions[id];
  if (levelFor(pet.xp) < mission.level) return `Reach level ${mission.level}`;
  if (mission.requires && !pet.equipped.includes(mission.requires))
    return `Equip ${gear[mission.requires].name}`;
  return null;
}
export function greeting(pet: Companion, name: string): string {
  if (pet.assignment?.result)
    return `${name} is practically vibrating. “I brought you something. Want to see?”`;
  if (pet.assignment !== null)
    return `“${pet.temperament === "bold" ? "On it. I have a plan!" : pet.temperament === "cozy" ? "Taking good care of this one." : "Ooh, I found a promising thread!"}”`;
  const lines = {
    curious: [
      "What are we figuring out today?",
      "I found a very interesting leaf. Also, I can sort your morning.",
      "One mission? Maybe a tiny adventure?",
    ],
    cozy: [
      "We can take this one thing at a time.",
      "I saved you the quiet spot. What needs doing?",
      "A little help, then a little rest.",
    ],
    bold: [
      "Give me a mission. I’m ready.",
      "Small creature. Very organized plans.",
      "Let’s get something good done today.",
    ],
  };
  return `“${lines[pet.temperament][pet.greetings % 3]}”`;
}
/** Authored sample catalogs. Focus selection changes the computed output; no model or web access. */
export function makeReport(id: MissionId, brief: string, focus: Focus): Report {
  const order =
    focus === "work"
      ? ["work", "mixed", "life"]
      : focus === "life"
        ? ["life", "mixed", "work"]
        : ["mixed", "work", "life"];
  const intro = brief.trim() || missions[id].prompt;
  if (id === "morning") {
    const inbox = [
      {
        category: "work",
        priority: 1,
        title: "Review the design draft",
        body: "The sample project review is due today. Set aside 20 minutes and send your three most useful comments.",
      },
      {
        category: "life",
        priority: 1,
        title: "Reply to a friend",
        body: "A sample invitation is waiting. Pick a time that works and draft a short reply.",
      },
      {
        category: "mixed",
        priority: 1,
        title: "Protect a focus block",
        body: "Reserve one uninterrupted 30-minute block before you start opening everything else.",
      },
      {
        category: "work",
        priority: 2,
        title: "Prepare tomorrow’s outline",
        body: "Write the purpose, the decision needed, and three talking points for the sample team meeting.",
      },
      {
        category: "life",
        priority: 2,
        title: "Make the small errand list",
        body: "Combine the sample library return and grocery reminder into one trip.",
      },
      {
        category: "mixed",
        priority: 2,
        title: "Leave newsletters for later",
        body: "Two sample newsletters can wait. Keep them outside the first attention block.",
      },
    ];
    const selected = [...inbox]
      .sort(
        (a, b) =>
          order.indexOf(a.category) - order.indexOf(b.category) ||
          a.priority - b.priority,
      )
      .slice(0, 3);
    return {
      title: "Your morning, untangled",
      intro,
      sections: selected.map(({ title, body }) => ({ title, body })),
      footnote:
        "Sorted from six sample inbox items. Your focus changes the order. Nothing was sent or scheduled.",
    };
  }
  if (id === "research") {
    const shelf = [
      {
        category: "work",
        title: "Write a brief someone can act on",
        body: "20-minute practice · Turn one fuzzy request into a goal, an audience, and an observable outcome.",
      },
      {
        category: "life",
        title: "Keep a field notebook",
        body: "15-minute practice · Take a short walk and record five things you usually pass without noticing.",
      },
      {
        category: "mixed",
        title: "Ask a better question",
        body: "10-minute practice · Rewrite a question three ways: what changed, what matters, and what would prove it?",
      },
      {
        category: "work",
        title: "Trace a tiny automation",
        body: "25-minute practice · Map a trigger, an action, and a way to tell whether the action succeeded.",
      },
      {
        category: "life",
        title: "Learn through one small project",
        body: "30-minute practice · Choose a small thing you can finish today and write down what it taught you.",
      },
    ];
    const selected = [...shelf]
      .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category))
      .slice(0, 3);
    return {
      title: "Three worthwhile rabbit holes",
      intro,
      sections: selected.map(({ title, body }) => ({ title, body })),
      footnote:
        "Selected from an authored practice shelf. These are sample activities, not live search results.",
    };
  }
  const activities =
    focus === "work"
      ? [
          "A quiet project session",
          "A walk away from the screen",
          "Plan one small next step",
        ]
      : focus === "life"
        ? [
            "A slow neighborhood walk",
            "Make something for lunch",
            "Visit a bookshop or read at home",
          ]
        : [
            "Finish one small errand",
            "A walk and an unhurried lunch",
            "An hour for a personal project",
          ];
  return {
    title: "A little room for a good day",
    intro,
    sections: activities.map((title, i) => ({
      title: `${["10:00–10:40", "11:00–11:40", "12:00–12:40"][i]} · ${title}`,
      body: "40 minutes for this activity, then a 20-minute buffer. Move or replace it to suit your day.",
    })),
    footnote:
      "A computed three-hour sample itinerary with 120 minutes of activities and 60 minutes of buffer. Nothing was booked.",
  };
}
export function validCompanion(p: Companion): boolean {
  const uniqueGear = (items: GearId[]): boolean =>
    Array.isArray(items) &&
    items.length <= 5 &&
    new Set(items).size === items.length &&
    items.every((id) => Object.hasOwn(gear, id));
  const report = (r: Report): boolean =>
    typeof r.title === "string" &&
    typeof r.intro === "string" &&
    typeof r.footnote === "string" &&
    Array.isArray(r.sections) &&
    r.sections.length <= 6 &&
    r.sections.every(
      (s) => typeof s.title === "string" && typeof s.body === "string",
    );
  return (
    ["curious", "cozy", "bold"].includes(p.temperament) &&
    [p.xp, p.buttons, p.missions, p.greetings].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    ) &&
    uniqueGear(p.owned) &&
    uniqueGear(p.equipped) &&
    p.equipped.every((g) => p.owned.includes(g)) &&
    p.equipped.filter((g) => gear[g].cosmetic !== true).length <= 2 &&
    (p.assignment === null ||
      (Object.hasOwn(missions, p.assignment.id) &&
        typeof p.assignment.brief === "string" &&
        p.assignment.brief.length <= 240 &&
        ["balanced", "work", "life"].includes(p.assignment.focus) &&
        Number.isSafeInteger(p.assignment.duration) &&
        p.assignment.duration >= 1 &&
        p.assignment.duration <= 8 &&
        typeof p.assignment.failed === "boolean" &&
        (p.assignment.result === null || report(p.assignment.result)))) &&
    Array.isArray(p.journal) &&
    p.journal.length <= 12 &&
    p.journal.every(
      (j) =>
        Object.hasOwn(missions, j.mission) &&
        Number.isSafeInteger(j.at) &&
        typeof j.brief === "string" &&
        report(j.result),
    )
  );
}
