// Run with: node --test tests/gear.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../shared.js");
require("../dice.js");
require("../characters.js");
require("../databank.js");
require("../format.js");
require("../gear.js");

const C = globalThis.NCD_CHARACTERS, G = globalThis.NCD_GEAR;
const w = (category, keywords = [], extra = {}) => C.newGear({ kind: "weapon", description: "W", category, keywords, ...extra });

test("gear: old props are untouched", () => {
  assert.deepEqual(C.gear({ gear: [{ id: 1, description: "Old" }] }),
    [{ id: 1, kind: "prop", description: "Old", starter: false, quantity: 1, keywords: [], fixed: [], conditions: [] }]);
  assert.equal(G.label({ id: 1, description: "Old" }), "prop");
});

test("newGear and the normaliser: quantity, keywords, fixed", () => {
  const g = C.newGear({ kind: "kit", description: " Bag ", quantity: 3, keywords: ["Durable", " Durable", "", 5], set: "Paramedic's Kit" });
  assert.deepEqual([g.kind, g.description, g.quantity, g.keywords, g.fixed, g.set, g.starter], ["kit", "Bag", 3, ["Durable"], [], "Paramedic's Kit", false]);
  assert.equal(C.gear({ gear: [{ id: 1, quantity: 0 }] })[0].quantity, 1);
  assert.equal(C.gear({ gear: [{ id: 1, quantity: "4" }] })[0].quantity, 4);
});

test("weapon stats and label come from the databank", () => {
  assert.equal(G.label(w("Pistol")), "Pistol · 1h · +20 dmg");
  assert.equal(G.label(w("Thrown")), "Thrown · +10 dmg");
  assert.equal(G.stats(w("Rifle", ["Miniaturized", "Mounted"])).damage, 30);
  assert.equal(G.stats(w("Rifle", ["Miniaturized"])).hands, 1);
  assert.equal(G.stats(w("One-handed melee", ["Jagged"])).damage, 15);
  assert.deepEqual(G.builtIn(w("Shotgun")), ["Close Range"]);
});

test("keyword rules", () => {
  assert.equal(G.canAdd(w("Pistol"), "Rail"), true);
  assert.equal(G.canAdd(w("Rifle"), "Compact"), false);           // Compact on weapons follows the allowed list
  assert.equal(G.canAdd(w("Rifle"), "Durable"), true);            // other gear keywords are open
  assert.equal(G.canAdd(w("Pistol"), "Cybernetic"), false);
  assert.equal(G.canAdd(w("One-handed melee"), "Concussive"), false); // built-in Silent excludes it
  assert.equal(G.canAdd(w("Thrown"), "Obfuscating"), false);
  assert.equal(G.canAdd(w("Thrown", ["Explosive"]), "Obfuscating"), true);
  const car = C.newGear({ kind: "vehicle", description: "Car", vehicle: "Muscle Car" });
  for (const k of ["Cybernetic", "Bulky", "Fragile", "Wearable"]) assert.equal(G.canAdd(car, k), false, k);
  assert.equal(G.canAdd(car, "Flashy"), true);
  assert.equal(G.canAdd(car, "Rail"), false); // weapon keywords are for weapons
  const prop = C.newGear({ description: "Bag", keywords: ["Compact"] });
  assert.equal(G.canAdd(prop, "Bulky"), false);
  assert.equal(G.canAdd(C.newGear({ description: "x", keywords: ["Unreliable"] }), "Reliable"), false);
  assert.equal(G.canAdd(C.newGear({ description: "x", keywords: ["Bulky"] }), "Cybernetic"), false); // excludes listed on the other side
  const gauntlet = w("Two-handed melee", [], { fixed: ["Mounted"] });
  assert.ok(G.keywordsOf(gauntlet).includes("Mounted"));
  assert.deepEqual(G.legalize(gauntlet).fixed, ["Mounted"]);
  assert.equal(G.canAdd(w("Pistol", ["Rail"]), "Rail"), false); // already has it
});

