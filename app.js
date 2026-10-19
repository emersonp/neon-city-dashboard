// Page wiring: theme toggle, tabs, the dice roller, and posting rolls to Discord.
(function () {
  const DICE = window.NCD_DICE;
  const { buildMessage, influenceMessage, send } = window.NCD_DISCORD;
  const { svg: icon } = window.NCD_ICONS;
  const $ = (id) => document.getElementById(id);

  // localStorage can be missing or throw (private windows, blocked storage); never let that break the page.
  const store = {
    get(key, fallback = null) { try { return localStorage.getItem(`ncd.${key}`) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(`ncd.${key}`, value); } catch {} },
  };

  // A webhook saved from Settings (later) wins over the hardcoded one in config.js.
  const webhookUrl = () => store.get("webhook") || window.NCD_CONFIG?.webhookUrl || "";

  document.querySelectorAll("[data-icon]").forEach((el) => { el.innerHTML = icon(el.dataset.icon); });

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

  // ---- tabs ----
  const tabs = $("tabs");
  customElements.whenDefined("wa-tab-group").then(() => { tabs.active = store.get("tab", "dice"); });
  tabs.addEventListener("wa-tab-show", (e) => store.set("tab", e.detail.name));

  // ---- settings ----
  const playerInput = $("player-name");
  const gmSwitch = $("gm");
  playerInput.value = store.get("playerName", "");
  if (store.get("gm") === "1") gmSwitch.setAttribute("checked", "");
  const playerName = () => String(playerInput.value ?? "").trim() || "Player";
  const isGM = () => gmSwitch.checked;
  playerInput.addEventListener("input", () => store.set("playerName", playerInput.value));
  gmSwitch.addEventListener("change", () => store.set("gm", gmSwitch.checked ? "1" : "0"));

  // ---- toasts ----
  const toast = (message, variant = "neutral") =>
    customElements.whenDefined("wa-toast").then(() => $("toast").create(message, { variant, duration: 4000 }));

  // ---- roller inputs ----
  // Target sticks between rolls (and reloads) until cleared; the dice pools reset after every roll.
  const targetInput = $("target");
  targetInput.value = store.get("target", "");
  // Keeps a target box to digits only; onChange gets the cleaned value.
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
  const readTarget = targetField(targetInput, (v) => store.set("target", v));
  targetInput.addEventListener("keydown", (e) => { if (e.key === "Enter") rollAndPost(); });

  // Fills a radio group with 0-4 button choices.
  function fillPool(group) {
    for (let n = 0; n <= DICE.MAX_POOL; n++) {
      const radio = document.createElement("wa-radio");
      radio.value = String(n);
      radio.setAttribute("appearance", "button");
      radio.textContent = n;
      group.append(radio);
    }
  }
  const pools = { adv: $("adv"), chal: $("chal") };
  Object.values(pools).forEach(fillPool);
  const resetPools = () => { for (const group of Object.values(pools)) group.value = "0"; };

  // ---- result panel ----
  const D10 = (cls, n) => `<div class="d10 ${cls}"><svg viewBox="0 0 100 100" aria-hidden="true">
      <polygon class="shape" points="50,3 96,46 96,58 50,97 4,58 4,46"/>
      <polyline class="facet" points="4,46 26,56 50,3 74,56 96,46"/>
      <polyline class="facet" points="26,56 50,70 74,56"/>
      <line class="facet" x1="50" y1="70" x2="50" y2="97"/>
      <text class="num" x="50" y="44">${n}</text></svg></div>`;
  const dicePair = (tens, ones) => `<div class="d10s">${D10("tens", tens)}${D10("ones", ones)}</div>`;

  // Each pool die shows what it landed on: a Boon / Drawback, or an empty slot for a blank face.
  const face = (kind, hit) => hit
    ? `<span class="${kind}" title="${kind === "adv" ? "Boon" : "Drawback"}">${icon(kind === "adv" ? "boon" : "drawback")}</span>`
    : `<span class="${kind} blank" title="Blank"></span>`;
  function facesHTML(r) {
    const adv = r.adv.map((hit) => face("adv", hit));
    const chal = r.chal.map((hit) => face("chal", hit));
    if (!adv.length && !chal.length) return "";
    return `<div class="faces">${adv.join("")}${adv.length && chal.length ? `<span class="gap"></span>` : ""}${chal.join("")}</div>`;
  }

  // Boons and Drawbacks cancel one for one; survivors are bright, cancelled pairs are greyed out.
  function netHTML(r) {
    if (!r.adv.length && !r.chal.length) return "";
    const live = Array(Math.abs(r.net)).fill(r.net > 0 ? "boon" : "drawback")
      .map((name) => `<span class="${name === "boon" ? "adv" : "chal"}">${icon(name)}</span>`).join("");
    const pairs = Array(r.cancelled).fill(`<span class="adv cancelled">${icon("boon")}</span><span class="chal cancelled">${icon("drawback")}</span>`).join("");
    const label =
      r.net > 0 ? [`+${r.net} Boon${r.net > 1 ? "s" : ""}`, "boon"] :
      r.net < 0 ? [`+${-r.net} Drawback${r.net < -1 ? "s" : ""}`, "drawback"] :
      [r.boons ? "All cancelled" : "No symbols", "even"];
    const icons = live + (live && pairs ? `<span class="sep"></span>` : "") + pairs;
    return `<div class="net">${icons ? `<div class="net-icons">${icons}</div>` : ""}<div class="net-label ${label[1]}">${label[0]}</div></div>`;
  }

  function showResult(r, animate, el = $("result")) {
    const verdict = r.success == null ? "" : `<div class="verdict ${r.success ? "success" : "failure"}">${r.success ? "Success" : "Failure"}</div>`;
    el.className = "result" + (animate ? " reveal" : "");
    el.innerHTML = dicePair(DICE.fmtTens(r.tens), r.ones) + `<div class="total">${r.total}</div>` + verdict + facesHTML(r) + netHTML(r);
  }

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  // Spins the d10 faces for a moment before the real result lands.
  function spin(el = $("result"), ms = 650) {
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

  let lastRoll = null;
  try { lastRoll = JSON.parse(store.get("lastRoll")); } catch {}
  if (lastRoll) showResult(lastRoll, false);

  // ---- Discord ----
  // Luck and the posting name come from the character open in the Character tab (roster.js).
  // The GM posts as Administrator; with no character open, Luck is left out.
  const activeCharacter = () => window.NCD_ACTIVE_CHARACTER?.();
  function postingName() {
    const handle = String(activeCharacter()?.handle ?? "").trim();
    return isGM() ? "Administrator" : handle || "Neon City Dashboard";
  }
  function messageFor(r, skill) {
    const character = activeCharacter();
    return buildMessage(r, playerName(), {
      skill,
      luck: isGM() || !character ? null : window.NCD_CHARACTERS.luck(character).current,
      emoji: window.NCD_CONFIG?.emoji,
      username: postingName(),
    });
  }

  async function post(payload, what) {
    const url = webhookUrl();
    if (!url) { toast(`${what}, but no webhook is set. Copy config.example.js to config.js and add one.`, "warning"); return; }
    try {
      await send(url, payload);
    } catch (err) {
      console.error(err);
      toast(`Discord: ${err.message}`, "danger");
    }
  }
  const postToDiscord = (r, skill) => post(messageFor(r, skill), "Rolled");
  // delta is +1 (gained) or -1 (spent).
  const postInfluence = (delta) => post(
    influenceMessage(playerName(), delta, { emoji: window.NCD_CONFIG?.emoji, username: postingName() }),
    "Influence changed");

  // ---- rolling ----
  let rolling = false;
  async function rollAndPost() {
    if (rolling) return;
    rolling = true;
    $("roll").loading = true;
    try {
      const r = DICE.roll({ target: readTarget(), advantage: pools.adv.value, challenge: pools.chal.value });
      resetPools();
      await spin();
      showResult(r, true);
      lastRoll = r;
      store.set("lastRoll", JSON.stringify(r));
      await postToDiscord(r);
    } finally {
      rolling = false;
      $("roll").loading = false;
    }
  }

  $("roll").addEventListener("click", rollAndPost);

  // R rolls from anywhere on the Dice tab, except while typing or using a control.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "r" && e.key !== "R") return;
    if (e.ctrlKey || e.metaKey || e.altKey || tabs.active !== "dice") return;
    if (e.composedPath().some((n) => n.matches?.("input, textarea, wa-input, wa-textarea, [contenteditable]"))) return;
    e.preventDefault();
    rollAndPost();
  });

  // For the character tab's skill rolls (roster.js).
  window.NCD_ROLLER = { fillPool, targetField, spin, showResult, postToDiscord, postInfluence };
})();
