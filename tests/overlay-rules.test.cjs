// Run with: node --test tests/overlay-rules.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
require("../overlay-rules.js");
const { STATS, clampStat, cleanTicker, tidyTicker, PLANNING_MAX, planningLeft, planningStep, cleanPlanning, fmtClock, make, read,
  PHASES, cleanInitiative, stepPhase, stepInitiative } = globalThis.NCD_OVERLAY;

const source = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");
const TYPES = ["stat", "roll", "clearRoll", "ticker", "planning", "initiative", "ping", "overlayState"];

test("stats are kept to whole numbers within their limits", () => {
  assert.equal(clampStat("heat", 12), 12);
  assert.equal(clampStat("heat", -1), 0);
  assert.equal(clampStat("heat", 150), 99);
  assert.equal(clampStat("day", 11), 10);
  assert.equal(clampStat("influence", 2.6), 3);
  assert.equal(clampStat("influence", "abc"), 0);
  assert.equal(clampStat("luck", 5), null);
  assert.equal(clampStat("toString", 5), null);
  assert.deepEqual(Object.keys(STATS), ["heat", "influence", "day"]);
});

test("ticker items are trimmed text with blanks dropped", () => {
  assert.deepEqual(cleanTicker(["  Riots downtown ", "", "  ", null, "Curfew at 10"]), ["Riots downtown", "Curfew at 10"]);
  assert.deepEqual(cleanTicker("One item"), ["One item"]);
  assert.deepEqual(cleanTicker(undefined), []);
});

test("ticker boxes: blanks go, except the focused one, and a blank one waits at the end", () => {
  assert.deepEqual(tidyTicker([]), { remove: [], addBlank: true });
  assert.deepEqual(tidyTicker([""]), { remove: [], addBlank: false });
  assert.deepEqual(tidyTicker(["a"]), { remove: [], addBlank: true });
  assert.deepEqual(tidyTicker(["a", "", "b", ""]), { remove: [1], addBlank: false });
  assert.deepEqual(tidyTicker(["a", "", "b", ""], 1), { remove: [], addBlank: false });
  assert.deepEqual(tidyTicker(["", "", "b"]), { remove: [0, 1], addBlank: true });
  assert.deepEqual(tidyTicker(["a", " "]), { remove: [], addBlank: false });
});

test("the planning countdown starts, pauses, plays, takes more time and stops", () => {
  let p = planningStep(null, { action: "start", seconds: 180 }, 1000);
  assert.deepEqual(p, { running: true, left: 180000, at: 1000 });
  assert.equal(planningLeft(p, 11000), 170000);
  p = planningStep(p, { action: "pause" }, 11000);
  assert.deepEqual(p, { running: false, left: 170000, at: 11000 });
  assert.equal(planningLeft(p, 99000), 170000);           // paused, so it holds
  p = planningStep(p, { action: "add", seconds: 30 }, 20000);
  assert.deepEqual(p, { running: false, left: 200000, at: 20000 });
  p = planningStep(p, { action: "play" }, 30000);
  assert.equal(planningLeft(p, 230000), 0);
  assert.equal(planningLeft(p, 999999), 0);               // never below zero
  assert.equal(planningStep(p, { action: "stop" }, 40000), null);
  // nothing to pause, play or add to without a countdown; start needs some time
  for (const action of ["pause", "play", "add", "stop"]) assert.equal(planningStep(null, { action, seconds: 30 }, 0), null);
  assert.equal(planningStep(null, { action: "start", seconds: 0 }, 0), null);
  // +30 stops at 99:59
  assert.equal(planningStep({ running: false, left: PLANNING_MAX - 1000, at: 0 }, { action: "add", seconds: 30 }, 0).left, PLANNING_MAX);
});

test("a kept countdown comes back only if it's still going", () => {
  assert.deepEqual(cleanPlanning({ running: 1, left: 5000, at: 0 }, 1000), { running: true, left: 5000, at: 0 });
  assert.deepEqual(cleanPlanning({ running: false, left: 5000, at: 0 }, 1e9), { running: false, left: 5000, at: 0 });
  assert.equal(cleanPlanning({ running: true, left: 5000, at: 0 }, 6000), null);
  assert.equal(cleanPlanning({ left: "x", at: 0 }, 0), null);
  assert.equal(cleanPlanning(null, 0), null);
});

test("the clock shows minutes and seconds, rounding up", () => {
  assert.equal(fmtClock(900000), "15:00");
  assert.equal(fmtClock(899400), "15:00");
  assert.equal(fmtClock(180000), "03:00");
  assert.equal(fmtClock(59001), "01:00");
  assert.equal(fmtClock(1), "00:01");
  assert.equal(fmtClock(0), "00:00");
  assert.equal(fmtClock(-5), "00:00");
  assert.equal(fmtClock(PLANNING_MAX), "99:59");
});

