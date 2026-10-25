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
  yield ["alarm heat", T.alarmHeatIntro];
  for (const d of T.securityDefenses) yield [d.name, d.text];
  for (const g of [...T.objectives, ...T.obstacles, ...T.complications]) {
    yield [g.title, g.title];
    yield [g.title, g.intro];
    for (const e of g.entries) yield [e.name, e.text];
  }
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

test("tables: the complications come in the rulebook's three groups, each with entries", () => {
  assert.deepEqual(T.complications.map((g) => g.title), ["Minor complications (5 [heat])", "Major complications (10 [heat])", "Plot twists (20 [heat])"]);
  for (const g of T.complications) {
    assert.ok(g.entries.length, g.title);
    for (const e of g.entries) assert.ok(e.name.trim(), g.title);
  }
});

test("tables: every sample objective and security system objective names its difficulty", () => {
  for (const g of [...T.objectives, ...T.obstacles]) {
    for (const e of g.entries) if (e.tag) assert.match(e.tag, /^Objective · Difficulty \d+$/, e.name);
  }
});

test("tables: every headline news table covers 1-100", () => {
  assert.equal(T.headlines.length, 6);
  for (const t of T.headlines) {
    assert.equal(globalThis.NCD_DICE.tableDie(t), 100, t.title);
    let next = 1;
    for (const [range, text] of t.rows) {
      const [lo, hi] = range.split("-").map(Number);
      assert.equal(lo, next, `${t.title} ${range}`);
      next = hi + 1;
      assert.ok(text.trim(), range);
    }
    assert.equal(next, 101, t.title);
  }
});

// A rng for rollTable that rolls these d100 totals in turn (100 being 00 + 0).
const rolling = (...totals) => {
  const d10s = totals.flatMap((n) => [Math.floor(n / 10) % 10, n % 10]);
  return () => d10s.shift();
};

test("tables: headline news rolls each table in order, like the rulebook's example", () => {
  const news = T.headlineNews(rolling(16, 50, 7, 59, 26, 67, 11));
  assert.deepEqual(news.map((n) => n.question), ["Who is the subject?", "What happened?", "Who is the victim?",
    "What motivated this event?", "How did the victim respond?", "What truth does the story hide?"]);
  assert.deepEqual(news.map((n) => n.text), ["16: C04: The Digital Security Firm", "50: ...publicly denounced...",
    "07, then 59: C15: The Software Firm", "26: Covering up something even worse",
    "67: They have hired the G01: Body Butchers to exact revenge", "11: Something dangerous has gone missing during these events"]);
  assert.equal(T.headline(news), "C04: The Digital Security Firm publicly denounced C15: The Software Firm.");
});

test("tables: a motive sabotaging a third party rolls the third party on Table X-1", () => {
  const motive = T.headlineNews(rolling(1, 1, 21, 65, 23, 1, 1, 100))[3];
  assert.equal(motive.text, "65: Sabotaging some undertaking of a third party, then 23: C06: The Franchise Chain");
});

test("tables: the headline reads as a sentence, the victim lowercased mid-sentence", () => {
  assert.equal(T.headline(T.headlineNews(rolling(1, 20, 34, 1, 1, 1))),
    "C01: The Bank clashed violently with the citizens of a particular district.");
  assert.equal(T.headline(T.headlineNews(rolling(98, 100, 22, 1, 1, 1))),
    "X08: The Religious Group destroyed the homes/other property of an individual citizen.");
});
