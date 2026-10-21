// Run with: node --test tests/lore.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../shared.js");
require("../format.js");
require("../lore.js");

const L = globalThis.NCD_LORE;
const { ICON_TOKENS } = globalThis.NCD_FORMAT;
const names = (list) => list.map((k) => k.name);

// Every piece of text the tab formats, with where it came from.
function* texts() {
  for (const s of L.gear) {
    if (s.intro) yield [s.title, s.intro];
    for (const e of s.entries) yield [e.name, e.text];
  }
  yield ["weapons", L.weaponsIntro];
  yield ["vehicles", L.vehicleRules];
  for (const v of L.vehicles) yield [v.name, v.text];
  yield ["keywords", L.keywordsIntro];
  yield ["random keywords", L.randomKeywordsIntro];
  for (const k of Object.values(L.keywords).flat()) yield [k.name, k.text];
}

test("lore: every entry has a name and text, and only known icon tokens", () => {
  for (const [where, text] of texts()) {
    assert.ok(typeof text === "string" && text.trim(), where);
    for (const [, token] of text.matchAll(/\[(\w+)\]/g)) assert.ok(ICON_TOKENS[token], `${where}: [${token}]`);
  }
});

test("lore: tables are rectangular", () => {
  const tables = L.gear.flatMap((s) => s.entries).filter((e) => e.table).map((e) => e.table);
  assert.ok(tables.length >= 2);
  for (const t of tables) for (const r of t.rows) assert.equal(r.length, t.head.length);
  for (const r of L.randomKeywords) assert.equal(r.length, 3);
});

test("lore: no keyword is listed twice in its group", () => {
  for (const [group, list] of Object.entries(L.keywords)) assert.equal(new Set(names(list)).size, list.length, group);
});

test("lore: the random gear keywords table covers 1-100 with the gear keywords", () => {
  const positive = names(L.keywords.positive), negative = names(L.keywords.negative);
  let next = 1;
  for (const [range, pos, neg] of L.randomKeywords) {
    const [lo, hi] = range.split("-").map(Number);
    assert.equal(lo, next, range);
    next = hi + 1;
    assert.ok(positive.includes(pos), pos);
    assert.ok(negative.includes(neg), neg);
  }
  assert.equal(next, 101);
  // and every gear keyword can be rolled
  assert.deepEqual(new Set(L.randomKeywords.map((r) => r[1])), new Set(positive));
  assert.deepEqual(new Set(L.randomKeywords.map((r) => r[2])), new Set(negative));
});

test("lore: weapons allow only weapon keywords, intrinsic ones included, and every weapon keyword is allowed somewhere", () => {
  const weaponKeywords = names(L.keywords.weapon);
  for (const w of L.weapons) {
    for (const k of w.allowed) assert.ok(weaponKeywords.includes(k), `${w.name}: ${k}`);
    for (const k of w.intrinsic) assert.ok(w.allowed.includes(k), `${w.name}: ${k}`);
    assert.ok([1, 2, null].includes(w.hands), w.name);
    assert.ok(w.damage > 0 && w.damage % 10 === 0, w.name);
  }
  for (const k of weaponKeywords) assert.ok(L.weapons.some((w) => w.allowed.includes(k)), k);
});
