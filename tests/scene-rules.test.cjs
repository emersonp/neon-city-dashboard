// Run with: node --test tests/scene-rules.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../shared.js");
require("../dice.js");
require("../tables.js");
require("../enemies.js");
require("../hazards.js");
require("../overlay-rules.js");
require("../scene-rules.js");

const S = globalThis.NCD_SCENES;
const RULEBOOK = { enemies: globalThis.NCD_ENEMIES.enemies, tables: globalThis.NCD_TABLES, hazards: globalThis.NCD_HAZARDS.hazards };
const NO_CUSTOM = { enemies: [], objectives: [], hazards: [] };
const lib = (custom = NO_CUSTOM) => S.library(RULEBOOK, custom);
const find = (list, name) => list.find((item) => item.name === name);

test("library: every rulebook enemy, tagged objective and hazard, marked rulebook", () => {
  const { enemies, objectives, hazards } = lib();
  assert.equal(enemies.length, 58);
  assert.equal(hazards.length, RULEBOOK.hazards.length);
  // the sample objectives, the security systems and the Network obstacles, with the difficulty read from the tag
  assert.equal(objectives.length, 22);
  assert.equal(find(objectives, "Get Through a Lock").difficulty, 30);
  assert.equal(find(objectives, "Laser Tripwires").difficulty, 50);
  assert.equal(find(objectives, "Hive RFID Readers").difficulty, 200);
  for (const item of [...enemies, ...objectives, ...hazards]) assert.equal(item.source, "rulebook", item.name);
  assert.equal(new Set([...enemies, ...objectives, ...hazards].map((i) => i.id)).size, 58 + 22 + hazards.length);
});

test("custom enemies keep exactly the rulebook enemy's fields, and luck only when they aren't a minion squad", () => {
  const raw = {
    id: "c1", name: "  Vex  ", type: "Antagonist", luck: "80", text: "A fixer.", page: 3, portrait: "x.png", junk: 1,
    attacks: [["Shock Pistol", "75%; 45 physical damage"], ["", "no name"], ["Blank", " "]], perks: [["Quick", "Moves fast."]],
  };
  assert.deepEqual(S.cleanCustom("enemy", raw), {
    id: "c1", name: "Vex", type: "Antagonist", luck: 80, text: "A fixer.",
    attacks: [["Shock Pistol", "75%; 45 physical damage"]], perks: [["Quick", "Moves fast."]],
  });
  const squad = S.cleanCustom("enemy", { id: "c2", name: "Goons", type: "Minion squad", luck: 50, attacks: [] });
  assert.equal("luck" in squad, false);
  // a type it doesn't know is an antagonist; luck that isn't a whole number above 0 is 50
  assert.deepEqual([S.cleanCustom("enemy", { id: "c3", name: "X", type: "Boss", luck: -4 })].map((e) => [e.type, e.luck]),
    [["Antagonist", 50]]);
  assert.equal(S.cleanCustom("enemy", { id: "c4", name: " " }), null);
  assert.equal(S.cleanCustom("enemy", { name: "No id" }), null);
});

test("custom objectives have a name, description, difficulty and Urgent, Timed or neither", () => {
  assert.deepEqual(S.cleanCustom("objective", { id: "o1", name: "Defuse", text: "A bomb.", difficulty: "100", timing: "timed", x: 1 }),
    { id: "o1", name: "Defuse", text: "A bomb.", difficulty: 100, timing: "timed" });
  const plain = S.cleanCustom("objective", { id: "o2", name: "Talk", difficulty: 0, timing: "soon" });
  assert.deepEqual([plain.difficulty, plain.timing, plain.text], [50, null, ""]);
});

