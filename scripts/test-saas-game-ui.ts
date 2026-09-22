import {
  distance,
  findTownPath,
  isWalkable,
  nearbyPlace,
  nearbyWalkable,
  places,
  townSpawn,
  walkStep,
} from "../src/components/design/SaasGameUI/townModel";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  advanceNursery,
  actOnCompanion,
  adoptCompanion,
  changeWorker,
  freshNursery,
  hatch,
  restoreNursery,
} from "../src/components/design/SaasGameUI/creatureEngine";
import {
  levelFor,
  makeReport,
} from "../src/components/design/SaasGameUI/companions";
import {
  advanceGuild,
  assignOrder,
  controlUnit,
  freshGuild,
  validTarget,
  type Guild,
} from "../src/components/design/SaasGameUI/relayEngine";

void test("cron starts at UTC boundaries; manual runs do not change the schedule", () => {
  let state = hatch(freshNursery(), "Pip", "sprout", "deliver", 5);
  state = advanceNursery(state, 4);
  assert.equal(state.workers[0].runs, 0);
  state = advanceNursery(state);
  assert.equal(state.workers[0].runs, 1);
  assert.equal(state.workers[0].next, 10);
  state = advanceNursery(state, 3);
  assert.equal(state.workers[0].successes, 1);
  state = changeWorker(state, 1, { type: "run" });
  assert.equal(state.workers[0].next, 10);
  state = advanceNursery(state, 2);
  assert.equal(
    state.workers[0].runs,
    2,
    "overlapping scheduled occurrence must not create another run",
  );
  assert.ok(state.workers[0].log.some((l) => l.text.includes("skipped")));
});
void test("pause lets current work finish; edit computes the new next occurrence", () => {
  let state = hatch(freshNursery(), "Pip", "finch", "deliver", 5);
  state = advanceNursery(state, 5);
  state = changeWorker(state, 1, { type: "pause" });
  state = advanceNursery(state, 11);
  assert.equal(state.workers[0].runs, 1);
  assert.equal(state.workers[0].successes, 1);
  state = changeWorker(state, 1, {
    type: "edit",
    name: "Momo",
    interval: 30,
    job: "index",
  });
  assert.equal(state.workers[0].next, 30);
  state = changeWorker(state, 1, { type: "pause" });
  state = advanceNursery(state, 14);
  assert.equal(state.workers[0].runs, 2);
  assert.equal(state.workers[0].job, "index");
});
void test("augmentations change duration and recover one failed attempt without double-counting runs", () => {
  let state = hatch(freshNursery(), "Nori", "moth", "watch", 30);
  state = changeWorker(state, 1, { type: "upgrade", upgrade: "wings" });
  state = changeWorker(state, 1, { type: "upgrade", upgrade: "retry" });
  state = changeWorker(state, 1, { type: "fault" });
  state = changeWorker(state, 1, { type: "run" });
  const before = state.workers[0];
  state = changeWorker(state, 1, { type: "upgrade", upgrade: "wings" });
  assert.deepEqual(
    state.workers[0].upgrades,
    before.upgrades,
    "running equipment is locked",
  );
  state = advanceNursery(state);
  assert.equal(state.workers[0].retrying, true);
  state = advanceNursery(state);
  assert.equal(state.workers[0].successes, 1);
  assert.equal(state.workers[0].runs, 1);
  assert.equal(state.workers[0].attempts, 2);
  assert.equal(state.workers[0].failures, 0);
  assert.equal(state.workers[0].lastDuration, 2);
  state = changeWorker(state, 1, { type: "upgrade", upgrade: "retry" });
  state = changeWorker(state, 1, { type: "fault" });
  state = changeWorker(state, 1, { type: "run" });
  state = advanceNursery(state);
  assert.equal(state.workers[0].failures, 1);
});
void test("creatures keep independent schedules and survive a save without time travel", () => {
  let state = hatch(freshNursery(), "Pip", "sprout", "deliver", 5);
  state = hatch(state, "Momo", "finch", "index", 15);
  state = advanceNursery(state, 18);
  assert.equal(state.workers[0].successes, 3);
  assert.equal(state.workers[1].successes, 1);
  assert.deepEqual(restoreNursery(JSON.stringify(state)), state);
  assert.deepEqual(
    restoreNursery('{"version":1,"workers":[null]}'),
    freshNursery(),
  );
  assert.deepEqual(restoreNursery("null"), freshNursery());
});
function until(state: Guild, done: (s: Guild) => boolean): Guild {
  for (let i = 0; i < 80 && !done(state); i++) state = advanceGuild(state);
  assert.ok(done(state), "workflow failed to make progress");
  return state;
}
void test("role and target guards reject invalid orders; pause and cancellation stop progress", () => {
  let state = freshGuild();
  assert.equal(validTarget(state, "scout", "review", "observatory"), false);
  assert.equal(validTarget(state, "scout", "research", "client"), false);
  assert.equal(validTarget(state, "scout", "handoff", "author"), false);
  state = assignOrder(state, "scout", "research", "archive");
  state = controlUnit(state, "scout", "pause");
  const position = [state.units[0].x, state.units[0].y];
  state = advanceGuild(state);
  assert.deepEqual([state.units[0].x, state.units[0].y], position);
  state = controlUnit(state, "scout", "cancel");
  state = advanceGuild(state);
  assert.equal(state.units[0].order, null);
  assert.equal(state.units[0].items.length, 0);
});
void test("parallel agents wait for inputs, receive explicit handoffs, and deliver only reviewed evidence", () => {
  let state = freshGuild();
  state = assignOrder(state, "author", "draft", "workbench");
  state = assignOrder(state, "reviewer", "review", "observatory");
  state = until(
    state,
    (s) =>
      s.units[1].status.startsWith("Waiting") &&
      s.units[2].status.startsWith("Waiting"),
  );
  assert.equal(state.units[1].items.length, 0);
  state = assignOrder(state, "scout", "research", "archive");
  state = until(state, (s) => s.units[0].items.length > 0);
  assert.equal(
    state.units[1].items.length,
    0,
    "context must not leak across agents",
  );
  state = assignOrder(state, "scout", "handoff", "author");
  state = until(state, (s) => s.units[1].items.some((a) => a.kind === "draft"));
  assert.equal(state.units[0].items.length, 1, "handoff shares a reference");
  state = assignOrder(state, "author", "handoff", "reviewer");
  state = until(state, (s) =>
    s.units[2].items.some((a) => a.kind === "approved"),
  );
  assert.equal(state.checks.length, 3);
  assert.ok(state.checks.every((c) => c.passed));
  state = assignOrder(state, "reviewer", "deliver", "client");
  state = until(state, (s) => s.won);
  assert.equal(state.delivered?.includes("Morning brief"), true);
  assert.deepEqual(
    advanceGuild(state),
    state,
    "completed mission must stop execution",
  );
});
void test("review detects missing evidence and cannot produce an approved artifact", () => {
  let state = freshGuild();
  state.units[2].items = [
    {
      kind: "draft",
      text: "Unsupported proposal",
      sources: 0,
      reviewed: false,
    },
  ];
  state = assignOrder(state, "reviewer", "review", "observatory");
  state = until(state, (s) => s.checks.length > 0);
  assert.ok(state.checks.every((c) => !c.passed));
  assert.equal(
    state.units[2].items.some((a) => a.kind === "approved"),
    false,
  );
  state = assignOrder(state, "reviewer", "deliver", "client");
  state = until(state, (s) => s.units[2].status.startsWith("Waiting"));
  assert.equal(state.won, false);
});

