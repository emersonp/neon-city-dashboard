// Run with: node --test tests/shells.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../shared.js");
require("../dice.js");
require("../conditions.js");
require("../characters.js");
require("../abilities.js");
require("../shells.js");

const C = globalThis.NCD_CHARACTERS, S = globalThis.NCD_SHELLS, CAT = globalThis.NCD_ABILITIES;
// A character in its default body; `skills` (full states) go through withSkill.
const char = ({ skills = {}, ...fields } = {}) => Object.entries(skills).reduce((c, [id, s]) => C.withSkill(c, id, s),
  { ...C.newCharacter(), creation: undefined, handle: "Vex", origin: "Cybernetic", currentInfluence: 1, ...fields });
const synth = (fields) => char({ origin: "Synthetic", ...fields });
const quick = (changes = {}) => ({ shell: "quick", identity: "specific", name: "Night Janitor", source: "scene",
  major: ["analyze-data", "convince-someone", "sneak-around", "shoot-someone"], minor: ["goad-someone", "run-like-hell"], ...changes });

test("the catalog: Quick Shell, Mass-Produced Synth, Utility Robot, Total Conversion Cyborg", () => {
  assert.deepEqual(S.SHELLS.map((s) => s.name), ["Quick Shell", "Mass-Produced Synth", "Utility Robot", "Total Conversion Cyborg"]);
  for (const s of S.SHELLS) {
    for (const id of Object.keys(s.skills ?? {})) assert.ok(C.SKILLS.some((x) => x.id === id), `${s.id}: ${id}`);
    for (const id of s.augmentations) assert.ok(CAT.some((a) => a.id === id), `${s.id}: ${id}`);
    for (const src of s.sources) assert.ok(S.SOURCES[src], `${s.id}: ${src}`);
  }
  for (const i of Object.values(S.IDENTITIES)) for (const id of i.chal) assert.ok(C.SKILLS.some((x) => x.id === id), id);
  assert.ok(CAT.some((a) => a.id === S.DEVICE_DRIVER));
});

test("body type: synthetic minds load only into synthetic shells, humans only into human ones", () => {
  const human = char(), ai = synth();
  const ok = (c) => S.SHELLS.filter((s) => S.canLoad(c, s)).map((s) => s.id);
  assert.deepEqual(ok(human), ["quick", "cyborg"]);
  assert.deepEqual(ok(ai), ["quick", "synth", "utility-robot"]);
  assert.equal(S.missing(human, { shell: "synth", source: "scene" }), "shell");
  assert.equal(S.missing(ai, { shell: "cyborg" }), "shell");
  assert.equal(S.missing(human, { shell: "nope" }), "shell");
  // the Quick Shell's Body Type follows the mind
  assert.equal(S.build(human, quick()).synthetic, false);
  assert.equal(S.build(ai, quick()).synthetic, true);
  assert.deepEqual(S.build(human, quick()).augmentations, []);
  assert.deepEqual(S.build(ai, quick()).augmentations, ["synthetic-body"]);
});

test("Quick Shell: identity, then 4 and 2 different skills, a source, and a name", () => {
  const c = char();
  assert.equal(S.missing(c, quick({ identity: null })), "identity");
  assert.equal(S.missing(c, quick({ major: ["analyze-data", "analyze-data", "sneak-around", "shoot-someone"] })), "major");
  assert.equal(S.missing(c, quick({ major: ["analyze-data"] })), "major");
  assert.equal(S.missing(c, quick({ major: ["analyze-data", "convince-someone", "sneak-around", "initiative-in-the-world"] })), "major");
  assert.equal(S.missing(c, quick({ minor: ["goad-someone", "sneak-around"] })), "minor"); // all 6 different
  assert.equal(S.missing(c, quick({ minor: ["goad-someone"] })), "minor");
  assert.equal(S.missing(c, quick({ source: null })), "source");
  assert.equal(S.missing(c, quick({ name: " " })), "name");
  assert.equal(S.missing(c, quick()), null);
});