test("keywordChoices: two groups, built-ins checked and flagged", () => {
  const list = G.keywordChoices(w("One-handed melee"));
  assert.ok(list.findIndex((k) => k.group === "gear") > list.findLastIndex((k) => k.group === "weapon"));
  const silent = list.find((k) => k.name === "Silent");
  assert.deepEqual([silent.builtIn, silent.checked], [true, true]);
  assert.equal(list.filter((k) => k.name === "Compact").length, 1);
  assert.equal(list.find((k) => k.name === "Concussive").allowed, false);
  assert.ok(list.every((k) => typeof k.text === "string" && k.text));
  assert.equal(G.keywordChoices(C.newGear({ description: "x" })).some((k) => k.group === "weapon"), false);
  const checked = G.keywordChoices(w("Pistol", ["Rail"])).find((k) => k.name === "Rail");
  assert.deepEqual([checked.checked, checked.allowed, checked.builtIn], [true, true, false]);
});

test("keyword: groups, and Compact on a weapon is the weapon one", () => {
  assert.equal(G.keyword("Cheap").group, "negative");
  assert.equal(G.keyword("Durable").group, "positive");
  assert.equal(G.keyword("Rail").group, "weapon");
  assert.equal(G.keyword("Compact").group, "positive");
  assert.equal(G.keyword("Compact", w("Pistol")).group, "weapon");
  assert.equal(G.keyword("Nope"), null);
});

test("retype and recategorise drop illegal keywords", () => {
  const p = w("Pistol", ["Rail", "Durable"]);
  assert.deepEqual(G.legalize({ ...p, category: "Shotgun" }).keywords, ["Durable"]);
  const prop = G.retype(p, "prop");
  assert.deepEqual([prop.kind, prop.category, prop.keywords, prop.id, prop.description], ["prop", undefined, ["Durable"], p.id, "W"]);
  // dropping Explosive drops the Obfuscating that needed it
  assert.deepEqual(G.legalize(w("Thrown", ["Obfuscating"])).keywords, []);
});

test("kit, armor, equipment, vehicle labels and rules text", () => {
  const kit = C.newGear({ kind: "kit", description: "Med bag", set: "Paramedic's Kit", quality: "standard" });
  assert.equal(G.label(kit), "Kit · Paramedic's Kit · Standard · +20 impact");
  assert.equal(G.stats(kit).impact, 20);
  const armor = C.newGear({ kind: "armor", description: "Vest", level: 3 });
  assert.equal(G.label(armor), "Armor · Armored x3");
  assert.equal(G.label({ ...armor, level: 1 }), "Armor · Armored");
  assert.deepEqual(G.builtIn(armor), ["Expensive", "Bulky"]);
  assert.equal(G.label(C.newGear({ kind: "equipment", description: "Ripcord", entry: "Ripcord" })), "Equipment · Computer gear");
  // the entry shows when the name doesn't say it, and so does the choice
  assert.equal(G.label(C.newGear({ kind: "equipment", description: "Chip", entry: "Expert", choice: "heal-someone" })), "Equipment · Guided skill software · Expert · Heal Someone");
  assert.equal(G.label(C.newGear({ kind: "vehicle", description: "V", vehicle: "Muscle Car" })), "Vehicle · Muscle Car · Medium ground vehicle");
  // the pop-up's text is the item's keywords only, not the databank text for what it is
  assert.ok(G.EQUIPMENT.some((e) => e.name === "Ripcord") && !G.EQUIPMENT.some((e) => e.reference || e.name === "Rules"));
  assert.ok(!G.EQUIPMENT.some((e) => e.name === "Standard Tools" || e.name === "Props"));
  assert.equal(G.EQUIPMENT.find((e) => e.name === "Basic").section, "Guided skill software");
});

test("gear: junk fields don't throw", () => {
  for (const junk of [{ kind: "weapon", category: "Laser cannon", keywords: [5, "Nope", null] }, { kind: "kit", set: "x", quality: "y" },
    { kind: "armor", level: 9 }, { kind: "equipment", entry: "?" }, { kind: "vehicle", vehicle: "Boat" }, { kind: "blimp" }]) {
    const item = C.gear({ gear: [{ id: 1, description: "J", ...junk }] })[0];
    for (const f of [G.label, G.stats, G.descriptionText, G.keywordChoices, G.keywordsOf, G.builtIn, G.legalize]) assert.doesNotThrow(() => f(item), JSON.stringify(junk));
  }
  assert.match(G.label({ id: 1, kind: "weapon", category: "Laser cannon" }), /\?/);
  assert.deepEqual(G.keywordsOf({ id: 1, kind: "prop", keywords: ["Nope", "Durable"] }), ["Durable"]);
});