void test("accepted missions award progression once and unlock an equipped specialty", () => {
  let state = adoptCompanion(freshNursery(), "Pip", "sprout", "cozy");
  assert.equal(state.workers[0].enabled, false);
  const locked = actOnCompanion(state, 1, {
    type: "mission",
    mission: "research",
    brief: "Explore",
    focus: "work",
  });
  assert.deepEqual(locked, state);
  state = actOnCompanion(state, 1, {
    type: "mission",
    mission: "morning",
    brief: "A calmer day",
    focus: "life",
  });
  state = advanceNursery(state, 4);
  assert.equal(
    state.workers[0].companion.xp,
    0,
    "completed work still needs acceptance",
  );
  assert.equal(
    state.workers[0].companion.assignment?.result?.sections[0].title,
    "Reply to a friend",
  );
  state = actOnCompanion(state, 1, { type: "accept" });
  assert.equal(state.workers[0].companion.xp, 30);
  assert.equal(levelFor(state.workers[0].companion.xp), 2);
  assert.equal(state.workers[0].companion.buttons, 30);
  assert.equal(state.workers[0].companion.journal.length, 1);
  assert.deepEqual(
    actOnCompanion(state, 1, { type: "accept" }),
    state,
    "no double reward",
  );
  state = actOnCompanion(state, 1, { type: "buy", item: "lens" });
  assert.equal(state.workers[0].companion.buttons, 12);
  assert.deepEqual(
    actOnCompanion(state, 1, { type: "buy", item: "lens" }),
    state,
    "no duplicate purchase",
  );
  assert.equal(
    actOnCompanion(state, 1, {
      type: "mission",
      mission: "research",
      brief: "Explore",
      focus: "work",
    }).workers[0].companion.assignment,
    null,
    "ownership alone does not equip a tool",
  );
  state = actOnCompanion(state, 1, { type: "equip", item: "lens" });
  state = actOnCompanion(state, 1, {
    type: "mission",
    mission: "research",
    brief: "Explore",
    focus: "work",
  });
  assert.equal(state.workers[0].remaining, 6);
  assert.deepEqual(
    actOnCompanion(state, 1, { type: "equip", item: "lens" }),
    state,
    "gear locks during a mission",
  );
  state = advanceNursery(state, 6);
  state = actOnCompanion(state, 1, { type: "accept" });
  assert.equal(levelFor(state.workers[0].companion.xp), 3);
  state = actOnCompanion(state, 1, { type: "buy", item: "planner" });
  state = actOnCompanion(state, 1, { type: "equip", item: "planner" });
  state = actOnCompanion(state, 1, {
    type: "mission",
    mission: "weekend",
    brief: "A lovely Saturday",
    focus: "balanced",
  });
  state = advanceNursery(state, 8);
  state = actOnCompanion(state, 1, { type: "accept" });
  assert.equal(state.workers[0].companion.missions, 3);
  assert.equal(levelFor(state.workers[0].companion.xp), 4);
  assert.equal(state.workers[0].companion.journal.length, 3);
});
void test("gear has a price and two functional slots; a cosmetic uses neither slot", () => {
  let state = adoptCompanion(freshNursery(), "Nori", "moth", "curious");
  state = actOnCompanion(state, 1, { type: "buy", item: "wings" });
  state = actOnCompanion(state, 1, { type: "buy", item: "retry" });
  assert.equal(state.workers[0].companion.buttons, 0);
  assert.deepEqual(
    actOnCompanion(state, 1, { type: "buy", item: "scarf" }),
    state,
  );
  state = actOnCompanion(state, 1, { type: "equip", item: "wings" });
  state = actOnCompanion(state, 1, { type: "equip", item: "retry" });
  state = changeWorker(state, 1, { type: "fault" });
  state = actOnCompanion(state, 1, {
    type: "mission",
    mission: "morning",
    brief: "Hello",
    focus: "balanced",
  });
  assert.equal(state.workers[0].remaining, 2);
  state = advanceNursery(state, 2);
  assert.equal(state.workers[0].retrying, true);
  state = advanceNursery(state);
  assert.ok(state.workers[0].companion.assignment?.result);
  assert.equal(state.workers[0].attempts, 2);
  state = actOnCompanion(state, 1, { type: "accept" });
  state = actOnCompanion(state, 1, { type: "buy", item: "lens" });
  assert.deepEqual(
    actOnCompanion(state, 1, { type: "equip", item: "lens" }),
    state,
  );
  state = actOnCompanion(state, 1, { type: "equip", item: "wings" });
  state = actOnCompanion(state, 1, { type: "equip", item: "lens" });
  assert.deepEqual(state.workers[0].upgrades, ["retry"]);
  state.workers[0].companion.buttons = 6;
  state = actOnCompanion(state, 1, { type: "buy", item: "scarf" });
  state = actOnCompanion(state, 1, { type: "equip", item: "scarf" });
  assert.equal(state.workers[0].companion.equipped.length, 3);
  assert.deepEqual(restoreNursery(JSON.stringify(state)), state);
});
void test("recalled, rejected, failed, and routine work cannot claim mission XP", () => {
  let state = adoptCompanion(freshNursery(), "Pip", "finch", "bold");
  state = actOnCompanion(state, 1, {
    type: "mission",
    mission: "morning",
    brief: "Help",
    focus: "work",
  });
  state = actOnCompanion(state, 1, { type: "cancelMission" });
  state = advanceNursery(state, 10);
  assert.equal(state.workers[0].companion.assignment, null);
  state = actOnCompanion(state, 1, {
    type: "mission",
    mission: "morning",
    brief: "Help",
    focus: "work",
  });
  state = advanceNursery(state, 4);
  state = actOnCompanion(state, 1, { type: "dismiss" });
  state = actOnCompanion(state, 1, { type: "accept" });
  assert.equal(state.workers[0].companion.xp, 0);
  state = changeWorker(state, 1, { type: "fault" });
  state = actOnCompanion(state, 1, {
    type: "mission",
    mission: "morning",
    brief: "Help",
    focus: "work",
  });
  state = advanceNursery(state, 4);
  assert.equal(state.workers[0].companion.assignment?.failed, true);
  assert.equal(state.workers[0].companion.assignment?.result, null);
  state = actOnCompanion(state, 1, { type: "accept" });
  assert.equal(state.workers[0].companion.xp, 0);
  state = actOnCompanion(state, 1, { type: "cancelMission" });
  state = changeWorker(state, 1, { type: "pause" });
  state = advanceNursery(state, 45);
  assert.ok(state.workers[0].successes > 1);
  assert.equal(state.workers[0].companion.xp, 0);
});
void test("existing worker saves migrate without losing schedules, equipment, or history", () => {
  let state = hatch(freshNursery(), "Old friend", "finch", "index", 5);
  state = changeWorker(state, 1, { type: "upgrade", upgrade: "wings" });
  state = advanceNursery(state, 8);
  const worker = Object.fromEntries(
    Object.entries(state.workers[0]).filter(([key]) => key !== "companion"),
  );
  const migrated = restoreNursery(
    JSON.stringify({ ...state, version: 1, workers: [worker] }),
  );
  assert.equal(migrated.version, 2);
  assert.equal(migrated.now, 8);
  assert.equal(migrated.workers[0].successes, 1);
  assert.equal(migrated.workers[0].enabled, true);
  assert.deepEqual(migrated.workers[0].companion.owned, ["wings"]);
  assert.deepEqual(migrated.workers[0].log, worker.log);
  assert.equal(migrated.workers[0].companion.xp, 0);
  assert.deepEqual(restoreNursery(JSON.stringify(migrated)), migrated);
});
void test("mission focus changes the sample artifact and long-term progress caps the visible level", () => {
  const work = makeReport("morning", "My request", "work"),
    life = makeReport("morning", "My request", "life");
  assert.notDeepEqual(work.sections, life.sections);
  assert.equal(work.intro, "My request");
  assert.equal(levelFor(9999), 5);
});

