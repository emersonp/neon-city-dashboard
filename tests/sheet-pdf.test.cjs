// Run with: node --test tests/sheet-pdf.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../shared.js");
require("../dice.js");
require("../conditions.js");
require("../characters.js");
require("../abilities.js");
require("../databank.js");
require("../format.js");
require("../gear.js");
require("../sheet-pdf.js");

const C = globalThis.NCD_CHARACTERS, P = globalThis.NCD_SHEET_PDF, ABILITIES = globalThis.NCD_ABILITIES;
// A stand-in for the font's widths: every character is half the font size wide.
const measure = (text, size) => String(text).length * size * 0.5;
const layout = (character) => P.layout(character, { abilities: ABILITIES, measure });
const texts = (ops) => ops.filter((o) => o.kind === "text");
const allText = (pages) => pages.flat().filter((o) => o.kind === "text").map((o) => o.text).join(" ");
const near = (a, b, msg) => assert.ok(Math.abs(a - b) <= 0.5, `${msg}: ${a} is not ${b}`);

const base = () => ({ ...C.newCharacter(), handle: "Glitch", name: "Mara Voss", archetype: "Bruiser", origin: "Synthetic" });

test("two landscape Letter pages", () => {
  const { pages, width, height } = layout(base());
  assert.equal(pages.length, 2);
  assert.equal(width, 792);
  assert.equal(height, 612);
});

test("skill rows sit at the official sheet's coordinates", () => {
  const rows = P.skillRows();
  const byId = (id) => rows.find((r) => r.id === id);
  // read from Character_and_Shell_Sheets.pdf, page 1
  near(byId("analyze-data").top, 85.2, "first mental row");
  near(byId("analyze-data").right, 484.1, "short mental row's right end");
  near(byId("case-the-joint").right, 527.5, "long mental row's right end");
  near(byId("throw-money-at-the-problem").top, 372.3, "last mental row");
  near(byId("break-or-destroy-something").top, 387.4, "first physical row");
  near(byId("break-or-destroy-something").left, 303.0, "short physical row's left end");
  near(byId("climb-jump-or-tumble").left, 260.1, "long physical row's left end");
  near(byId("tough-it-out").top, 553.6, "last physical row");
  assert.equal(rows.filter((r) => r.type === "mental").length, 20);
  assert.equal(rows.filter((r) => r.type === "physical").length, 12);
  near(P.ANYTHING_ELSE.top, 568.6, "Anything Else");
});

test("dice: only marked dice are drawn, advantage first, in the row's slots", () => {
  const c = C.withSkill(C.withSkill(base(), "analyze-data", { adv: 2, chal: 1 }), "case-the-joint", { chal: 2 });
  const dice = layout(c).pages[0].filter((o) => o.kind === "icon" && /-die$/.test(o.name));
  const inRow = (top) => dice.filter((o) => o.y > top && o.y < top + 15).map((o) => [o.name, o.x]);
  assert.deepEqual(inRow(85.2), [["advantage-die", 429.7], ["advantage-die", 439.3], ["challenge-die", 448.4]]);
  assert.deepEqual(inRow(100.3), [["challenge-die", 491.4], ["challenge-die", 501.0]]);
  assert.equal(dice.length, 5);
});

test("trained skills print their %, untrained ones print nothing; Anything Else is 50%", () => {
  const c = C.withSkill(base(), "shoot-someone", { value: 65 });
  const ops = texts(layout(c).pages[0]);
  const shoot = P.skillRows().find((r) => r.id === "shoot-someone");
  // below the initiative boxes, which print 50% when untrained
  const percents = ops.filter((o) => /^\d+%$/.test(o.text) && o.y > 80);
  assert.deepEqual(percents.filter((o) => o.y > shoot.top && o.y < shoot.top + 15).map((o) => o.text), ["65%"]);
  assert.ok(percents.some((o) => o.text === "50%" && o.y > P.ANYTHING_ELSE.top));
  assert.equal(percents.length, 2);
});

test("every area to know about has a box, and only the known ones are checked", () => {
  const c = { ...base(), knows: ["AI", "Weapons"] };
  const checks = layout(c).pages[0].filter((o) => o.kind === "check" && o.group === "knows");
  assert.equal(checks.length, C.KNOWLEDGE.length);
  assert.deepEqual(checks.filter((o) => o.checked).map((o) => o.label), ["AI", "Weapons"]);
});

test("Handle and Name both print; Appearance has Pronouns, Physical Appearance and Network Default", () => {
  const c = { ...base(), appearance: { pronouns: "she/her", physical: "Chrome jaw.", network: "A paper crane." } };
  const text = allText(layout(c).pages);
  for (const s of ["Glitch", "Mara Voss", "HANDLE", "NAME", "PRONOUNS", "she/her", "PHYSICAL APPEARANCE", "Chrome jaw.",
    "NETWORK DEFAULT", "A paper crane."]) assert.ok(text.includes(s), s);
});

test("Influence prints as current / starting; Luck, XP, archetype and origin print", () => {
  const c = { ...base(), startingInfluence: 3, currentInfluence: 1, maxLuck: 100, currentLuck: 40, xpAvailable: 4, xpSpent: 6 };
  const text = allText(layout(c).pages);
  for (const s of ["1 / 3", "40", "100", "Bruiser", "Synthetic"]) assert.ok(text.includes(s), s);
  assert.ok(/\b4\b/.test(text) && text.includes("6 SPENT"));
});

