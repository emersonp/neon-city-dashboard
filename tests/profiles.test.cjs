// Run with: node --test tests/profiles.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../shared.js");
require("../dice.js");
require("../conditions.js");
require("../characters.js");
require("../abilities.js");
require("../rules.js");
require("../databank.js");
require("../format.js");
require("../gear.js");
require("../advancement.js");
require("../profiles.js");

const C = globalThis.NCD_CHARACTERS, P = globalThis.NCD_PROFILES, A = globalThis.NCD_ADVANCEMENT;
// Every piece of text a page shows, so a missing field ("undefined") can't slip through.
const texts = (sections) => sections.flatMap((s) => [s.title, s.intro, s.outro, ...(s.table?.head ?? []), ...(s.table?.rows.flat() ?? []),
  ...(s.entries ?? []).flatMap((e) => [e.name, e.tag, e.text])]).filter((x) => x != null);

test("every archetype and origin has a page with no missing text", () => {
  for (const [names, page] of [[C.ARCHETYPES, P.archetype], [C.ORIGINS, P.origin]]) {
    for (const name of names) {
      const sections = page(name);
      assert.ok(sections.length > 0, name);
      for (const t of texts(sections)) assert.ok(typeof t === "string" && !/undefined|null|NaN/.test(t), `${name}: ${t}`);
      for (const s of sections) assert.ok(s.intro || s.table || s.entries?.length, `${name}: ${s.title} is empty`);
    }
  }
});

test("an archetype's page has its 12 skills, 5 perks, and 3 augmentations from each origin", () => {
  for (const name of C.ARCHETYPES) {
    const page = P.archetype(name), by = (title) => page.find((s) => s.title === title);
    assert.equal(by("Skills").table.rows.length, 12, name);
    assert.equal(by(`${name} Perks`).entries.length, 5, name);
    for (const origin of C.ORIGINS) assert.equal(by(`${origin} ${name} Augmentations`).entries.length, 3, `${origin} ${name}`);
  }
});

test("the archetype text follows the book's wording", () => {
  const assassin = P.archetype("Assassin");
  assert.equal(assassin.find((s) => s.title === "Things You Know About").intro,
    "Choose three from the following list: Criminals, Executives, Medicine, Psionics, Weapons");
  assert.equal(P.archetype("Mastermind").find((s) => s.title === "Things You Know About").intro, "Choose **any 4** Things You Know About.");
  assert.match(assassin.find((s) => s.title === "Initiative").intro, /\*\*In the World:\*\* 70%\n- \*\*In the Network:\*\* 50%/);
  const skills = assassin.find((s) => s.title === "Skills");
  assert.deepEqual(skills.table.rows.find((r) => r[0] === "Gossip with Citizens"), ["Gossip with Citizens", "-", "[challenge][challenge]"]);
  assert.equal(skills.outro, "Then choose **any 4 skills** and increase them each by 5%.");
  // the "choose one" line is its own list, then the rest are one list
  assert.match(assassin.find((s) => s.title === "Starting Gear").intro, /Your choice of:\n\n- A compact rail pistol.*\n- Two plasma swords.*\n\n- Five copies/);
});

test("an origin's page lists its creation steps, options, XP table and augmentations", () => {
  const synthetic = P.origin("Synthetic"), by = (title) => synthetic.find((s) => s.title === title);
  assert.match(by("When Creating Your Character").intro, /^When you first create.*\n\n- Add the Synthetic Body augmentation/);
  assert.deepEqual(by("When Creating Your Character").entries.map((e) => e.name), ["Network Native", "Ascended Robot"]);
  assert.match(by("Advancement").intro, /described on Table 3-5: Synthetic Character Advancement XP Expenditures\. As a synthetic/);
  assert.deepEqual(by("Synthetic Character Perks").entries.map((e) => e.name), ["Device Driver", "Installation Wizard"]);
  assert.ok(by("Synthetic Augmentations").entries.some((e) => e.name === "Synthetic Body" && !e.tag));
  assert.equal(P.origin("Psionic").find((s) => s.title === "Psionic Character Perks"), undefined);
});

test("one origin's XP table shows only its own costs, as the book's tables do", () => {
  const cost = (origin, id) => A.tableFor(origin).rows[A.BENEFITS.findIndex((b) => b.id === id)][1];
  assert.equal(cost("Cybernetic", "initiative-in-the-world"), "3");
  assert.equal(cost("Cybernetic", "initiative-in-the-network"), "2");
  assert.equal(cost("Synthetic", "initiative-in-the-network"), "1");
  assert.equal(cost("Gene-Spliced", "augmentation-body"), "4 + the number of body augmentations you have");
  assert.equal(cost("Synthetic", "augmentation-own"), "1 + the number of body augmentations you have");
  assert.equal(cost("Psionic", "luck"), "1");
  assert.deepEqual(A.tableFor(), A.TABLE);
});