test("custom hazards default to difficulty 50, a 50% hit and 10 × round damage", () => {
  assert.deepEqual(S.cleanCustom("hazard", { id: "h1", name: "Sparks" }),
    { id: "h1", name: "Sparks", text: "", difficulty: 50, hit: 50, damage: "round", effect: "" });
  assert.deepEqual(S.cleanCustom("hazard", { id: "h2", name: "Gas", hit: 70, damage: 15, effect: "Choking." }),
    { id: "h2", name: "Gas", text: "", difficulty: 50, hit: 70, damage: 15, effect: "Choking." });
  assert.equal(S.cleanCustom("hazard", { id: "h3", name: "Noise", damage: null }).damage, null);
  assert.equal(S.cleanCustom("hazard", { id: "h4", name: "Odd", hit: 150, damage: "lots" }).hit, 100);
  assert.equal(S.cleanCustom("hazard", { id: "h4", name: "Odd", damage: "lots" }).damage, "round");
});

test("copying snapshots the definition: changing the list item afterwards leaves the copy alone", () => {
  const custom = { ...NO_CUSTOM, enemies: [S.cleanCustom("enemy", { id: "c1", name: "Vex", luck: 80, attacks: [["Zap", "75%; 45 physical damage"]] })] };
  const vex = find(lib(custom).enemies, "Vex");
  const copy = S.copy(vex, "e1");
  custom.enemies[0].attacks[0][1] = "10%; 1 damage";
  vex.attacks[0][1] = "10%; 1 damage";
  vex.luck = 1;
  assert.deepEqual([copy.def.attacks[0][1], copy.def.luck], ["75%; 45 physical damage", 80]);
  assert.deepEqual([copy.id, copy.kind, copy.name], ["e1", "enemy", "Vex"]);
});

test("an enemy copy has its own name, and a minion squad copy its size (5 to start)", () => {
  const guards = find(lib().enemies, "Private Security Guards");
  assert.equal(S.copy(guards, "e1").size, 5);
  assert.deepEqual(S.copy(guards, "e2", { name: "Lobby guards", size: 8 }), { ...S.copy(guards, "e2"), name: "Lobby guards", size: 8 });
  const bodyguard = S.copy(find(lib().enemies, "Bodyguard"), "e3", { name: "Moth", size: 4 });
  assert.equal(bodyguard.name, "Moth");
  assert.equal("size" in bodyguard, false);
  assert.equal(S.copy(find(lib().enemies, "Bodyguard"), "e4", { name: " " }).name, "Bodyguard");
});

test("an objective or hazard copy has its own name, difficulty, and Urgent, Timed or neither", () => {
  const lock = find(lib().objectives, "Get Through a Lock");
  const copy = S.copy(lock, "o1", { name: "Vault door", difficulty: 100, timing: "urgent" });
  assert.deepEqual([copy.name, copy.difficulty, copy.timing, copy.def.difficulty], ["Vault door", 100, "urgent", 30]);
  const plain = S.copy(lock, "o2");
  assert.deepEqual([plain.name, plain.difficulty, plain.timing], ["Get Through a Lock", 30, null]);
  const smoke = S.copy(find(lib().hazards, "Narcotic Smoke"), "h1", { timing: "timed" });
  assert.deepEqual([smoke.kind, smoke.difficulty, smoke.timing], ["hazard", 50, "timed"]);
});

// A scene with two Bodyguards (Vex and Moth), a lock and a hazard, the lock being the Main Goal.
function heist() {
  const L = lib();
  let scene = S.newScene("s1");
  scene = { ...scene, name: "Heist", mode: "conflict", notes: "Get in." };
  scene = S.addElement(scene, S.copy(find(L.enemies, "Bodyguard"), "vex", { name: "Vex" }));
  scene = S.addElement(scene, S.copy(find(L.enemies, "Bodyguard"), "moth", { name: "Moth" }));
  scene = S.addElement(scene, S.copy(find(L.enemies, "Private Security Guards"), "squad", { size: 4 }));
  scene = S.addElement(scene, S.copy(find(L.enemies, "Junior Executive"), "exec"));
  scene = S.addElement(scene, S.copy(find(L.objectives, "Get Through a Lock"), "lock"));
  scene = S.addElement(scene, S.copy(find(L.objectives, "Security Cameras"), "cams", { timing: "urgent", difficulty: 20 }));
  scene = S.addElement(scene, S.copy(find(L.hazards, "Narcotic Smoke"), "smoke"));
  return S.setMainGoal(scene, "lock");
}