test("Quick Shell: mental capabilities get advantage dice, physical ones a chance; the identity adds challenge dice", () => {
  const shell = S.build(char(), quick({ appearance: " Grey coveralls. " }));
  assert.equal(shell.type, "quick");
  assert.equal(shell.name, "Night Janitor");
  assert.equal(shell.appearance, "Grey coveralls.");
  assert.equal(shell.wounds, 0);
  assert.deepEqual(shell.skills, {
    "analyze-data": { adv: 2, chal: 0 },
    "convince-someone": { adv: 2, chal: 1 },   // a capability and Specific Individual
    "intimidate-someone": { adv: 0, chal: 1 },
    "lie-to-someone": { adv: 0, chal: 1 },
    "sneak-around": { value: 75 },
    "shoot-someone": { value: 75 },
    "goad-someone": { adv: 1, chal: 0 },
    "run-like-hell": { value: 65 },
  });
  const anon = S.build(char(), quick({ identity: "anonymous" })).skills;
  assert.deepEqual(Object.keys(anon).filter((id) => anon[id].chal), ["gossip-with-citizens", "gossip-with-corporates", "throw-money-at-the-problem"]);
});

test("in a Quick Shell, the shell's values count, the mind's stay, and the default body's are covered", () => {
  const c = char({ skills: { "analyze-data": { value: 80, adv: 1, chal: 1 }, "sneak-around": { value: 90, adv: 1, chal: 0 },
    "climb-jump-or-tumble": { value: 70 } } });
  const { character: s } = S.load(c, quick());
  assert.deepEqual(C.skill(s, "analyze-data"), { value: 80, adv: 2, chal: 0 });
  assert.deepEqual(C.skill(s, "sneak-around"), { value: 75, adv: 1, chal: 0 });
  assert.deepEqual(C.skill(s, "climb-jump-or-tumble"), { value: null, adv: 0, chal: 0 });
  assert.equal(C.canBeUsed(s, "sneak-around"), false);
  assert.equal(C.canBeUsed(s, "analyze-data"), true);
  // and back in the default body, it's as it was
  assert.deepEqual(C.skill(S.returnToDefault(s), "sneak-around"), { value: 90, adv: 1, chal: 0 });
  assert.deepEqual(C.skill(S.returnToDefault(s), "analyze-data"), { value: 80, adv: 1, chal: 1 });
});

test("Mass-Produced Synth and Utility Robot: the printed numbers, body perks and Inconspicuous x2", () => {
  for (const id of ["synth", "utility-robot"]) {
    const { character: s, shell } = S.load(synth(), { shell: id, source: "scene" });
    assert.equal(shell.name, S.byId(id).name);
    assert.deepEqual(C.skill(s, "gossip-with-ai"), { value: null, adv: 2, chal: 0 });
    assert.deepEqual(C.skill(s, "gossip-with-citizens"), { value: null, adv: 0, chal: 1 });
    assert.equal(C.skill(s, "conceal-an-object").value, 75);
    assert.equal(C.skill(s, "sneak-around").value, 70);
    assert.deepEqual(C.abilityIds(s), ["synthetic-body"]);
    assert.deepEqual(C.conditions(shell).map((x) => [x.name, x.severity, x.intrinsic]), [["Inconspicuous", 2, true]]);
    assert.deepEqual(S.byId(id).perks.map((p) => p.name), ["Stock Model", "Fresh Install"]);
  }
  // Kidnapping isn't one of their sources
  assert.equal(S.missing(synth(), { shell: "synth", source: "larceny" }), "source");
});

test("Device Driver loads the Synth and the Utility Robot without a Shell Source", () => {
  const driver = C.withAbility(synth(), S.DEVICE_DRIVER);
  assert.deepEqual(S.sourcesFor(driver, S.byId("synth")), []);
  assert.equal(S.missing(driver, { shell: "utility-robot" }), null);
  assert.equal(S.load(driver, { shell: "utility-robot", source: "people" }).shell.source, null);
  assert.equal(S.load(driver, { shell: "utility-robot" }).character.currentInfluence, 1);
  // not the Quick Shell
  assert.deepEqual(S.sourcesFor(driver, S.byId("quick")), ["scene", "larceny", "people"]);
});

