// Turns a roll (from NCD_DICE.roll) into a Discord webhook message using Discord's
// layout components: a container with an accent bar and small / big / small text.
// Boons and Drawbacks show as inline custom emoji when their codes are configured,
// otherwise as words.
// Plain script (no modules) so the page also works when opened straight from disk.
(function (root) {
  const COLORS = { success: 0x3dffb0, failure: 0xff3b5c, none: 0x00f0ff };
  const WORDS = ["no", "one", "two", "three", "four", "five"];
  const count = (n, one, many = one + "s") => `${WORDS[n] ?? n} ${n === 1 ? one : many}`;
  const fmtTens = (tens) => (tens === 0 ? "00" : String(tens * 10));
  const outcomeOf = (r) => (r.success == null ? "none" : r.success ? "success" : "failure");

  // emoji: { boon: "<:ncd_boon:123>", drawback: "<:ncd_drawback:456>" }, both or neither.
  const hasEmoji = (emoji) => Boolean(emoji?.boon && emoji?.drawback);

  // Leftover symbols after Boons and Drawbacks cancel.
  function netText(r, emoji) {
    if (!r.net) return r.cancelled ? "all symbols cancelled" : "";
    const name = r.net > 0 ? "boon" : "drawback", n = Math.abs(r.net);
    return hasEmoji(emoji) ? emoji[name].repeat(n) : `with ${count(n, name)}`;
  }

  // What each pool die landed on; blanks are a dash when showing emoji.
  function poolText(dice, name, emoji, label) {
    if (!dice.length) return "";
    if (hasEmoji(emoji)) return `${label} ${dice.map((hit) => (hit ? emoji[name] : "–")).join(" ")}`;
    const hits = dice.filter(Boolean).length;
    return `${count(dice.length, `${label.toLowerCase()} die`, `${label.toLowerCase()} dice`)}: ${count(hits, name)}`;
  }

  // The three lines: small intro, big result, subtle breakdown.
  function lines(r, player, emoji) {
    const verdict = { success: "Success!", failure: "Failure.", none: "" }[outcomeOf(r)];
    const net = netText(r, emoji);
    return {
      intro: r.target == null ? `${player} rolled and got` : `${player} rolled against ${r.target} and got`,
      result: [verdict, String(r.total)].filter(Boolean).join(" ") + (net ? (net.startsWith("with") ? ` ${net}` : ` · ${net}`) : ""),
      detail: [
        `Rolled ${fmtTens(r.tens)} + ${r.ones}`,
        poolText(r.adv, "boon", emoji, "Advantage"),
        poolText(r.chal, "drawback", emoji, "Challenge"),
      ].filter(Boolean).join(" · "),
    };
  }

  function buildMessage(r, player, { emoji, username } = {}) {
    const l = lines(r, player, emoji);
    return {
      ...(username && { username }),
      flags: 1 << 15, // IS_COMPONENTS_V2
      components: [{
        type: 17, // container
        accent_color: COLORS[outcomeOf(r)],
        components: [
          { type: 10, content: `-# ${l.intro}\n## ${l.result}` }, // text display
          { type: 14, divider: true, spacing: 1 },                // separator
          { type: 10, content: `-# ${l.detail}` },
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
