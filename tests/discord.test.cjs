// Run with: node --test tests/discord.test.cjs
const test = require("node:test");
const assert = require("node:assert/strict");
require("../dice.js");
require("../discord.js");
const { roll } = globalThis.NCD_DICE;
const { lines, buildMessage, isWebhookUrl } = globalThis.NCD_DISCORD;

test("webhook addresses", () => {
  assert.ok(isWebhookUrl("https://discord.com/api/webhooks/123/abc_DEF-9"));
  assert.ok(isWebhookUrl("  https://canary.discordapp.com/api/v10/webhooks/123/abc  "));
  for (const bad of ["", null, "https://discord.com/api/webhooks/<id>/<token>", "http://discord.com/api/webhooks/1/a",
    "https://evil.com/api/webhooks/1/a", "https://discord.com/api/webhooks/1"]) assert.ok(!isWebhookUrl(bad), String(bad));
});

const seq = (...values) => () => values.shift();
const EMOJI = { boon: "<:ncd_boon:1>", drawback: "<:ncd_drawback:2>" };

test("words when no emoji are configured", () => {
  const r = roll({ target: 45, advantage: 2, challenge: 1 }, seq(3, 2, 0, 2, 7));
  assert.deepEqual(lines(r, { player: "Parker", luck: 50 }), {
    intro: "Parker rolled against 45 and got a",
    result: "Success! 32 with two boons",
    detail: "Luck: 50 · Rolled: two boons",
  });
});

test("inline emoji for leftover symbols and each pool die", () => {
  const r = roll({ target: 45, advantage: 2, challenge: 2 }, seq(7, 8, 1, 0, 3, 0));
  const l = lines(r, { player: "Parker", emoji: EMOJI, luck: 50 });
  assert.equal(l.result, "Failure. 78 · <:ncd_drawback:2>");
  assert.equal(l.detail, "Luck: 50 · Rolled: <:ncd_boon:1> <:ncd_drawback:2> <:ncd_drawback:2>");
});

test("cancelled symbols and no target", () => {
  const r = roll({ advantage: 1, challenge: 1 }, seq(0, 0, 0, 0));
  assert.equal(lines(r, { player: "Parker", emoji: EMOJI, luck: 50 }).result, "100 · all symbols cancelled");
  assert.equal(lines(r, { player: "Parker", luck: 50 }).intro, "Parker rolled and got a");
  assert.equal(lines(r, { player: "Parker", emoji: EMOJI, luck: 50 }).detail, "Luck: 50 · Rolled: <:ncd_boon:1> <:ncd_drawback:2>");
});

test("no symbols rolled means no Rolled part, even with dice in the pool", () => {
  const r = roll({ target: 60, advantage: 2, challenge: 1 }, seq(2, 4, 1, 3, 8));
  assert.equal(lines(r, { player: "Parker", emoji: EMOJI, luck: 50 }).detail, "Luck: 50");
  assert.equal(lines(r, { player: "Parker", luck: 50 }).detail, "Luck: 50");
});

test("words list boons and drawbacks together", () => {
  const r = roll({ target: 50, advantage: 1, challenge: 2 }, seq(2, 4, 0, 0, 1));
  assert.equal(lines(r, { player: "Parker", luck: 50 }).detail, "Luck: 50 · Rolled: one boon, two drawbacks");
});

test("footer always shows Luck, target or not", () => {
  const r = roll({}, seq(2, 4));
  const parts = buildMessage(r, "Parker", { luck: 50 }).components[0].components;
  assert.equal(parts.length, 3);
  assert.equal(parts[2].content, "-# Luck: 50");
});

test("half-configured emoji falls back to words", () => {
  const r = roll({ advantage: 1 }, seq(1, 1, 0));
  assert.equal(lines(r, { player: "Parker", emoji: { boon: "<:ncd_boon:1>", drawback: "" }, luck: 50 }).result, "11 with one boon");
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
  assert.equal(lines(r, { player: "The GM", emoji: EMOJI, luck: null }).detail, "Rolled: <:ncd_boon:1>");
});

test("GM roll with no symbols has no footer at all", () => {
  const r = roll({ target: 50, advantage: 1 }, seq(2, 4, 1));
  const parts = buildMessage(r, "The GM", { emoji: EMOJI, luck: null }).components[0].components;
  assert.equal(parts.length, 1);
  assert.equal(parts[0].content, "-# The GM rolled against 50 and got a\n## Success! 24");
});

