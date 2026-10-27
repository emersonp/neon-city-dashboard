// Turns a roll (from NCD_DICE.roll) into a Discord webhook message using Discord's
// layout components: a container with an accent bar and small / big / small text.
// Boons and Drawbacks show as inline custom emoji when their codes are configured,
// otherwise as words.
// Plain script (no modules) so the page also works when opened straight from disk.
(function (root) {
  const COLORS = { success: 0x3dffb0, failure: 0xff3b5c, none: 0x00f0ff };
  // An initiative roll's accent: red for a Fast turn, cyan for a Slow one (as on the overlay).
  const TURN_COLORS = { fast: 0xff3b5c, slow: 0x00f0ff };
  const NO_PINGS = { parse: [] };
  const THIN = "\u2009"; // thin space between emoji, so they don't run together
  const WORDS = ["no", "one", "two", "three", "four", "five"];
  const count = (n, one, many = one + "s") => `${WORDS[n] ?? n} ${n === 1 ? one : many}`;
  const outcomeOf = (r) => (r.success == null ? "none" : r.success ? "success" : "failure");

  // emoji: { boon: "<:ncd_boon:123>", drawback: "<:ncd_drawback:456>" }, both or neither,
  // plus an optional influence: "<:ncd_influence:789>".
  // Player names and handles are typed in by hand, so messages never ping anyone (no @everyone).
  const hasEmoji = (emoji) => Boolean(emoji?.boon && emoji?.drawback);

  // Leftover symbols after Boons and Drawbacks cancel, to follow the total: " · [boon]" or " with one boon".
  function netSuffix(r, emoji) {
    if (!r.net) return r.cancelled ? " · all symbols cancelled" : "";
    const name = r.net > 0 ? "boon" : "drawback", n = Math.abs(r.net);
    return hasEmoji(emoji) ? ` · ${Array(n).fill(emoji[name]).join(THIN)}` : ` with ${count(n, name)}`;
  }

  // Every Boon and Drawback that came up, before cancelling; blanks aren't shown.
  function rolledText(r, emoji) {
    if (!r.boons && !r.drawbacks) return "";
    const symbols = hasEmoji(emoji)
      ? [...Array(r.boons).fill(emoji.boon), ...Array(r.drawbacks).fill(emoji.drawback)].join(THIN)
      : [r.boons && count(r.boons, "boon"), r.drawbacks && count(r.drawbacks, "drawback")].filter(Boolean).join(", ");
    return `Rolled: ${symbols}`;
  }

  // An initiative roll's three lines: who rolled for which initiative, Fast or Slow, and what came up.
  // A success is a Fast turn and a failure a Slow one; with no target there's no telling, so the total stands in.
  function initiativeLines(r, { player, emoji, skill, handle }) {
    const turn = r.success == null ? null : r.success ? "Fast" : "Slow";
    return {
      intro: `${player} rolled for ${skill}${r.pushed ? `, pushed ${r.pushed.luck} Luck` : ""}`,
      result: turn ? `${handle || player} will go ${turn}` : String(r.total),
      detail: `Rolled ${r.total}${netSuffix(r, emoji)}`,
    };
  }

  // The three lines: small intro, big result (with the impact, on a success with one), and a subtle footer.
  // `luck` and `influence` are null for the GM (or with no character open), so the footer can end up empty.
  // `skill` is the skill's name, if any. A pushed roll (dice.js's push) says how much Luck it spent. With `initiative` (an Initiative skill), they're initiativeLines, and
  // `handle` names the character going Fast or Slow. `damage` is what an attack (the Scene Runner's) does on a hit
  // ("45 physical damage"), shown after the total when it hits.
  function lines(r, { player, emoji, luck = null, influence = null, skill, initiative = false, handle, damage } = {}) {
    if (initiative) return initiativeLines(r, { player, emoji, skill, handle });
    const verdict = { success: "Success!", failure: "Failure.", none: "" }[outcomeOf(r)];
    return {
      intro: `${player} rolled${skill ? ` *${skill}*` : ""}${r.target == null ? "" : ` against ${r.target}`}${
        r.pushed ? `, pushed ${r.pushed.luck} Luck,` : ""} and got a`,
      result: [verdict, String(r.total)].filter(Boolean).join(" ") + (r.impact ? ` · Impact ${r.impact}` : "")
        + (damage && r.success ? ` · ${damage}` : "") + netSuffix(r, emoji),
      detail: [luck != null && `Luck: ${luck}`, influence != null && `Influence: ${influence}`, rolledText(r, emoji)]
        .filter(Boolean).join(" · "),
    };
  }

  // What every message starts with: who it's from, and no pings.
  // avatarUrl must be a public link Discord can fetch (a GitHub Pages URL, not localhost).
  const from = ({ username, avatarUrl }) => ({
    ...(username && { username }),
    ...(avatarUrl && { avatar_url: avatarUrl }),
    allowed_mentions: NO_PINGS,
  });

  function buildMessage(r, player, { emoji, username, avatarUrl, luck, influence, skill, initiative, handle, damage } = {}) {
    const l = lines(r, { player, emoji, luck, influence, skill, initiative, handle, damage });
    const accent = initiative && r.success != null ? TURN_COLORS[r.success ? "fast" : "slow"] : COLORS[outcomeOf(r)];
    return {
      ...from({ username, avatarUrl }),
      flags: 1 << 15, // IS_COMPONENTS_V2
      components: [{
        type: 17, // container
        accent_color: accent,
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

  // A plain one-line message for spending or gaining Influence while running a character.
  // `remaining` is the character's Influence after the change.
  function influenceMessage(player, delta, remaining, { emoji, username, avatarUrl } = {}) {
    const icon = emoji?.influence ? ` ${emoji.influence}` : "";
    return {
      ...from({ username, avatarUrl }),
      content: `${player} ${delta > 0 ? "gained" : "spent"} an Influence.${icon} ${remaining} remaining.`,
    };
  }

  // A plain one-line message for a shell (shells.js) while running a character. `action` is "load" (with the Shell
  // Source: { name, heat, influence } or null, and `remaining` Influence after paying it), "return" (back to the default
  // body), or "destroyed" (`memoryLoss` is its severity now). `shell` names it ("Night Janitor · Quick Shell").
  function shellMessage(player, { action, shell, source = null, remaining = null, memoryLoss = 1 }, { emoji, username, avatarUrl } = {}) {
    let content;
    if (action === "return") content = `${player} left ${shell} and is back in their default body.`;
    else if (action === "destroyed") content = `${player}'s shell ${shell} was destroyed: back in their default body, with Memory Loss${memoryLoss > 1 ? ` x${memoryLoss}` : ""}.`;
    else {
      const paid = !source ? ""
        : source.heat ? ` ${source.name}: add ${source.heat} heat to the heat pool.${emoji?.heat ? ` ${Array(source.heat).fill(emoji.heat).join(THIN)}` : ""}`
        : source.influence ? ` ${source.name}: spent ${count(source.influence, "Influence", "Influence")}.${emoji?.influence ? ` ${emoji.influence}` : ""} ${remaining} remaining.`
        : ` ${source.name}.`;
      content = `${player} loaded into ${shell}.${paid}`;
    }
    return { ...from({ username, avatarUrl }), content };
  }

  // A Discord webhook address: https://discord.com/api/webhooks/<id>/<token> (discordapp.com, ptb. and canary. work too).
  const isWebhookUrl = (value) =>
    /^https:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api\/(?:v\d+\/)?webhooks\/\d+\/[\w-]+\/?$/.test(String(value ?? "").trim());

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

  root.NCD_DISCORD = { COLORS, lines, buildMessage, influenceMessage, shellMessage, isWebhookUrl, send };
})(globalThis);
