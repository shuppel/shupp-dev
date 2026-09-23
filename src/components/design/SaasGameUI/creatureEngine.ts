import { legacyGenome, validGenome, type Genome } from "./creatureGenetics";
import {
  freshCompanion,
  gear,
  levelFor,
  makeReport,
  missionLock,
  missions,
  validCompanion,
  type Companion,
  type Focus,
  type GearId,
  type MissionId,
  type Temperament,
} from "./companions";

export type CreatureKind = "sprout" | "finch" | "moth";
export type Job = "deliver" | "index" | "watch";
export type Upgrade = "wings" | "retry";
export interface Entry {
  at: number;
  text: string;
  tone: "info" | "good" | "bad";
}
export interface Worker {
  genome: Genome;
  companion: Companion;
  id: number;
  name: string;
  kind: CreatureKind;
  job: Job;
  interval: number;
  upgrades: Upgrade[];
  enabled: boolean;
  next: number;
  remaining: number;
  retrying: boolean;
  faultNext: boolean;
  runs: number;
  successes: number;
  failures: number;
  attempts: number;
  started: number;
  lastDuration: number | null;
  log: Entry[];
}
export interface Nursery {
  version: 2;
  now: number;
  nextId: number;
  workers: Worker[];
}
export const jobs: Record<
  Job,
  { name: string; place: string; output: string }