test("scenes: elements in order, one Main Goal, and removing the Main Goal leaves none", () => {
  const scene = heist();
  assert.deepEqual(scene.elements.map((e) => e.id), ["vex", "moth", "squad", "exec", "lock", "cams", "smoke"]);
  assert.equal(scene.mainGoal, "lock");
  assert.equal(S.setMainGoal(scene, "vex").mainGoal, "vex");
  assert.equal(S.setMainGoal(scene, "nobody").mainGoal, "lock");
  assert.equal(S.removeElement(scene, "lock").mainGoal, null);
  assert.equal(S.removeElement(scene, "vex").mainGoal, "lock");
  assert.deepEqual(S.removeElement(scene, "vex").elements.map((e) => e.id), ["moth", "squad", "exec", "lock", "cams", "smoke"]);
});

test("scenes: a copy's name, size, difficulty and timing change; nothing else does", () => {
  const scene = S.changeElement(S.changeElement(heist(), "squad", { size: 9, name: "Lobby", luck: 5 }), "lock", { difficulty: 60, timing: "timed" });
  const squad = scene.elements.find((e) => e.id === "squad");
  assert.deepEqual([squad.name, squad.size, "luck" in squad.def], ["Lobby", 9, false]);
  const lock = scene.elements.find((e) => e.id === "lock");
  assert.deepEqual([lock.difficulty, lock.timing, lock.def.difficulty], [60, "timed", 30]);
});

test("scenes: a second copy of the same name gets a number", () => {
  assert.equal(S.freeName(heist(), "Bodyguard"), "Bodyguard");
  assert.equal(S.freeName(heist(), "Vex"), "Vex 2");
  assert.equal(S.freeName(S.addElement(heist(), { ...heist().elements[0], id: "vex2", name: "Vex 2" }), "Vex"), "Vex 3");
});

test("scenes: validation wants a name and a Main Goal that's one of the scene's elements", () => {
  assert.deepEqual(S.sceneProblems(heist()), []);
  assert.deepEqual(S.sceneProblems({ ...heist(), name: " " }), ["Give the scene a name."]);
  assert.deepEqual(S.sceneProblems({ ...heist(), mainGoal: "gone" }), ["The Main Goal isn't one of the scene's elements."]);
  assert.deepEqual(S.sceneProblems({ ...heist(), mainGoal: null }), []);
});

test("scenes: cleaning keeps a good scene as it is and drops what it can't use", () => {
  const scene = heist();
  assert.deepEqual(S.cleanScene(JSON.parse(JSON.stringify(scene))), scene);
  const messy = { ...scene, mode: "party", elements: [...scene.elements, { id: "x", kind: "dragon" }, "junk"], mainGoal: "x" };
  const clean = S.cleanScene(messy);
  assert.deepEqual([clean.mode, clean.elements.length, clean.mainGoal], ["legwork", 7, null]);
  assert.equal(S.cleanScene({ name: "No id" }), null);
  assert.equal(S.cleanScene("nope"), null);
});

test("attack reading: fixed damage, with or without a damage type", () => {
  assert.deepEqual(S.readAttack("75%; 45 physical damage; renders a target unconscious"), { hit: 75, damage: 45, type: "physical" });
  assert.deepEqual(S.readAttack("50%, 20 damage"), { hit: 50, damage: 20, type: null });
  assert.deepEqual(S.readAttack("75%, 40 physical damage. If this character spends an action"), { hit: 75, damage: 40, type: "physical" });
});

test("attack reading: a squad's damage comes from its size now", () => {
  assert.deepEqual(S.readAttack("50%; physical damage equal to the squad's size x5", { size: 4 }), { hit: 50, damage: 20, type: "physical" });
  assert.deepEqual(S.readAttack("65%; physical damage equal to the squad's size x10", { size: 3 }), { hit: 65, damage: 30, type: "physical" });
  assert.deepEqual(S.readAttack("65%; physical damage equal to 5 + (the squad's size x5)", { size: 2 }), { hit: 65, damage: 15, type: "physical" });
  assert.deepEqual(S.readAttack("50%, damage equal to the squad's size x5", { size: 0 }), { hit: 50, damage: 0, type: null });
});

