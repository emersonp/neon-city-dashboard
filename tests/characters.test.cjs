// Run with: node --test tests/characters.test.cjs
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

test("gear: props with a description, Starter off unless set", () => {
  const C = globalThis.NCD_CHARACTERS;
  assert.deepEqual(C.gear({}), []);
  assert.deepEqual(C.newCharacter().gear, []);
  const coat = C.newProp("  Street clothes and a duster or leather jacket ");
  assert.equal(coat.kind, "prop");
  assert.equal(coat.description, "Street clothes and a duster or leather jacket");
  assert.equal(coat.starter, false);
  assert.equal(C.newProp("Deck", true).starter, true);
  let c = C.withGear({ id: "c" }, coat);
  c = C.withGear(c, C.newProp("Burner phone"));
  assert.deepEqual(C.gear(c).map((g) => g.description), ["Street clothes and a duster or leather jacket", "Burner phone"]);
  c = C.withGear(c, { ...coat, description: "Duster", starter: true });
  assert.deepEqual(C.gear(c).map((g) => [g.description, g.starter]), [["Duster", true], ["Burner phone", false]]);
  assert.deepEqual(C.gear(C.withoutGear(c, coat.id)).map((g) => g.description), ["Burner phone"]);
  assert.deepEqual(C.gear({ gear: [null, { id: 1, description: "Old" }] }), [{ id: 1, kind: "prop", description: "Old", starter: false, quantity: 1, keywords: [], fixed: [], conditions: [] }]);
});

test("conditions: added with a name, severity 1-4, and intrinsic off unless set", () => {
  const C = globalThis.NCD_CHARACTERS;
  assert.deepEqual(C.conditions({}), []);
  assert.deepEqual(C.newCharacter().conditions, []);
  let c = C.withCondition({ id: "c" }, { name: "  Exhausted " });
  const [ex] = C.conditions(c);
  assert.equal(ex.name, "Exhausted");
  assert.equal(ex.severity, 1);
  assert.equal(ex.intrinsic, false);
  assert.ok(ex.id);
  c = C.withCondition(c, { name: "Difficulty in Tight Spaces", severity: 2, intrinsic: true });
  assert.deepEqual(C.conditions(c).map((x) => [x.name, x.severity, x.intrinsic]),
    [["Exhausted", 1, false], ["Difficulty in Tight Spaces", 2, true]]);
  assert.equal(C.withCondition(c, { name: "   " }), c);
});

test("conditions: adding a name that's there worsens it, up to x4, keeping spelling and intrinsic", () => {
  const C = globalThis.NCD_CHARACTERS;
  let c = C.withCondition({}, { name: "Exhausted", severity: 3, intrinsic: true });
  c = C.withCondition(c, { name: " exhausted ", severity: 2, intrinsic: false });
  assert.deepEqual(C.conditions(c).map((x) => [x.name, x.severity, x.intrinsic]), [["Exhausted", 4, true]]);
});

test("conditions: severity changes are clamped; removing drops one; the original is untouched", () => {
  const C = globalThis.NCD_CHARACTERS;
  const c = C.withCondition({}, { name: "Damaged" });
  const id = C.conditions(c)[0].id;
  assert.equal(C.conditions(C.withSeverity(c, id, 9))[0].severity, 4);
  assert.equal(C.conditions(C.withSeverity(c, id, 0))[0].severity, 1);
  assert.deepEqual(C.conditions(C.withoutCondition(c, id)), []);
  assert.equal(C.conditions(c)[0].severity, 1);
});

test("conditions: labels hide x1", () => {
  const C = globalThis.NCD_CHARACTERS;
  assert.deepEqual([1, 2, 3, 4].map(C.severityLabel), ["", "x2", "x3", "x4"]);
});

