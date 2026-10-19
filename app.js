// Page wiring: theme toggle, tabs, the dice roller, and the Discord style lab.
(function () {
  const DICE = window.NCD_DICE;
  const { STYLES, COLORS, send, stripImage } = window.NCD_DISCORD;
  const { svg: icon, icons: ICON_DATA } = window.NCD_ICONS;
  const $ = (id) => document.getElementById(id);
  const PLAYER = "Parker"; // until the Roster tab exists

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

  // ---- toasts ----
  const toast = (message, variant = "neutral") =>
    customElements.whenDefined("wa-toast").then(() => $("toast").create(message, { variant, duration: 4000 }));

  // ---- roller inputs ----
  // Target sticks between rolls (and reloads) until cleared; the dice pools reset after every roll.
  const targetInput = $("target");
  targetInput.value = store.get("target", "");
  const cleanTarget = () => {
    const v = String(targetInput.value ?? "").replace(/\D/g, "").slice(0, 3);
    if (v !== targetInput.value) targetInput.value = v;
    store.set("target", v);
  };
  targetInput.addEventListener("input", cleanTarget);
  targetInput.addEventListener("wa-clear", () => queueMicrotask(cleanTarget));
  targetInput.addEventListener("keydown", (e) => { if (e.key === "Enter") rollAndPost([currentStyle()]); });
  const readTarget = () => (targetInput.value === "" ? null : Number(targetInput.value));

  const pools = { adv: $("adv"), chal: $("chal") };
  for (const group of Object.values(pools)) {
    for (let n = 0; n <= DICE.MAX_POOL; n++) {
      const radio = document.createElement("wa-radio");
      radio.value = String(n);
      radio.setAttribute("appearance", "button");
      radio.textContent = n;
      group.append(radio);
    }
  }
  const resetPools = () => { for (const group of Object.values(pools)) group.value = "0"; };

  // ---- result panel ----
  const D10 = (cls, n) => `<div class="d10 ${cls}"><svg viewBox="0 0 100 100" aria-hidden="true">
      <polygon class="shape" points="50,3 96,46 96,58 50,97 4,58 4,46"/>
      <polyline class="facet" points="4,46 26,56 50,3 74,56 96,46"/>
      <polyline class="facet" points="26,56 50,70 74,56"/>
      <line class="facet" x1="50" y1="70" x2="50" y2="97"/>
      <text class="num" x="50" y="44">${n}</text></svg></div>`;
  const dicePair = (tens, ones) => `<div class="d10s">${D10("tens", tens)}${D10("ones", ones)}</div>`;

  // Each pool die shows what it landed on: a Boon / Drawback, or the (greyed) die for a blank.
  function facesHTML(r) {
    const adv = r.adv.map((hit) => `<span class="adv${hit ? "" : " blank"}" title="${hit ? "Boon" : "Blank"}">${icon(hit ? "boon" : "advantage-die")}</span>`);
    const chal = r.chal.map((hit) => `<span class="chal${hit ? "" : " blank"}" title="${hit ? "Drawback" : "Blank"}">${icon(hit ? "drawback" : "challenge-die")}</span>`);
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

  function showResult(r, animate) {
    const el = $("result");
    const verdict = r.success == null ? "" : `<div class="verdict ${r.success ? "success" : "failure"}">${r.success ? "Success" : "Failure"}</div>`;
    el.className = "result" + (animate ? " reveal" : "");
    el.innerHTML = dicePair(DICE.fmtTens(r.tens), r.ones) + `<div class="total">${r.total}</div>` + verdict + facesHTML(r) + netHTML(r);
  }

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  // Spins the d10 faces for a moment before the real result lands.
  function spin(ms = 650) {
    if (reducedMotion.matches) return Promise.resolve();
    const el = $("result");
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

  // ---- style lab ----
  const styleGroup = $("style");
  for (const [key, style] of Object.entries(STYLES)) {
    const radio = document.createElement("wa-radio");
    radio.value = key;
    radio.setAttribute("appearance", "button");
    radio.textContent = style.label;
    styleGroup.append(radio);
  }
  styleGroup.setAttribute("value", STYLES[store.get("style")] ? store.get("style") : "markdown");

  const customName = $("custom-name");
  if (store.get("customName") === "1") customName.setAttribute("checked", "");

  const currentStyle = () => (STYLES[styleGroup.value] ? styleGroup.value : "markdown");
  const username = () => (customName.checked ? "Neon City Dashboard" : undefined);

  // The thumbnail is the leftover symbol: a Boon or Drawback icon, or nothing when none are left.
  const thumbFor = (r) => (r.net > 0 ? "boon" : r.net < 0 ? "drawback" : null);

  function renderPreview() {
    const style = STYLES[currentStyle()];
    $("style-about").textContent = style.about;
    // Before the first roll, preview an example so there's something to look at.
    const r = lastRoll ?? DICE.roll({ target: 45, advantage: 2, challenge: 1 });
    const built = style.build(r, PLAYER);
    const withThumb = built.image && thumbFor(r);
    const payload = { ...(username() && { username: username() }), ...(withThumb ? built.payload : stripImage(built.payload)) };
    $("payload").textContent = (lastRoll ? "" : "// example roll; roll to see your own\n")
      + JSON.stringify(payload, null, 2)
      + (withThumb ? `\n\n// + result.png (${thumbFor(r)} icon) uploaded as an attachment` : "");
  }

  styleGroup.addEventListener("change", () => { store.set("style", currentStyle()); renderPreview(); });
  customName.addEventListener("change", () => { store.set("customName", customName.checked ? "1" : "0"); renderPreview(); });

  // Renders a game icon to a tinted PNG, since Discord can't show SVG and only accepts
  // images by public URL or upload. Works from file:// because nothing is fetched.
  async function iconPng(name, size = 160) {
    const data = ICON_DATA[name];
    const color = "#" + COLORS[name === "boon" ? "success" : "failure"].toString(16).padStart(6, "0");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${data.viewBox}" width="${size}" height="${size}">`
      + `<style>.ink{fill:${color}}.paper{fill:#0d0c1a}.paper-stroke{stroke:#0d0c1a}</style>${data.body}</svg>`;
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    canvas.getContext("2d").drawImage(img, 0, 0, size, size);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  async function postToDiscord(r, styleKeys) {
    const url = webhookUrl();
    if (!url) { toast("Rolled, but no webhook is set. Copy config.example.js to config.js and add one.", "warning"); return; }
    try {
      const thumb = thumbFor(r);
      const image = thumb ? await iconPng(thumb).catch(() => null) : null;
      for (const [i, key] of styleKeys.entries()) {
        if (i) await new Promise((res) => setTimeout(res, 700)); // stay well under Discord's rate limit
        await send(url, STYLES[key].build(r, PLAYER), { username: username(), image });
      }
      if (styleKeys.length > 1) toast(`Sent ${styleKeys.length} styles to Discord.`, "success");
    } catch (err) {
      console.error(err);
      toast(`Discord: ${err.message}`, "danger");
    }
  }

  // ---- rolling ----
  let rolling = false;
  async function rollAndPost(styleKeys) {
    if (rolling) return;
    rolling = true;
    const buttons = [$("roll"), $("roll-all")];
    buttons.forEach((b) => { b.loading = true; });
    try {
      const r = DICE.roll({ target: readTarget(), advantage: pools.adv.value, challenge: pools.chal.value });
      resetPools();
      await spin();
      showResult(r, true);
      lastRoll = r;
      store.set("lastRoll", JSON.stringify(r));
      renderPreview();
      await postToDiscord(r, styleKeys);
    } finally {
      rolling = false;
      buttons.forEach((b) => { b.loading = false; });
    }
  }

  $("roll").addEventListener("click", () => rollAndPost([currentStyle()]));
  $("roll-all").addEventListener("click", () => rollAndPost(Object.keys(STYLES)));

  // R rolls from anywhere on the Dice tab, except while typing or using a control.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "r" && e.key !== "R") return;
    if (e.ctrlKey || e.metaKey || e.altKey || tabs.active !== "dice") return;
    if (e.composedPath().some((n) => n.matches?.("input, textarea, wa-input, wa-textarea, [contenteditable]"))) return;
    e.preventDefault();
    rollAndPost([currentStyle()]);
  });

  customElements.whenDefined("wa-radio-group").then(renderPreview);
})();
