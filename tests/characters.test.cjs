// Run with: node --test tests/characters.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../characters.js");
const C = globalThis.NCD_CHARACTERS;

// A storage stand-in with the localStorage methods the module uses.
const memoryStorage = () => {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
};

test("archetypes and origins match the rulebook lists", () => {
  assert.deepEqual(C.ARCHETYPES, ["Assassin", "Bruiser", "Doc", "Gearhead", "Grifter", "Hacker", "Mastermind", "Merc", "Operator", "Thief"]);
  assert.deepEqual(C.ORIGINS, ["Cybernetic", "Gene-Spliced", "Psionic", "Synthetic"]);
});

test("a new character starts as a Cybernetic Assassin with a random handle and name", () => {
  const c = C.newCharacter();
  assert.equal(c.archetype, "Assassin");
  assert.equal(c.origin, "Cybernetic");
  assert.ok(c.id && typeof c.id === "string");
  assert.ok(c.handle.trim().length >= 3);
  assert.match(c.name, /^\S+(\s\S+)+$/); // at least two parts
});

test("random handles and names vary", () => {
  const handles = new Set(Array.from({ length: 50 }, () => C.randomHandle()));
  const names = new Set(Array.from({ length: 50 }, () => C.randomName()));
  assert.ok(handles.size > 30, `only ${handles.size} distinct handles`);
  assert.ok(names.size > 30, `only ${names.size} distinct names`);
});

test("family-name-first cultures put the family name first", () => {
  // rng() = 0 always picks the first culture, given name, and family name.
  const first = C.CULTURES[0];
  const name = C.randomName(() => 0);
  const expected = first.familyFirst ? `${first.family[0]} ${first.given[0]}` : `${first.given[0]} ${first.family[0]}`;
  assert.equal(name, expected);
  assert.ok(C.CULTURES.some((c) => c.familyFirst), "expected at least one family-name-first culture");
});

test("tab label is the handle, or Character when blank", () => {
  assert.equal(C.label({ handle: "NullJack" }), "NullJack");
  assert.equal(C.label({ handle: "   " }), "Character");
  assert.equal(C.label({ handle: null }), "Character");
  assert.equal(C.label(null), "Character");
});

test("save adds or replaces by id, and load reads them back", () => {
  const storage = memoryStorage();
  assert.deepEqual(C.load(storage), []);
  const a = { ...C.newCharacter(), handle: "A" };
  const b = { ...C.newCharacter(), handle: "B" };
  C.save(storage, a);
  C.save(storage, b);
  C.save(storage, { ...a, handle: "A2" });
  const all = C.load(storage);
  assert.deepEqual(all.map((c) => c.handle), ["A2", "B"]);
  assert.ok(all[0].updatedAt >= all[0].createdAt);
});

test("load survives broken or missing storage", () => {
  assert.deepEqual(C.load({ getItem: () => "not json" }), []);
  assert.deepEqual(C.load({ getItem: () => { throw new Error("blocked"); } }), []);
  assert.deepEqual(C.load(null), []);
});

test("export is pretty JSON with a filename from the handle", () => {
  const c = { ...C.newCharacter(), handle: "Null Jack/2" };
  const { filename, json } = C.toExport(c);
  assert.equal(filename, "Null-Jack-2.json");
  assert.deepEqual(JSON.parse(json), c);
  assert.equal(C.toExport({ ...c, handle: "  " }).filename, "character.json");
});

// ---- skills ----

test("31 skills from the sheet: 20 mental, 11 physical, unique ids", () => {
  assert.equal(C.SKILLS.length, 31);
  assert.equal(C.SKILLS.filter((s) => s.type === "mental").length, 20);
  assert.equal(C.SKILLS.filter((s) => s.type === "physical").length, 11);
  assert.equal(new Set(C.SKILLS.map((s) => s.id)).size, 31);
  assert.equal(C.SKILLS[0].name, "Analyze Data");
  assert.equal(C.SKILLS.find((s) => s.name === "Tough It Out").type, "physical");
});

test("a skill with no entry is null with no dice, and shows as 50", () => {
  const s = C.skill({}, "analyze-data");
  assert.deepEqual(s, { value: null, adv: 0, chal: 0 });
  assert.equal(C.shownValue(s.value), 50);
  assert.equal(C.shownValue(70), 70);
  assert.deepEqual(C.skill({ skills: { "analyze-data": { value: 60 } } }, "analyze-data"), { value: 60, adv: 0, chal: 0 });
});

test("only skills with a value or intrinsic dice are shown on the sheet", () => {
  assert.equal(C.isNotable({ value: null, adv: 0, chal: 0 }), false);
  assert.equal(C.isNotable({ value: 55, adv: 0, chal: 0 }), true);
  assert.equal(C.isNotable({ value: null, adv: 0, chal: 1 }), true);
});

test("setting a value clamps to 55-95 and rounds", () => {
  assert.equal(C.clampValue(40), 55);
  assert.equal(C.clampValue(120), 95);
  assert.equal(C.clampValue(72.6), 73);
  assert.equal(C.clampValue("80"), 80);
  assert.equal(C.clampValue(""), null);
  assert.equal(C.clampValue("abc"), null);
});

test("incrementing goes up by 5 and stops at 95", () => {
  assert.equal(C.increment(55), 60);
  assert.equal(C.increment(92), 95);
  assert.equal(C.increment(95), 95);
});

test("withSkill updates one skill without touching the original", () => {
  const c = { skills: { "run-like-hell": { value: 60, adv: 1, chal: 0 } } };
  const next = C.withSkill(c, "run-like-hell", { value: null });
  assert.deepEqual(next.skills["run-like-hell"], { value: null, adv: 1, chal: 0 });
  assert.equal(c.skills["run-like-hell"].value, 60);
  const dice = C.withSkill({}, "heal-someone", { adv: 9, chal: -1 });
  assert.deepEqual(dice.skills["heal-someone"], { value: null, adv: 4, chal: 0 });
});

test("skills that are back to default are dropped from storage", () => {
  const next = C.withSkill({ skills: { "sneak-around": { value: 55, adv: 0, chal: 0 } } }, "sneak-around", { value: null });
  assert.equal("sneak-around" in next.skills, false);
});

test("new characters start with no skills set", () => {
  assert.deepEqual(C.newCharacter().skills, {});
});