test("attack reading: 10 × the round", () => {
  assert.deepEqual(S.readAttack("50%; damage equal to 10 × the round", { round: 3 }), { hit: 50, damage: 30, type: null });
  assert.deepEqual(S.readAttack("60%; 10 x round physical damage", { round: 2 }), { hit: 60, damage: 20, type: "physical" });
});

test("attack reading: text it can't read is a plain percentile roll", () => {
  assert.equal(S.readAttack("Throws a chair at someone"), null);
  assert.equal(S.readAttack("150%; 10 damage"), null);
  assert.deepEqual(S.readAttack("40%; a nasty surprise"), { hit: 40, damage: null, type: null });
});

test("attack reading: every rulebook enemy's attack is readable", () => {
  for (const e of RULEBOOK.enemies) {
    for (const [name, text] of e.attacks) {
      const read = S.readAttack(text, { size: 2, round: 1 });
      assert.ok(read && Number.isInteger(read.hit) && Number.isInteger(read.damage), `${e.name}: ${name}: ${text}`);
    }
  }
});

// Applies the actions in turn, starting from state.
const run = (state, ...actions) => actions.reduce(S.apply, state);
const started = (scene = heist()) => S.apply(null, { type: "start", scene });
const track = (state, id) => state.track[id];

test("run: starting copies the scene, and a Conflict scene starts at Hazard, round 1", () => {
  const scene = heist();
  const state = started(scene);
  assert.equal(state.sceneId, "s1");
  assert.deepEqual(state.elements, scene.elements);
  assert.notEqual(state.elements, scene.elements);
  assert.deepEqual(state.initiative, { conflict: true, phase: "hazard", round: 1 });
  assert.deepEqual(started({ ...scene, mode: "legwork" }).initiative, { conflict: false, phase: "hazard", round: 1 });
  assert.deepEqual([track(state, "vex").luck, track(state, "squad").size, track(state, "exec").wounds, track(state, "lock").progress],
    [70, 4, 0, 0]);
});

test("run: luck, squad size and wounds change and stop at 0; luck stops at the enemy's own too", () => {
  const state = run(started(),
    { type: "luck", id: "vex", delta: -45 }, { type: "luck", id: "vex", delta: -45 },
    { type: "luck", id: "moth", delta: -10 }, { type: "luck", id: "moth", delta: 100 },
    { type: "size", id: "squad", size: -1 },
    { type: "wounds", id: "exec", delta: 1 }, { type: "wounds", id: "exec", delta: 1 }, { type: "wounds", id: "exec", delta: -5 },
    { type: "wounds", id: "vex", delta: 1 });
  assert.deepEqual([track(state, "vex").luck, track(state, "moth").luck, track(state, "squad").size], [0, 70, 0]);
  // only villains take wounds
  assert.deepEqual([track(state, "exec").wounds, track(state, "vex").wounds], [0, 0]);
  assert.equal(run(started(), { type: "wounds", id: "exec", delta: 2 }).track.exec.wounds, 2);
});

test("run: only villains can be marked Defeated, and it toggles", () => {
  const once = run(started(), { type: "defeated", id: "exec" }, { type: "defeated", id: "vex" });
  assert.deepEqual([track(once, "exec").defeated, track(once, "vex").defeated], [true, false]);
  assert.equal(run(once, { type: "defeated", id: "exec" }).track.exec.defeated, false);
});

test("run: progress goes up to the difficulty and down to 0, and marks the objective progressed this round", () => {
  const state = run(started(), { type: "progress", id: "cams", delta: 15 });
  assert.deepEqual([track(state, "cams").progress, track(state, "cams").progressed], [15, true]);
  assert.equal(run(state, { type: "progress", id: "cams", delta: 50 }).track.cams.progress, 20);
  assert.equal(run(state, { type: "progress", id: "cams", delta: -50 }).track.cams.progress, 0);
  assert.equal(run(state, { type: "progress", id: "vex", delta: 5 }).track.vex.progress, 0);
});