test("wounds fill that many of the four boxes", () => {
  const boxes = layout({ ...base(), wounds: 3 }).pages[0].filter((o) => o.kind === "check" && o.group === "wounds");
  assert.deepEqual(boxes.map((o) => o.checked), [true, true, true, false]);
});

test("perks go in Character Perks, augmentations in Body Perks", () => {
  const perk = ABILITIES.find((a) => a.type === "perk"), aug = ABILITIES.find((a) => a.type === "augmentation");
  const c = { ...base(), abilities: [perk.id, aug.id] };
  const page = layout(c).pages[0];
  const heading = (name) => texts(page).find((o) => o.text === name.toUpperCase());
  assert.ok(heading(perk.name).x < 396, "perk on the left half");
  assert.ok(heading(aug.name).x > 396, "augmentation on the right half");
});

test("text that doesn't fit continues in Other Notes, and every line stays inside its box", () => {
  const perks = ABILITIES.filter((a) => a.type === "perk").slice(0, 8);
  const c = { ...base(), abilities: perks.map((a) => a.id) };
  const { pages, boxes } = layout(c);
  const page2 = allText([pages[1]]);
  assert.ok(page2.includes("CHARACTER PERKS (CONTINUED)"));
  // every perk shows up somewhere
  for (const a of perks) assert.ok(allText(pages).includes(a.name.toUpperCase()), a.name);
  for (const [i, ops] of pages.entries()) {
    for (const o of ops.filter((o) => o.box)) {
      const b = boxes[o.box];
      // a text op's y is its baseline; an icon's is its top
      const [top, bottom] = o.kind === "text" ? [o.y - o.size, o.y] : [o.y, o.y + o.size];
      assert.ok(top >= b.y - 0.01 && bottom <= b.y + b.h + 0.01, `page ${i + 1}: "${o.text ?? o.name}" is outside ${o.box} vertically`);
      const w = o.kind === "text" ? measure(o.text, o.size) : o.size;
      assert.ok(o.x >= b.x - 0.01 && o.x + w <= b.x + b.w + 0.01, `page ${i + 1}: "${o.text ?? o.name}" is outside ${o.box}`);
    }
  }
});

test("gear: starting items are checked; the first two weapons fill the Weapons slots, the rest go in Gear", () => {
  const weapon = (description) => C.newGear({ kind: "weapon", description, category: "Pistol" });
  const c = { ...base(), gear: [{ ...weapon("Pistol A"), starter: true }, weapon("Pistol B"), weapon("Pistol C"),
    C.newGear({ description: "Rope", starter: true })] };
  const { pages } = layout(c);
  const gear = pages[1].filter((o) => o.kind === "check" && o.group === "gear");
  assert.deepEqual(gear.filter((o) => o.label).map((o) => [o.label, o.checked]), [["Pistol C", false], ["Rope", true]]);
  assert.equal(gear.length, 20);
  const page1 = allText([pages[0]]);
  assert.ok(page1.includes("Pistol A") && page1.includes("Pistol B") && !page1.includes("Pistol C"));
});

test("conditions go in Additional Traits; Repercussions and Story Rewards and Liability print", () => {
  const c = { ...base(), liability: "Owes the Tanaka family.", story: "Burned a contact.",
    conditions: [{ name: "Exhausted", severity: 2 }, { name: "Armored", severity: 1, intrinsic: true }] };
  const text = allText([layout(c).pages[1]]);
  for (const s of ["Owes the Tanaka family.", "Burned a contact.", "Exhausted x2", "Armored (intrinsic)"]) assert.ok(text.includes(s), s);
});

test("winAnsi: keeps what the standard fonts can draw and replaces the rest", () => {
  assert.equal(P.winAnsi("Café — “quoted” ×2 • ok"), "Café — “quoted” ×2 • ok");
  assert.equal(P.winAnsi("Ōtomo 東京 ✓"), "Otomo ?? ?");
  assert.equal(P.winAnsi("tab\there"), "tab here");
});

test("descriptions: [advantage] and friends become icons; bold markers are dropped", () => {
  const lines = P.wrap(P.paragraphs("Add 1 advantage die ([advantage]) to **all** rolls.")[0], 1000, 7, measure);
  const words = lines.flatMap((l) => l.words);
  assert.ok(words.some((w) => w.icon === "advantage-die"));
  assert.ok(!words.some((w) => String(w.text ?? "").includes("*")));
});

test("the grey background art never sits over a skill row: the rows are drawn after it, filled white", () => {
  const ops = layout(base()).pages[0];
  const lastArt = ops.map((o) => o.fill === "wash" || o.strokeColor === "wash").lastIndexOf(true);
  const firstRow = ops.findIndex((o) => o.kind === "path" && o.closed && o.stroke === 0.6 && o.fill === "paper");
  assert.ok(lastArt >= 0 && firstRow > lastArt);
});

test("the PDF is named after the handle", () => {
  assert.equal(P.fileName({ handle: "Null Fox" }), "Null Fox.pdf");
  assert.equal(P.fileName({ handle: " a/b:c " }), "a-b-c.pdf");
  assert.equal(P.fileName({}), "Character.pdf");
});
