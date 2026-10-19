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