test("conditions: junk and old saves load cleanly, on characters and gear", () => {
  const C = globalThis.NCD_CHARACTERS;
  assert.deepEqual(C.conditions({ conditions: "nope" }), []);
  assert.deepEqual(C.conditions({ conditions: [null, { id: "a", name: " " }, { id: "b", name: "Poisoned", severity: "9", intrinsic: "yes" }] }),
    [{ id: "b", name: "Poisoned", severity: 4, intrinsic: false }]);
  assert.deepEqual(C.gear({ gear: [{ id: 1, description: "Pistol" }] })[0].conditions, []);
  const item = C.withCondition(C.newProp("Pistol"), { name: "Damaged", severity: 2 });
  const c = C.withGear({}, item);
  assert.deepEqual(C.gear(c)[0].conditions.map((x) => [x.name, x.severity]), [["Damaged", 2]]);
  // changing the description keeps conditions
  assert.equal(C.gear(C.withGear(c, { ...C.gear(c)[0], description: "Heavy pistol" }))[0].conditions.length, 1);
});
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

test("a new character starts in creation with no archetype or origin", () => {
  const c = C.newCharacter();
  assert.equal(c.archetype, null);
  assert.equal(c.origin, null);
  assert.deepEqual(c.creation, C.newCreation());
  assert.equal(C.isCreating(c), true);
  assert.equal(C.isCreating({ id: "x" }), false);
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
  assert.equal(C.SKILLS.length, 33);
  assert.equal(C.SKILLS.filter((s) => s.type === "mental").length, 20);
  assert.equal(C.SKILLS.filter((s) => s.type === "physical").length, 11);
  assert.equal(C.SKILLS.filter((s) => s.type === "initiative").length, 2);
  assert.equal(new Set(C.SKILLS.map((s) => s.id)).size, 33);
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
  assert.deepEqual(dice.skills["heal-someone"], { value: null, adv: 2, chal: 0 });
});

