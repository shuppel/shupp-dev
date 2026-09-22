export type CreatureKind = "sprout" | "finch" | "moth";
export type Job = "deliver" | "index" | "watch";
export type Upgrade = "wings" | "retry";
export interface Entry {
  at: number;
  text: string;
  tone: "info" | "good" | "bad";
}
export interface Worker {
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
  version: 1;
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
  version: 1,
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
  if (action.type === "run" && w.remaining === 0) begin(w, state.now, true);
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
    w.upgrades = w.upgrades.includes(action.upgrade)
      ? w.upgrades.filter((u) => u !== action.upgrade)
      : [...w.upgrades, action.upgrade];
    entry(
      w,
      state.now,
      `${action.upgrade === "wings" ? "Swift wings" : "Retry charm"} ${w.upgrades.includes(action.upgrade) ? "equipped" : "removed"}.`,
    );
  }
  if (
    action.type === "edit" &&
    w.remaining === 0 &&
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
            }
          } else {
            w.successes++;
            w.lastDuration = result.now - w.started;
            w.retrying = false;
            entry(w, result.now, `${jobs[w.job].output}.`, "good");
          }
        }
      }
      if (result.now >= w.next) {
        w.next = nextDue(result.now, w.interval);
        if (w.enabled) {
          if (w.remaining === 0) begin(w, result.now, false);
          else
            entry(
              w,
              result.now,
              "Scheduled occurrence skipped: previous run still active.",
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
    const s = JSON.parse(raw) as Nursery;
    if (
      s.version !== 1 ||
      !Number.isSafeInteger(s.now) ||
      s.now < 0 ||
      !Number.isSafeInteger(s.nextId) ||
      !Array.isArray(s.workers) ||
      s.workers.length > 6
    )
      return freshNursery();
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
        w.remaining <= 3 &&
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
      ? s
      : freshNursery();
  } catch {
    return freshNursery();
  }
}