test("gear: an unknown fixed keyword is ignored, not thrown on", () => {
  const item = w("Pistol", [], { fixed: ["Nope"] });
  assert.deepEqual(G.builtIn(item), []);
  for (const f of [G.label, G.stats, G.descriptionText, G.keywordChoices]) assert.doesNotThrow(() => f(item));
  assert.doesNotThrow(() => G.descriptionText(C.newGear({ description: "Hat", fixed: ["Nope"] })));
});

test("retype to another kind drops fixed keywords; the same kind keeps them", () => {
  const gauntlet = w("Two-handed melee", [], { fixed: ["Mounted"] });
  assert.deepEqual(G.retype(gauntlet, "prop").fixed ?? [], []);
  assert.deepEqual(G.retype(gauntlet, "weapon").fixed, ["Mounted"]);
});

test("defaultName: a name from what the item is", () => {
  const n = (f) => G.defaultName(C.newGear(f));
  assert.equal(n({ kind: "kit", set: "Hacker's Deck", quality: "improvised" }), "Improvised Hacker's Deck");
  assert.equal(n({ kind: "kit", set: "Paramedic's Kit", quality: "exceptional", special: "heal-someone" }), "Exceptional Paramedic's Kit (Heal Someone)");
  assert.equal(n({ kind: "kit", set: "Paramedic's Kit" }), "Paramedic's Kit");
  assert.equal(n({ kind: "kit" }), "Kit");
  assert.equal(n({ kind: "weapon", category: "Pistol", keywords: ["Rail", "Durable"] }), "Rail Pistol");
  assert.equal(n({ kind: "weapon", category: "One-handed melee" }), "One-handed Melee Weapon");
  assert.equal(n({ kind: "weapon", category: "Thrown", keywords: ["Explosive", "Obfuscating"] }), "Explosive Obfuscating Thrown Weapon");
  assert.equal(n({ kind: "weapon", category: "Sniper rifle" }), "Sniper Rifle");
  assert.equal(n({ kind: "weapon" }), "Weapon");
  assert.equal(n({ kind: "equipment", entry: "Ripcord" }), "Ripcord");
  assert.equal(n({ kind: "equipment", entry: "Environment Suit", choice: "Underwater" }), "Environment Suit (Underwater)");
  assert.equal(n({ kind: "equipment", entry: "Expert", choice: "shoot-someone" }), "Expert Guided Skill Software (Shoot Someone)");
  assert.equal(n({ kind: "equipment" }), "Equipment");
  assert.equal(n({ kind: "armor", level: 1 }), "Body Armor");
  assert.equal(n({ kind: "armor", level: 3 }), "Body Armor x3");
  assert.equal(n({ kind: "vehicle", vehicle: "Muscle Car" }), "Muscle Car");
  assert.equal(n({ kind: "vehicle" }), "Vehicle");
  assert.equal(n({ kind: "prop" }), "Prop");
  assert.doesNotThrow(() => G.defaultName({ kind: "blimp", keywords: [5] }));
});

const PARAGRAPH = /\n\s*\n/;
test("descriptionText: the book's own words for what the item is, trimmed to what matters", () => {
  const D = globalThis.NCD_DATABANK, entry = (n) => D.gear.flatMap((x) => x.entries).find((e) => e.name === n);
  const has = (text, part) => assert.ok(text.includes(part), part.slice(0, 40));
  // weapon: the examples (hands and damage are on the label)
  assert.equal(G.descriptionText(w("Pistol")), `*${D.weapons.find((x) => x.name === "Pistol").examples}*`);
  // kit: the quality's text and the set's skills; hyper-specialized adds that rule's first paragraph; consumable adds its rule
  const kit = C.newGear({ kind: "kit", description: "Deck", set: "Hacker's Deck", quality: "improvised" });
  has(G.descriptionText(kit), entry("Improvised Tools").text);
  has(G.descriptionText(kit), "Crash a System, Infiltrate a System, Override a System");
  assert.ok(!G.descriptionText(kit).includes("Hyper"));
  const hyper = G.descriptionText({ ...kit, special: "crash-a-system", consumable: true });
  has(hyper, entry("Hyper-Specialized Tools").text.split(PARAGRAPH)[0]);
  assert.ok(!hyper.includes("For example"));
  has(hyper, entry("Consumable Tools").text);
  // equipment: the entry's text, without the list of options when one is chosen
  assert.equal(G.descriptionText(C.newGear({ kind: "equipment", description: "R", entry: "Ripcord" })), entry("Ripcord").text);
  const suit = G.descriptionText(C.newGear({ kind: "equipment", description: "S", entry: "Environment Suit", choice: "Underwater" }));
  has(suit, "Covers the wearer from head to toe"); has(suit, "Heavily Encumbered");
  assert.ok(!suit.includes("- Space vacuum"));
  has(G.descriptionText(C.newGear({ kind: "equipment", description: "T", entry: "Targeted Stimulant" })), "- Depleted Focus x2");
  // armor, vehicle (no blurb), prop (just the rule)
  assert.equal(G.descriptionText(C.newGear({ kind: "armor", description: "A", level: 2 })), D.armor.text);
  const car = D.vehicles.find((v) => v.name === "Muscle Car");
  assert.equal(G.descriptionText(C.newGear({ kind: "vehicle", description: "V", vehicle: "Muscle Car" })), car.text);
  assert.equal(G.descriptionText(C.newGear({ description: "Hat" })), entry("Props").text.split(PARAGRAPH)[1]);
  assert.equal(G.descriptionText({ kind: "weapon", category: "Nope" }), "");
});

