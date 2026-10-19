// Discord webhook message builders. Each style turns the same roll (from NCD_DICE.roll)
// into a different Discord payload so the formatting options can be compared in a channel.
// Plain script (no modules) so the page also works when opened straight from disk.
(function (root) {
  const COLORS = { success: 0x3dffb0, failure: 0xff3b5c, none: 0x00f0ff };
  const WORDS = ["no", "one", "two", "three", "four", "five"];
  const count = (n, one, many = one + "s") => `${WORDS[n] ?? n} ${n === 1 ? one : many}`;
  const fmtTens = (tens) => (tens === 0 ? "00" : String(tens * 10));

  const outcomeOf = (r) => (r.success == null ? "none" : r.success ? "success" : "failure");

  // Leftover symbols after Boons and Drawbacks cancel, e.g. "two boons".
  function netText(r) {
    if (r.net > 0) return count(r.net, "boon");
    if (r.net < 0) return count(-r.net, "drawback");
    return r.cancelled ? "all symbols cancelled" : "";
  }

  // The three lines of the target layout: small intro, big result, subtle breakdown.
  function lines(r, player) {
    const verdict = { success: "Success!", failure: "Failure.", none: "" }[outcomeOf(r)];
    const net = netText(r);
    const result = [verdict, String(r.total)].filter(Boolean).join(" ")
      + (net ? (r.net ? ` with ${net}` : ` · ${net}`) : "");
    const detail = [
      `Rolled ${fmtTens(r.tens)} + ${r.ones}`,
      r.adv.length && `${count(r.adv.length, "advantage die", "advantage dice")}: ${count(r.boons, "boon")}`,
      r.chal.length && `${count(r.chal.length, "challenge die", "challenge dice")}: ${count(r.drawbacks, "drawback")}`,
    ].filter(Boolean).join(" · ");
    return {
      intro: r.target == null ? `${player} rolled and got` : `${player} rolled against ${r.target} and got`,
      result,
      detail,
    };
  }

  const THUMB = "result.png";

  const STYLES = {
    plain: {
      label: "Plain",
      about: "Just text, on one line.",
      build(r, player) {
        const net = netText(r);
        const verdict = r.success == null ? "" : ` against ${r.target}: ${r.success ? "success" : "failure"}`;
        return { payload: { content: `${player} rolled ${r.total}${verdict}${net ? `, ${net}` : ""}.` } };
      },
    },

    markdown: {
      label: "Markdown",
      about: "Text only, using -# subtext and ## headings to get the small / big / small layout. Works everywhere, including mobile.",
      build(r, player) {
        const l = lines(r, player);
        return { payload: { content: `-# ${l.intro}\n## ${l.result}\n-# ${l.detail}` } };
      },
    },

    embed: {
      label: "Embed",
      about: "A card with a colored side bar. Author line (small), title (big), footer (small) with a timestamp, plus the boon or drawback icon when symbols are left over.",
      build(r, player) {
        const l = lines(r, player);
        return {
          image: true,
          payload: {
            embeds: [{
              color: COLORS[outcomeOf(r)],
              author: { name: l.intro },
              title: l.result,
              thumbnail: { url: `attachment://${THUMB}` },
              footer: { text: l.detail },
              timestamp: new Date(r.at).toISOString(),
            }],
          },
        };
      },
    },

    fields: {
      label: "Embed + fields",
      about: "Embed with inline fields, laid out like a small stat table.",
      build(r, player) {
        const l = lines(r, player);
        const net = r.net > 0 ? `+${r.net} boon${r.net > 1 ? "s" : ""}`
          : r.net < 0 ? `+${-r.net} drawback${r.net < -1 ? "s" : ""}`
          : r.cancelled ? "cancelled" : "–";
        return {
          image: true,
          payload: {
            embeds: [{
              color: COLORS[outcomeOf(r)],
              author: { name: l.intro },
              title: l.result,
              thumbnail: { url: `attachment://${THUMB}` },
              fields: [
                { name: "Dice", value: `\`${fmtTens(r.tens)}\` + \`${r.ones}\``, inline: true },
                { name: "Total", value: `**${r.total}**`, inline: true },
                { name: "Target", value: r.target == null ? "none" : `≤ ${r.target}`, inline: true },
                { name: "Boons", value: `${r.boons} of ${r.adv.length}`, inline: true },
                { name: "Drawbacks", value: `${r.drawbacks} of ${r.chal.length}`, inline: true },
                { name: "Net", value: net, inline: true },
              ],
              footer: { text: "Neon City Dashboard" },
              timestamp: new Date(r.at).toISOString(),
            }],
          },
        };
      },
    },

    components: {
      label: "Components",
      about: "Discord's newer layout blocks: a container with an accent bar, markdown text beside the symbol icon, and a divider. Webhooks can send these without interactive buttons.",
      build(r, player) {
        const l = lines(r, player);
        return {
          image: true,
          query: "with_components=true", // webhooks only render components when asked
          payload: {
            flags: 1 << 15, // IS_COMPONENTS_V2
            components: [{
              type: 17, // container
              accent_color: COLORS[outcomeOf(r)],
              components: [
                {
                  type: 9, // section
                  components: [{ type: 10, content: `-# ${l.intro}\n## ${l.result}` }],
                  accessory: { type: 11, media: { url: `attachment://${THUMB}` } },
                },
                { type: 14, divider: true, spacing: 1 },
                { type: 10, content: `-# ${l.detail}` },
              ],
            }],
          },
        };
      },
    },

    ansi: {
      label: "ANSI color",
      about: "A colored code block. Shows real text colors on desktop. Mobile shows it uncolored.",
      build(r, player) {
        const l = lines(r, player);
        const e = "\u001b[";
        const tone = { success: "1;32", failure: "1;31", none: "1;36" }[outcomeOf(r)];
        return {
          payload: {
            content: "```ansi\n" +
              `${e}0;30m${l.intro}${e}0m\n` +
              `${e}${tone}m${l.result}${e}0m\n` +
              `${e}0;30m${l.detail}${e}0m\n` +
              "```",
          },
        };
      },
    },
  };

  // Posts one built message. `image` is an optional PNG Blob attached as result.png.
  async function send(webhookUrl, built, { username, image } = {}) {
    const payload = { ...built.payload };
    if (username) payload.username = username;

    const url = new URL(webhookUrl);
    url.searchParams.set("wait", "true");
    if (built.query) new URLSearchParams(built.query).forEach((v, k) => url.searchParams.set(k, v));

    let body;
    if (built.image && image) {
      body = new FormData();
      payload.attachments = [{ id: 0, filename: THUMB }];
      body.append("payload_json", JSON.stringify(payload));
      body.append("files[0]", image, THUMB);
    } else {
      body = JSON.stringify(stripImage(payload));
    }

    const res = await fetch(url, {
      method: "POST",
      headers: typeof body === "string" ? { "Content-Type": "application/json" } : undefined,
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Discord said ${res.status}: ${text.slice(0, 300)}`);
    }
    return res.json();
  }

  // Without an image to upload, drop the attachment:// references so Discord doesn't reject them.
  function stripImage(payload) {
    const p = JSON.parse(JSON.stringify(payload));
    p.embeds?.forEach((e) => delete e.thumbnail);
    p.components?.forEach((c) => c.components?.forEach((s, i, arr) => {
      if (s.type === 9) arr[i] = s.components[0];
    }));
    return p;
  }

  root.NCD_DISCORD = { STYLES, COLORS, lines, send, stripImage };
})(globalThis);
