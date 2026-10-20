// Run with: node --test tests/abilities.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../dice.js");
require("../characters.js");
require("../abilities.js");

const C = globalThis.NCD_CHARACTERS, CATALOG = globalThis.NCD_ABILITIES;
const perk = (id, extra) => ({ id, type: "perk", name: id, origin: null, archetype: "Bruiser", summary: "s", ...extra });

test("catalog: seed is the 30 Cybernetic and 4 Gene-Spliced augmentations", () => {
  assert.equal(CATALOG.length, 34);
  const cyber = CATALOG.filter((a) => a.origin === "Cybernetic");
  assert.equal(cyber.length, 30);
  for (const arch of C.ARCHETYPES) assert.equal(cyber.filter((a) => a.archetype === arch).length, 3, arch);
  assert.deepEqual(CATALOG.filter((a) => a.origin === "Gene-Spliced").map((a) => a.name).sort(),
    ["G-Force Adaptation", "Hypertense Tendons", "Melanophore Control", "Musculoskeletal Chemical Refinement"]);
  assert.equal(CATALOG.find((a) => a.id === "fastreact").summary, "Always succeed on initiative");
});

test("catalog: every entry is valid", () => {
  const ids = new Set();
  for (const a of CATALOG) {
    assert.match(a.id, /^[a-z]+(-[a-z]+)*$/, a.id);
    assert.ok(!ids.has(a.id), `duplicate ${a.id}`); ids.add(a.id);
    assert.ok(["perk", "augmentation"].includes(a.type), a.id);
    assert.ok(a.origin === null || C.ORIGINS.includes(a.origin), a.id);
    assert.ok(a.archetype === null || C.ARCHETYPES.includes(a.archetype), a.id);
    if (a.type === "augmentation") assert.ok(a.origin, `${a.id}: augmentation needs an origin`);
    else assert.ok(!a.origin !== !a.archetype, `${a.id}: perk needs exactly one of origin/archetype`);
    assert.ok(String(a.summary ?? "").trim() || String(a.description ?? "").trim(), `${a.id}: needs summary or description`);
  }
});

test("abilities: ids in saved order, add and remove", () => {
  const cat = [perk("a"), perk("b")];
  let c = C.withAbility({}, "b"); c = C.withAbility(c, "a"); c = C.withAbility(c, "a");
  assert.deepEqual(c.abilities, ["b", "a"]);
  assert.deepEqual(C.abilities(c, cat).map((a) => a.id), ["b", "a"]);
  assert.deepEqual(C.withoutAbility(c, "b").abilities, ["a"]);
  assert.deepEqual(C.newCharacter().abilities, []);
});

test("abilities: skips unknown and duplicate ids", () => {
  assert.deepEqual(C.abilities({ abilities: ["a", "gone", "a"] }, [perk("a")]).map((a) => a.id), ["a"]);
});

test("abilities: tolerates bad saved data", () => {
  assert.deepEqual(C.abilities({}, [perk("a")]), []);
  assert.deepEqual(C.abilities({ abilities: "a" }, [perk("a")]), []);
  assert.deepEqual(C.abilities({ abilities: [null, 3, "a"] }, [perk("a")]).map((a) => a.id), ["a"]);
});

test("abilityTag", () => {
  assert.equal(C.abilityTag({ type: "augmentation", origin: "Cybernetic", archetype: "Assassin" }), "Augmentation · Cybernetic · Assassin");
  assert.equal(C.abilityTag({ type: "perk", origin: null, archetype: "Bruiser" }), "Perk · Bruiser");
});

test("findAbilities: groups, order, search", () => {
  const cat = [
    { id: "z", type: "augmentation", name: "Zed", origin: "Psionic", archetype: null, summary: "s" },
    { id: "y", type: "augmentation", name: "Yak", origin: "Cybernetic", archetype: "Bruiser", summary: "s" },
    { id: "x", type: "augmentation", name: "Xi", origin: "Cybernetic", archetype: "Assassin", summary: "s" },
    perk("bb", { name: "Bravo" }), perk("aa", { name: "Alpha" }),
  ];
  assert.deepEqual(C.findAbilities(cat).map((g) => [g.heading, g.items.map((a) => a.id)]), [
    ["Bruiser Perks", ["aa", "bb"]],
    ["Cybernetic Assassin Augmentations", ["x"]],
    ["Cybernetic Bruiser Augmentations", ["y"]],
    ["Psionic Augmentations", ["z"]],
  ]);
  assert.deepEqual(C.findAbilities(cat, "  ALP ").map((g) => g.items.map((a) => a.id)), [["aa"]]);
});

test("findAbilities: drops empty groups", () => {
  const cat = [perk("aa"), { id: "x", type: "augmentation", name: "Xi", origin: "Cybernetic", archetype: null, summary: "s" }];
  assert.deepEqual(C.findAbilities(cat, "", ["aa"]).map((g) => g.heading), ["Cybernetic Augmentations"]);
  assert.deepEqual(C.findAbilities(cat, "nothing"), []);
});

test("abilityIds: keeps saved ids the catalog doesn't know, so a broken catalog can't erase them on Save", () => {
  assert.deepEqual(C.abilityIds({ abilities: ["a", "gone", 3, null, "a"] }), ["a", "gone"]);
  assert.deepEqual(C.abilityIds({}), []);
});
