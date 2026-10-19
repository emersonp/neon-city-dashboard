// Run with: node --test tests/discord.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../dice.js");
require("../discord.js");
const { roll } = globalThis.NCD_DICE;
const { lines, buildMessage } = globalThis.NCD_DISCORD;

const seq = (...values) => () => values.shift();
const EMOJI = { boon: "<:ncd_boon:1>", drawback: "<:ncd_drawback:2>" };

test("words when no emoji are configured", () => {
  const r = roll({ target: 45, advantage: 2, challenge: 1 }, seq(3, 2, 0, 2, 7));
  assert.deepEqual(lines(r, "Parker", undefined, 50), {
    intro: "Parker rolled against 45 and got a",
    result: "Success! 32 with two boons",
    detail: "Luck: 50 · Rolled: two boons",
  });
});

test("inline emoji for leftover symbols and each pool die", () => {
  const r = roll({ target: 45, advantage: 2, challenge: 2 }, seq(7, 8, 1, 0, 3, 0));
  const l = lines(r, "Parker", EMOJI, 50);
  assert.equal(l.result, "Failure. 78 · <:ncd_drawback:2>");
  assert.equal(l.detail, "Luck: 50 · Rolled: <:ncd_boon:1> <:ncd_drawback:2> <:ncd_drawback:2>");
});

test("cancelled symbols and no target", () => {
  const r = roll({ advantage: 1, challenge: 1 }, seq(0, 0, 0, 0));
  assert.equal(lines(r, "Parker", EMOJI, 50).result, "100 · all symbols cancelled");
  assert.equal(lines(r, "Parker", undefined, 50).intro, "Parker rolled and got a");
  assert.equal(lines(r, "Parker", EMOJI, 50).detail, "Luck: 50 · Rolled: <:ncd_boon:1> <:ncd_drawback:2>");
});

test("no symbols rolled means no Rolled part, even with dice in the pool", () => {
  const r = roll({ target: 60, advantage: 2, challenge: 1 }, seq(2, 4, 1, 3, 8));
  assert.equal(lines(r, "Parker", EMOJI, 50).detail, "Luck: 50");
  assert.equal(lines(r, "Parker", undefined, 50).detail, "Luck: 50");
});

test("words list boons and drawbacks together", () => {
  const r = roll({ target: 50, advantage: 1, challenge: 2 }, seq(2, 4, 0, 0, 1));
  assert.equal(lines(r, "Parker", undefined, 50).detail, "Luck: 50 · Rolled: one boon, two drawbacks");
});

test("footer always shows Luck, target or not", () => {
  const r = roll({}, seq(2, 4));
  const parts = buildMessage(r, "Parker", { luck: 50 }).components[0].components;
  assert.equal(parts.length, 3);
  assert.equal(parts[2].content, "-# Luck: 50");
});

test("half-configured emoji falls back to words", () => {
  const r = roll({ advantage: 1 }, seq(1, 1, 0));
  assert.equal(lines(r, "Parker", { boon: "<:ncd_boon:1>", drawback: "" }, 50).result, "11 with one boon");
});

test("message is a components container colored by outcome", () => {
  const r = roll({ target: 10 }, seq(5, 5));
  const m = buildMessage(r, "Parker", { username: "Neon City Dashboard" });
  assert.equal(m.flags, 1 << 15);
  assert.equal(m.username, "Neon City Dashboard");
  assert.equal(m.components[0].type, 17);
  assert.equal(m.components[0].accent_color, 0xff3b5c);
  assert.equal(m.components[0].components[0].content, "-# Parker rolled against 10 and got a\n## Failure. 55");
});

test("GM rolls (no luck) leave Luck out of the footer", () => {
  const r = roll({ target: 50, advantage: 1 }, seq(2, 4, 0));
  assert.equal(lines(r, "The GM", EMOJI, null).detail, "Rolled: <:ncd_boon:1>");
});

test("GM roll with no symbols has no footer at all", () => {
  const r = roll({ target: 50, advantage: 1 }, seq(2, 4, 1));
  const parts = buildMessage(r, "The GM", { emoji: EMOJI, luck: null }).components[0].components;
  assert.equal(parts.length, 1);
  assert.equal(parts[0].content, "-# The GM rolled against 50 and got a\n## Success! 24");
});

test("a skill roll names the skill, in italics, in the intro", () => {
  const r = roll({ target: 65, advantage: 0 }, seq(2, 4));
  assert.equal(lines(r, "Parker", EMOJI, 50, "Shoot Someone").intro, "Parker rolled *Shoot Someone* against 65 and got a");
  const untargeted = roll({}, seq(2, 4));
  assert.equal(lines(untargeted, "Parker", EMOJI, 50, "Anything else").intro, "Parker rolled *Anything else* and got a");
  const m = buildMessage(r, "Parker", { luck: 50, skill: "Shoot Someone" });
  assert.match(m.components[0].components[0].content, /^-# Parker rolled \*Shoot Someone\* against 65 and got a\n/);
});
