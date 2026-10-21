// Run with: node --test tests/advancement.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../shared.js");
require("../dice.js");
require("../characters.js");
require("../abilities.js");
require("../rules.js");
require("../databank.js");
require("../format.js");
require("../gear.js");
require("../advancement.js");

const C = globalThis.NCD_CHARACTERS, A = globalThis.NCD_ADVANCEMENT, CAT = globalThis.NCD_ABILITIES;
const thief = (changes = {}) => ({ id: "t", archetype: "Thief", origin: "Cybernetic", startingInfluence: 2, xpAvailable: 10, xpSpent: 0,
  abilities: [], gear: [], skills: {}, ...changes });
const buy = (c, purchases, options = {}) => A.applyPurchases(c, purchases, { catalog: CAT, ...options });

test("the table: every benefit has text and a cost, and origin costs are noted", () => {
  assert.equal(A.TABLE.rows.length, A.BENEFITS.length);
  for (const [text, cost] of A.TABLE.rows) assert.ok(text && cost);
  assert.deepEqual(A.TABLE.rows.find(([t]) => t.includes("Initiative in the Network")), [
    "Increase your Initiative in the Network chance of success by 5%", "3 (Cybernetic: 2; Synthetic: 1)"]);
});

test("costs follow the origin tables", () => {
  const world = A.BENEFIT["initiative-in-the-world"], network = A.BENEFIT["initiative-in-the-network"];
  const cost = (b, origin) => b.cost({ character: thief({ origin }) });
  assert.deepEqual(["Cybernetic", "Gene-Spliced", "Psionic", "Synthetic"].map((o) => [cost(world, o), cost(network, o)]),
    [[3, 2], [2, 3], [2, 3], [2, 1]]);
  assert.equal(A.BENEFIT.influence.cost({ character: thief() }), 3);
  assert.deepEqual(A.augmentationOrigins("Synthetic"), ["Synthetic", "Cybernetic"]);
  // a synthetic can't add gene-spliced or psionic augmentations
  const body = A.BENEFIT["augmentation-body"].options({ character: thief({ origin: "Synthetic" }) }, CAT);
  assert.ok(body.length);
  assert.ok(body.every((o) => CAT.find((a) => a.id === o.value).origin === "Cybernetic"));
});

test("purchases cost more as perks and augmentations add up, and stop when the XP runs out", () => {
  const perksOwn = A.BENEFIT["perk-own"].options({ character: thief() }, CAT).map((o) => o.value);
  const augs = A.BENEFIT["augmentation-own"].options({ character: thief() }, CAT).map((o) => o.value);
  assert.ok(perksOwn.length >= 2 && augs.length);
  const r = buy(thief(), [
    { benefit: "perk-own", value: perksOwn[0] },      // 1 + 0
    { benefit: "perk-own", value: perksOwn[1] },      // 1 + 1
    { benefit: "augmentation-own", value: augs[0] },  // 2 + 0
    { benefit: "luck" },                              // 1
    { benefit: "influence" },                         // 1 + 2: 4 left, so it fits
    { benefit: "influence" },                         // 1 + 3: only 1 left
    { benefit: "luck" },                              // 1
  ]);
  assert.deepEqual(r.purchases.map((p) => p.cost), [1, 2, 2, 1, 3, 1]);
  assert.equal(r.spent, 10);
  assert.equal(r.remaining, 0);
  assert.equal(r.character.startingInfluence, 3);
  assert.equal(C.luck(r.character).max, 110);
  // already owned: skipped
  assert.equal(buy(thief({ abilities: [perksOwn[0]] }), [{ benefit: "perk-own", value: perksOwn[0] }]).purchases.length, 0);
});

test("skills, advantage dots and initiatives", () => {
  const r = buy(thief({ skills: { "sneak-around": { value: 70, adv: 1 } } }), [
    { benefit: "skill", value: "goad-someone" },
    { benefit: "advantage", value: "goad-someone" },  // first: 3
    { benefit: "advantage", value: "sneak-around" },  // second: 5
    { benefit: "advantage", value: "sneak-around" },  // already 2: skipped
  ], { available: 20 });
  assert.deepEqual(r.purchases.map((p) => [p.benefit, p.cost]), [["skill", 2], ["advantage", 3], ["advantage", 5]]);
  assert.deepEqual(C.skill(r.character, "goad-someone"), { value: 55, adv: 1, chal: 0 });
  assert.equal(C.skill(r.character, "sneak-around").adv, 2);
  const i = buy(thief(), [{ benefit: "initiative-in-the-world" }, { benefit: "initiative-in-the-world" }]);
  assert.equal(C.skill(i.character, "initiative-in-the-world").value, 60);
  assert.equal(buy(thief({ skills: { "initiative-in-the-world": { value: 95 } } }), [{ benefit: "initiative-in-the-world" }]).purchases.length, 0);
});

test("gear: keep acquired gear, add a keyword to starting gear, and gain common gear", () => {
  const coat = C.newProp("Coat", true), loot = C.newProp("Loot");
  const r = buy(thief({ gear: [coat] }), [
    { benefit: "keep-gear", value: String(loot.id) },
    { benefit: "keyword", value: { gear: String(coat.id), keyword: "Stylish" } },   // 1 + 0
    { benefit: "keyword", value: { gear: String(coat.id), keyword: "Durable" } },   // 1 + 1
    { benefit: "keyword", value: { gear: String(coat.id), keyword: "Durable" } },   // already has it: skipped
    { benefit: "common-gear", value: { kind: "prop", description: "Umbrella", keywords: ["Stylish"] } },
    { benefit: "common-gear", value: { kind: "weapon", category: "Sniper rifle", description: "Long gun" } },  // never common: skipped
  ], { acquired: [loot] });
  assert.deepEqual(r.purchases.map((p) => p.cost), [1, 1, 2, 1]);
  assert.deepEqual(C.gear(r.character).map((g) => [g.description, g.starter, g.keywords]),
    [["Coat", true, ["Stylish", "Durable"]], ["Loot", true, []], ["Umbrella", true, []]]);
  assert.deepEqual(r.acquired, []);
});

test("Spend XP after Finish Job: acquired gear is kept until it's confirmed, then XP moves to spent", () => {
  const coat = C.newProp("Coat", true), loot = { ...C.newProp("Loot"), conditions: [{ id: "d", name: "Damaged" }] };
  const onJob = C.withGear(C.startJob(thief({ gear: [coat], xpAvailable: 2 })), loot);
  const finished = C.finishJob(onJob, { liability: "Debts", improvement: "xp", successful: true, xp: 2, reward: "feature" }).character;
  const spending = A.beginSpending(onJob, finished);
  assert.ok(A.isSpending(spending));
  assert.equal(C.xp(spending).available, 5);
  assert.deepEqual(A.acquiredGear(spending).map((g) => [g.description, C.conditions(g).length]), [["Loot", 0]]);
  assert.deepEqual(C.gear(spending).map((g) => g.description), ["Coat"]);
  const done = A.finishSpending(spending, [{ benefit: "keep-gear", value: String(loot.id) }, { benefit: "luck" }], CAT);
  assert.equal(A.isSpending(done.character), false);
  assert.deepEqual(C.xp(done.character), { spent: 2, available: 3, total: 5 });
  assert.equal(done.character.currentLuck, 105);
  assert.deepEqual(C.gear(done.character).map((g) => [g.description, g.starter]), [["Coat", true], ["Loot", true]]);
});
