// Run with: node --test tests/databank.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../shared.js");
require("../dice.js");
require("../characters.js");
require("../format.js");
require("../databank.js");

const L = globalThis.NCD_DATABANK;
const { ICON_TOKENS } = globalThis.NCD_FORMAT;
const names = (list) => list.map((k) => k.name);

// Every piece of text the tab formats, with where it came from.
function* texts() {
  for (const s of L.gear) {
    if (s.intro) yield [s.title, s.intro];
    for (const e of s.entries) yield [e.name, e.text];
  }
  yield [L.armor.name, L.armor.text];
  yield ["weapons", L.weaponsIntro];
  yield ["vehicles", L.vehicleRules];
  for (const v of L.vehicles) yield [v.name, v.text];
  yield ["keywords", L.keywordsIntro];
  for (const k of Object.values(L.keywords).flat()) yield [k.name, k.text];
}

test("databank: every entry has a name and text, and only known icon tokens", () => {
  for (const [where, text] of texts()) {
    assert.ok(typeof text === "string" && text.trim(), where);
    for (const [, token] of text.matchAll(/\[(\w+)\]/g)) assert.ok(ICON_TOKENS[token], `${where}: [${token}]`);
  }
});

test("databank: tables are rectangular", () => {
  // the tool set and armor tables are built in app.js from toolSets and armor.levels
  const tables = [...L.gear.flatMap((s) => s.entries), L.armor].filter((e) => e.table).map((e) => e.table);
  for (const t of tables) for (const r of t.rows) assert.equal(r.length, t.head.length);
});

test("databank: keyword restrictions name real keywords and match their text", () => {
  const all = Object.values(L.keywords).flat(), known = new Set(all.map((k) => k.name));
  for (const k of all) {
    for (const n of [...(k.excludes ?? []), ...(k.requires ?? [])]) {
      assert.ok(known.has(n), `${k.name} → ${n}`);
      assert.match(k.text, new RegExp(n, "i"), `${k.name} text mentions ${n}`);
    }
    for (const where of k.notOn ?? []) assert.match(k.text, where === "vehicle" ? /[Vv]ehicles cannot/ : /Weapons cannot/, k.name);
  }
  assert.deepEqual(all.filter((k) => k.notOn?.includes("vehicle")).map((k) => k.name).sort(), ["Bulky", "Cybernetic", "Fragile", "Wearable"]);
  assert.deepEqual(all.filter((k) => k.notOn?.includes("weapon")).map((k) => k.name), ["Cybernetic"]);
});

test("databank: keyword damage and kit impact match their text", () => {
  const changers = L.keywords.weapon.filter((k) => k.damage != null);
  assert.deepEqual(changers.map((k) => [k.name, k.damage]), [["Jagged", 5], ["Miniaturized", -10], ["Mounted", 10]]);
  for (const k of changers) assert.match(k.text, new RegExp(`\\*\\*${k.damage > 0 ? "\\+" : "−"}${Math.abs(k.damage)}\\*\\*`), k.name);
  const kits = L.gear.flatMap((s) => s.entries).filter((e) => e.impact != null);
  assert.deepEqual(kits.map((e) => [e.quality, e.impact]), [["improvised", 10], ["standard", 20], ["exceptional", 30]]);
  for (const e of kits) assert.ok(e.tag.startsWith(`+${e.impact} impact`), e.name);
});

test("databank: tool sets use real skill ids, armor has four levels", () => {
  const ids = new Set(globalThis.NCD_CHARACTERS.SKILLS.map((s) => s.id));
  assert.equal(L.toolSets.length, 7);
  for (const t of L.toolSets) { assert.equal(t.skills.length, 3, t.name); for (const s of t.skills) assert.ok(ids.has(s), `${t.name}: ${s}`); }
  assert.deepEqual(L.armor.levels, [[], ["Expensive"], ["Expensive", "Bulky"], ["Expensive", "Bulky", "Complicated"]]);
});

test("databank: equipment choices, and reference entries are marked", () => {
  const entry = (n) => L.gear.flatMap((s) => s.entries).find((e) => e.name === n);
  assert.equal(entry("Environment Suit").choice.options.length, 5);
  assert.equal(entry("Handheld Scanner").choice.options.length, 7);
  for (const n of ["Basic", "Advanced", "Expert", "Targeted Stimulant"]) assert.equal(entry(n).choice.skill, true, n);
  for (const n of ["Breaking & Repairing Gear", "Common Gear", "Props", "Rules", "Hyper-Specialized Tools", "Consumable Tools", "Tool Sets"])
    assert.equal(entry(n).reference, true, n);
});

test("databank: no keyword is listed twice in its group", () => {
  for (const [group, list] of Object.entries(L.keywords)) assert.equal(new Set(names(list)).size, list.length, group);
});

test("databank: weapons allow only weapon keywords, intrinsic ones included, and every weapon keyword is allowed somewhere", () => {
  const weaponKeywords = names(L.keywords.weapon);
  for (const w of L.weapons) {
    for (const k of w.allowed) assert.ok(weaponKeywords.includes(k), `${w.name}: ${k}`);
    for (const k of w.intrinsic) assert.ok(w.allowed.includes(k), `${w.name}: ${k}`);
    assert.ok([1, 2, null].includes(w.hands), w.name);
    assert.ok(w.damage > 0 && w.damage % 10 === 0, w.name);
  }
  for (const k of weaponKeywords) assert.ok(L.weapons.some((w) => w.allowed.includes(k)), k);
});
