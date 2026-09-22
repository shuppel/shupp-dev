export interface Point {
  x: number;
  z: number;
}
export type PlaceId = "hatchery" | "shop" | "missions" | "camp" | "gate";
export interface TownPlace {
  id: PlaceId;
  name: string;
  action: string;
  label: string;
  x: number;
  z: number;
  door: Point;
  width: number;
  depth: number;
  color: string;
}
export const places: TownPlace[] = [
  {
    id: "hatchery",
    name: "Fern & Fossil",
    action: "Meet a companion",
    label: "HATCHERY",
    x: -7,
    z: -4,
    door: { x: -7, z: -0.6 },
    width: 5.3,
    depth: 4.4,
    color: "#6e9980",
  },
  {
    id: "shop",
    name: "The Amber Outfitter",
    action: "Enter the store",
    label: "OUTFITTER",
    x: 7,
    z: -4,
    door: { x: 7, z: -0.6 },
    width: 5.3,
    depth: 4.4,
    color: "#c5794c",
  },
  {
    id: "missions",
    name: "Adventure board",
    action: "Choose a mission",
    label: "MISSIONS",
    x: 0,
    z: -5,
    door: { x: 0, z: -2.8 },
    width: 2.3,
    depth: 1,
    color: "#b99b64",
  },
  {
    id: "camp",
    name: "Keeper’s camp",
    action: "Set a routine",
    label: "CAMP",
    x: -7,
    z: 6,
    door: { x: -5, z: 5.4 },
    width: 3.2,
    depth: 3.2,
    color: "#ddbc69",
  },
  {
    id: "gate",
    name: "The wilds",
    action: "Check expeditions",
    label: "EXPEDITIONS",
    x: 7,
    z: 6.5,
    door: { x: 7, z: 4.7 },
    width: 3.3,
    depth: 1,
    color: "#809aad",
  },
];
export const townSpawn: Point = { x: 0, z: 5 };
export const distance = (a: Point, b: Point): number =>
  Math.hypot(a.x - b.x, a.z - b.z);
export function isWalkable(p: Point): boolean {
  if (
    !Number.isFinite(p.x) ||
    !Number.isFinite(p.z) ||
    Math.abs(p.x) > 12 ||
    Math.abs(p.z) > 10
  )
    return false;
  return !places.some(
    (b) =>
      !(b.id === "gate" && Math.abs(p.x - b.x) < 1.2) &&
      Math.abs(p.x - b.x) < b.width / 2 + 0.4 &&
      Math.abs(p.z - b.z) < b.depth / 2 + 0.4,
  );
}
export function nearbyPlace(p: Point): TownPlace | undefined {
  return places.find((b) => distance(p, b.door) < 1.75);
}
export function nearbyWalkable(p: Point): Point {
  if (isWalkable(p)) return p;
  for (let radius = 0.5; radius <= 4; radius += 0.5) {
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const candidate = {
        x: p.x + Math.cos(angle) * radius,
        z: p.z + Math.sin(angle) * radius,
      };
      if (isWalkable(candidate)) return candidate;
    }
  }
  return { ...townSpawn };
}
export function walkStep(from: Point, to: Point): Point {
  if (isWalkable(to)) return to;
  const x = { x: to.x, z: from.z };
  if (isWalkable(x)) return x;
  const z = { x: from.x, z: to.z };
  return isWalkable(z) ? z : from;
}
// A small navigation grid routes clicks around buildings; keyboard movement uses the same collision boundary.
export function findTownPath(start: Point, end: Point): Point[] {
  if (!isWalkable(end)) return [];
  const size = 0.5,
    key = (p: Point): string => `${p.x},${p.z}`;
  const snap = (p: Point): Point => ({
    x: Math.round(p.x / size) * size,
    z: Math.round(p.z / size) * size,
  });
  const from = snap(start),
    goal = snap(end),
    queue = [from],
    visited = new Map<string, Point | null>([[key(from), null]]);
  for (let i = 0; i < queue.length && i < 2500; i++) {
    const here = queue[i];
    if (distance(here, goal) < 0.1) {
      const path: Point[] = [end];
      let node: Point | null = here;
      while (node !== null) {
        path.unshift(node);
        node = visited.get(key(node)) ?? null;
      }
      path.shift();
      return path;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ]) {
      const next = { x: here.x + dx * size, z: here.z + dz * size };
      if (visited.has(key(next)) || !isWalkable(next)) continue;
      if (
        dx !== 0 &&
        dz !== 0 &&
        (!isWalkable({ x: next.x, z: here.z }) ||
          !isWalkable({ x: here.x, z: next.z }))
      )
        continue;
      visited.set(key(next), here);
      queue.push(next);
    }
  }
  return [];
}