void test("every town entrance is physically reachable without crossing buildings", () => {
  for (const start of [townSpawn, ...places.map((p) => p.door)]) {
    for (const place of places) {
      const path = findTownPath(start, place.door);
      assert.ok(
        path.length > 0,
        `${place.id} reachable from ${JSON.stringify(start)}`,
      );
      assert.ok(path.every(isWalkable));
      assert.ok(distance(path[path.length - 1], place.door) < 0.01);
      for (let i = 1; i < path.length; i++)
        assert.ok(
          distance(path[i - 1], path[i]) <= 0.9,
          "no teleporting over blocked cells",
        );
    }
  }
});
void test("town interaction requires proximity; collisions and invalid destinations are enforced", () => {
  assert.equal(nearbyPlace(townSpawn), undefined);
  const shop = places.find((p) => p.id === "shop");
  assert.ok(shop);
  assert.equal(nearbyPlace(shop.door)?.id, "shop");
  assert.equal(isWalkable({ x: shop.x, z: shop.z }), false);
  assert.equal(isWalkable({ x: Infinity, z: 0 }), false);
  assert.equal(isWalkable({ x: 13, z: 0 }), false);
  assert.deepEqual(findTownPath(townSpawn, { x: shop.x, z: shop.z }), []);
  const atWall = { x: 7, z: -1.35 };
  assert.deepEqual(walkStep(atWall, { x: 7, z: -1.65 }), atWall);
  assert.equal(
    isWalkable({ x: 7, z: 6.5 }),
    true,
    "expedition arch has a walkable opening",
  );
});

void test("companions spawn and follow on valid ground near buildings", () => {
  for (const place of places) {
    const candidate = nearbyWalkable({
      x: place.door.x - 1.3,
      z: place.door.z + 1.1,
    });
    assert.ok(isWalkable(candidate));
    assert.ok(findTownPath(place.door, candidate).length > 0);
  }
});