test("run: dealt with is automatic at full progress, 0 luck or squad size 0, and by hand otherwise", () => {
  let state = started();
  assert.equal(["vex", "squad", "cams", "smoke"].some((id) => S.dealtWith(state, id)), false);
  state = run(state, { type: "luck", id: "vex", delta: -70 }, { type: "size", id: "squad", size: 0 },
    { type: "progress", id: "cams", delta: 20 }, { type: "dealt", id: "smoke" });
  assert.deepEqual(["vex", "squad", "cams", "smoke", "moth"].map((id) => S.dealtWith(state, id)), [true, true, true, true, false]);
  assert.equal(S.dealtWith(run(state, { type: "dealt", id: "smoke" }), "smoke"), false);
});

test("run: obstacles left before the Main Goal are everything else not dealt with or defeated", () => {
  let state = started();
  assert.equal(S.obstaclesLeft(state), 6);
  state = run(state, { type: "dealt", id: "vex" }, { type: "defeated", id: "exec" }, { type: "progress", id: "lock", delta: 30 });
  assert.equal(S.obstaclesLeft(state), 4);
  assert.equal(S.obstaclesLeft(started({ ...heist(), mainGoal: null })), 7);
});

const step = (n) => Array.from({ length: Math.abs(n) }, () => ({ type: "step", step: Math.sign(n) }));
// A full round on, from wherever the turn is to the same turn in the next round.
const round = () => step(4);

test("run: stepping turns counts rounds both ways, never below 1", () => {
  let state = run(started(), ...step(3));
  assert.deepEqual(state.initiative, { conflict: true, phase: "slow", round: 1 });
  state = run(state, ...step(1));
  assert.deepEqual(state.initiative, { conflict: true, phase: "hazard", round: 2 });
  state = run(state, ...step(-1));
  assert.deepEqual(state.initiative, { conflict: true, phase: "slow", round: 1 });
  assert.deepEqual(run(started(), ...step(-1)).initiative, { conflict: true, phase: "slow", round: 1 });
});

test("run: an Urgent objective deteriorates at a round's start only if it wasn't progressed in the round before", () => {
  // cams is Urgent; lock is neither
  let state = run(started(), { type: "progress", id: "cams", delta: 5 }, ...round());
  assert.equal(track(state, "cams").deteriorating, 0);
  state = run(state, ...round());
  assert.equal(track(state, "cams").deteriorating, 1);
  assert.deepEqual(state.notices, [{ id: "cams", deteriorating: 1 }]);
  state = run(state, ...round());
  assert.deepEqual([track(state, "cams").deteriorating, track(state, "lock").deteriorating], [2, 0]);
  // stepping within a round, or back, deteriorates nothing
  assert.equal(run(state, ...step(3), ...step(-3)).track.cams.deteriorating, 2);
});

test("run: a Timed objective deteriorates at every round's start, progressed or not", () => {
  const state = run(started(), { type: "progress", id: "smoke", delta: 0 }, { type: "dealt", id: "cams" },
    ...round(), { type: "progress", id: "smoke", delta: 5 }, ...round());
  // smoke is a hazard with no timing: nothing
  assert.equal(track(state, "smoke").deteriorating, 0);
  const timed = S.changeElement(heist(), "lock", { timing: "timed" });
  const later = run(started(timed), { type: "progress", id: "lock", delta: 5 }, ...round(), { type: "progress", id: "lock", delta: 5 }, ...round());
  assert.equal(track(later, "lock").deteriorating, 2);
});

test("run: Deteriorating ×4 then another worsening makes it Irreparable, which refuses progress", () => {
  let state = run(started(), ...round(), ...round(), ...round(), ...round());
  assert.equal(track(state, "cams").deteriorating, 4);
  state = run(state, ...round());
  assert.deepEqual([track(state, "cams").deteriorating, track(state, "cams").irreparable], [4, true]);
  assert.deepEqual(state.notices, [{ id: "cams", irreparable: true }]);
  assert.equal(run(state, { type: "progress", id: "cams", delta: 10 }).track.cams.progress, 0);
  // and it worsens no further
  assert.deepEqual(run(state, ...round()).notices, []);
});

