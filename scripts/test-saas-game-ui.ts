import assert from "node:assert/strict";
import { test } from "node:test";
import {
  advanceNursery,
  changeWorker,
  freshNursery,
  hatch,
  restoreNursery,
} from "../src/components/design/SaasGameUI/creatureEngine";
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