test("Total Conversion Cyborg: capabilities and 2 Synthetic augmentations (not Synthetic Body)", () => {
  const options = S.augmentationChoices(CAT).map((a) => a.id);
  assert.ok(options.length > 2 && !options.includes("synthetic-body") && options.includes("extra-arms"));
  assert.ok(S.augmentationChoices(CAT).every((a) => a.origin === "Synthetic" && a.type === "augmentation"));
  const choices = quick({ shell: "cyborg", identity: undefined, augmentations: ["extra-arms", "hulking-frame"] });
  assert.equal(S.missing(char(), { ...choices, augmentations: ["extra-arms"] }), "augmentations");
  assert.equal(S.missing(char(), { ...choices, augmentations: ["extra-arms", "extra-arms"] }), "augmentations");
  assert.equal(S.missing(char(), { ...choices, augmentations: ["extra-arms", "synthetic-body"] }), "augmentations");
  const { character: s, shell } = S.load(char(), choices, CAT);
  assert.equal(shell.synthetic, false);
  assert.deepEqual(shell.augmentations, ["extra-arms", "hulking-frame"]);
  assert.deepEqual(C.abilityIds(s).slice(-2), ["extra-arms", "hulking-frame"]);
  assert.equal(C.skill(s, "convince-someone").chal, 0); // no Shell Identity on the Cyborg
});

test("Shell Source: The Right Kind of People costs 1 Influence, and needs it", () => {
  const { character: s, source } = S.load(char({ currentInfluence: 2 }), quick({ source: "people" }));
  assert.equal(source, "people");
  assert.equal(s.currentInfluence, 1);
  assert.equal(S.missing(char({ currentInfluence: 0 }), quick({ source: "people" })), "source");
  assert.equal(S.load(char({ currentInfluence: 0 }), quick({ source: "people" })), null);
  assert.equal(S.SOURCES.larceny.heat, 4);
  assert.equal(S.load(char(), quick({ source: "larceny" })).character.currentInfluence, 1);
});

test("loading replaces a loaded shell; each body keeps its own wounds", () => {
  const hurt = C.withWounds(char(), 2);
  let { character: s } = S.load(hurt, quick());
  assert.equal(C.wounds(s), 0);
  s = C.withWounds(s, 3);
  ({ character: s } = S.load(s, quick({ name: "Courier" })));
  assert.equal(s.shell.name, "Courier");
  assert.equal(C.wounds(s), 0);
  assert.equal(C.wounds(S.returnToDefault(s)), 2);
});

test("a destroyed shell: back in the default body with Memory Loss, worse the second time", () => {
  let { character: s } = S.load(char(), quick());
  s = S.destroy(s);
  assert.equal(C.inShell(s), false);
  assert.deepEqual(C.conditions(s).map((x) => [x.name, x.severity, x.intrinsic]), [["Memory Loss", 1, false]]);
  ({ character: s } = S.load(s, quick()));
  s = S.destroy(s);
  assert.deepEqual(C.conditions(s).map((x) => [x.name, x.severity]), [["Memory Loss", 2]]);
  // the shell's own conditions go with it
  let { character: r } = S.load(synth(), { shell: "synth", source: "scene" });
  assert.deepEqual(C.conditions(S.returnToDefault(r)), []);
});

test("the end of a job clears the shell", () => {
  const { character: s } = S.load(C.startJob(char()), quick());
  assert.equal(C.inShell(C.abandonJob(s)), false);
  assert.equal(C.inShell(C.startJob(s)), false);
});

test("label and installed gear", () => {
  const { character: s } = S.load(char(), quick());
  assert.equal(S.label(s), "Night Janitor · Quick Shell");
  assert.equal(S.label(S.load(synth(), { shell: "synth", source: "scene" }).character), "Mass-Produced Synth");
  assert.equal(S.label(char()), "");
  assert.equal(S.sheetOf(s).id, "quick");
  assert.equal(S.isInstalled({ keywords: ["Cybernetic"] }), true);
  assert.equal(S.isInstalled({ keywords: [], fixed: ["Cybernetic"] }), true);
  assert.equal(S.isInstalled({ keywords: ["Compact"] }), false);
});
