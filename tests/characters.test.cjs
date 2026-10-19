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

// ---- luck ----

test("new characters start with full luck", () => {
  const c = C.newCharacter();
  assert.equal(c.maxLuck, 100);
  assert.equal(c.currentLuck, 100);
});

test("older saves without luck start full", () => {
  assert.deepEqual(C.luck({}), { max: 100, current: 100 });
  assert.deepEqual(C.luck({ maxLuck: 80 }), { max: 80, current: 80 });
  assert.deepEqual(C.luck({ maxLuck: 80, currentLuck: 30 }), { max: 80, current: 30 });
});

test("current luck stays between 0 and max", () => {
  assert.equal(C.clampCurrentLuck(120, 90), 90);
  assert.equal(C.clampCurrentLuck(-5, 90), 0);
  assert.equal(C.clampCurrentLuck("42", 90), 42);
  assert.equal(C.clampCurrentLuck("", 90), 90);
  assert.equal(C.clampMaxLuck(-3), 0);
  assert.equal(C.clampMaxLuck("abc"), 100);
});

// ---- wounds ----

test("wounds are 0-4, defaulting to 0", () => {
  assert.equal(C.newCharacter().wounds, 0);
  assert.equal(C.wounds({}), 0);
  assert.equal(C.wounds({ wounds: 3 }), 3);
  assert.equal(C.wounds({ wounds: 9 }), 4);
  assert.equal(C.wounds({ wounds: -1 }), 0);
});

test("clicking a wound box marks up to it; clicking the last marked box unmarks it", () => {
  assert.equal(C.clickWound(0, 3), 3);
  assert.equal(C.clickWound(3, 1), 1);
  assert.equal(C.clickWound(3, 4), 4);
  assert.equal(C.clickWound(3, 3), 2);
  assert.equal(C.clickWound(1, 1), 0);
});

// ---- used ----

test("skills can be marked used and unmarked, without touching the original", () => {
  const c = { skills: {} };
  assert.equal(C.isUsed(c, "sneak-around"), false);
  const used = C.withUsed(c, "sneak-around", true);
  assert.equal(C.isUsed(used, "sneak-around"), true);
  assert.equal(C.isUsed(c, "sneak-around"), false);
  assert.deepEqual(C.withUsed(used, "sneak-around", false).used, {});
});

test("only trained skills can be marked used", () => {
  const c = { skills: { "shoot-someone": { value: 60, adv: 0, chal: 0 }, "heal-someone": { value: null, adv: 2, chal: 0 } } };
  assert.equal(C.canBeUsed(c, "shoot-someone"), true);
  assert.equal(C.canBeUsed(c, "heal-someone"), false);
  assert.equal(C.canBeUsed(c, "anything-else"), false);
});

// ---- influence ----

test("influence starts at 1, and older saves without it start there too", () => {
  const c = C.newCharacter();
  assert.equal(c.startingInfluence, 1);
  assert.equal(c.currentInfluence, 1);
  assert.deepEqual(C.influence({}), { starting: 1, current: 1 });
  assert.deepEqual(C.influence({ startingInfluence: 3 }), { starting: 3, current: 3 });
  assert.deepEqual(C.influence({ startingInfluence: 3, currentInfluence: 0 }), { starting: 3, current: 0 });
});

test("influence is a whole number, never negative", () => {
  assert.equal(C.clampInfluence(-2), 0);
  assert.equal(C.clampInfluence("4.6"), 5);
  assert.equal(C.clampInfluence("", 2), 2);
  assert.equal(C.clampInfluence(12), 12);
});

// ---- portraits ----

test("portraits fall back to the default unless the chosen one is listed", () => {
  const available = C.availablePortraits(["razor.png"]);
  assert.deepEqual(available, ["default.png", "razor.png"]);
  assert.deepEqual(C.availablePortraits(undefined), ["default.png"]);
  assert.equal(C.portraitFile({ portrait: "razor.png" }, available), "razor.png");
  assert.equal(C.portraitFile({ portrait: "gone.png" }, available), "default.png");
  assert.equal(C.portraitFile({ portrait: null }, available), "default.png");
  assert.equal(C.newCharacter().portrait, null);
});

test("portrait labels come from the file name", () => {
  assert.equal(C.portraitLabel("default.png"), "Default");
  assert.equal(C.portraitLabel("street-samurai_2.jpg"), "Street Samurai 2");
});

// ---- knows something about ----

test("known topics come back in sheet order, ignoring unknown ones", () => {
  assert.equal(C.KNOWLEDGE.length, 16);
  assert.deepEqual(C.knows({ knows: ["Weapons", "Citizens", "Cooking"] }), ["Citizens", "Weapons"]);
  assert.deepEqual(C.knows({}), []);
  assert.deepEqual(C.newCharacter().knows, []);
});
