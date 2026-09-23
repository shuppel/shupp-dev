export interface Point {
  x: number;
  y: number;
}
export type ObjectId =
  | "source"
  | "tests"
  | "implementer"
  | "verifier"
  | "task"
  | "patch";
export type ActorId = "operator" | "implementer" | "verifier";
export type ItemId = "source" | "tests" | "patch";
export type Command = "implement" | "verify" | "apply";
export interface FieldObject extends Point {
  id: ObjectId;
  label: string;
  kind: "file" | "agent" | "task" | "patch";
}
export const objects: FieldObject[] = [
  { id: "source", label: "search.ts", kind: "file", x: 23, y: 46 },
  { id: "tests", label: "search.test.ts", kind: "file", x: 24, y: 70 },
  { id: "implementer", label: "Implementer", kind: "agent", x: 43, y: 43 },
  { id: "verifier", label: "Verifier", kind: "agent", x: 48, y: 72 },
  { id: "task", label: "Search guard", kind: "task", x: 79, y: 44 },
  { id: "patch", label: "Proposed patch", kind: "patch", x: 72, y: 72 },
];
export const spawn: Point = { x: 13, y: 78 };
export const moveKeys = new Set([
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "w",
  "a",
  "s",
  "d",
]);
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
export function approach(p: Point): Point {
  return { x: clamp(p.x - 6, 8, 92), y: clamp(p.y + 9, 25, 88) };
}
export function inBounds(p: Point): boolean {
  return p.x >= 8 && p.x <= 92 && p.y >= 25 && p.y <= 88;
}
export function walkable(p: Point, blocks: Point[]): boolean {
  return inBounds(p) && blocks.every((b) => distance(p, b) > 4.2);
}
/** Small eight-way navigation grid: routes around objects; no corner cutting. */
export function findPath(from: Point, to: Point, blocks: Point[]): Point[] {
  const cols = 43,
    rows = 32;
  const node = (p: Point): number =>
    clamp(Math.round((p.y - 25) / 2), 0, rows - 1) * cols +
    clamp(Math.round((p.x - 8) / 2), 0, cols - 1);
  const point = (n: number): Point => ({
    x: 8 + (n % cols) * 2,
    y: 25 + Math.floor(n / cols) * 2,
  });
  const start = node(from);
  let end = node(to);
  if (!walkable(point(end), blocks)) {
    let best = Infinity;
    for (let i = 0; i < cols * rows; i++) {
      const p = point(i),
        d = distance(p, to);
      if (walkable(p, blocks) && d < best) {
        best = d;
        end = i;
      }
    }
  }
  const open = new Set([start]),
    cost = new Map([[start, 0]]),
    parents = new Map<number, number>();
  let iterations = 0;
  while (open.size > 0 && iterations++ < cols * rows) {
    let current = start,
      best = Infinity;
    for (const n of open) {
      const f = (cost.get(n) ?? Infinity) + distance(point(n), point(end));
      if (f < best) {
        best = f;
        current = n;
      }
    }
    if (current === end) {
      const path: Point[] = [];
      let n = end;
      while (n !== start) {
        path.unshift(point(n));
        const prev = parents.get(n);
        if (prev === undefined) break;
        n = prev;
      }
      return path;
    }
    open.delete(current);
    const p = point(current);
    for (const [dx, dy] of [
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2],
      [2, 2],
      [2, -2],
      [-2, 2],
      [-2, -2],
    ]) {
      const next = { x: p.x + dx, y: p.y + dy };
      if (!walkable(next, blocks)) continue;
      if (
        dx !== 0 &&
        dy !== 0 &&
        (!walkable({ x: p.x + dx, y: p.y }, blocks) ||
          !walkable({ x: p.x, y: p.y + dy }, blocks))
      )
        continue;
      const n = node(next),
        g = (cost.get(current) ?? 0) + Math.hypot(dx, dy);
      if (g < (cost.get(n) ?? Infinity)) {
        cost.set(n, g);
        parents.set(n, current);
        open.add(n);
      }
    }
  }
  return [];
}