> = {
  deliver: {
    name: "Deliver digest",
    place: "Post office",
    output: "Daily digest delivered",
  },
  index: { name: "Index notes", place: "Archive", output: "12 notes indexed" },
  watch: {
    name: "Check uptime",
    place: "Watchtower",
    output: "3 services checked",
  },
};
export const freshNursery = (): Nursery => ({
  version: 2,
  now: 0,
  nextId: 1,
  workers: [],
});
export const clockLabel = (minute: number): string =>
  `D${Math.floor(minute / 1440) + 1} ${String(Math.floor(minute / 60) % 24).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
export const nextDue = (now: number, interval: number): number =>
  (Math.floor(now / interval) + 1) * interval;
function entry(
  w: Worker,
  now: number,
  text: string,
  tone: Entry["tone"] = "info",
): void {
  w.log = [{ at: now, text, tone }, ...w.log].slice(0, 30);
}
export function hatch(
  state: Nursery,
  name: string,
  kind: CreatureKind,
  job: Job,
  interval: number,
): Nursery {
  if (state.workers.length >= 6 || ![5, 15, 30].includes(interval))
    return state;
  const worker: Worker = {
    genome: legacyGenome(state.nextId, name.trim().slice(0, 24), kind),
    companion: freshCompanion(),
    id: state.nextId,
    name: name.trim().slice(0, 24) || `Worker ${state.nextId}`,
    kind,
    job,
    interval,
    upgrades: [],
    enabled: true,
    next: nextDue(state.now, interval),
    remaining: 0,
    retrying: false,
    faultNext: false,
    runs: 0,
    successes: 0,
    failures: 0,
    attempts: 0,
    started: 0,
    lastDuration: null,
    log: [{ at: state.now, text: "Hatched. Schedule enabled.", tone: "good" }],
  };
  return {
    ...state,
    nextId: state.nextId + 1,
    workers: [...state.workers, worker],
  };
}
function begin(w: Worker, now: number, manual: boolean): void {
  w.remaining = w.upgrades.includes("wings") ? 1 : 3;
  w.retrying = false;
  w.started = now;
  w.runs++;
  w.attempts++;
  entry(
    w,
    now,
    `${manual ? "Manual" : "Scheduled"} run started → ${jobs[w.job].place}.`,
  );
}
export type WorkerAction =
  | { type: "run" | "pause" | "fault" }
  | { type: "upgrade"; upgrade: Upgrade }
  | { type: "edit"; name: string; interval: number; job: Job };
export function changeWorker(
  state: Nursery,
  id: number,
  action: WorkerAction,
): Nursery {
  const result = structuredClone(state);
  const w = result.workers.find((worker) => worker.id === id);
  if (!w) return state;
  if (
    action.type === "run" &&
    w.remaining === 0 &&
    w.companion.assignment === null
  )
    begin(w, state.now, true);
  if (action.type === "pause") {
    w.enabled = !w.enabled;
    w.next = nextDue(state.now, w.interval);
    entry(
      w,
      state.now,
      w.enabled
        ? "Schedule resumed."
        : "Schedule paused. Current run can finish.",
    );
  }
  if (action.type === "fault" && w.remaining === 0) {
    w.faultNext = true;
    entry(w, state.now, "Next attempt will simulate a service timeout.");
  }
  if (action.type === "upgrade" && w.remaining === 0) {
    if (w.companion.assignment !== null) return state;
    if (
      !w.upgrades.includes(action.upgrade) &&
      w.companion.equipped.filter((id) => gear[id].cosmetic !== true).length >=
        2
    )
      return state;
    w.upgrades = w.upgrades.includes(action.upgrade)
      ? w.upgrades.filter((u) => u !== action.upgrade)
      : [...w.upgrades, action.upgrade];
    w.companion.owned = [...new Set([...w.companion.owned, action.upgrade])];
    w.companion.equipped = [
      ...w.companion.equipped.filter((id) => id !== "wings" && id !== "retry"),
      ...w.upgrades,
    ];
    entry(
      w,
      state.now,
      `${action.upgrade === "wings" ? "Swift wings" : "Retry charm"} ${w.upgrades.includes(action.upgrade) ? "equipped" : "removed"}.`,
    );
  }
  if (
    action.type === "edit" &&
    w.remaining === 0 &&
    w.companion.assignment === null &&
    [5, 15, 30].includes(action.interval)
  ) {
    w.name = action.name.trim().slice(0, 24) || w.name;
    w.interval = action.interval;
    w.job = action.job;
    w.next = nextDue(state.now, w.interval);
    entry(w, state.now, "Worker updated. Next run recalculated.");
  }
  return result;
}

export function adoptCompanion(
  state: Nursery,
  name: string,
  kind: CreatureKind,
  temperament: Temperament,
  genome?: Genome,
): Nursery {
  if (genome !== undefined && !validGenome(genome)) return state;
  const next = hatch(state, name, kind, "deliver", 15);
  if (next === state) return state;
  const w = next.workers[next.workers.length - 1];
  if (genome !== undefined) w.genome = { ...genome };
  w.enabled = false;
  w.companion.temperament = temperament;
  w.log = [
    {
      at: next.now,
      text: "Adopted! Ready for a first mission. Routines are off until you enable them.",
      tone: "good",
    },
  ];
  return next;
}
export type CompanionAction =
  | { type: "hello" }
  | { type: "buy" | "equip"; item: GearId }
  | { type: "mission"; mission: MissionId; brief: string; focus: Focus }
  | { type: "accept" | "dismiss" | "cancelMission" };

export function actOnCompanion(
  state: Nursery,
  id: number,
  action: CompanionAction,
): Nursery {
  const next = structuredClone(state),
    w = next.workers.find((worker) => worker.id === id);
  if (!w) return state;
  const pet = w.companion;
  if (action.type === "hello") pet.greetings++;
  if (action.type === "buy") {
    const item = gear[action.item];
    if (
      pet.owned.includes(action.item) ||
      pet.buttons < item.cost ||
      levelFor(pet.xp) < item.level
    )
      return state;
    pet.buttons -= item.cost;
    pet.owned.push(action.item);
    entry(
      w,
      next.now,
      `Bought ${item.name} for ${item.cost} buttons. Ready to equip.`,
    );
  }
  if (action.type === "equip") {
    if (
      !pet.owned.includes(action.item) ||
      pet.assignment !== null ||
      w.remaining > 0
    )
      return state;
    if (pet.equipped.includes(action.item))
      pet.equipped = pet.equipped.filter((item) => item !== action.item);
    else {
      if (
        gear[action.item].cosmetic !== true &&
        pet.equipped.filter((item) => gear[item].cosmetic !== true).length >= 2
      )
        return state;
      pet.equipped.push(action.item);
    }
    w.upgrades = pet.equipped.filter(
      (item): item is Upgrade => item === "wings" || item === "retry",
    );
    entry(
      w,
      next.now,
      `${gear[action.item].name} ${pet.equipped.includes(action.item) ? "equipped" : "put away"}.`,
    );
  }
  if (action.type === "mission") {
    if (
      w.remaining > 0 ||
      pet.assignment !== null ||
      missionLock(pet, action.mission) !== null
    )
      return state;
    const mission = missions[action.mission],
      duration = Math.max(
        1,
        mission.duration - (w.upgrades.includes("wings") ? 2 : 0),
      );
    pet.assignment = {
      id: action.mission,
      brief: action.brief.trim().slice(0, 240) || mission.prompt,
      focus: action.focus,
      duration,
      result: null,
      failed: false,
    };
    w.remaining = duration;
    w.started = next.now;
    w.retrying = false;
    w.runs++;
    w.attempts++;
    entry(w, next.now, `Set off on a mission: ${mission.title}.`);
  }
  if (action.type === "accept") {
    const assignment = pet.assignment;
    if (!assignment?.result || assignment.failed || w.remaining > 0)
      return state;
    const mission = missions[assignment.id],
      before = levelFor(pet.xp);
    pet.xp += mission.xp;
    pet.buttons += mission.buttons;
    pet.missions++;
    pet.journal = [
      {
        mission: assignment.id,
        at: next.now,
        brief: assignment.brief,
        result: assignment.result,
      },
      ...pet.journal,
    ].slice(0, 12);
    pet.assignment = null;
    entry(
      w,
      next.now,
      `Result accepted! +${mission.xp} XP · +${mission.buttons} buttons.${levelFor(pet.xp) > before ? ` Level ${levelFor(pet.xp)} reached!` : ""}`,
      "good",
    );
  }
  if (action.type === "dismiss" || action.type === "cancelMission") {
    if (pet.assignment === null) return state;
    if (action.type === "dismiss" && pet.assignment.result === null)
      return state;
    pet.assignment = null;
    w.remaining = 0;
    w.retrying = false;
    entry(
      w,
      next.now,
      action.type === "dismiss"
        ? "Result needs another pass. No XP or buttons awarded."
        : "Mission recalled. No reward claimed.",
    );
  }
  return next;
}
export function advanceNursery(state: Nursery, minutes = 1): Nursery {
  const result = structuredClone(state);
  for (let m = 0; m < minutes; m++) {
    result.now++;
    for (const w of result.workers) {
      if (w.remaining > 0) {
        w.remaining--;
        if (w.remaining === 0) {
          if (w.faultNext && !w.retrying) {
            w.faultNext = false;
            entry(w, result.now, "Attempt failed: service timeout.", "bad");
            if (w.upgrades.includes("retry")) {
              w.retrying = true;
              w.remaining = 1;
              w.attempts++;
              entry(w, result.now, "Retry charm: one automatic retry.");
            } else {
              w.failures++;
              w.lastDuration = result.now - w.started;
              if (w.companion.assignment !== null)
                w.companion.assignment.failed = true;
            }
          } else {
            w.successes++;
            w.lastDuration = result.now - w.started;
            w.retrying = false;
            const assignment = w.companion.assignment;
            if (assignment !== null) {
              assignment.result = makeReport(
                assignment.id,
                assignment.brief,
                assignment.focus,
              );
              entry(
                w,
                result.now,
                `Returned from ${missions[assignment.id].title}. Review the result to earn its reward.`,
                "good",
              );
            } else entry(w, result.now, `${jobs[w.job].output}.`, "good");
          }
        }
      }
      if (result.now >= w.next) {
        w.next = nextDue(result.now, w.interval);
        if (w.enabled) {
          if (w.remaining === 0 && w.companion.assignment === null)
            begin(w, result.now, false);
          else
            entry(
              w,
              result.now,
              w.companion.assignment !== null
                ? "Scheduled occurrence skipped: companion has a mission."
                : "Scheduled occurrence skipped: previous run still active.",
            );
        }
      }
    }
  }
  return result;
}
/** A bounded, versioned save. Never infer elapsed real time as missed cron runs. */
export function restoreNursery(raw: string | null): Nursery {
  if (raw === null || raw === "") return freshNursery();
  try {
    const s = JSON.parse(raw) as Omit<Nursery, "version"> & { version: number };
    if (
      ![1, 2].includes(s.version) ||
      !Number.isSafeInteger(s.now) ||
      s.now < 0 ||
      !Number.isSafeInteger(s.nextId) ||
      !Array.isArray(s.workers) ||
      s.workers.length > 6
    )
      return freshNursery();
    if (s.version === 1) {
      s.workers = s.workers.map((w) => ({
        ...w,
        companion: freshCompanion(w.upgrades),
      }));
      s.version = 2;
    }
    s.workers = s.workers.map((w) => ({
      ...w,
      genome: Object.hasOwn(w, "genome")
        ? w.genome
        : legacyGenome(w.id, w.name, w.kind),
    }));
    const valid = s.workers.every(
      (w) =>
        Number.isSafeInteger(w.id) &&
        w.id > 0 &&
        typeof w.name === "string" &&
        w.name.length <= 24 &&
        ["sprout", "finch", "moth"].includes(w.kind) &&
        Object.hasOwn(jobs, w.job) &&
        [5, 15, 30].includes(w.interval) &&
        Array.isArray(w.upgrades) &&
        w.upgrades.every((u) => ["wings", "retry"].includes(u)) &&
        typeof w.enabled === "boolean" &&
        typeof w.faultNext === "boolean" &&
        typeof w.retrying === "boolean" &&
        [
          w.next,
          w.remaining,
          w.runs,
          w.successes,
          w.failures,
          w.attempts,
          w.started,
        ].every((n) => Number.isSafeInteger(n) && n >= 0) &&
        w.remaining <= 8 &&
        validGenome(w.genome) &&
        validCompanion(w.companion) &&
        w.upgrades.length ===
          w.companion.equipped.filter((g) => g === "wings" || g === "retry")
            .length &&
        w.upgrades.every((g) => w.companion.equipped.includes(g)) &&
        (w.lastDuration === null || Number.isFinite(w.lastDuration)) &&
        Array.isArray(w.log) &&
        w.log.length <= 30 &&
        w.log.every(
          (l) =>
            typeof l.text === "string" &&
            Number.isFinite(l.at) &&
            ["info", "good", "bad"].includes(l.tone),
        ),
    );
    return valid &&
      new Set(s.workers.map((w) => w.id)).size === s.workers.length &&
      s.workers.every((w) => w.id < s.nextId)
      ? { ...s, version: 2 }
      : freshNursery();
  } catch {
    return freshNursery();
  }
}