test("run: a dealt-with objective doesn't deteriorate", () => {
  const state = run(started(), { type: "progress", id: "cams", delta: 20 }, ...round(), ...round());
  assert.equal(track(state, "cams").deteriorating, 0);
});

test("run: Make it a conflict turns a Legwork scene's initiative on at Hazard, round 1", () => {
  const legwork = started({ ...heist(), mode: "legwork" });
  assert.deepEqual(run(legwork, { type: "conflict" }).initiative, { conflict: true, phase: "hazard", round: 1 });
});

test("run: what the overlay reports becomes the initiative, starting each round it went on", () => {
  const state = run(started(), { type: "initiative", initiative: { conflict: true, phase: "fast", round: 3 } });
  assert.deepEqual(state.initiative, { conflict: true, phase: "fast", round: 3 });
  assert.equal(track(state, "cams").deteriorating, 2);
  assert.deepEqual(run(state, { type: "initiative", initiative: { conflict: false } }).initiative, { conflict: false, phase: "hazard", round: 1 });
});

test("run: an element added mid-run is in the run only, with fresh tracking", () => {
  const scene = heist();
  const extra = S.copy(find(lib().enemies, "Bodyguard"), "rook", { name: "Rook" });
  const state = run(started(scene), { type: "add", element: extra });
  assert.deepEqual(state.elements.map((e) => e.id).at(-1), "rook");
  assert.equal(track(state, "rook").luck, 70);
  assert.equal(scene.elements.length, 7);
  assert.equal(run(state, { type: "add", element: extra }).elements.length, 8);
});

test("run: ending it leaves no run, and the saved scene as it was", () => {
  const scene = heist();
  const before = structuredClone(scene);
  assert.equal(run(started(scene), { type: "luck", id: "vex", delta: -20 }, { type: "end" }), null);
  assert.deepEqual(scene, before);
});

test("run: hazards are highlighted on the Hazard turn and enemies on the Antagonists turn", () => {
  let state = started();
  assert.deepEqual(S.highlighted(state), ["smoke"]);
  state = run(state, ...step(1));
  assert.deepEqual(S.highlighted(state), []);
  state = run(state, ...step(1));
  assert.deepEqual(S.highlighted(state), ["vex", "moth", "squad", "exec"]);
  assert.deepEqual(S.highlighted(started({ ...heist(), mode: "legwork" })), []);
});

test("rolls: each attack of an enemy copy, labelled with the copy's name, and a squad's from its size now", () => {
  const state = run(started(), { type: "size", id: "squad", size: 3 });
  assert.deepEqual(S.attacks(state, "vex").map((a) => a.label), ["Vex — Shock Pistol", "Vex — Fists and Feet", "Vex — Anything Else"]);
  assert.deepEqual(S.attacks(state, "vex")[0], {
    label: "Vex — Shock Pistol", name: "Shock Pistol", hit: 75, damage: 45, type: "physical",
    text: "75%; 45 physical damage; renders a target unconscious if it reduces them to 0 luck",
  });
  assert.equal(S.attacks(state, "squad")[0].damage, 15);
});

test("rolls: a hazard rolls its hit chance for 10 × the round, or its fixed damage", () => {
  const state = run(started(), ...round(), ...round());
  assert.deepEqual(S.attacks(state, "smoke").map(({ label, hit, damage }) => ({ label, hit, damage })),
    [{ label: "Narcotic Smoke — Hazard", hit: 50, damage: 30 }]);
  const leak = S.copy(find(lib().hazards, "Radiation Leak"), "leak");
  assert.equal(S.attacks(run(state, { type: "add", element: leak }), "leak")[0].damage, 20);
  assert.deepEqual(S.attacks(state, "lock"), []);
});

