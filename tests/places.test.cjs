// Run with: node --test tests/places.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../places.js");

const P = globalThis.NCD_PLACES;

test("two districts, and the rulebook's 24 types of place, each with its alternatives and no repeats", () => {
  assert.deepEqual(P.DISTRICTS, ["D03 - Financial District", "D04 - Industrial District"]);
  assert.equal(P.TYPES.length, 24);
  assert.equal(new Set(P.TYPES.map((t) => t.name)).size, 24);
  for (const t of P.TYPES) {
    assert.ok(t.alternatives.length >= 4, t.name);
    assert.equal(new Set(t.alternatives).size, t.alternatives.length, t.name);
    for (const a of t.alternatives) assert.match(a, /^[A-Z]/, `${t.name}: ${a}`);
  }
  assert.deepEqual(P.alternatives("Bars").slice(0, 2), ["Dive bar", "Swanky cocktail bar"]);
  assert.deepEqual(P.alternatives("Nowhere"), []);
});

test("cleaning keeps only what's on the lists, and an alternative only of its own type", () => {
  assert.deepEqual(P.cleanPlace(undefined), P.NO_PLACE);
  assert.deepEqual(P.cleanPlace({ district: "D99 - Moon", type: "Bars", alternative: "Dive bar", location: "  The Rusty Nail " }),
    { district: "", type: "Bars", alternative: "Dive bar", location: "The Rusty Nail" });
  assert.equal(P.cleanPlace({ type: "Bars", alternative: "Fight club" }).alternative, "");
});

test("changing the type of place clears an alternative that isn't one of the new type's; the district stays", () => {
  const place = { district: "D04 - Industrial District", type: "Bars", alternative: "Dive bar", location: "Pier 9" };
  assert.deepEqual(P.changePlace(place, { type: "Arenas" }), { ...place, type: "Arenas", alternative: "" });
  assert.deepEqual(P.changePlace(place, { district: "D03 - Financial District" }), { ...place, district: "D03 - Financial District" });
  assert.deepEqual(P.changePlace(place, { alternative: "Speakeasy" }), { ...place, alternative: "Speakeasy" });
});

test("randomizing picks a district, a type and one of its alternatives, and keeps the location", () => {
  const first = P.randomPlace({ location: "Pier 9" }, () => 0);
  assert.deepEqual(first, { district: "D03 - Financial District", type: "Apartments", alternative: "Hacker's hovel", location: "Pier 9" });
  const last = P.randomPlace({}, () => 0.999);
  assert.deepEqual(last, { district: "D04 - Industrial District", type: "Vending", alternative: "Emergency medical booth", location: "" });
  for (let i = 0; i < 50; i++) {
    const p = P.randomPlace({});
    assert.ok(P.alternatives(p.type).includes(p.alternative));
  }
});

test("a place in a line leaves out what isn't set", () => {
  assert.equal(P.placeLabel({ district: "D03 - Financial District", type: "Bars", alternative: "", location: "The Rusty Nail" }),
    "D03 - Financial District · Bars · The Rusty Nail");
  assert.equal(P.placeLabel({}), "");
});
