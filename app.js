// Page wiring: theme toggle, tabs, settings, the dice roller, posting to Discord, and the Databank tab.
(function () {
  const DICE = window.NCD_DICE;
  const C = window.NCD_CHARACTERS;
  const { buildMessage, influenceMessage, isWebhookUrl, send } = window.NCD_DISCORD;
  const { svg: icon } = window.NCD_ICONS;
  const store = window.NCD_STORE;
  const SESSION = window.NCD_SESSION;
  const { $, text } = window.NCD_UTIL;

  // The two kinds of pool die, and the symbol each one rolls.
  const KINDS = {
    adv: { die: "advantage-die", label: "Advantage dice", symbol: "boon", title: "Boon" },
    chal: { die: "challenge-die", label: "Challenge dice", symbol: "drawback", title: "Drawback" },
  };

  // The webhook lives only in Settings (this browser's localStorage), never in a file.
  const webhookUrl = () => text(store.get("webhook"));

  document.querySelectorAll("[data-icon]").forEach((el) => { el.innerHTML = icon(el.dataset.icon); });

  // Every dice pool on the page (data-pool="adv" or "chal") gets its label and 0-4 button choices (data-max caps a group lower).
  document.querySelectorAll("[data-pool]").forEach((group) => {
    const kind = KINDS[group.dataset.pool];
    const label = Object.assign(document.createElement("span"), { slot: "label", className: "pool-label" });
    label.innerHTML = icon(kind.die) + kind.label;
    group.append(label);
    for (let n = 0; n <= Number(group.dataset.max ?? DICE.MAX_POOL); n++) {
      const radio = document.createElement("wa-radio");
      radio.value = String(n);
      radio.setAttribute("appearance", "button");
      radio.textContent = n;
      group.append(radio);
    }
  });

  // ---- theme ----
  const html = document.documentElement;
  const themeIcon = $("theme-toggle").querySelector("wa-icon");
  const syncThemeIcon = () => { themeIcon.name = html.classList.contains("wa-dark") ? "sun" : "moon"; };
  $("theme-toggle").addEventListener("click", () => {
    const dark = !html.classList.contains("wa-dark");
    html.classList.toggle("wa-dark", dark);
    html.classList.toggle("wa-light", !dark);
    store.set("theme", dark ? "dark" : "light");
    syncThemeIcon();
  });
  syncThemeIcon();

  // ---- settings ----
  const playerInput = $("player-name");
  const gmSwitch = $("gm");
  SESSION.playerName = store.get("playerName", "");
  SESSION.gm = store.get("gm") === "1";
  playerInput.value = SESSION.playerName;
  if (SESSION.gm) gmSwitch.setAttribute("checked", "");
  window.NCD_ADMIN.setGm(SESSION.gm);
  playerInput.addEventListener("input", () => { SESSION.playerName = playerInput.value; store.set("playerName", playerInput.value); });
  gmSwitch.addEventListener("change", () => {
    SESSION.gm = gmSwitch.checked;
    store.set("gm", gmSwitch.checked ? "1" : "0");
    window.NCD_ADMIN.setGm(SESSION.gm);
  });
  // Send to Discord (on unless turned off): when it's off, nothing posts and the webhook isn't checked or needed.
  const discordSwitch = $("send-to-discord");
  const sendToDiscord = () => store.get("discord") !== "0";
  if (sendToDiscord()) discordSwitch.setAttribute("checked", "");
  const webhookInput = $("webhook");
  webhookInput.value = store.get("webhook", "");
  webhookInput.placeholder = "https://discord.com/api/webhooks/…";
  const checkWebhook = () => customElements.whenDefined("wa-input").then(() => {
    webhookInput.disabled = !sendToDiscord();
    webhookInput.setCustomValidity(!sendToDiscord() || isWebhookUrl(webhookUrl()) ? "" : "Not a Discord webhook address");
  });
  webhookInput.addEventListener("input", () => { store.set("webhook", text(webhookInput.value)); checkWebhook(); });
  discordSwitch.addEventListener("change", () => { store.set("discord", discordSwitch.checked ? "1" : "0"); checkWebhook(); });
  checkWebhook();

  // ---- tabs ----
  // Start on Settings until there's a player name and, when sending to Discord, a working webhook.
  const tabs = $("tabs");
  const needsSetup = () => !text(SESSION.playerName) || (sendToDiscord() && !isWebhookUrl(webhookUrl()));
  let forced = false; // a forced trip to Settings isn't remembered as the last tab
  // A tab marked data-admin (Tables) is there only for the Administrator.
  const tabShown = (name) => {
    const tab = tabs.querySelector(`:scope > wa-tab[panel="${CSS.escape(name)}"]`);
    return Boolean(tab) && (!tab.hasAttribute("data-admin") || SESSION.gm);
  };
  customElements.whenDefined("wa-tab-group").then(() => {
    forced = needsSetup();
    // a remembered tab that no longer exists (renamed or removed), or is the Administrator's, falls back to Dice
    const last = store.get("tab", "dice");
    tabs.active = forced ? "settings" : tabShown(last) ? last : "dice";
    // turning the Administrator switch off while on one of their tabs leaves for Dice
    window.NCD_ADMIN.onGm(() => { if (!tabShown(tabs.active)) tabs.active = "dice"; });
  });
  tabs.addEventListener("wa-tab-show", (e) => {
    if (e.target !== tabs) return; // the Databank tab's own Gear/Keywords tabs bubble up here too
    if (forced && e.detail.name === "settings") return;
    forced = false;
    store.set("tab", e.detail.name);
  });

  // ---- toasts ----
  const toast = (message, variant = "neutral") =>
    customElements.whenDefined("wa-toast").then(() => $("toast").create(message, { variant, duration: 4000 }));

  // ---- result panel ----
  const D10 = (cls, n) => `<div class="d10 ${cls}"><svg viewBox="0 0 100 100" aria-hidden="true">
      <polygon class="shape" points="50,3 96,46 96,58 50,97 4,58 4,46"/>
      <polyline class="facet" points="4,46 26,56 50,3 74,56 96,46"/>
      <polyline class="facet" points="26,56 50,70 74,56"/>
      <line class="facet" x1="50" y1="70" x2="50" y2="97"/>
      <text class="num" x="50" y="44">${n}</text></svg></div>`;
  const dicePair = (tens, ones) => `<div class="d10s">${D10("tens", tens)}${D10("ones", ones)}</div>`;
  const symbol = (kind, cls = "") => `<span class="${kind}${cls}" title="${KINDS[kind].title}">${icon(KINDS[kind].symbol)}</span>`;

  // Each pool die is a slot-machine reel, like the overlay's: its die icon over a window showing what it landed on,
  // a Boon / Drawback or a blank. Spinning, the reel runs through random faces (at the die's real odds) first.
  const ODDS = { adv: 0.5, chal: 0.6 };
  const reelFace = (kind, hit) => `<div class="face">${hit ? symbol(kind) : ""}</div>`;
  function reelsHTML(r, spinning) {
    const dice = [...r.adv.map((hit) => ["adv", hit]), ...r.chal.map((hit) => ["chal", hit])];
    if (!dice.length) return "";
    return `<div class="reels">${dice.map(([kind, hit], i) => {
      const len = spinning ? 14 + i * 3 : 1;
      const faces = Array.from({ length: len - 1 }, () => reelFace(kind, Math.random() < ODDS[kind])).join("") + reelFace(kind, hit);
      const gap = kind === "chal" && i === r.adv.length && r.adv.length ? `<span class="gap"></span>` : "";
      return `${gap}<div class="slot ${kind}" data-len="${len}" title="${hit ? KINDS[kind].title : "Blank"}">
        ${icon(KINDS[kind].die, "slot-die")}<div class="window"><div class="strip">${faces}</div></div></div>`;
    }).join("")}</div>`;
  }
  // Reel i stops this long after the result shows; with the d10 spin first, that's when the overlay's reel i stops too.
  const reelStopAt = (i) => 1050 + i * 220;
  function spinReels(el) {
    const body = el.querySelector(".result-body") ?? el;
    const slots = body.querySelectorAll(".slot");
    const net = body.querySelector(".net");
    if (!slots.length) return;
    net?.classList.add("waiting");
    slots.forEach((slot, i) => {
      const strip = slot.querySelector(".strip");
      strip.classList.add("spinning");
      void strip.offsetWidth;
      strip.style.transition = `transform ${reelStopAt(i)}ms cubic-bezier(0.2, 0.6, 0.3, 1)`;
      strip.style.transform = `translateY(calc(var(--s) * -${Number(slot.dataset.len) - 1}))`;
      el.reelTimers.push(setTimeout(() => { strip.classList.remove("spinning"); slot.classList.add("landed"); }, reelStopAt(i) - 120));
    });
    el.reelTimers.push(setTimeout(() => {
      if (!net) return;
      net.classList.remove("waiting");
      // replay the pop it already ran while hidden
      net.style.animation = "none";
      void net.offsetWidth;
      net.style.animation = "";
    }, reelStopAt(slots.length - 1) + 150));
  }

  // Boons and Drawbacks cancel one for one; survivors are bright, cancelled pairs are greyed out.
  function netHTML(r) {
    if (!r.adv.length && !r.chal.length) return "";
    const live = symbol(r.net > 0 ? "adv" : "chal").repeat(Math.abs(r.net));
    const pairs = (symbol("adv", " cancelled") + symbol("chal", " cancelled")).repeat(r.cancelled);
    const label =
      r.net > 0 ? [`+${r.net} Boon${r.net > 1 ? "s" : ""}`, "boon"] :
      r.net < 0 ? [`+${-r.net} Drawback${r.net < -1 ? "s" : ""}`, "drawback"] :
      [r.boons ? "All cancelled" : "No symbols", "even"];
    const icons = live + (live && pairs ? `<span class="sep"></span>` : "") + pairs;
    return `<div class="net">${icons ? `<div class="net-icons">${icons}</div>` : ""}<div class="net-label ${label[1]}">${label[0]}</div></div>`;
  }

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  function rollHTML(r, spinning) {
    const verdict = r.success == null ? "" : `<div class="verdict ${r.success ? "success" : "failure"}">${r.success ? "Success" : "Failure"}</div>`;
    const impact = r.impact ? `<div class="impact">Impact ${r.impact}</div>` : "";
    return dicePair(DICE.fmtTens(r.tens), r.ones) + `<div class="total">${r.total}</div>` + verdict + impact + reelsHTML(r, spinning) + netHTML(r);
  }

  // A panel marked data-steady (the Dice tab's, the roll dialog's) stays the height of the biggest roll there is, a
  // target and every pool die, so it doesn't jump about from roll to roll: a hidden copy of that roll sits under whatever
  // is showing. data-steady="impact" counts an impact line too.
  const all = (hit) => Array(DICE.MAX_POOL).fill(hit);
  const BIGGEST = { tens: 0, ones: 0, total: 100, success: true, adv: all(true), chal: all(true), boons: DICE.MAX_POOL, net: 0, cancelled: DICE.MAX_POOL };
  const BIGGEST_IMPACT = { ...BIGGEST, impact: 999 };
  // With clear, it gets the small button that clears the roll away (a data-clearable panel's, while a roll shows).
  const CLEAR_BUTTON = `<wa-button class="result-clear" size="s" appearance="plain" title="Clear the roll">
      <wa-icon name="xmark" label="Clear the roll"></wa-icon></wa-button>`;
  function fill(el, html, clear = false) {
    el.innerHTML = !el.hasAttribute("data-steady") ? html
      : `<div class="result-body">${html}</div><div class="result-hold" aria-hidden="true">${
        rollHTML(el.dataset.steady === "impact" ? BIGGEST_IMPACT : BIGGEST, false)}</div>`
        + (clear ? CLEAR_BUTTON : "");
  }

  function showResult(r, animate, el) {
    const spinning = animate && !reducedMotion.matches;
    (el.reelTimers ?? []).forEach(clearTimeout);
    el.reelTimers = [];
    el.className = "result" + (animate ? " reveal" : "");
    fill(el, rollHTML(r, spinning), el.hasAttribute("data-clearable"));
    if (spinning) spinReels(el);
  }
  // Spins the d10 faces for a moment before the real result lands.
  function spin(el, ms = 650) {
    if (reducedMotion.matches) return Promise.resolve();
    (el.reelTimers ?? []).forEach(clearTimeout);
    el.className = "result rolling";
    fill(el, dicePair("–", "–"));
    const nums = el.querySelectorAll(".num");
    const timer = setInterval(() => {
      nums[0].textContent = DICE.fmtTens(Math.floor(Math.random() * 10));
      nums[1].textContent = Math.floor(Math.random() * 10);
    }, 60);
    return new Promise((resolve) => setTimeout(() => { clearInterval(timer); resolve(); }, ms));
  }

  // ---- Discord ----
  const emoji = window.NCD_CONFIG?.emoji;
  const playerName = () => text(SESSION.playerName) || "Player";

  // The message avatar: administrator.png for the GM, otherwise the character's portrait, or default.png if they
  // haven't picked one. Discord fetches it itself, so it needs a public link: the site's own address on GitHub Pages
  // (https), or publicUrl in config.js. Locally, no avatar is sent.
  function avatarUrl(character) {
    const base = window.NCD_CONFIG?.publicUrl || (location.protocol === "https:" ? location.href : "");
    const file = SESSION.gm ? C.ADMIN_PORTRAIT
      : character && (C.portraitFile(character, C.availablePortraits(window.NCD_PORTRAITS)) ?? C.DEFAULT_PORTRAIT);
    if (!file || !base) return undefined;
    return new URL(C.PORTRAIT_DIR + file, base).href;
  }

  // Who a message is from: the character open in the Character tab (its handle and portrait), "Administrator"
  // for the GM, or "Neon City Dashboard" with no character open. The GM never has a character, so their
  // messages leave out Luck and Influence.
  function sender() {
    const character = SESSION.gm ? null : SESSION.character;
    return {
      character,
      username: SESSION.gm ? "Administrator" : text(character?.handle) || "Neon City Dashboard",
      avatarUrl: avatarUrl(character),
    };
  }

  async function post(payload, what) {
    if (!sendToDiscord()) return;
    const url = webhookUrl();
    if (!isWebhookUrl(url)) { toast(`${what}, but there's no Discord webhook. Add one in Settings.`, "warning"); return; }
    try {
      await send(url, payload);
    } catch (err) {
      console.error(err);
      toast(`Discord: ${err.message}`, "danger");
    }
  }

  // initiative is { handle } for an Initiative roll (the character going Fast or Slow), or null.
  function postRoll(r, skill, initiative = null) {
    const { character, username, avatarUrl } = sender();
    return post(buildMessage(r, playerName(), {
      skill, emoji, username, avatarUrl, initiative: Boolean(initiative), handle: initiative?.handle,
      luck: character ? C.luck(character).current : null,
      influence: character ? C.influence(character).current : null,
    }), "Rolled");
  }

  // delta is +1 (gained) or -1 (spent).
  function postInfluence(delta, remaining) {
    const { username, avatarUrl } = sender();
    return post(influenceMessage(playerName(), delta, remaining, { emoji, username, avatarUrl }), "Influence changed");
  }

  // ---- rolling ----
  // Keeps a target box to digits only; onChange gets the cleaned value. Returns a reader for the target (null if blank).
  function targetField(input, onChange = () => {}) {
    const clean = () => {
      const v = String(input.value ?? "").replace(/\D/g, "").slice(0, 3);
      if (v !== input.value) input.value = v;
      onChange(v);
    };
    input.addEventListener("input", clean);
    input.addEventListener("wa-clear", () => queueMicrotask(clean));
    return () => (input.value === "" ? null : Number(input.value));
  }

  // A roll button's whole job: roll, reset the pools, spin, show the result, then post it. One roll at a time.
  // The Administrator's rolls also play on the OBS overlay (admin.js), starting with the spin here.
  // `scroll` brings the result into view (the skill dialog, where on phones it's below the fold).
  // `onRoll` runs once the result shows; `skill` names the skill for the message, if any; `readImpact` gives the impact, if any;
  // `initiative` gives { handle } when it's an Initiative roll (so the message says Fast or Slow), else null.
  function makeRoller({ button, readTarget, pools, result, resetPools, scroll = false, onRoll = () => {}, skill = () => undefined,
    readImpact = () => null, initiative = () => null }) {
    let busy = false;
    const reveal = () => { if (scroll) result.scrollIntoView({ block: "nearest" }); };
    return async function rollAndPost() {
      if (busy) return;
      busy = true;
      button.loading = true;
      try {
        const r = DICE.roll({ target: readTarget(), advantage: pools.adv.value, challenge: pools.chal.value, impact: readImpact() });
        resetPools();
        window.NCD_ADMIN.send("roll", r);
        result.hidden = false;
        const spinning = spin(result);
        reveal();
        await spinning;
        showResult(r, true, result);
        reveal();
        onRoll(r);
        await postRoll(r, skill(), initiative());
      } finally {
        busy = false;
        button.loading = false;
      }
    };
  }

  // ---- the Dice tab ----
  // Target sticks between rolls (and reloads) until cleared; the dice pools reset after every roll.
  const targetInput = $("target");
  targetInput.value = store.get("target", "");
  const pools = { adv: $("adv"), chal: $("chal") };
  const rollAndPost = makeRoller({
    button: $("roll"),
    readTarget: targetField(targetInput, (v) => store.set("target", v)),
    pools,
    result: $("result"),
    resetPools: () => { for (const group of Object.values(pools)) group.value = "0"; },
    onRoll: (r) => store.set("lastRoll", JSON.stringify(r)),
  });
  try {
    const last = JSON.parse(store.get("lastRoll"));
    if (last) showResult(last, false, $("result"));
  } catch {}
  // Back to "No rolls yet": by the clear button, or at the end of a Planning countdown (admin-planning.js).
  // The Administrator's overlay shows what this panel shows, so "No rolls yet" here clears the overlay's roll too,
  // now and whenever the overlay connects.
  const noRoll = () => !$("result").querySelector(".result-body .d10s");
  // Any result panel back to "No rolls yet".
  function emptyResult(el) {
    (el.reelTimers ?? []).forEach(clearTimeout);
    el.reelTimers = [];
    el.className = "result";
    fill(el, `<p class="result-empty">No rolls yet</p>`);
  }
  function clearResult() {
    emptyResult($("result"));
    store.set("lastRoll", null);
    window.NCD_ADMIN.send("clearRoll");
  }
  if (!$("result").querySelector(".result-body")) clearResult();
  $("result").addEventListener("click", (e) => { if (e.target.closest(".result-clear")) clearResult(); });
  window.NCD_ADMIN.onLink(({ status }) => { if (status === "connected" && noRoll()) window.NCD_ADMIN.send("clearRoll"); });

  $("roll").addEventListener("click", rollAndPost);
  targetInput.addEventListener("keydown", (e) => { if (e.key === "Enter") rollAndPost(); });

  // R rolls from anywhere on the Dice tab, except while typing or using a control.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "r" && e.key !== "R") return;
    if (e.ctrlKey || e.metaKey || e.altKey || tabs.active !== "dice") return;
    if (e.composedPath().some((n) => n.matches?.("input, textarea, wa-input, wa-textarea, [contenteditable]"))) return;
    e.preventDefault();
    rollAndPost();
  });

  // ---- the Databank and Tables tabs ----
  // Built once from databank.js. A section with many entries spans the page and flows its entries into columns.
  let tablePicker; // set in the block below, which has the table helpers
  {
    const DATABANK = window.NCD_DATABANK;
    const { formatDescription } = window.NCD_FORMAT;
    const { escapeHTML } = window.NCD_UTIL;
    const ICON_COLOR = { "advantage-die": "adv", boon: "adv", "challenge-die": "chal", drawback: "chal" };
    const rich = (s) => `<div class="ability-text">${formatDescription(s, (name) => icon(name, ICON_COLOR[name] ?? ""))}</div>`;
    // A table's cells are plain text, unless it has its own cell(value, column) giving HTML, or `format` (format.js text).
    const formatCell = (c) => formatDescription(c, (name) => icon(name, ICON_COLOR[name] ?? "")).replace(/^<p>|<\/p>$/g, "");
    const table = (t) => `<div class="databank-table-wrap"><table class="databank-table">
      <thead><tr>${t.head.map((h) => `<th>${escapeHTML(h)}</th>`).join("")}</tr></thead>
      <tbody>${t.rows.map((r) => `<tr>${r.map((c, j) => `<td>${t.cell ? t.cell(c, j) : t.format ? formatCell(c) : escapeHTML(c)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div>`;
    const entry = (e) => `<article class="databank-entry">
      <h3>${escapeHTML(e.name)}${e.tag ? ` <span class="databank-tag">${escapeHTML(e.tag)}</span>` : ""}</h3>
      ${e.text ? rich(e.text) : ""}${e.table ? table(e.table) : ""}
    </article>`;
    // `roll` (the Tables tab) puts a dice button in the card's title, for rolling on its table.
    const rollButton = (n, die) => `<span class="table-roller"><span class="table-roll" aria-live="polite"></span>
        <wa-button appearance="plain" size="s" data-roll-table="${n}" title="Roll d${die}">
        <wa-icon name="dice" label="Roll d${die}"></wa-icon></wa-button></span>`;
    // `outro` is text under the table; `after` is HTML under that (the Tables tab's buttons). A card is the full width
    // with `wide`, or many entries. `double` makes it two columns wide where the page has room for two.
    const section = ({ title, kind = "", intro, entries = [], table: t, outro, roll, after = "", wide = entries.length > 6, double = false }) => `
      <section class="sheet-column databank-section${wide ? " wide" : double ? " double" : ""}">
        <h2 class="${kind}${roll != null ? " rollable" : ""}">${escapeHTML(title)}${roll != null ? rollButton(roll, DICE.tableDie(t)) : ""}</h2>
        ${intro ? rich(intro) : ""}${t ? table(t) : ""}${outro ? rich(outro) : ""}${after}
        ${entries.length ? `<div class="databank-entries">${entries.map(entry).join("")}</div>` : ""}
      </section>`;
    const list = (names) => names.length ? names.join(", ") : "none";

    // The tool set and armor tables come from their data in databank.js.
    const skillName = (id) => window.NCD_CHARACTERS.SKILLS.find((s) => s.id === id)?.name ?? id;
    const toolSetTable = { head: ["Tool set", "Associated skills"], rows: DATABANK.toolSets.map((t) => [t.name, t.skills.map(skillName).join(", ")]) };
    const armorTable = { head: ["Armor benefit", "Keywords"],
      rows: DATABANK.armor.levels.map((k, i) => [`Armored${i ? ` x${i + 1}` : ""}`, k.join(", ") || "–"]) };
    $("databank-gear").innerHTML = DATABANK.gear.map((s) => section({ ...s,
      entries: s.entries.map((e) => (e.name === "Tool Sets" ? { ...e, table: toolSetTable } : e)) })).join("");

    $("databank-armory").innerHTML = [
      section({
        title: "Weapons", intro: DATABANK.weaponsIntro,
        entries: DATABANK.weapons.map((w) => ({
          name: w.name,
          tag: [w.hands && `${w.hands}H`, `+${w.damage} damage`].filter(Boolean).join(" · "),
          text: `**Intrinsic keywords:** ${list(w.intrinsic)}\n\n**Allowed keywords:** ${list(w.allowed)}\n\n*${w.examples}*`,
        })),
      }),
      section({ title: "Armor", entries: [{ ...DATABANK.armor, table: armorTable }] }),
    ].join("");

    $("databank-garage").innerHTML = section({
      title: "Vehicles", intro: DATABANK.vehicleRules,
      entries: DATABANK.vehicles.map((v) => ({ name: v.name, tag: v.size, text: `*${v.blurb}*\n\n${v.text}` })),
    });

    // Each weapon keyword says which weapon categories allow it (and which always have it).
    const weaponsWith = (k, field) => DATABANK.weapons.filter((w) => w[field].includes(k)).map((w) => w.name);
    $("databank-keywords").innerHTML = [
      section({ title: "Positive gear keywords", kind: "boon", intro: DATABANK.keywordsIntro, entries: DATABANK.keywords.positive }),
      section({ title: "Negative gear keywords", kind: "drawback", entries: DATABANK.keywords.negative }),
      section({
        title: "Weapon keywords", intro: "Only weapons can have these keywords, and each weapon category allows only some of them.",
        entries: DATABANK.keywords.weapon.map((k) => {
          const always = weaponsWith(k.name, "intrinsic");
          return { ...k, text: `${k.text}\n\n**Allowed on:** ${list(weaponsWith(k.name, "allowed"))}${always.length ? `\n\n**Always on:** ${always.join(", ")}` : ""}` };
        }),
      }),
    ].join("");

    // One XP table for every origin (advancement.js), with the costs that differ by origin noted.
    const ADVANCEMENT = window.NCD_ADVANCEMENT;
    $("databank-xp").innerHTML = section({ title: "Advancement XP expenditures", intro: ADVANCEMENT.TABLE_INTRO, table: ADVANCEMENT.TABLE, wide: true });

    // Archetypes and Origins: a tab for each, with its page from profiles.js.
    const PROFILES = window.NCD_PROFILES, C = window.NCD_CHARACTERS;
    const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const profileTabs = (prefix, names, page) => `<wa-tab-group class="databank-tabs databank-profile-tabs">
        ${names.map((name) => `<wa-tab panel="${prefix}-${slug(name)}">${escapeHTML(name)}</wa-tab>`).join("")}
        ${names.map((name) => `<wa-tab-panel name="${prefix}-${slug(name)}"><div class="cheat-sheet databank">${
          page(name).map(section).join("")}</div></wa-tab-panel>`).join("")}
      </wa-tab-group>`;
    $("databank-archetypes").innerHTML = profileTabs("archetype", C.ARCHETYPES, PROFILES.archetype);
    $("databank-origins").innerHTML = profileTabs("origin", C.ORIGINS, PROFILES.origin);

    // The skill descriptions, mental then physical, then Anything Else.
    $("databank-skills").innerHTML = DATABANK.skills.map(section).join("");

    // ---- the Tables tab: tables to roll on or look up (tables.js), in the Databank's style ----
    const TABLES = window.NCD_TABLES;
    // A card whose table's first column names a die ("d100") gets a dice button in its title: it rolls that die, lights
    // up the row the roll falls in, and shows the roll beside the button.
    const tables = [];
    const tableSection = (s) => {
      if (!DICE.tableDie(s.table)) return section(s);
      tables.push(s.table);
      return section({ ...s, roll: tables.length - 1 });
    };
    // Security system tiers: each defense with a description opens it, and the Security Tiers button opens every tier's.
    const defense = (name) => TABLES.securityDefenses.findIndex((d) => d.name.toLowerCase() === name.toLowerCase());
    const defensesHTML = (names) => names.map((name) => (defense(name) < 0 ? escapeHTML(name)
      : `<button type="button" class="ability-name" data-defense="${defense(name)}">${escapeHTML(name)}</button>`)).join(", ") || "–";
    const securityTable = { head: ["Tier", "Typical defenses"], rows: TABLES.securityTiers.map((t) => [t.name, t.defenses]),
      cell: (c, j) => (j ? defensesHTML(c) : escapeHTML(c)) };
    const securityTiersButton = `<wa-button size="s" appearance="outlined" data-security-tiers>
        <wa-icon slot="start" name="circle-info"></wa-icon>Security Tiers</wa-button>`;

    $("tables").innerHTML = [
      tableSection({ title: "Random gear keywords", intro: TABLES.randomKeywordsIntro, table: { head: ["d100", "Positive", "Negative"], rows: TABLES.randomKeywords } }),
      tableSection({ title: "Security system tiers", table: securityTable, after: securityTiersButton }),
      tableSection({ title: "Liabilities", table: { head: ["d100", "Liability"], rows: TABLES.liabilities } }),
    ].join("");

    // A table to pick a row from (roster.js: a character's liability), drawn into el. Clicking a row (or Enter or Space on
    // it) picks it; the dice button rolls the table's die and picks the row it lands on, as often as you like.
    // onPick(row) gets the picked row's cells. Drawing it again clears the pick.
    tablePicker = (el, t, onPick) => {
      const die = DICE.tableDie(t);
      el.innerHTML = `<div class="table-picker"><p class="table-picker-head">Pick one, or roll for it.${die ? rollButton(0, die) : ""}</p>${table(t)}</div>`;
      const rows = [...el.querySelectorAll("tbody tr")];
      for (const tr of rows) Object.assign(tr, { tabIndex: 0, ariaSelected: "false" });
      const shown = el.querySelector(".table-roll");
      const pick = (i, total = "") => {
        rows.forEach((tr, j) => { tr.classList.toggle("rolled", j === i); tr.ariaSelected = String(j === i); });
        if (shown) shown.textContent = total;
        rows[i]?.scrollIntoView({ block: "nearest" });
        if (rows[i]) onPick(t.rows[i]);
      };
      el.onclick = (e) => {
        if (e.target.closest("[data-roll-table]")) {
          const r = DICE.rollTable(t);
          pick(r.row, r.total);
        } else {
          const tr = e.target.closest("tbody tr");
          if (tr) pick(rows.indexOf(tr));
        }
      };
      el.onkeydown = (e) => {
        const tr = e.target.closest("tbody tr");
        if (!tr || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        pick(rows.indexOf(tr));
      };
    };

    const info = $("tables-info-dialog");
    const showInfo = (label, html) => { info.label = label; $("tables-info-body").innerHTML = html; info.open = true; };
    $("tables").addEventListener("click", (e) => {
      const d = TABLES.securityDefenses[e.target.closest("[data-defense]")?.dataset.defense];
      if (d) showInfo(d.name, `${d.tag ? `<p class="ability-tag">${escapeHTML(d.tag)}</p>` : ""}${rich(d.text)}`);
      if (e.target.closest("[data-security-tiers]")) {
        showInfo("Security Tiers", rich([...TABLES.securityTiers.map((t) => `**${t.name}:** ${t.text}`), TABLES.securityTiersOutro].join("\n\n")));
      }
      const button = e.target.closest("[data-roll-table]");
      if (!button) return;
      const r = DICE.rollTable(tables[Number(button.dataset.rollTable)]);
      const el = button.closest("section");
      el.querySelectorAll("tbody tr").forEach((tr, i) => tr.classList.toggle("rolled", i === r.row));
      el.querySelector(".table-roll").textContent = r.total;
      el.querySelector("tr.rolled")?.scrollIntoView({ block: "nearest" });
    });
  }

  // ---- masonry: the Cheat Sheet, Databank and Tables cards stack in their columns instead of lining up in rows ----
  // The grid's rows are MASONRY_ROW tall, and each card spans enough of them for its height plus the gap, so a short card
  // doesn't leave a hole under it. A card's span is redone whenever its size changes (a resize, or its tab being shown).
  const MASONRY_ROW = 2;
  for (const grid of document.querySelectorAll(".cheat-sheet")) {
    grid.classList.add("masonry");
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    const sized = new ResizeObserver((changes) => {
      for (const { target } of changes) {
        const height = target.offsetHeight; // layout pixels, like the grid's rows (unlike getBoundingClientRect under zoom)
        // a hidden tab measures 0; keep the last span until it's shown again
        if (height) target.style.gridRowEnd = `span ${Math.ceil((height + gap) / MASONRY_ROW)}`;
      }
    });
    for (const card of grid.children) sized.observe(card);
  }

  // For the Character tab (roster.js).
  window.NCD_APP = { KINDS, toast, targetField, makeRoller, postInfluence, clearResult, emptyResult, tablePicker };
})();
