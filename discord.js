// Discord webhook message builders. Each style turns the same roll into a different
// Discord payload so the formatting options can be compared side by side in a channel.
// Plain script (no modules) so the page also works when opened straight from disk.
(function (root) {
  const COLORS = { crit: 0xf5ff3b, success: 0x00f0ff, failure: 0xff2bd6 };
  const WORDS = ["no", "one", "two", "three", "four", "five"];
  const plural = (n, word) => `${WORDS[n] ?? n} ${word}${n === 1 ? "" : "s"}`;
  const rand = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

  // Made-up numbers so every style has something realistic to show. Not real rules.
  function sampleRoll(player = "Parker") {
    const base = rand(1, 100);
    const mod = [0, 10, 20, 30][rand(0, 3)];
    const total = base + mod;
    const outcome = total >= 100 ? "crit" : total >= 60 ? "success" : "failure";
    return {
      player,
      skill: ["Hacking", "Athletics", "Persuasion", "Stealth"][rand(0, 3)],
      base, mod, total, outcome,
      advantage: rand(0, 3),
      boons: rand(0, 3),
      drawbacks: rand(0, 1),
    };
  }

  // The three lines of the target layout: small intro, big result, subtle breakdown.
  function lines(r) {
    const verdict = { crit: "Critical!", success: "Success!", failure: "Failure." }[r.outcome];
    const extras = [r.boons && plural(r.boons, "boon"), r.drawbacks && plural(r.drawbacks, "drawback")]
      .filter(Boolean).join(" and ");
    const detail = [`Roll ${r.base} with +${r.mod}`, r.advantage && `rolled ${plural(r.advantage, "advantage die")}`]
      .filter(Boolean).join(", ").replace("advantage dies", "advantage dice");
    return {
      intro: `${r.player} rolled ${r.skill} and got a`,
      result: `${verdict} ${r.total}${extras ? ` with ${extras}` : ""}`,
      detail,
    };
  }

  const THUMB = "result.png";

  const STYLES = {
    plain: {
      label: "Plain",
      about: "Just text. Exactly what the app sent at first.",
      build: (r) => ({ payload: { content: `${r.player} rolled.` } }),
    },

    markdown: {
      label: "Markdown",
      about: "Text only, using -# subtext and ## headings to get the small / big / small layout. Works everywhere, including mobile.",
      build(r) {
        const l = lines(r);
        return {
          payload: {
            content: `-# **${r.player}** rolled **${r.skill}** and got a\n## ${l.result}\n-# ${l.detail}`,
          },
        };
      },
    },

    embed: {
      label: "Embed",
      about: "A card with a colored side bar. Author line (small), title (big), footer (small) with a timestamp, plus an uploaded thumbnail.",
      build(r) {
        const l = lines(r);
        return {
          image: true,
          payload: {
            embeds: [{
              color: COLORS[r.outcome],
              author: { name: l.intro },
              title: l.result,
              thumbnail: { url: `attachment://${THUMB}` },
              footer: { text: l.detail },
              timestamp: new Date().toISOString(),
            }],
          },
        };
      },
    },

    fields: {
      label: "Embed + fields",
      about: "Embed with a description and inline fields, laid out like a small stat table.",
      build(r) {
        const l = lines(r);
        return {
          image: true,
          payload: {
            embeds: [{
              color: COLORS[r.outcome],
              author: { name: l.intro },
              title: l.result,
              description: `> *${r.skill}* check against **60**`,
              thumbnail: { url: `attachment://${THUMB}` },
              fields: [
                { name: "Roll", value: `\`${r.base}\``, inline: true },
                { name: "Modifier", value: `\`+${r.mod}\``, inline: true },
                { name: "Total", value: `**${r.total}**`, inline: true },
                { name: "Advantage", value: String(r.advantage), inline: true },
                { name: "Boons", value: String(r.boons), inline: true },
                { name: "Drawbacks", value: String(r.drawbacks), inline: true },
              ],
              footer: { text: "Neon City Dashboard" },
              timestamp: new Date().toISOString(),
            }],
          },
        };
      },
    },

    components: {
      label: "Components",
      about: "Discord's newer layout blocks: a container with an accent bar, markdown text beside a thumbnail, and a divider. Webhooks can send these without interactive buttons.",
      build(r) {
        const l = lines(r);
        return {
          image: true,
          query: "with_components=true", // webhooks only render components when asked
          payload: {
            flags: 1 << 15, // IS_COMPONENTS_V2
            components: [{
              type: 17, // container
              accent_color: COLORS[r.outcome],
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
      build(r) {
        const l = lines(r);
        const e = "\u001b[";
        const tone = { crit: "1;33", success: "1;36", failure: "1;35" }[r.outcome];
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

  root.NCD_DISCORD = { STYLES, COLORS, sampleRoll, lines, send };
})(globalThis);