test("a skill roll names the skill, in italics, in the intro", () => {
  const r = roll({ target: 65, advantage: 0 }, seq(2, 4));
  assert.equal(lines(r, { player: "Parker", emoji: EMOJI, luck: 50, skill: "Shoot Someone" }).intro, "Parker rolled *Shoot Someone* against 65 and got a");
  const untargeted = roll({}, seq(2, 4));
  assert.equal(lines(untargeted, { player: "Parker", emoji: EMOJI, luck: 50, skill: "Anything else" }).intro, "Parker rolled *Anything else* and got a");
  const m = buildMessage(r, "Parker", { luck: 50, skill: "Shoot Someone" });
  assert.match(m.components[0].components[0].content, /^-# Parker rolled \*Shoot Someone\* against 65 and got a\n/);
});

test("influence message: gained or spent, with the icon when configured", () => {
  const { influenceMessage } = globalThis.NCD_DISCORD;
  assert.deepEqual(influenceMessage("Parker", 1, 3, { username: "NullJack" }), {
    username: "NullJack",
    allowed_mentions: { parse: [] },
    content: "Parker gained an Influence. 3 remaining.",
  });
  assert.equal(influenceMessage("Parker", -1, 0, { emoji: { influence: "<:influence:9>" } }).content, "Parker spent an Influence. <:influence:9> 0 remaining.");
});

test("shell messages: loading with its Shell Source, going back, and a destroyed shell", () => {
  const { shellMessage } = globalThis.NCD_DISCORD;
  const shell = "Night Janitor · Quick Shell";
  assert.deepEqual(shellMessage("Parker", { action: "load", shell, source: { name: "Kidnapping or Larceny", heat: 4 } }, { username: "NullJack" }), {
    username: "NullJack",
    allowed_mentions: { parse: [] },
    content: "Parker loaded into Night Janitor · Quick Shell. Kidnapping or Larceny: add 4 heat to the heat pool.",
  });
  assert.equal(shellMessage("Parker", { action: "load", shell, source: { name: "Kidnapping or Larceny", heat: 2 } }, { emoji: { heat: "<:h:1>" } }).content,
    "Parker loaded into Night Janitor · Quick Shell. Kidnapping or Larceny: add 2 heat to the heat pool. <:h:1> <:h:1>");
  assert.equal(shellMessage("Parker", { action: "load", shell, source: { name: "The Right Kind of People", influence: 1 }, remaining: 0 },
    { emoji: { influence: "<:influence:9>" } }).content,
    "Parker loaded into Night Janitor · Quick Shell. The Right Kind of People: spent one Influence. <:influence:9> 0 remaining.");
  assert.equal(shellMessage("Parker", { action: "load", shell, source: { name: "Another Scene" } }).content,
    "Parker loaded into Night Janitor · Quick Shell. Another Scene.");
  assert.equal(shellMessage("Parker", { action: "load", shell: "Utility Robot" }).content, "Parker loaded into Utility Robot.");
  assert.equal(shellMessage("Parker", { action: "return", shell }).content, "Parker left Night Janitor · Quick Shell and is back in their default body.");
  assert.equal(shellMessage("Parker", { action: "destroyed", shell, memoryLoss: 1 }).content,
    "Parker's shell Night Janitor · Quick Shell was destroyed: back in their default body, with Memory Loss.");
  assert.equal(shellMessage("Parker", { action: "destroyed", shell, memoryLoss: 2 }).content.endsWith("Memory Loss x2."), true);
});

test("network messages: entering and leaving", () => {
  const { networkMessage } = globalThis.NCD_DISCORD;
  assert.deepEqual(networkMessage("NullJack", "enter", { username: "NullJack" }), {
    username: "NullJack",
    allowed_mentions: { parse: [] },
    content: "NullJack is HACKING THE PLANET!",
  });
  assert.equal(networkMessage("NullJack", "leave").content, "NullJack has entered the desert of the real.");
});

test("messages never ping anyone", () => {
  const r = roll({ target: 50 }, seq(2, 4));
  assert.deepEqual(buildMessage(r, "@everyone").allowed_mentions, { parse: [] });
});

test("leftover emoji in the result line are spaced like the footer", () => {
  const r = roll({ target: 50, advantage: 2 }, seq(2, 4, 0, 0));
  assert.equal(lines(r, { player: "Parker", emoji: EMOJI, luck: 50 }).result, "Success! 24 · <:ncd_boon:1> <:ncd_boon:1>");
});

test("footer shows Luck, then Influence, then what was rolled", () => {
  const r = roll({ target: 50, advantage: 1 }, seq(2, 4, 0));
  assert.equal(lines(r, { player: "Parker", emoji: EMOJI, luck: 94, influence: 2 }).detail, "Luck: 94 · Influence: 2 · Rolled: <:ncd_boon:1>");
  const plain = roll({ target: 50 }, seq(2, 4));
  assert.equal(lines(plain, { player: "Parker", emoji: EMOJI, luck: 94, influence: 0 }).detail, "Luck: 94 · Influence: 0");
  assert.equal(lines(plain, { player: "The GM", emoji: EMOJI, luck: null, influence: null }).detail, "");
  const m = buildMessage(r, "Parker", { emoji: EMOJI, luck: 94, influence: 2 });
  assert.equal(m.components[0].components.at(-1).content, "-# Luck: 94 · Influence: 2 · Rolled: <:ncd_boon:1>");
});

test("an avatar link is sent only when given", () => {
  const r = roll({ target: 50 }, seq(2, 4));
  assert.equal(buildMessage(r, "Parker", { avatarUrl: "https://x.test/portraits/default.png" }).avatar_url, "https://x.test/portraits/default.png");
  assert.equal("avatar_url" in buildMessage(r, "Parker"), false);
  const { influenceMessage } = globalThis.NCD_DISCORD;
  assert.equal(influenceMessage("Parker", 1, 2, { avatarUrl: "https://x.test/a.png" }).avatar_url, "https://x.test/a.png");
});

test("a success with an impact shows it on the main line", () => {
  const r = roll({ target: 45, impact: 20 }, seq(3, 2));
  assert.equal(lines(r, { player: "Parker" }).result, "Success! 32 · Impact 52");
  assert.equal(lines(roll({ target: 20, impact: 20 }, seq(3, 2)), { player: "Parker" }).result, "Failure. 32");
});

test("initiative: a success goes Fast, a failure Slow", () => {
  const fast = roll({ target: 70, advantage: 1 }, seq(3, 2, 0));
  assert.deepEqual(lines(fast, { player: "Parker", luck: 50, skill: "Initiative in the World", initiative: true, handle: "Zero" }), {
    intro: "Parker rolled for Initiative in the World",
    result: "Zero will go Fast",
    detail: "Rolled 32 with one boon",
  });
  const slow = roll({ target: 30 }, seq(5, 5));
  const m = buildMessage(slow, "Parker", { skill: "Initiative in the Network", initiative: true, handle: "Zero" });
  assert.equal(m.components[0].accent_color, 0x00f0ff);
  assert.equal(m.components[0].components[0].content, "-# Parker rolled for Initiative in the Network\n## Zero will go Slow");
  assert.equal(m.components[0].components[2].content, "-# Rolled 55");
  assert.equal(buildMessage(fast, "Parker", { skill: "Initiative in the World", initiative: true }).components[0].accent_color, 0xff3b5c);
});

test("initiative with emoji, and with no target", () => {
  const r = roll({ advantage: 0, challenge: 1 }, seq(4, 1, 0));
  const l = lines(r, { player: "Parker", emoji: EMOJI, skill: "Initiative in the World", initiative: true, handle: "Zero" });
  assert.equal(l.result, "41");
  assert.equal(l.detail, "Rolled 41 · <:ncd_drawback:2>");
});

test("a pushed roll says how much Luck it spent", () => {
  const r = { ...roll({ target: 30 }, () => 4), success: true, pushed: { luck: 20, dice: 2, adv: 0 } };
  assert.equal(lines(r, { player: "Parker", skill: "Hack" }).intro, "Parker rolled *Hack* against 30, pushed 20 Luck, and got a");
});

test("an attack's damage shows on the main line on a hit, and not on a miss", () => {
  const hit = roll({ target: 75 }, seq(3, 2));
  assert.equal(lines(hit, { player: "Vex", skill: "Shock Knuckles", damage: "45 physical damage" }).result, "Success! 32 · 45 physical damage");
  assert.equal(lines(roll({ target: 20 }, seq(3, 2)), { player: "Vex", damage: "45 physical damage" }).result, "Failure. 32");
  assert.equal(lines(hit, { player: "Vex" }).result, "Success! 32");
  const message = buildMessage(hit, "Vex", { damage: "10 damage" });
  assert.match(message.components[0].components[0].content, /## Success! 32 · 10 damage$/);
});