test("intrinsic dice go up to 2 of each, and older saves read back clamped", () => {
  assert.equal(C.MAX_INTRINSIC, 2);
  assert.deepEqual(C.skill({ skills: { "sneak-around": { value: 60, adv: 4, chal: 3 } } }, "sneak-around"),
    { value: 60, adv: 2, chal: 2 });
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

test("a character has no portrait unless the chosen one is listed", () => {
  const available = C.availablePortraits(["razor.png"]);
  assert.deepEqual(available, ["razor.png"]);
  assert.deepEqual(C.availablePortraits(undefined), []);
  assert.equal(C.portraitFile({ portrait: "razor.png" }, available), "razor.png");
  assert.equal(C.portraitFile({ portrait: "gone.png" }, available), null);
  assert.equal(C.portraitFile({ portrait: null }, available), null);
  assert.equal(C.newCharacter().portrait, null);
});

test("characters can't pick the default or administrator portraits", () => {
  const available = C.availablePortraits(["default.png", "administrator.png", "razor.png", "razor.png"]);
  assert.deepEqual(available, ["razor.png"]);
  assert.equal(C.portraitFile({ portrait: "administrator.png" }, available), null);
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

// ---- XP and appearance ----

test("XP total is spent plus available, both whole and never negative", () => {
  assert.deepEqual(C.xp(C.newCharacter()), { spent: 0, available: 0, total: 0 });
  assert.deepEqual(C.xp({ xpSpent: 8, xpAvailable: "4" }), { spent: 8, available: 4, total: 12 });
  assert.deepEqual(C.xp({ xpSpent: -3 }), { spent: 0, available: 0, total: 0 });
});

test("appearance fields default to empty text", () => {
  assert.deepEqual(C.appearance({}), { pronouns: "", physical: "", network: "" });
  assert.equal(C.appearance({ appearance: { pronouns: "they/them" } }).pronouns, "they/them");
});

test("initiatives are rolled like skills", () => {
  const c = C.withSkill({}, "initiative-in-the-world", { value: 60 });
  assert.equal(C.skill(c, "initiative-in-the-world").value, 60);
  assert.ok(C.canBeUsed(c, "initiative-in-the-world"));
});

// ---- Create mode ----
const R = globalThis.NCD_RULES, CAT = globalThis.NCD_ABILITIES;
const make = (changes = {}) => ({ ...C.newCharacter(), handle: "Zed", creation: { ...C.newCreation(), ...changes } });
const applied = (changes) => C.applyCreation(make(changes), R, CAT);
const sk = (c, id) => C.skill(c, id);
const clone = (x) => JSON.parse(JSON.stringify(x));

test("STEPS and newCreation", () => {
  assert.deepEqual(C.STEPS, ["archetype", "skills", "perk", "origin", "details", "review"]);
  assert.deepEqual(C.newCreation(), { step: "archetype", archetype: null, knows: [], bumps: [], perk: null, gear: {}, gearPicks: {},
    origin: null, augmentations: [], option: null, placements: {}, optionBumps: [] });
});

test("applyCreation: archetype sets skills, initiative, gear, luck, influence", () => {
  const c = applied({ archetype: "Assassin" });
  assert.deepEqual(sk(c, "shoot-someone"), { value: 65, adv: 2, chal: 0 });
  assert.equal(sk(c, "initiative-in-the-world").value, 70);
  assert.equal(sk(c, "initiative-in-the-network").value, null);
  assert.equal(c.archetype, "Assassin");
  assert.deepEqual([c.maxLuck, c.currentLuck, c.startingInfluence, c.currentInfluence], [100, 100, 1, 1]);
  // handle and name are left alone
  const d = C.applyCreation({ ...make({ archetype: "Doc" }), handle: "Keep", name: "Me" }, R, CAT);
  assert.deepEqual([d.handle, d.name], ["Keep", "Me"]);
});

test("applyCreation: bumps add 5, untrained becomes 55, capped at 95", () => {
  const c = applied({ archetype: "Assassin", bumps: ["case-the-joint", "lift-or-move-something"] });
  assert.equal(sk(c, "case-the-joint").value, 65);
  assert.equal(sk(c, "lift-or-move-something").value, 55);
  const stacked = applied({ archetype: "Assassin", origin: "Gene-Spliced", option: "artificial-lycanthropy",
    optionBumps: ["shoot-someone", "run-like-hell"], bumps: ["shoot-someone"] });
  assert.equal(sk(stacked, "shoot-someone").value, 75);
  const rules = clone(R);
  rules.archetypes.Assassin.skills["shoot-someone"].value = 95;
  const top = C.applyCreation(make({ archetype: "Assassin", bumps: ["shoot-someone"] }), rules, CAT);
  assert.equal(sk(top, "shoot-someone").value, 95);
});

test("applyCreation: abilities are perk, automatic augmentations, chosen augmentations, option perk", () => {
  const c = applied({ archetype: "Assassin", origin: "Synthetic", perk: "deadshot", augmentations: ["extra-arms"], option: "network-native" });
  assert.deepEqual(c.abilities, ["deadshot", "synthetic-body", "extra-arms", "installation-wizard"]);
  assert.equal(c.origin, "Synthetic");
});

test("applyCreation: origin dice add to the archetype's, Moment of Clarity adds 20 luck, Lycanthropy bumps add 5", () => {
  const c = applied({ archetype: "Assassin", origin: "Cybernetic", option: "new-game-plus",
    placements: { a: "shoot-someone", b: "run-like-hell", c: "run-like-hell", d: "case-the-joint" } });
  assert.deepEqual(sk(c, "shoot-someone"), { value: 65, adv: 2, chal: 2 });
  assert.deepEqual([sk(c, "run-like-hell").adv, sk(c, "run-like-hell").chal], [2, 1]);
  assert.equal(sk(c, "case-the-joint").value, 60);
  const capped = applied({ archetype: "Assassin", origin: "Cybernetic", option: "new-game-plus", placements: { c: "shoot-someone" } });
  assert.equal(sk(capped, "shoot-someone").adv, 2); // clamped at MAX_INTRINSIC
  const m = applied({ archetype: "Assassin", origin: "Psionic", option: "moment-of-clarity" });
  assert.deepEqual([m.maxLuck, m.currentLuck], [120, 120]);
  const l = applied({ archetype: "Assassin", origin: "Gene-Spliced", option: "artificial-lycanthropy", optionBumps: ["run-like-hell", "sneak-around"] });
  assert.equal(sk(l, "run-like-hell").value, 55);
  assert.equal(sk(l, "sneak-around").value, 70);
});

test("placeable: a placement is only offered where it fits and honours differentFrom", () => {
  const c = make({ archetype: "Assassin", origin: "Cybernetic", option: "new-game-plus" }).creation;
  const cAdv = C.placeable(c, "c", R);
  assert.ok(!cAdv.includes("shoot-someone") && !cAdv.includes("sneak-around"));
  assert.ok(cAdv.includes("run-like-hell"));
  const physical = C.SKILLS.filter((s) => s.type === "physical").map((s) => s.id);
  assert.ok(cAdv.every((id) => physical.includes(id)));
  assert.ok(C.placeable(c, "a", R).includes("shoot-someone")); // challenge has room there
  assert.ok(!C.placeable({ ...c, placements: { a: "run-like-hell" } }, "b", R).includes("run-like-hell"));
  // picked the other way round: the 2-dice skill can't be the one the 1 die is on
  assert.ok(!C.placeable({ ...c, placements: { b: "run-like-hell" } }, "a", R).includes("run-like-hell"));
  // nor can a different kind of die: every placement gets its own skill
  assert.ok(!C.placeable({ ...c, placements: { a: "run-like-hell" } }, "c", R).includes("run-like-hell"));
  assert.ok(!C.placeable({ ...c, placements: { d: "run-like-hell" } }, "a", R).includes("run-like-hell"));
  // 1 die: not on a skill the archetype already gives 2 of that kind, fine on one with 1
  const dAdv = C.placeable(c, "d", R);
  assert.ok(!dAdv.includes("shoot-someone") && dAdv.includes("throw-something"));
  assert.deepEqual(C.placeable({ ...c, option: null }, "a", R), []);
});

test("bumpable: mental and physical skills below 95 only", () => {
  const b = C.bumpable({ ...C.newCreation(), archetype: "Assassin" }, R);
  assert.ok(b.includes("case-the-joint") && b.includes("lift-or-move-something"));
  assert.ok(!b.some((id) => id.startsWith("initiative")));
  assert.deepEqual(C.bumpable(C.newCreation(), R), []);
  const rules = clone(R);
  rules.archetypes.Assassin.skills["shoot-someone"].value = 95;
  assert.ok(!C.bumpable({ ...C.newCreation(), archetype: "Assassin" }, rules).includes("shoot-someone"));
});

test("withCreation resets downstream choices", () => {
  const full = { archetype: "Assassin", knows: ["Criminals"], bumps: ["case-the-joint"], perk: "deadshot", gear: { 0: 1 }, origin: "Cybernetic",
    augmentations: ["active-camouflage"], option: "chop-shop", placements: { a: "case-the-joint" }, optionBumps: ["run-like-hell"] };
  const c = make(full);
  const arch = C.withCreation(c, { archetype: "Bruiser" }, R, CAT);
  assert.deepEqual([arch.creation.knows, arch.creation.perk, arch.creation.gear, arch.creation.augmentations, arch.creation.placements], [[], null, {}, [], {}]);
  assert.deepEqual([arch.creation.bumps, arch.creation.origin, arch.creation.option], [["case-the-joint"], "Cybernetic", "chop-shop"]);
  assert.equal(arch.archetype, "Bruiser");
  // a bump that is no longer legal is dropped
  const rules = clone(R);
  rules.archetypes.Bruiser.skills["lift-or-move-something"] = { value: 95, adv: 0, chal: 0 };
  const dropped = C.withCreation(make({ ...full, bumps: ["case-the-joint", "lift-or-move-something"] }), { archetype: "Bruiser" }, rules, CAT);
  assert.deepEqual(dropped.creation.bumps, ["case-the-joint"]);
  const org = C.withCreation(c, { origin: "Psionic" }, R, CAT).creation;
  assert.deepEqual([org.augmentations, org.option, org.placements, org.optionBumps], [[], null, {}, []]);
  assert.deepEqual([org.archetype, org.perk, org.bumps], ["Assassin", "deadshot", ["case-the-joint"]]);
  const two = make({ ...full, augmentations: ["active-camouflage", "kinetic-trajectory-calculator"] });
  const opt = C.withCreation(two, { option: "new-game-plus" }, R, CAT).creation;
  assert.deepEqual([opt.placements, opt.optionBumps, opt.augmentations], [{}, [], ["active-camouflage"]]);
  assert.equal(C.withCreation(two, { option: null }, R, CAT).creation.augmentations.length, 1);
  assert.deepEqual(C.withCreation(two, { option: "chop-shop" }, R, CAT).creation, two.creation); // same value: nothing reset
  assert.deepEqual(C.withCreation(c, { archetype: "Assassin", origin: "Cybernetic" }, R, CAT).creation, c.creation);
  assert.equal(C.withCreation(c, { step: "skills" }, R, CAT).creation.step, "skills");
});

const done = {
  archetype: "Assassin", knows: ["Criminals", "Weapons", "Medicine"], bumps: ["case-the-joint", "lift-or-move-something", "run-like-hell", "sneak-around"],
  perk: "deadshot", gear: { 0: 0 }, origin: "Cybernetic", augmentations: ["active-camouflage"],
};
const ok = (changes, step) => C.stepComplete(make({ ...done, ...changes }), step, R, CAT);

test("stepComplete", () => {
  assert.equal(ok({ archetype: null }, "archetype"), false);
  assert.equal(ok({}, "archetype"), true);
  // skills
  assert.equal(ok({}, "skills"), true);
  assert.equal(ok({ knows: ["Criminals", "Weapons"] }, "skills"), false);
  assert.equal(ok({ knows: ["Criminals", "Weapons", "Citizens"] }, "skills"), false); // not on the list
  assert.equal(ok({ knows: ["Criminals", "Criminals", "Weapons"] }, "skills"), false);
  assert.equal(ok({ bumps: done.bumps.slice(0, 3) }, "skills"), false);
  assert.equal(ok({ bumps: [...done.bumps, "analyze-data"] }, "skills"), false);
  assert.equal(ok({ bumps: ["case-the-joint", "case-the-joint", "run-like-hell", "sneak-around"] }, "skills"), false);
  assert.equal(ok({ bumps: [...done.bumps.slice(0, 3), "initiative-in-the-world"] }, "skills"), false);
  assert.equal(C.stepComplete(make({ archetype: "Mastermind", knows: ["Citizens", "Computers", "Network", "Weapons"], bumps: done.bumps }), "skills", R, CAT), true);
  // perk
  assert.equal(ok({}, "perk"), true);
  assert.equal(ok({ perk: null }, "perk"), false);
  assert.equal(ok({ perk: "virus" }, "perk"), false); // a Hacker perk
  assert.equal(ok({ perk: "installation-wizard" }, "perk"), false);
  assert.equal(ok({ gear: {} }, "perk"), false); // choice unanswered
  assert.equal(ok({ gear: { 0: 5 } }, "perk"), false);
  // origin
  assert.equal(ok({}, "origin"), true);
  assert.equal(ok({ origin: null }, "origin"), false);
  assert.equal(ok({ augmentations: [] }, "origin"), false);
  assert.equal(ok({ augmentations: ["armor-plating"] }, "origin"), false); // origin-only
  assert.equal(ok({ augmentations: ["extra-arms"] }, "origin"), false); // wrong origin
  assert.equal(ok({ augmentations: ["active-camouflage", "kinetic-trajectory-calculator"] }, "origin"), false);
  const chop = { option: "chop-shop", augmentations: ["active-camouflage", "kinetic-trajectory-calculator"], placements: { a: "case-the-joint", b: "run-like-hell" } };
  assert.equal(ok(chop, "origin"), true);
  assert.equal(ok({ ...chop, augmentations: ["active-camouflage", "active-camouflage"] }, "origin"), false);
  assert.equal(ok({ ...chop, augmentations: ["active-camouflage"] }, "origin"), false);
  assert.equal(ok({ ...chop, placements: { a: "case-the-joint" } }, "origin"), false); // unfilled
  assert.equal(ok({ ...chop, placements: { a: "run-like-hell", b: "run-like-hell" } }, "origin"), false); // wrong category
  const lyc = { origin: "Gene-Spliced", option: "artificial-lycanthropy", augmentations: [CAT.find((a) => a.origin === "Gene-Spliced" && a.archetype === "Assassin").id],
    placements: { a: "case-the-joint", b: "run-like-hell" }, optionBumps: ["run-like-hell", "sneak-around"] };
  assert.equal(ok(lyc, "origin"), true);
  assert.equal(ok({ ...lyc, optionBumps: ["run-like-hell"] }, "origin"), false);
  assert.equal(ok({ ...lyc, optionBumps: ["run-like-hell", "run-like-hell"] }, "origin"), false);
  assert.equal(ok({ ...lyc, optionBumps: ["run-like-hell", "case-the-joint"] }, "origin"), false); // wrong category
  assert.equal(ok({ ...chop, optionBumps: ["run-like-hell"] }, "origin"), false); // option has no bumps
  // details
  assert.equal(ok({}, "details"), true);
  assert.equal(C.stepComplete({ ...make(done), handle: "  " }, "details", R, CAT), false);
  // review
  assert.equal(ok({}, "review"), true);
  assert.equal(ok({ perk: null }, "review"), false);
  assert.equal(C.stepComplete({ ...make(done), handle: "" }, "review", R, CAT), false);
  assert.equal(ok({}, "nonsense"), false);
});

test("firstIncomplete returns the first unfinished step, or null", () => {
  assert.equal(C.firstIncomplete(make(), R, CAT), "archetype");
  assert.equal(C.firstIncomplete(make({ ...done, perk: null }), R, CAT), "perk");
  assert.equal(C.firstIncomplete(make({ ...done, bumps: [] }), R, CAT), "skills");
  assert.equal(C.firstIncomplete(make(done), R, CAT), null);
});

test("finishCreation drops creation and keeps the sheet", () => {
  const c = applied(done);
  const f = C.finishCreation(c);
  assert.equal("creation" in f, false);
  assert.equal(C.isCreating(f), false);
  const { creation, ...rest } = c;
  assert.deepEqual(f, rest);
  assert.equal(C.isCreating(c), true); // original untouched
});

test("remove deletes one saved character and leaves the rest", () => {
  const storage = memoryStorage();
  C.save(storage, { id: "a", handle: "A" });
  C.save(storage, { id: "b", handle: "B" });
  C.remove(storage, "a");
  assert.deepEqual(C.load(storage).map((c) => c.id), ["b"]);
  C.remove(storage, "missing");
  assert.deepEqual(C.load(storage).map((c) => c.id), ["b"]);
});

test("a partial creation object is filled in rather than throwing", () => {
  const c = { ...C.newCharacter(), creation: {} };
  const next = C.withCreation(c, { archetype: "Assassin" }, R, CAT);
  assert.equal(next.archetype, "Assassin");
  assert.deepEqual(next.creation.bumps, []);
  assert.equal(C.stepComplete(c, "skills", R, CAT), false);
  assert.equal(C.stepComplete(c, "origin", R, CAT), false);
  assert.ok(C.bumpable({ archetype: "Assassin" }, R).length > 0);
  assert.deepEqual(C.placeable({}, "x", R), []);
  assert.equal(C.applyCreation(c, R, CAT).archetype, null);
});

test("inherited names like constructor aren't archetypes or origins", () => {
  for (const name of ["constructor", "toString", "__proto__"]) {
    assert.equal(ok({ archetype: name }, "archetype"), false);
    assert.equal(ok({ origin: name }, "origin"), false);
    assert.deepEqual(C.bumpable({ archetype: name }, R), []);
    assert.deepEqual(C.applyCreation(make({ archetype: name, origin: name }), R, CAT).skills, {});
  }
});

test("the Dice tab never rolls as a character in creation", () => {
  const creating = C.newCharacter();
  assert.equal(C.playingAs(creating), null);
  const finished = C.finishCreation({ ...creating, handle: "Ace" });
  assert.equal(C.playingAs(finished), finished);
  assert.equal(C.playingAs(null), null);
  assert.equal(C.playingAs(undefined), null);
});

const G = globalThis.NCD_GEAR;

test("create gear: archetype lines become typed starter items", () => {
  const c = applied({ archetype: "Assassin" });
  assert.equal(c.gear.length, 2); // radio line unanswered
  assert.ok(c.gear.every((g) => g.starter));
  assert.deepEqual(c.gear.map((g) => [g.kind, g.quantity]), [["weapon", 5], ["prop", 1]]);
  const swords = applied({ archetype: "Assassin", gear: { 0: 1 } }).gear[0];
  assert.deepEqual([swords.description, swords.category, swords.keywords, swords.quantity, swords.id], ["Plasma sword", "One-handed melee", ["Plasma"], 2, "create-gear-0-1-0"]);
  assert.equal(G.label(swords), "One-handed melee · 1h · +10");
  assert.deepEqual(applied({ archetype: "Assassin", gear: { 0: 1 } }).gear.map((g) => g.id), applied({ archetype: "Assassin", gear: { 0: 1 } }).gear.map((g) => g.id));
});

test("create gear: picks fill keywords, categories, and vehicles; illegal picks are dropped", () => {
  const picks = { "create-gear-0-0-0": { keywords: ["Rail", "Durable"] }, "create-gear-0-0-1": { keywords: ["Compact"] } };
  const merc = applied({ archetype: "Merc", gearPicks: picks }).gear;
  assert.deepEqual(merc[0].keywords, ["Rail", "Durable"]);
  assert.deepEqual(merc[1].keywords, []); // a rifle can't be Compact
  const op = (p) => applied({ archetype: "Operator", gearPicks: p }).gear;
  const opPicks = { "create-gear-2-0-0": { vehicle: "Drift Car" }, "create-gear-3-0-0": { category: "Shotgun", keywords: ["Flechette", "Loud"] } };
  const gear = op(opPicks);
  assert.equal(gear[2].vehicle, "Drift Car");
  assert.deepEqual([gear[3].category, gear[3].keywords], ["Shotgun", ["Mounted", "Flechette", "Loud"]]);
  assert.deepEqual(op({ ...opPicks, "create-gear-3-0-0": { category: "Launcher", keywords: ["Flechette", "Loud"] } })[3].keywords, ["Mounted", "Loud"]);
  assert.equal(op({ "create-gear-2-0-0": { vehicle: "Police Mecha" } })[2].vehicle, undefined); // not one of the choices
});

test("create gear: slotOpen says what's left", () => {
  const slots = G.starterSlots(make({ archetype: "Operator" }).creation, R);
  assert.deepEqual(G.slotOpen(slots[2], {}), { vehicle: true, keywords: 0 });
  assert.deepEqual(G.slotOpen(slots[3], {}), { category: true, keywords: 2 });
  const pick = { category: "Rifle", keywords: ["Laser"] }; // the slot is built from the same picks
  const picked = G.starterSlots(make({ archetype: "Operator", gearPicks: { "create-gear-3-0-0": pick } }).creation, R);
  assert.deepEqual(G.slotOpen(picked[3], pick), { category: false, keywords: 1 });
  assert.deepEqual(G.slotOpen(slots[1], undefined), { keywords: 0 });
});

test("create gear: Perk & Gear isn't complete until every pick is made", () => {
  const base = { archetype: "Doc", perk: CAT.find((a) => a.type === "perk" && a.archetype === "Doc").id };
  assert.equal(ok(base, "perk"), false);
  assert.equal(ok({ ...base, gearPicks: { "create-gear-0-0-0": { keywords: ["Laser"] } } }, "perk"), true);
  assert.equal(ok({ ...base, gearPicks: { "create-gear-0-0-0": { keywords: ["Laser", "Rail"] } } }, "perk"), false);
  assert.equal(ok({ ...base, gearPicks: { "create-gear-0-0-0": { keywords: ["Cybernetic"] } } }, "perk"), false); // not allowed
});

test("create gear: augmentation gear, Butcher's Gauntlet exception, Weapon Mount", () => {
  const bg = applied({ archetype: "Bruiser", origin: "Synthetic", augmentations: ["butcher-s-gauntlet"] }).gear.at(-1);
  assert.deepEqual([bg.id, bg.category, bg.fixed, G.stats(bg).damage], ["create-aug-butcher-s-gauntlet-0", "Two-handed melee", ["Mounted"], 30]);
  assert.ok(applied({ archetype: "Bruiser", origin: "Synthetic", augmentations: [] }).gear.every((g) => !g.id.startsWith("create-aug-")));
  const doc = { archetype: "Doc", origin: "Cybernetic", augmentations: ["weapon-mount"] };
  assert.deepEqual(G.weaponMountTargets(make(doc).creation, R), ["create-gear-0-0-0"]);
  const mounted = applied({ ...doc, gearPicks: { "weapon-mount": { target: "create-gear-0-0-0", keywords: ["Shock"] } } }).gear[0];
  assert.ok(["Mounted", "Shock"].every((k) => mounted.keywords.includes(k)));
  const gone = { ...doc, gearPicks: { "weapon-mount": { target: "gone", keywords: ["Shock"] } } };
  assert.equal(ok(gone, "origin"), false);
  assert.doesNotThrow(() => applied(gone));
  assert.equal(ok({ ...doc, gearPicks: { "weapon-mount": { target: "create-gear-0-0-0", keywords: [] } } }, "origin"), false);
  assert.equal(ok({ ...doc, gearPicks: { "weapon-mount": { target: "create-gear-0-0-0", keywords: ["Shock"] } } }, "origin"), true);
  // a weapon that already has Mounted isn't a target
  const merc = { archetype: "Merc", origin: "Synthetic", augmentations: ["transfigurable-weapon"] };
  assert.ok(!G.weaponMountTargets({ ...make(merc).creation, augmentations: ["transfigurable-weapon", "weapon-mount"] }, R).includes("create-aug-transfigurable-weapon-0"));
});

test("create gear: origin step needs the augmentation gear picks", () => {
  const bruiser = { archetype: "Bruiser", origin: "Synthetic", augmentations: ["butcher-s-gauntlet"] };
  assert.equal(ok(bruiser, "origin"), false);
  assert.equal(ok({ ...bruiser, gearPicks: { "create-aug-butcher-s-gauntlet-0": { keywords: ["Jagged"] } } }, "origin"), true);
});

test("create gear: old creation shape still loads", () => {
  const c = C.applyCreation({ id: "x", creation: { archetype: "Assassin", gear: { 0: 0 } } }, R, CAT);
  assert.equal(c.gear[0].category, "Pistol");
  assert.deepEqual(c.gear[0].keywords, ["Compact", "Rail"]);
});

test("create gear: changing archetype clears picks", () => {
  const c = C.withCreation(make({ archetype: "Merc", gearPicks: { "create-gear-0-0-0": { keywords: ["Rail"] } } }), { archetype: "Doc" }, R, CAT);
  assert.deepEqual(c.creation.gearPicks, {});
});
