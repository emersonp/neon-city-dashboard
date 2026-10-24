// Run with: node --test tests/adversaries.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
require("../shared.js");
require("../format.js");
require("../adversaries.js");

const { TYPES, adversaries } = globalThis.NCD_ADVERSARIES;
const { ICON_TOKENS } = globalThis.NCD_FORMAT;

test("adversaries: every enemy in the rulebook, each named once", () => {
  assert.equal(adversaries.length, 58);
  assert.equal(new Set(adversaries.map((a) => a.name)).size, adversaries.length);
});

test("adversaries: each has a known type, and luck unless it's a minion squad", () => {
  for (const a of adversaries) {
    assert.ok(TYPES.includes(a.type), a.name);
    if (a.type === "Minion squad") assert.equal(a.luck, undefined, a.name);
    else assert.ok(Number.isInteger(a.luck) && a.luck > 0, a.name);
  }
});

test("adversaries: every enemy outside the Network has its face, 256 pixels square", () => {
  for (const a of adversaries) {
    if (a.network) { assert.equal(a.portrait, undefined, a.name); continue; }
    const file = path.join(__dirname, "..", "portraits", "adversaries", a.portrait);
    const png = fs.readFileSync(file);
    assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [256, 256], a.portrait);
  }
});

test("adversaries: every attack and perk has text, and only known icon tokens", () => {
  const texts = [];
  for (const a of adversaries) {
    assert.ok(a.attacks.length && a.perks.length, a.name);
    texts.push([a.name, a.text], ...[...a.attacks, ...a.perks].map(([n, t]) => [`${a.name}: ${n}`, t]));
  }
  for (const [where, text] of texts) {
    assert.ok(typeof text === "string" && text.trim(), where);
    for (const [, token] of text.matchAll(/\[(\w+)\]/g)) assert.ok(ICON_TOKENS[token], `${where}: [${token}]`);
  }
});
