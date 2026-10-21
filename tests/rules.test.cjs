// Run with: node --test tests/rules.test.cjs
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

const C = globalThis.NCD_CHARACTERS, CATALOG = globalThis.NCD_ABILITIES, R = globalThis.NCD_RULES;
const step5 = (n) => Number.isInteger(n) && n % 5 === 0;

test("every archetype and origin has rules", () => {
  assert.deepEqual(Object.keys(R.archetypes), C.ARCHETYPES);
  assert.deepEqual(Object.keys(R.origins), C.ORIGINS);
  for (const x of [...Object.values(R.archetypes), ...Object.values(R.origins)]) {
    assert.equal(typeof x.pitch, "string");
    assert.ok(x.pitch.length > 0);
  }
});

test("every archetype has its opening paragraph and what it does on the job", () => {
  for (const [name, a] of Object.entries(R.archetypes)) {
    assert.ok(typeof a.intro === "string" && a.intro.length > 0, name);
    assert.equal(a.job.length, 2, name);
    for (const b of a.job) {
      assert.ok(typeof b.lead === "string" && b.lead.endsWith(":"), name);
      assert.ok(b.items.length > 0 && b.items.every((i) => typeof i === "string" && i.length > 0), name);
    }
  }
});

test("archetype skills use known skill ids, legal values, and at most 2 dice", () => {
  for (const [name, a] of Object.entries(R.archetypes)) {
    assert.equal(Object.keys(a.skills).length, 12, name);
    for (const [id, s] of Object.entries(a.skills)) {
      const def = C.SKILLS.find((k) => k.id === id);
      assert.ok(def && ["mental", "physical"].includes(def.type), `${name}: ${id}`);
      assert.ok(s.value === null || (s.value >= C.MIN_VALUE && s.value <= C.MAX_VALUE && step5(s.value)), `${name}: ${id}`);
      for (const k of ["adv", "chal"]) assert.ok(Number.isInteger(s[k]) && s[k] >= 0 && s[k] <= C.MAX_INTRINSIC, `${name}: ${id}`);
    }
  }
});

test("initiatives are whole percentages", () => {
  for (const [name, a] of Object.entries(R.archetypes))
    for (const k of ["world", "network"]) assert.ok(a.initiative[k] >= 50 && a.initiative[k] <= 95 && step5(a.initiative[k]), `${name}: ${k}`);
});

test("knows lists come from C.KNOWLEDGE", () => {
  for (const [name, a] of Object.entries(R.archetypes)) {
    for (const k of a.knows.from) assert.ok(C.KNOWLEDGE.includes(k), `${name}: ${k}`);
    assert.equal(new Set(a.knows.from).size, a.knows.from.length, name);
    if (name === "Mastermind") {
      assert.equal(a.knows.count, 4);
      assert.deepEqual(a.knows.from, C.KNOWLEDGE);
    } else {
      assert.equal(a.knows.count, 3, name);
      assert.equal(a.knows.from.length, 5, name);
    }
  }
});

const G = globalThis.NCD_GEAR, D = globalThis.NCD_DATABANK;
const templates = () => [
  ...Object.entries(R.archetypes).flatMap(([n, a]) => a.gear.flatMap((l) => (l.choose ?? [l]).flatMap((o) => o.items.map((t) => [n, t])))),
  ...Object.entries(R.augmentationGear).flatMap(([id, ts]) => ts.map((t) => [id, t])),
];

test("gear templates: lines have text and items, choice groups have at least 2 options", () => {
  for (const [name, a] of Object.entries(R.archetypes)) for (const l of a.gear) {
    for (const o of l.choose ?? [l]) { assert.ok(o.text.trim(), name); assert.ok(o.items.length > 0, name); }
    if (l.choose) assert.ok(l.choose.length >= 2, name);
  }
  for (const id of Object.keys(R.augmentationGear)) assert.ok(CATALOG.some((a) => a.id === id && a.type === "augmentation"), id);
});

test("gear templates name real categories, sets, vehicles, and keywords", () => {
  const cats = D.weapons.map((w) => w.name), vehicles = D.vehicles.map((v) => v.name), sets = D.toolSets.map((t) => t.name);
  for (const [where, t] of templates()) {
    assert.ok(G.KINDS.includes(t.kind) && t.name, where);
    for (const c of [t.category, ...(t.categories ?? [])].filter(Boolean)) assert.ok(cats.includes(c), `${where}: ${c}`);
    for (const v of [t.vehicle, ...(t.vehicles ?? [])].filter(Boolean)) assert.ok(vehicles.includes(v), `${where}: ${v}`);
    if (t.kind === "kit") assert.ok(sets.includes(t.set) && t.quality in G.QUALITIES, where);
    for (const k of [...(t.keywords ?? []), ...(t.fixed ?? [])]) assert.ok(G.keyword(k), `${where}: ${k}`);
  }
});

test("given keywords are legal for every category a template allows", () => {
  for (const [where, t] of templates()) for (const category of t.categories ?? [t.category]) {
    const item = { kind: t.kind, category, keywords: [], fixed: t.fixed ?? [] };
    for (const k of t.keywords ?? []) { assert.ok(G.canAdd(item, k), `${where}: ${category} + ${k}`); item.keywords.push(k); }
  }
});