test("rollOf: the skills, extra dice and impact an item rolls with", () => {
  assert.deepEqual(G.rollOf(w("One-handed melee")), { skills: ["slash-stab-or-strike-someone"], adv: 1, impact: 10, attack: "melee" });
  assert.deepEqual(G.rollOf(w("Two-handed melee")), { skills: ["slash-stab-or-strike-someone"], adv: 1, impact: 20, attack: "melee" });
  assert.deepEqual(G.rollOf(w("Pistol")), { skills: ["shoot-someone"], adv: 0, impact: 20, attack: "ranged" });
  assert.deepEqual(G.rollOf(w("Launcher")), { skills: ["shoot-someone"], adv: 0, impact: 20, attack: "ranged" });
  assert.deepEqual(G.rollOf(w("Thrown")), { skills: ["throw-something"], adv: 0, impact: 10, attack: "ranged" });
  assert.equal(G.rollOf(w("Mine")), null);
  assert.equal(G.rollOf(w(undefined)), null);
  const kit = (extra) => C.newGear({ kind: "kit", description: "K", set: "Hacker's Deck", quality: "standard", ...extra });
  const deck = ["crash-a-system", "infiltrate-a-system", "override-a-system"];
  assert.deepEqual(G.rollOf(kit()), { skills: deck, adv: 0, impact: 20 });
  assert.deepEqual(G.rollOf(kit({ special: "crash-a-system" })), { skills: ["crash-a-system"], adv: 2, impact: 20 });
  assert.deepEqual(G.rollOf(kit({ special: "shoot-someone" })), { skills: deck, adv: 0, impact: 20 });
  assert.deepEqual(G.rollOf(kit({ quality: undefined })), { skills: deck, adv: 0, impact: null });
  assert.equal(G.rollOf(kit({ set: undefined })), null);
  assert.deepEqual(G.rollOf(C.newGear({ kind: "vehicle", description: "V", vehicle: "Chopper" })), { skills: ["drive-or-pilot-something"], adv: 0, impact: null });
  for (const kind of ["equipment", "armor", "prop"]) assert.equal(G.rollOf(C.newGear({ kind, description: "X" })), null);
});

test("common gear, as Gear basics' Common Gear entry defines it", () => {
  const D = globalThis.NCD_DATABANK, set = D.toolSets[0].name;
  assert.equal(G.isCommon(w("Pistol")), true);
  assert.equal(G.isCommon(w("Pistol", ["Silent"])), false);         // added keywords
  for (const never of ["Sniper rifle", "Launcher", "Mine"]) assert.equal(G.isCommon(w(never)), false, never);
  assert.equal(G.isCommon(C.newProp("Umbrella")), true);
  const kit = (quality, consumable = false) => ({ kind: "kit", set, quality, consumable });
  assert.equal(G.isCommon(kit("improvised")), true);
  assert.equal(G.isCommon(kit("standard")), false);
  assert.equal(G.isCommon(kit("standard", true)), true);
  assert.equal(G.isCommon(kit("exceptional", true)), false);
  assert.equal(G.isCommon({ kind: "equipment", entry: "Basic" }), true);  // basic guided skill software
  assert.equal(G.isCommon({ kind: "equipment", entry: "Tablet" }), true);
  assert.equal(G.isCommon({ kind: "equipment", entry: "Advanced" }), false);
  assert.equal(G.isCommon({ kind: "armor", level: 1 }), false);
  assert.ok(D.weapons.filter((x) => x.common === false).length === 3);
});
