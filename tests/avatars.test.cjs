// Run with: node --test tests/avatars.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../shared.js");
require("../dice.js");
require("../conditions.js");
require("../characters.js");
require("../abilities.js");
require("../shells.js");
require("../avatars.js");

const C = globalThis.NCD_CHARACTERS, S = globalThis.NCD_SHELLS, V = globalThis.NCD_AVATARS, CAT = globalThis.NCD_ABILITIES;
// A character in its default body; `skills` (full states) go through withSkill.
const char = ({ skills = {}, ...fields } = {}) => Object.entries(skills).reduce((c, [id, s]) => C.withSkill(c, id, s),
  { ...C.newCharacter(), creation: undefined, handle: "Vex", origin: "Cybernetic", ...fields });
const quick = (changes = {}) => ({ kind: "quick", appearance: "abstract", username: "pie_hacker", description: "A talking pie", ...changes });
const enhanced = (changes = {}) => quick({ kind: "enhanced", major: ["crash-a-system", "gossip-with-citizens"],
  minor: ["analyze-data", "lie-to-someone"], software: ["keychain", "daemon"], ...changes });
const online = (c, choices = quick()) => V.enter(V.create(c, choices));

test("the sheet: four appearances on Gossip skills, nine pieces of software, and the perks it names", () => {
  for (const a of Object.values(V.APPEARANCES)) assert.ok(C.SKILLS.some((s) => s.id === a.chal && s.type === "mental"), a.chal);
  assert.deepEqual(Object.values(V.SOFTWARE).map((s) => s.name), ["VPN Tunnel", "Keychain", "SUDO Commands", "Async Attack Processes",
    "CHMOD Access", "Icebreaker Suite", "Daemon", "Co-Op Mode", "Emulation Software"]);
  for (const id of [V.ENHANCED_AVATARS, V.INSTALLATION_WIZARD]) assert.ok(CAT.some((a) => a.id === id), id);
  assert.ok(V.ENHANCEABLE.every((s) => s.type === "mental"));
});

test("a Quick Avatar for anyone; an Enhanced one only with Enhanced Avatars", () => {
  assert.deepEqual(V.kindsFor(char()), ["quick"]);
  assert.deepEqual(V.kindsFor(char({ abilities: [V.ENHANCED_AVATARS] })), ["quick", "enhanced"]);
  assert.equal(V.missing(char(), enhanced()), "kind");
  assert.equal(V.missing(char(), quick({ kind: null })), "kind");
});

test("the choices: an appearance, the Enhanced skills, and exactly the software the perks allow", () => {
  const plain = char(), wizard = char({ origin: "Synthetic", abilities: [V.INSTALLATION_WIZARD] });
  const hacker = char({ abilities: [V.ENHANCED_AVATARS, V.INSTALLATION_WIZARD] });
  assert.equal(V.missing(plain, quick()), null);
  assert.equal(V.missing(plain, quick({ username: "" })), null); // the username is optional
  assert.equal(V.missing(plain, quick({ appearance: "nope" })), "appearance");
  // no software unless a perk says so
  assert.equal(V.missing(plain, quick({ software: ["keychain"] })), "software");
  // Installation Wizard: one box on a Quick Avatar
  assert.equal(V.softwareCount(wizard, "quick"), 1);
  assert.equal(V.missing(wizard, quick()), "software");
  assert.equal(V.missing(wizard, quick({ software: ["keychain"] })), null);
  assert.equal(V.missing(wizard, quick({ software: ["nope"] })), "software");
  // Enhanced: 2 boxes, the Wizard adds none
  assert.equal(V.softwareCount(hacker, "enhanced"), 2);
  assert.equal(V.missing(hacker, enhanced()), null);
  assert.equal(V.missing(hacker, enhanced({ software: ["keychain"] })), "software");
  assert.equal(V.missing(hacker, enhanced({ software: ["keychain", "keychain"] })), "software");
  assert.equal(V.missing(hacker, enhanced({ major: ["crash-a-system", "crash-a-system"] })), "major");
  assert.equal(V.missing(hacker, enhanced({ major: ["crash-a-system", "sneak-around"] })), "major"); // physical
  assert.equal(V.missing(hacker, enhanced({ major: ["crash-a-system", "initiative-in-the-network"] })), "major");
  assert.equal(V.missing(hacker, enhanced({ minor: ["crash-a-system", "lie-to-someone"] })), "minor");
  assert.equal(V.missing(hacker, enhanced({ minor: ["analyze-data"] })), "minor");
});

test("building: the appearance's challenge die, an Enhanced Avatar's advantage dice stacked on it", () => {
  const q = V.build(char(), quick());
  assert.deepEqual(q.skills, { "gossip-with-citizens": { adv: 0, chal: 1 } });
  assert.deepEqual(q.software, []);
  const e = V.build(char({ abilities: [V.ENHANCED_AVATARS] }), enhanced());
  assert.deepEqual(e.skills, {
    "gossip-with-citizens": { adv: 2, chal: 1 }, "crash-a-system": { adv: 2, chal: 0 },
    "analyze-data": { adv: 1, chal: 0 }, "lie-to-someone": { adv: 1, chal: 0 },
  });
  assert.deepEqual(e.software, ["keychain", "daemon"]);
  assert.equal(V.kindLabel(e), "Enhanced Avatar · Abstract Form");
});

