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
  playerInput.addEventListener("input", () => { SESSION.playerName = playerInput.value; store.set("playerName", playerInput.value); });
  gmSwitch.addEventListener("change", () => { SESSION.gm = gmSwitch.checked; store.set("gm", gmSwitch.checked ? "1" : "0"); });
  const webhookInput = $("webhook");
  webhookInput.value = store.get("webhook", "");
  webhookInput.placeholder = "https://discord.com/api/webhooks/…";
  const checkWebhook = () => customElements.whenDefined("wa-input").then(() =>
    webhookInput.setCustomValidity(isWebhookUrl(webhookUrl()) ? "" : "Not a Discord webhook address"));
  webhookInput.addEventListener("input", () => { store.set("webhook", text(webhookInput.value)); checkWebhook(); });
  checkWebhook();

  // ---- tabs ----
  // Start on Settings until there's a player name and a working webhook.
  const tabs = $("tabs");
  const needsSetup = () => !text(SESSION.playerName) || !isWebhookUrl(webhookUrl());
  let forced = false; // a forced trip to Settings isn't remembered as the last tab
  customElements.whenDefined("wa-tab-group").then(() => {
    forced = needsSetup();
    // a remembered tab that no longer exists (renamed or removed) falls back to Dice
    const last = store.get("tab", "dice");
    tabs.active = forced ? "settings" : tabs.querySelector(`:scope > wa-tab[panel="${CSS.escape(last)}"]`) ? last : "dice";
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

  // Each pool die shows what it landed on: a Boon / Drawback, or an empty slot for a blank face.
  const face = (kind, hit) => (hit ? symbol(kind) : `<span class="${kind} blank" title="Blank"></span>`);
  function facesHTML(r) {
    const adv = r.adv.map((hit) => face("adv", hit));
    const chal = r.chal.map((hit) => face("chal", hit));
    if (!adv.length && !chal.length) return "";
    return `<div class="faces">${adv.join("")}${adv.length && chal.length ? `<span class="gap"></span>` : ""}${chal.join("")}</div>`;
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

  function showResult(r, animate, el) {
    const verdict = r.success == null ? "" : `<div class="verdict ${r.success ? "success" : "failure"}">${r.success ? "Success" : "Failure"}</div>`;
    el.className = "result" + (animate ? " reveal" : "");
    el.innerHTML = dicePair(DICE.fmtTens(r.tens), r.ones) + `<div class="total">${r.total}</div>` + verdict + facesHTML(r) + netHTML(r);
  }

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  // Spins the d10 faces for a moment before the real result lands.
  function spin(el, ms = 650) {
    if (reducedMotion.matches) return Promise.resolve();
    el.className = "result rolling";
    el.innerHTML = dicePair("–", "–");
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
    const url = webhookUrl();
    if (!isWebhookUrl(url)) { toast(`${what}, but there's no Discord webhook. Add one in Settings.`, "warning"); return; }
    try {
      await send(url, payload);
    } catch (err) {
      console.error(err);
      toast(`Discord: ${err.message}`, "danger");
    }
  }

  function postRoll(r, skill) {
    const { character, username, avatarUrl } = sender();
    return post(buildMessage(r, playerName(), {
      skill, emoji, username, avatarUrl,
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
  // `scroll` brings the result into view (the skill dialog, where on phones it's below the fold).
  // `onRoll` runs once the result shows; `skill` names the skill for the message, if any.
  function makeRoller({ button, readTarget, pools, result, resetPools, scroll = false, onRoll = () => {}, skill = () => undefined }) {
    let busy = false;
    const reveal = () => { if (scroll) result.scrollIntoView({ block: "nearest" }); };
    return async function rollAndPost() {
      if (busy) return;
      busy = true;
      button.loading = true;
      try {
        const r = DICE.roll({ target: readTarget(), advantage: pools.adv.value, challenge: pools.chal.value });
        resetPools();
        result.hidden = false;
        const spinning = spin(result);
        reveal();
        await spinning;
        showResult(r, true, result);
        reveal();
        onRoll(r);
        await postRoll(r, skill());
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

  // ---- the Databank tab ----
  // Built once from databank.js. A section with many entries spans the page and flows its entries into columns.
  {
    const DATABANK = window.NCD_DATABANK;
    const { formatDescription } = window.NCD_FORMAT;
    const { escapeHTML } = window.NCD_UTIL;
    const ICON_COLOR = { "advantage-die": "adv", boon: "adv", "challenge-die": "chal", drawback: "chal" };
    const rich = (s) => `<div class="ability-text">${formatDescription(s, (name) => icon(name, ICON_COLOR[name] ?? ""))}</div>`;
    const table = (t) => `<div class="databank-table-wrap"><table class="databank-table">
      <thead><tr>${t.head.map((h) => `<th>${escapeHTML(h)}</th>`).join("")}</tr></thead>
      <tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHTML(c)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div>`;
    const entry = (e) => `<article class="databank-entry">
      <h3>${escapeHTML(e.name)}${e.tag ? ` <span class="databank-tag">${escapeHTML(e.tag)}</span>` : ""}</h3>
      ${e.text ? rich(e.text) : ""}${e.table ? table(e.table) : ""}
    </article>`;
    const section = ({ title, kind = "", intro, entries = [], table: t }) => `
      <section class="sheet-column databank-section${entries.length > 6 ? " wide" : ""}">
        <h2 class="${kind}">${escapeHTML(title)}</h2>
        ${intro ? rich(intro) : ""}${t ? table(t) : ""}
        ${entries.length ? `<div class="databank-entries">${entries.map(entry).join("")}</div>` : ""}
      </section>`;
    const list = (names) => names.length ? names.join(", ") : "none";

    $("databank-gear").innerHTML = DATABANK.gear.map(section).join("");

    $("databank-armory").innerHTML = [
      section({
        title: "Weapons", intro: DATABANK.weaponsIntro,
        entries: DATABANK.weapons.map((w) => ({
          name: w.name,
          tag: [w.hands && `${w.hands}H`, `+${w.damage} damage`].filter(Boolean).join(" · "),
          text: `**Intrinsic keywords:** ${list(w.intrinsic)}\n\n**Allowed keywords:** ${list(w.allowed)}\n\n*${w.examples}*`,
        })),
      }),
      section({ title: "Armor", entries: [DATABANK.armor] }),
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
      section({ title: "Random gear keywords", intro: DATABANK.randomKeywordsIntro, table: { head: ["d100", "Positive", "Negative"], rows: DATABANK.randomKeywords } }),
      section({
        title: "Weapon keywords", intro: "Only weapons can have these keywords, and each weapon category allows only some of them.",
        entries: DATABANK.keywords.weapon.map((k) => {
          const always = weaponsWith(k.name, "intrinsic");
          return { ...k, text: `${k.text}\n\n**Allowed on:** ${list(weaponsWith(k.name, "allowed"))}${always.length ? `\n\n**Always on:** ${always.join(", ")}` : ""}` };
        }),
      }),
    ].join("");
  }

  // For the Character tab (roster.js).
  window.NCD_APP = { KINDS, toast, targetField, makeRoller, postInfluence };
})();
