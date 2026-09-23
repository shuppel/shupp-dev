import type { CreatureKind } from "./creatureEngine";
import type { Temperament } from "./companions";

export interface Genome {
  version: 1;
  seed: number;
}
export interface Hatchling {
  kind: CreatureKind;
  genome: Genome;
  temperament: Temperament;
}
export const palettes = [
  {
    name: "Lichen & slate",
    hide: "#84927b",
    belly: "#b7baa0",
    mark: "#485d53",
    iris: "#b6a164",
  },
  {
    name: "Ochre & peat",
    hide: "#ad9574",
    belly: "#c9ba9e",
    mark: "#65574a",
    iris: "#b49c63",
  },
  {
    name: "Clay & ash",
    hide: "#a68a7c",
    belly: "#c5b4a0",
    mark: "#61565b",
    iris: "#ad9f78",
  },
  {
    name: "Chalk & olive",
    hide: "#bab49b",
    belly: "#d3c9ad",
    mark: "#73735a",
    iris: "#a99258",
  },
  {
    name: "Moss & umber",
    hide: "#7c8765",
    belly: "#b4b293",
    mark: "#4d5747",
    iris: "#b4a27a",
  },
  {
    name: "Shale & copper",
    hide: "#899293",
    belly: "#b7b9ad",
    mark: "#5a6570",
    iris: "#b18b59",
  },
] as const;
export type Marking = "freckles" | "bands" | "marbling";
export interface Phenotype {
  palette: (typeof palettes)[number];
  marking: Marking;
  build: "rangy" | "sturdy" | "low-slung";
  width: number;
  height: number;
  length: number;
  head: number;
  tail: number;
  crest: number;
  neck: number;
  roughness: number;
}
export function seededRandom(seed: number): () => number {
  let n = seed >>> 0;
  return () => {
    n += 0x6d2b79f5;
    let t = n;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function validGenome(value: unknown): value is Genome {
  if (value === null || typeof value !== "object") return false;
  const g = value as Partial<Genome>;
  return (
    g.version === 1 &&
    typeof g.seed === "number" &&
    Number.isSafeInteger(g.seed) &&
    g.seed >= 0 &&
    g.seed <= 0xffffffff
  );
}
export function legacyGenome(id: number, name: string, kind: string): Genome {
  let seed = 2166136261;
  for (const c of `${id}:${name}:${kind}`) {
    seed ^= c.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return { version: 1, seed: seed >>> 0 };
}
export function phenotype(genome: Genome): Phenotype {
  const rand = seededRandom(genome.seed),
    palette = palettes[Math.floor(rand() * palettes.length)],
    marking = (["freckles", "bands", "marbling"] as const)[
      Math.floor(rand() * 3)
    ],
    build = (["rangy", "sturdy", "low-slung"] as const)[Math.floor(rand() * 3)];
  return {
    palette,
    marking,
    build,
    width:
      (build === "sturdy" ? 1.13 : build === "rangy" ? 0.89 : 1.02) *
      (0.96 + rand() * 0.08),
    height:
      (build === "rangy" ? 1.12 : build === "low-slung" ? 0.91 : 1) *
      (0.97 + rand() * 0.06),
    length: 0.92 + rand() * 0.18,
    head: 0.9 + rand() * 0.15,
    tail: 0.86 + rand() * 0.3,
    crest: 0.75 + rand() * 0.45,
    neck: 0.91 + rand() * 0.18,
    roughness: 0.58 + rand() * 0.15,
  };
}
export function rollHatch(
  seed: number,
  nest: CreatureKind | "surprise" = "surprise",
): Hatchling {
  const genome = { version: 1 as const, seed: seed >>> 0 },
    rand = seededRandom((seed ^ 0xafd17829) >>> 0);
  const kind =
    nest === "surprise"
      ? (["sprout", "finch", "moth"] as const)[Math.floor(rand() * 3)]
      : nest;
  return {
    kind,
    genome,
    temperament: (["curious", "cozy", "bold"] as const)[Math.floor(rand() * 3)],
  };
}
export function hatchSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
export const defaultGenome: Genome = { version: 1, seed: 73472 };
