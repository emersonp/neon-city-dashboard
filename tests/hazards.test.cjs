// Run with: node --test tests/hazards.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../shared.js");
require("../format.js");
require("../hazards.js");

const { hazards, DEFAULT_HIT, DEFAULT_DIFFICULTY } = globalThis.NCD_HAZARDS;
const { ICON_TOKENS } = globalThis.NCD_FORMAT;

test("hazards: the Playtest Packet's examples and the hazards in its jobs, each named once", () => {
  for (const name of ["Falling Concrete", "Intense Heat", "Strong Winds", "Narcotic Smoke", "Radiation Leak"]) {
    assert.ok(hazards.some((h) => h.name === name), name);
  }
  assert.equal(new Set(hazards.map((h) => h.name)).size, hazards.length);
});

test("hazards: the rulebook's defaults are a 50% hit and difficulty 50", () => {
  assert.equal(DEFAULT_HIT, 50);
  assert.equal(DEFAULT_DIFFICULTY, 50);
});

test("hazards: each has a page, a difficulty, a hit chance and its damage", () => {
  for (const h of hazards) {
    assert.ok(Number.isInteger(h.page) && h.page > 0, h.name);
    assert.ok(Number.isInteger(h.difficulty) && h.difficulty > 0 && h.difficulty % 10 === 0, h.name);
    assert.ok(Number.isInteger(h.hit) && h.hit >= 1 && h.hit <= 100, h.name);
    const { damage } = h;
    assert.ok(damage === "round" || damage === null || (Number.isInteger(damage) && damage > 0), h.name);
  }
});

test("hazards: a standard hazard hits half the time for 10 × the round", () => {
  const smoke = hazards.find((h) => h.name === "Narcotic Smoke");
  assert.deepEqual([smoke.hit, smoke.damage], [50, "round"]);
  assert.equal(hazards.find((h) => h.name === "Radiation Leak").damage, 20);
});

test("hazards: every description and effect has text, and only known icon tokens", () => {
  for (const h of hazards) {
    for (const text of [h.text, h.effect]) {
      assert.ok(typeof text === "string" && text.trim(), h.name);
      for (const [, token] of text.matchAll(/\[(\w+)\]/g)) assert.ok(ICON_TOKENS[token], `${h.name}: [${token}]`);
    }
  }
});