test("New Avatar replaces the saved one; entering needs one, and leaving keeps it", () => {
  const c = char();
  assert.equal(V.create(c, quick({ appearance: null })), null);
  assert.equal(V.enter(c), null);
  const made = V.create(c, quick());
  assert.equal(C.inNetwork(made), false);
  const replaced = V.create(made, quick({ appearance: "featureless", username: "" }));
  assert.equal(replaced.avatar.appearance, "featureless");
  assert.equal(V.label(replaced), "Vex"); // no username: the handle
  assert.equal(V.label(made), "pie_hacker");
  const inside = V.enter(made);
  assert.equal(C.inNetwork(inside), true);
  const out = V.leave(inside);
  assert.equal(C.inNetwork(out), false);
  assert.deepEqual(out.avatar, made.avatar);
  assert.equal(V.defaultDescription({ ...c, appearance: { network: "A glowing fox" } }), "A glowing fox");
});

test("in the Network: the mind's chances, only the avatar's mental dice, and no physical skills to mark", () => {
  const c = char({ skills: { "gossip-with-citizens": { value: 70, adv: 1, chal: 0 }, "crash-a-system": { value: 65, adv: 0, chal: 2 },
    "sneak-around": { value: 75, adv: 1, chal: 0 } } });
  const inside = online(c);
  assert.deepEqual(C.skill(inside, "gossip-with-citizens"), { value: 70, adv: 0, chal: 1 });
  assert.deepEqual(C.skill(inside, "crash-a-system"), { value: 65, adv: 0, chal: 0 });
  // physical skills keep the mind's dice and the body's chance, but can't be marked
  assert.deepEqual(C.skill(inside, "sneak-around"), { value: 75, adv: 1, chal: 0 });
  assert.equal(C.canBeUsed(c, "sneak-around"), true);
  assert.equal(C.canBeUsed(inside, "sneak-around"), false);
  assert.equal(C.canBeUsed(inside, "crash-a-system"), true);
  // a saved avatar does nothing outside the Network
  assert.deepEqual(C.skill(V.leave(inside), "gossip-with-citizens"), { value: 70, adv: 1, chal: 0 });
});

test("in a shell and the Network: the avatar's dice over the shell's; leaving goes back to the shell", () => {
  const c = char({ currentInfluence: 1 });
  const shelled = S.load(c, { shell: "quick", identity: "anonymous", name: "Night Janitor", source: "scene",
    major: ["analyze-data", "convince-someone", "sneak-around", "shoot-someone"], minor: ["goad-someone", "run-like-hell"] }).character;
  const inside = online(shelled);
  assert.deepEqual(C.skill(inside, "analyze-data"), { value: null, adv: 0, chal: 0 });
  assert.deepEqual(C.skill(inside, "gossip-with-citizens"), { value: null, adv: 0, chal: 1 });
  const back = V.leave(inside);
  assert.equal(C.inShell(back), true);
  assert.deepEqual(C.skill(back, "analyze-data"), { value: null, adv: 2, chal: 0 });
  // wounds are the shell's while it's loaded underneath
  assert.equal(C.wounds(C.withWounds(inside, 2)), 2);
  assert.equal(C.withWounds(inside, 2).shell.wounds, 2);
  assert.equal(C.withWounds(inside, 2).defaultBody.wounds, 0);
});

test("Edit's changes in the Network go to the mind and the default body, not the avatar", () => {
  const inside = online(char({ skills: { "gossip-with-citizens": { value: 60, adv: 1, chal: 0 } } }));
  const edited = C.withSkill(inside, "gossip-with-citizens", { value: 65 });
  assert.deepEqual(C.skill(C.asDefault(edited), "gossip-with-citizens"), { value: 65, adv: 1, chal: 0 });
  assert.deepEqual(edited.avatar, inside.avatar);
});

test("jobs leave the Network and keep the avatar", () => {
  const inside = online(char());
  for (const next of [C.startJob(inside), C.abandonJob(C.startJob(inside))]) {
    assert.equal(C.inNetwork(next), false);
    assert.deepEqual(next.avatar, inside.avatar);
  }
  const finished = C.finishJob(online(C.startJob(char())), { liability: "Debt", improvement: "xp", successful: false }).character;
  assert.equal(C.inNetwork(finished), false);
  assert.ok(C.hasAvatar(finished));
});

test("an old save has no avatar and isn't in the Network", () => {
  const { avatar, inNetwork, ...old } = char();
  assert.equal(C.hasAvatar(old), false);
  assert.equal(C.inNetwork({ ...old, inNetwork: true }), false);
  assert.equal(V.label(old), "Vex");
});
