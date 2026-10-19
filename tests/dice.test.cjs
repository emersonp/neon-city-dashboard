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
