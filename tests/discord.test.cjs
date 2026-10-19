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
  assert.deepEqual(lines(r, "Parker"), {
    intro: "Parker rolled against 45 and got",
    result: "Success! 32 with two boons",
    detail: "Rolled 30 + 2 · two advantage dice: two boons · one challenge die: no drawbacks",
  });
});

test("inline emoji for leftover symbols and each pool die", () => {
  const r = roll({ target: 45, advantage: 2, challenge: 2 }, seq(7, 8, 1, 0, 3, 0));
  const l = lines(r, "Parker", EMOJI);
  assert.equal(l.result, "Failure. 78 · <:ncd_drawback:2>");
  assert.equal(l.detail, "Rolled 70 + 8 · Advantage – <:ncd_boon:1> · Challenge <:ncd_drawback:2> <:ncd_drawback:2>");
});

test("cancelled symbols and no target", () => {
  const r = roll({ advantage: 1, challenge: 1 }, seq(0, 0, 0, 0));
  assert.equal(lines(r, "Parker", EMOJI).result, "100 · all symbols cancelled");
  assert.equal(lines(r, "Parker").intro, "Parker rolled and got");
});

test("half-configured emoji falls back to words", () => {
  const r = roll({ advantage: 1 }, seq(1, 1, 0));
  assert.equal(lines(r, "Parker", { boon: "<:ncd_boon:1>", drawback: "" }).result, "11 with one boon");
});

test("message is a components container colored by outcome", () => {
  const r = roll({ target: 10 }, seq(5, 5));
  const m = buildMessage(r, "Parker", { username: "Neon City Dashboard" });
  assert.equal(m.flags, 1 << 15);
  assert.equal(m.username, "Neon City Dashboard");
  assert.equal(m.components[0].type, 17);
  assert.equal(m.components[0].accent_color, 0xff3b5c);
  assert.equal(m.components[0].components[0].content, "-# Parker rolled against 10 and got\n## Failure. 55");
});
