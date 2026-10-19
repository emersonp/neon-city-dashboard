// Turns a roll (from NCD_DICE.roll) into a Discord webhook message using Discord's
// layout components: a container with an accent bar and small / big / small text.
// Boons and Drawbacks show as inline custom emoji when their codes are configured,
// otherwise as words.
// Plain script (no modules) so the page also works when opened straight from disk.
(function (root) {
  const COLORS = { success: 0x3dffb0, failure: 0xff3b5c, none: 0x00f0ff };
  const WORDS = ["no", "one", "two", "three", "four", "five"];
  const count = (n, one, many = one + "s") => `${WORDS[n] ?? n} ${n === 1 ? one : many}`;
  const outcomeOf = (r) => (r.success == null ? "none" : r.success ? "success" : "failure");

  // emoji: { boon: "<:ncd_boon:123>", drawback: "<:ncd_drawback:456>" }, both or neither.
  const hasEmoji = (emoji) => Boolean(emoji?.boon && emoji?.drawback);

  // Leftover symbols after Boons and Drawbacks cancel.
  function netText(r, emoji) {
    if (!r.net) return r.cancelled ? "all symbols cancelled" : "";
    const name = r.net > 0 ? "boon" : "drawback", n = Math.abs(r.net);
    return hasEmoji(emoji) ? emoji[name].repeat(n) : `with ${count(n, name)}`;
  }

  // Every Boon and Drawback that came up, before cancelling; blanks aren't shown.
  function rolledText(r, emoji) {
    if (!r.boons && !r.drawbacks) return "";
    const symbols = hasEmoji(emoji)
      ? [...Array(r.boons).fill(emoji.boon), ...Array(r.drawbacks).fill(emoji.drawback)].join(" ") // thin space
      : [r.boons && count(r.boons, "boon"), r.drawbacks && count(r.drawbacks, "drawback")].filter(Boolean).join(", ");
    return `Rolled: ${symbols}`;
  }

  // The three lines: small intro, big result, and a subtle footer.
  // `luck` is null for the GM, so the footer can end up empty. `skill` is the skill's name, if any.
  function lines(r, player, emoji, luck, skill) {
    const verdict = { success: "Success!", failure: "Failure.", none: "" }[outcomeOf(r)];
    const net = netText(r, emoji);
    return {
      intro: `${player} rolled${skill ? ` ${skill}` : ""}${r.target == null ? "" : ` against ${r.target}`} and got a`,
      result: [verdict, String(r.total)].filter(Boolean).join(" ") + (net ? (net.startsWith("with") ? ` ${net}` : ` · ${net}`) : ""),
      detail: [luck != null && `Luck: ${luck}`, rolledText(r, emoji)].filter(Boolean).join(" · "),
    };
  }

  function buildMessage(r, player, { emoji, username, luck, skill } = {}) {
    const l = lines(r, player, emoji, luck, skill);
    return {
      ...(username && { username }),
      flags: 1 << 15, // IS_COMPONENTS_V2
      components: [{
        type: 17, // container
        accent_color: COLORS[outcomeOf(r)],
        components: [
          { type: 10, content: `-# ${l.intro}\n## ${l.result}` }, // text display
          ...(l.detail ? [
            { type: 14, divider: true, spacing: 1 },              // separator
            { type: 10, content: `-# ${l.detail}` },
          ] : []),
        ],
      }],
    };
  }

  async function send(webhookUrl, payload) {
    const url = new URL(webhookUrl);
    url.searchParams.set("wait", "true");
    url.searchParams.set("with_components", "true"); // webhooks only render components when asked
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord said ${res.status}: ${text.slice(0, 300)}`);
    }
    return res.json();
  }

  root.NCD_DISCORD = { COLORS, lines, buildMessage, send };
})(globalThis);