test("rolls: an attack it can't read is still there, as a plain percentile roll with its text", () => {
  const odd = S.copy({ id: "c1", kind: "enemy", source: "custom", ...S.cleanCustom("enemy", { id: "c1", name: "Odd", attacks: [["Weird", "Something strange"]] }) }, "odd");
  const state = run(started(), { type: "add", element: odd });
  assert.deepEqual(S.attacks(state, "odd"), [{ label: "Odd — Weird", name: "Weird", hit: null, damage: null, type: null, text: "Something strange" }]);
});

// A stand-in for localStorage.
const memory = () => {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k), data };
};
const CUSTOM = {
  enemies: [S.cleanCustom("enemy", { id: "c1", name: "Vex", luck: 80, attacks: [["Zap", "75%; 45 physical damage"]] })],
  objectives: [S.cleanCustom("objective", { id: "c2", name: "Defuse", difficulty: 100, timing: "timed" })],
  hazards: [S.cleanCustom("hazard", { id: "c3", name: "Sparks", damage: 15 })],
};

test("storage: custom items, scenes and the open scene save and load back, under ncd.", () => {
  const storage = memory();
  assert.deepEqual(S.loadCustom(storage), NO_CUSTOM);
  assert.deepEqual(S.loadScenes(storage), []);
  assert.equal(S.loadOpen(storage), null);
  S.saveCustom(storage, CUSTOM);
  S.saveScenes(storage, [heist()]);
  assert.deepEqual(S.loadCustom(storage), CUSTOM);
  assert.deepEqual(S.loadScenes(storage), [heist()]);
  assert.ok([...storage.data.keys()].every((k) => k.startsWith("ncd.")));

  const building = { mode: "build", scene: { ...heist(), name: "" } };
  S.saveOpen(storage, building);
  assert.deepEqual(S.loadOpen(storage), building);
  S.saveOpen(storage, null);
  assert.equal(S.loadOpen(storage), null);
});

test("storage: a reload mid-run gets back everything being tracked", () => {
  const storage = memory();
  const state = run(started(), { type: "luck", id: "vex", delta: -30 }, { type: "size", id: "squad", size: 2 },
    { type: "wounds", id: "exec", delta: 1 }, { type: "progress", id: "lock", delta: 10 }, ...round(), ...round(), ...step(2));
  S.saveOpen(storage, { mode: "run", run: state });
  assert.deepEqual(S.loadOpen(storage), { mode: "run", run: state });
});

test("storage: missing, broken or throwing storage never throws", () => {
  const throwing = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  for (const storage of [null, undefined, throwing, { getItem: () => "{not json" }]) {
    assert.deepEqual(S.loadCustom(storage), NO_CUSTOM);
    assert.deepEqual(S.loadScenes(storage), []);
    assert.equal(S.loadOpen(storage), null);
  }
  assert.doesNotThrow(() => { S.saveCustom(throwing, CUSTOM); S.saveScenes(null, []); S.saveOpen(throwing, null); });
});

test("export then import gives back the same custom items and scenes", () => {
  const doc = S.exportDoc(CUSTOM, [heist()]);
  assert.equal(doc.version, 1);
  assert.deepEqual(S.importDoc(JSON.stringify(doc)), { custom: CUSTOM, scenes: [heist()] });
  assert.deepEqual(S.importDoc(doc), { custom: CUSTOM, scenes: [heist()] });
});

test("import refuses a file it can't use, saying why", () => {
  for (const bad of ["not json", "[]", "null", JSON.stringify({ version: 1 }), JSON.stringify({ ...S.exportDoc(CUSTOM, []), version: 99 }),
    JSON.stringify({ ...S.exportDoc(CUSTOM, []), scenes: "x" })]) {
    const result = S.importDoc(bad);
    assert.ok(typeof result.error === "string" && result.error, bad);
    assert.equal("custom" in result, false, bad);
  }
  // items it can't use are left out of one it can
  const doc = S.exportDoc({ ...CUSTOM, enemies: [...CUSTOM.enemies, { name: "No id" }] }, [heist(), { name: "No id" }]);
  assert.deepEqual(S.importDoc(doc), { custom: CUSTOM, scenes: [heist()] });
});