test("make builds clean messages and refuses unusable ones", () => {
  assert.deepEqual(make("stat", { key: "heat", value: 120 }), { type: "stat", key: "heat", value: 99 });
  assert.deepEqual(make("ping"), { type: "ping" });
  assert.deepEqual(make("ticker", { items: ["a", " ", "b "] }), { type: "ticker", items: ["a", "b"] });
  // a dice.js result carries more than the overlay needs; only the roll's own fields go
  assert.deepEqual(make("roll", { tens: 4, ones: 2, target: 50, adv: [true], chal: [false, 1], total: 42, success: true }),
    { type: "roll", tens: 4, ones: 2, target: 50, adv: [true], chal: [false, true] });
  assert.deepEqual(make("roll", { tens: 0, ones: 0 }), { type: "roll", tens: 0, ones: 0, target: null, adv: [], chal: [] });
  assert.deepEqual(make("planning", { action: "add", seconds: 30 }), { type: "planning", action: "add", seconds: 30 });
  assert.deepEqual(make("planning", { action: "stop" }), { type: "planning", action: "stop", seconds: 0 });
  assert.throws(() => make("planning", { action: "rewind" }));
  assert.throws(() => make("dance"));
  assert.throws(() => make("stat", { key: "luck", value: 1 }));
  assert.throws(() => make("roll", { tens: 10, ones: 2 }));
});

test("read drops what it doesn't know and cleans what it does", () => {
  assert.equal(read(null), null);
  assert.equal(read("ping"), null);
  assert.equal(read({ type: "dance" }), null);
  assert.equal(read({ type: "__proto__" }), null);
  assert.equal(read({ type: "roll", tens: "4", ones: 2 }), null);
  assert.deepEqual(read({ type: "stat", key: "day", value: -3, app: "nco" }), { type: "stat", key: "day", value: 0 });
  assert.deepEqual(read({ type: "overlayState", heat: 3, influence: 200, ticker: ["x", ""] }),
    { type: "overlayState", heat: 3, influence: 99, day: null, ticker: ["x"], planning: null, initiative: null });
  assert.deepEqual(read({ type: "overlayState" }),
    { type: "overlayState", heat: null, influence: null, day: null, ticker: null, planning: null, initiative: null });
  assert.deepEqual(read({ type: "overlayState", planning: { running: 1, left: -4, at: 7 } }).planning, { running: true, left: 0 });
  for (const type of TYPES) assert.ok(read({ type, tens: 1, ones: 1, key: "heat", value: 1, action: "stop" }), type);
});

test("the pages send and handle only messages overlay-rules.js knows", () => {
  const dashboard = ["app.js", "admin.js", "admin-overlay.js", "admin-planning.js", "admin-initiative.js", "scene-runner.js"].map(source).join("\n");
  const sent = [...dashboard.matchAll(/\b(?:send|make)\("(\w+)"/g)].map((m) => m[1]);
  const overlay = source("overlay.html");
  const handled = [...overlay.matchAll(/msg\.type === "(\w+)"/g)].map((m) => m[1]);
  const overlaySent = [...overlay.matchAll(/\bmake\("(\w+)"/g)].map((m) => m[1]);
  assert.ok(sent.length && handled.length && overlaySent.length);
  for (const type of [...sent, ...handled, ...overlaySent]) assert.ok(TYPES.includes(type), type);
  // everything the dashboard sends, the overlay handles
  for (const type of sent) assert.ok(handled.includes(type), `overlay.html doesn't handle ${type}`);
});

test("initiative runs Hazard, Fast, Antagonists, Slow, and round again", () => {
  assert.deepEqual(PHASES, ["hazard", "fast", "antagonists", "slow"]);
  assert.equal(stepPhase("hazard", 1), "fast");
  assert.equal(stepPhase("slow", 1), "hazard");
  assert.equal(stepPhase("hazard", -1), "slow");
  assert.equal(stepPhase("nonsense", 1), "fast");
});

test("initiative messages are cleaned, with a round of at least 1", () => {
  assert.deepEqual(cleanInitiative({ conflict: 1, phase: "fast", round: 3 }), { conflict: true, phase: "fast", round: 3 });
  assert.deepEqual(cleanInitiative({ phase: "toString" }), { conflict: false, phase: "hazard", round: 1 });
  assert.deepEqual(cleanInitiative(null), { conflict: false, phase: "hazard", round: 1 });
  for (const round of [0, -2, 2.5, "x", null]) assert.equal(cleanInitiative({ round }).round, 1, String(round));
  assert.equal(cleanInitiative({ round: "4" }).round, 4);
  assert.deepEqual(make("initiative", { conflict: true, phase: "slow", round: 2 }),
    { type: "initiative", conflict: true, phase: "slow", round: 2 });
  assert.deepEqual(read({ type: "overlayState", initiative: { conflict: true, phase: "antagonists" } }).initiative,
    { conflict: true, phase: "antagonists", round: 1 });
});

test("stepping from Slow to Hazard starts the next round, and back again ends it, never below round 1", () => {
  const at = (phase, round) => ({ conflict: true, phase, round });
  assert.deepEqual(stepInitiative(at("hazard", 1), 1), at("fast", 1));
  assert.deepEqual(stepInitiative(at("slow", 1), 1), at("hazard", 2));
  assert.deepEqual(stepInitiative(at("hazard", 2), -1), at("slow", 1));
  assert.deepEqual(stepInitiative(at("fast", 2), -1), at("hazard", 2));
  assert.deepEqual(stepInitiative(at("hazard", 1), -1), at("slow", 1));
});