test("Merc and Operator starting gear match the book", () => {
  const merc = R.archetypes.Merc.gear[0].items;
  assert.deepEqual(merc.map((t) => [t.category, t.pick]), [["Pistol", 2], ["Rifle", 1]]);
  const op = R.archetypes.Operator.gear.flatMap((l) => l.items ?? []);
  assert.deepEqual(op.find((t) => t.kind === "vehicle").vehicles, ["Chopper", "Street Bike", "Muscle Car", "Drift Car"]);
  assert.deepEqual(op.find((t) => t.categories).categories, ["Pistol", "Rifle", "Shotgun", "Launcher"]);
});

test("Assassin matches the book", () => {
  const a = R.archetypes.Assassin;
  assert.deepEqual(a.initiative, { world: 70, network: 50 });
  assert.deepEqual(a.skills, {
    "case-the-joint": { value: 60, adv: 0, chal: 0 },
    "climb-jump-or-tumble": { value: 55, adv: 0, chal: 0 },
    "cover-your-tracks": { value: 55, adv: 1, chal: 0 },
    "gossip-with-corporates": { value: null, adv: 0, chal: 1 },
    "gossip-with-citizens": { value: null, adv: 0, chal: 2 },
    "play-a-game": { value: null, adv: 0, chal: 1 },
    "read-the-situation": { value: 55, adv: 0, chal: 0 },
    "shoot-someone": { value: 65, adv: 2, chal: 0 },
    "slash-stab-or-strike-someone": { value: 65, adv: 2, chal: 0 },
    "size-someone-up": { value: 60, adv: 0, chal: 0 },
    "sneak-around": { value: 65, adv: 2, chal: 0 },
    "throw-something": { value: 60, adv: 1, chal: 0 },
  });
  assert.equal(a.gear.length, 3);
  assert.equal(a.gear[0].choose.length, 2);
  assert.deepEqual([a.gear[1].items[0].category, a.gear[1].items[0].quantity], ["Thrown", 5]);
  assert.equal(a.gear[2].items[0].kind, "prop");
  assert.match(a.gear[0].choose[0].text, /compact rail pistol/i);
  assert.deepEqual(a.gear[0].choose[0].items[0].keywords, ["Compact", "Rail"]);
  assert.match(a.gear[0].choose[1].text, /two plasma swords/i);
});

test("origin options match the spec table", () => {
  const P = (key, kind, count, category, differentFrom) => ({ key, kind, count, category, ...(differentFrom ? { differentFrom } : {}) });
  const four = (c1, c2, a1, a2) => [P("a", "chal", 2, c1), P("b", "chal", 1, c2, "a"), P("c", "adv", 2, a1), P("d", "adv", 1, a2, "c")];
  const two = (c) => [P("a", "chal", 2, c), P("b", "chal", 1, c, "a")];
  const expected = {
    Cybernetic: { "chop-shop": [P("a", "chal", 2, "mental"), P("b", "chal", 1, "physical")], "new-game-plus": four("physical", "physical", "physical", "physical") },
    "Gene-Spliced": { "artificial-lycanthropy": [P("a", "chal", 2, "mental"), P("b", "chal", 1, "physical")], "genome-engineering": four("mental", "mental", "physical", "physical") },
    Psionic: { "born-this-way": four("physical", "physical", "mental", "mental"), "moment-of-clarity": two("mental") },
    Synthetic: { "network-native": two("physical"), "ascended-robot": two("mental") },
  };
  for (const [origin, opts] of Object.entries(expected)) {
    const o = R.origins[origin];
    assert.deepEqual(o.options.map((x) => x.id), Object.keys(opts), origin);
    for (const opt of o.options) {
      assert.deepEqual(opt.placements ?? [], opts[opt.id], opt.id);
      assert.ok(opt.name && opt.text, opt.id);
    }
  }
  const opt = (origin, id) => R.origins[origin].options.find((x) => x.id === id);
  assert.deepEqual(opt("Gene-Spliced", "artificial-lycanthropy").bumps, { count: 2, category: "physical" });
  assert.equal(opt("Psionic", "moment-of-clarity").luck, 20);
  assert.equal(opt("Synthetic", "network-native").perk, "installation-wizard");
  assert.equal(opt("Synthetic", "ascended-robot").perk, "device-driver");
  assert.equal(opt("Cybernetic", "chop-shop").extraAugmentation, true);
  assert.deepEqual(R.origins.Synthetic.augmentations, ["synthetic-body"]);
  for (const o of ["Cybernetic", "Gene-Spliced", "Psionic"]) assert.deepEqual(R.origins[o].augmentations, []);
});

test("ability ids in the rules exist in the catalog", () => {
  const ids = new Set(CATALOG.map((a) => a.id));
  const used = [...Object.keys(R.augmentationGear)];
  for (const o of Object.values(R.origins)) {
    used.push(...o.augmentations);
    for (const opt of o.options) if (opt.perk) used.push(opt.perk);
  }
  assert.ok(used.length > 4);
  for (const id of used) assert.ok(ids.has(id), id);
  for (const items of Object.values(R.augmentationGear)) assert.ok(items.length > 0);
});
