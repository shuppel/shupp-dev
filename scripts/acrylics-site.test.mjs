import test from "node:test";
import assert from "node:assert/strict";
import {
  restoreSelection,
  matchesProject,
  composeBrief,
} from "../public/acrylics/site-state.mjs";
const valid = new Set(["red", "green"]);
test("stored collections reject corrupt data and retired project IDs", () => {
  assert.deepEqual([...restoreSelection("{broken", valid)], []);
  assert.deepEqual([...restoreSelection('{"id":"red"}', valid)], []);
  assert.deepEqual(
    [...restoreSelection('["red","deleted",null,"green","red"]', valid)],
    ["red", "green"],
  );
});
test("search and category apply together, ignoring query case and surrounding whitespace", () => {
  const project = { category: "Design", search: "void css ceramic" };
  assert.equal(matchesProject(project, "Design", " CSS "), true);
  assert.equal(matchesProject(project, "Products", "CSS"), false);
  assert.equal(matchesProject(project, "all", "missing"), false);
});
test("brief includes selected references, exact visitor text, and canonical URLs", () => {
  const draft = composeBrief(
    {
      name: " Alex ",
      email: "alex@example.com",
      interest: "A website",
      idea: "A & B + a little <texture>",
    },
    [{ title: "Void", href: "/design/void" }],
  );
  assert.match(draft, /A & B \+ a little <texture>/);
  assert.match(draft, /Void: https:\/\/shupp.dev\/design\/void/);
  assert.match(draft, /Alex\nalex@example.com$/);
});
