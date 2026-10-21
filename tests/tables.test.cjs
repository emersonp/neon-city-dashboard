// Run with: node --test tests/tables.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../shared.js");
require("../dice.js");
require("../characters.js");
require("../format.js");
require("../databank.js");
require("../tables.js");

const T = globalThis.NCD_TABLES;
const L = globalThis.NCD_DATABANK;
const { ICON_TOKENS } = globalThis.NCD_FORMAT;
const names = (list) => list.map((k) => k.name);

// Every piece of text the tab formats, with where it came from.
function* texts() {
  yield ["random keywords", T.randomKeywordsIntro];
  for (const t of T.securityTiers) yield [t.name, t.text];
  yield ["security tiers", T.securityTiersOutro];
  yield ["alarm heat", T.alarmHeatIntro];
  for (const d of T.securityDefenses) yield [d.name, d.text];
}

test("tables: every entry has text, and only known icon tokens", () => {
  for (const [where, text] of texts()) {
    assert.ok(typeof text === "string" && text.trim(), where);
    for (const [, token] of text.matchAll(/\[(\w+)\]/g)) assert.ok(ICON_TOKENS[token], `${where}: [${token}]`);
  }
});

test("tables: the random gear keywords table covers 1-100 with the gear keywords", () => {
  const positive = names(L.keywords.positive), negative = names(L.keywords.negative);
  let next = 1;
  for (const row of T.randomKeywords) {
    assert.equal(row.length, 3);
    const [range, pos, neg] = row;
    const [lo, hi] = range.split("-").map(Number);
    assert.equal(lo, next, range);
    next = hi + 1;
    assert.ok(positive.includes(pos), pos);
    assert.ok(negative.includes(neg), neg);
  }
  assert.equal(next, 101);
  // and every gear keyword can be rolled
  assert.deepEqual(new Set(T.randomKeywords.map((r) => r[1])), new Set(positive));
  assert.deepEqual(new Set(T.randomKeywords.map((r) => r[2])), new Set(negative));
});

test("tables: the liability table covers 1-100, and a roll always lands on a row", () => {
  const D = globalThis.NCD_DICE;
  let next = 1;
  for (const [range, text] of T.liabilities) {
    const [lo, hi] = range.split("-").map(Number);
    assert.equal(lo, next, range);
    next = hi + 1;
    assert.ok(text.trim(), range);
  }
  assert.equal(next, 101);
  const table = { head: ["d100", "Liability"], rows: T.liabilities };
  for (let n = 0; n < 100; n++) {
    const tens = Math.floor(n / 10), ones = n % 10; // every tens/ones pair, 00 + 0 being 100
    const rolls = [tens, ones];
    assert.ok(D.rollTable(table, () => rolls.shift()).row >= 0, String(n));
  }
});

test("tables: the distinctive visual traits table covers 1-100, and a roll always lands on a row", () => {
  const D = globalThis.NCD_DICE;
  let next = 1;
  for (const [range, text] of T.distinctiveTraits) {
    const [lo, hi] = range.split("-").map(Number);
    assert.equal(lo, next, range);
    next = hi + 1;
    assert.ok(text.trim(), range);
  }
  assert.equal(next, 101);
  const table = { head: ["d100", "Distinctive visual trait"], rows: T.distinctiveTraits };
  for (let n = 0; n < 100; n++) {
    const rolls = [Math.floor(n / 10), n % 10];
    assert.ok(D.rollTable(table, () => rolls.shift()).row >= 0, String(n));
  }
});

test("tables: every described security defense but X-ray scanners is named in a tier, so the table links to it", () => {
  const named = T.securityTiers.flatMap((t) => t.defenses).map((n) => n.toLowerCase());
  for (const d of T.securityDefenses) {
    if (d.name === "X-Ray Scanners") continue;
    assert.ok(named.includes(d.name.toLowerCase()), d.name);
  }
});

test("tables: the alarm heat table names each security tier but Unprotected, in order", () => {
  assert.deepEqual(T.alarmHeat.map(([tier]) => tier), T.securityTiers.slice(1).map((t) => t.name));
  for (const [tier, heat] of T.alarmHeat) assert.ok(Number.isInteger(heat) && heat > 0, tier);
});
