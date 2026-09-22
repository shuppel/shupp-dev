export type UnitId = "scout" | "author" | "reviewer";
export type StationId = "archive" | "workbench" | "observatory" | "client";
export type OrderKind = "research" | "draft" | "review" | "deliver" | "handoff";
export type ArtifactKind = "facts" | "draft" | "approved";
export interface Artifact {
  kind: ArtifactKind;
  text: string;
  sources: number;
  reviewed: boolean;
}
export interface Order {
  kind: OrderKind;
  target: UnitId | StationId;
  progress: number;
}
export interface Unit {
  id: UnitId;
  name: string;
  role: string;
  x: number;
  y: number;
  order: Order | null;
  paused: boolean;
  status: string;
  items: Artifact[];
  completed: number;
  log: { turn: number; text: string }[];
}
export interface Guild {
  version: 1;
  turn: number;
  units: Unit[];
  won: boolean;
  checks: { name: string; passed: boolean }[];
  delivered: string | null;
}
export const stations: {
  id: StationId;
  name: string;
  glyph: string;
  x: number;
  y: number;
  command: OrderKind;
}[] = [
  {
    id: "archive",
    name: "Archive",
    glyph: "▤",
    x: 1,
    y: 1,
    command: "research",
  },
  {
    id: "workbench",
    name: "Writing desk",
    glyph: "✎",
    x: 7,
    y: 1,
    command: "draft",
  },
  {
    id: "observatory",
    name: "Review tower",
    glyph: "◈",
    x: 7,
    y: 4,
    command: "review",
  },
  {
    id: "client",
    name: "Dispatch gate",
    glyph: "⚑",
    x: 1,
    y: 4,
    command: "deliver",
  },
];
export const artifactNames: Record<ArtifactKind, string> = {
  facts: "Source notes",
  draft: "Draft brief",
  approved: "Approved brief",
};
export const orderNames: Record<OrderKind, string> = {
  research: "Research",
  draft: "Write brief",
  review: "Review",
  deliver: "Deliver",
  handoff: "Handoff",
};
export const unitCommands: Record<UnitId, OrderKind[]> = {
  scout: ["research", "handoff"],
  author: ["draft", "handoff"],
  reviewer: ["review", "deliver", "handoff"],
};
export function freshGuild(): Guild {
  return {
    version: 1,
    turn: 0,
    won: false,
    checks: [],
    delivered: null,
    units: [
      { id: "scout", name: "Sora", role: "Researcher", x: 3, y: 3 },
      { id: "author", name: "Ren", role: "Writer", x: 4, y: 3 },
      { id: "reviewer", name: "Aki", role: "Reviewer", x: 5, y: 3 },
    ].map((u) => ({
      ...u,
      id: u.id as UnitId,
      order: null,
      paused: false,
      status: "Ready",
      items: [],
      completed: 0,
      log: [{ turn: 0, text: "Joined the party. Awaiting orders." }],
    })),
  };
}
function note(u: Unit, turn: number, text: string): void {
  u.log = [{ turn, text }, ...u.log].slice(0, 24);
}
export function latestItem(u: Unit): Artifact | undefined {
  return (
    u.items.find((a) => a.kind === "approved") ??
    u.items.find((a) => a.kind === "draft") ??
    u.items.find((a) => a.kind === "facts")
  );
}
export function validTarget(
  s: Guild,
  id: UnitId,
  kind: OrderKind,
  target: string,
): boolean {
  const u = s.units.find((a) => a.id === id);
  if (!u || u.order !== null || s.won || !unitCommands[id].includes(kind))
    return false;
  if (kind === "handoff")
    return (
      latestItem(u) !== undefined &&
      target !== id &&
      s.units.some((a) => a.id === target)
    );
  return stations.some((n) => n.id === target && n.command === kind);
}
export function assignOrder(
  s: Guild,
  id: UnitId,
  kind: OrderKind,
  target: UnitId | StationId,
): Guild {
  if (!validTarget(s, id, kind, target)) return s;
  const next = structuredClone(s),
    u = next.units.find((a) => a.id === id);
  if (!u) return s;
  u.order = { kind, target, progress: 0 };
  u.status = "Order queued";
  u.paused = false;
  note(
    u,
    s.turn,
    `${orderNames[kind]} queued. Destination: ${stations.find((n) => n.id === target)?.name ?? next.units.find((a) => a.id === target)?.name ?? target}.`,
  );
  return next;
}
export function controlUnit(
  s: Guild,
  id: UnitId,
  action: "pause" | "cancel",
): Guild {
  const next = structuredClone(s),
    u = next.units.find((a) => a.id === id);
  if (!u?.order) return s;
  if (action === "pause") {
    u.paused = !u.paused;
    note(u, s.turn, u.paused ? "Order paused." : "Order resumed.");
  } else {
    u.order = null;
    u.paused = false;
    u.status = "Ready";
    note(u, s.turn, "Order cancelled. Existing artifacts retained.");
  }
  return next;
}
function move(u: Unit, x: number, y: number): void {
  if (u.x !== x) u.x += Math.sign(x - u.x);
  else if (u.y !== y) u.y += Math.sign(y - u.y);
}
function give(u: Unit, item: Artifact): void {
  const invalidated =
    item.kind === "facts"
      ? ["draft", "approved"]
      : item.kind === "draft"
        ? ["approved"]
        : [];
  u.items = [
    ...u.items.filter(
      (a) => a.kind !== item.kind && !invalidated.includes(a.kind),
    ),
    { ...item },
  ];
}
function finish(u: Unit, turn: number, text: string): void {
  u.order = null;
  u.status = "Ready";
  u.completed++;
  note(u, turn, text);
}
export function advanceGuild(s: Guild): Guild {
  if (s.won) return s;
  const next = structuredClone(s);
  next.turn++;
  for (const u of next.units) {
    const order = u.order;
    if (!order || u.paused) continue;
    if (order.kind === "handoff") {
      const recipient = next.units.find((a) => a.id === order.target),
        item = latestItem(u);
      if (!recipient || !item) {
        finish(
          u,
          next.turn,
          "Handoff cancelled: missing recipient or artifact.",
        );
        continue;
      }
      if (Math.abs(u.x - recipient.x) + Math.abs(u.y - recipient.y) > 1) {
        move(u, recipient.x, recipient.y);
        u.status = `Carrying ${artifactNames[item.kind]}`;
        continue;
      }
      give(recipient, item);
      if (recipient.id === "reviewer" && item.kind !== "approved")
        next.checks = [];
      note(
        recipient,
        next.turn,
        `${artifactNames[item.kind]} received from ${u.name}.`,
      );
      finish(
        u,
        next.turn,
        `${artifactNames[item.kind]} handed to ${recipient.name}.`,
      );
      continue;
    }
    const station = stations.find((n) => n.id === order.target);
    if (!station) continue;
    if (u.x !== station.x || u.y !== station.y) {
      move(u, station.x, station.y);
      u.status = `Moving to ${station.name}`;
      continue;
    }
    const required =
      order.kind === "draft"
        ? "facts"
        : order.kind === "review"
          ? "draft"
          : order.kind === "deliver"
            ? "approved"
            : null;
    const input = u.items.find((a) => a.kind === required);
    if (required !== null && !input) {
      const status = `Waiting for ${artifactNames[required]}`;
      if (u.status !== status)
        note(u, next.turn, `${status}. A party member must hand it over.`);
      u.status = status;
      continue;
    }
    order.progress++;
    u.status = `${orderNames[order.kind]} · ${order.progress}/2`;
    if (order.progress < 2) continue;
    if (order.kind === "research") {
      give(u, {
        kind: "facts",
        sources: 2,
        reviewed: false,
        text: "Source 1 · Interview: operators miss overnight failures.\nSource 2 · Support log: people need a clear next action after a failed run.",
      });
      finish(u, next.turn, "Two sources collected. Hand Source notes to Ren.");
    } else if (order.kind === "draft" && input) {
      give(u, {
        kind: "draft",
        sources: input.sources,
        reviewed: false,
        text: "Morning brief\n\nShow overnight failures first. For each failed job, show the last successful run, the error, and one clear retry action.\n\nEvidence: operator interview + support log.",
      });
      finish(
        u,
        next.turn,
        "Brief written from source notes. Hand Draft brief to Aki.",
      );
    } else if (order.kind === "review" && input) {
      next.checks = [
        { name: "Two source references attached", passed: input.sources >= 2 },
        {
          name: "Brief contains a proposed action",
          passed: input.text.includes("retry action"),
        },
        { name: "Evidence is cited", passed: input.text.includes("Evidence:") },
      ];
      if (next.checks.every((c) => c.passed)) {
        give(u, { ...input, kind: "approved", reviewed: true });
        finish(
          u,
          next.turn,
          "3/3 checks passed. Deliver Approved brief to the gate.",
        );
      } else
        finish(
          u,
          next.turn,
          "Review failed. Inspect evidence before delivering.",
        );
    } else if (order.kind === "deliver" && input?.reviewed === true) {
      next.won = true;
      next.delivered = input.text;
      finish(u, next.turn, "Approved brief delivered. Party mission complete.");
    }
  }
  return next;
}
