// Run with: node --test tests/dice.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../dice.js");
const { roll, fmtTens } = globalThis.NCD_DICE;

// Feeds roll() a fixed sequence of d10 results: tens, ones, then advantage dice, then challenge dice.
const seq = (...values) => () => { if (!values.length) throw new Error("rng exhausted"); return values.shift(); };

test("tens and ones make the total; 00 + 0 is 100", () => {
  assert.equal(roll({}, seq(4, 2)).total, 42);
  assert.equal(roll({}, seq(0, 7)).total, 7);
  assert.equal(roll({}, seq(0, 0)).total, 100);
});

test("no target means no verdict", () => {
  assert.equal(roll({}, seq(4, 2)).success, null);
  assert.equal(roll({ target: null }, seq(4, 2)).success, null);
});

test("rolling at or under the target succeeds", () => {
  assert.equal(roll({ target: 42 }, seq(4, 2)).success, true);
  assert.equal(roll({ target: 50 }, seq(4, 2)).success, true);
  assert.equal(roll({ target: 41 }, seq(4, 2)).success, false);
  assert.equal(roll({ target: 99 }, seq(0, 0)).success, false);
});

test("advantage dice show a boon on even d10 results (4 of 8 faces)", () => {
  const r = roll({ advantage: 3 }, seq(1, 1, 0, 3, 8));
  assert.deepEqual(r.adv, [true, false, true]);
  assert.equal(r.boons, 2);
});

test("challenge dice show a drawback on d10 results under 6 (6 of 10 faces)", () => {
  const r = roll({ challenge: 3 }, seq(1, 1, 5, 6, 0));
  assert.deepEqual(r.chal, [true, false, true]);
  assert.equal(r.drawbacks, 2);
});

test("boons and drawbacks cancel one for one", () => {
  const r = roll({ advantage: 2, challenge: 3 }, seq(1, 1, 0, 2, 0, 0, 9));
  assert.equal(r.boons, 2);
  assert.equal(r.drawbacks, 2);
  assert.equal(r.net, 0);
  assert.equal(r.cancelled, 2);
  const r2 = roll({ advantage: 3, challenge: 1 }, seq(1, 1, 0, 2, 4, 0));
  assert.equal(r2.net, 2);
  assert.equal(r2.cancelled, 1);
});

test("pool sizes are clamped to 0-4", () => {
  const r = roll({ advantage: 9, challenge: -2 }, seq(1, 1, 0, 0, 0, 0));
  assert.equal(r.adv.length, 4);
  assert.equal(r.chal.length, 0);
});

test("tens die reads 00 for zero", () => {
  assert.equal(fmtTens(0), "00");
  assert.equal(fmtTens(7), "70");
});

test("default rng only produces 0-9", () => {
  for (let i = 0; i < 2000; i++) {
    const r = roll();
    assert.ok(r.tens >= 0 && r.tens <= 9 && r.ones >= 0 && r.ones <= 9);
    assert.ok(r.total >= 1 && r.total <= 100);
  }
});

test("impact: added to the total on a success, otherwise none", () => {
  assert.equal(roll({ target: 45, impact: 20 }, seq(3, 2)).impact, 52);
  assert.equal(roll({ target: 20, impact: 20 }, seq(3, 2)).impact, null);
  assert.equal(roll({ impact: 20 }, seq(3, 2)).impact, null);
  for (const bad of [0, -5, 1.5, "", null, "x"]) assert.equal(roll({ target: 45, impact: bad }, seq(3, 2)).impact, null, String(bad));
});

test("tables: the first column's head names the die", () => {
  const { tableDie } = globalThis.NCD_DICE;
  assert.equal(tableDie({ head: ["d100", "Positive"] }), 100);
  assert.equal(tableDie({ head: ["D6", "Result"] }), 6);
  assert.equal(tableDie({ head: ["Tool set", "Skills"] }), null);
});

test("tables: the roll picks the row whose range it falls in", () => {
  const { rollTable } = globalThis.NCD_DICE;
  const table = { head: ["d100", "Positive", "Negative"], rows: [["01-10", "a", "b"], ["11-95", "c", "d"], ["96-00", "e", "f"]] };
  assert.deepEqual(rollTable(table, seq(0, 1)), { die: 100, total: 1, row: 0 });
  assert.deepEqual(rollTable(table, seq(1, 0)), { die: 100, total: 10, row: 0 });
  assert.deepEqual(rollTable(table, seq(4, 7)), { die: 100, total: 47, row: 1 });
  assert.deepEqual(rollTable(table, seq(0, 0)), { die: 100, total: 100, row: 2 });
  assert.equal(rollTable({ head: ["Name"], rows: [] }), null);
});

test("tables: every roll on the random gear keywords table lands on a row", () => {
  require("../tables.js");
  const { rollTable } = globalThis.NCD_DICE;
  const table = { head: ["d100"], rows: globalThis.NCD_TABLES.randomKeywords };
  for (let tens = 0; tens < 10; tens++) for (let ones = 0; ones < 10; ones++) {
    assert.notEqual(rollTable(table, seq(tens, ones)).row, -1, `${tens}${ones}`);
  }
});

test("tables: small dice read off d10s, every face reachable", () => {
  const { rollDie } = globalThis.NCD_DICE;
  assert.equal(rollDie(6, seq(5)), 6);
  assert.equal(rollDie(6, seq(7, 2)), 3); // 6-9 rerolled
  assert.equal(rollDie(4, seq(8, 3)), 4);
  for (let i = 0; i < 500; i++) { const n = rollDie(20); assert.ok(n >= 1 && n <= 20); }
});
