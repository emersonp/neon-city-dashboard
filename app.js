// Page wiring: theme toggle, tabs, and the Dice tab's Discord style lab.
(function () {
  const { STYLES, COLORS, sampleRoll, send } = window.NCD_DISCORD;
  const ICONS = window.NCD_ICONS;
  const $ = (id) => document.getElementById(id);

  // localStorage can be missing or throw (private windows, blocked storage); never let that break the page.
  const store = {
    get(key, fallback = null) { try { return localStorage.getItem(`ncd.${key}`) ?? fallback; } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(`ncd.${key}`, value); } catch {} },
  };

  // A webhook saved from Settings (later) wins over the hardcoded one in config.js.
  const webhookUrl = () => store.get("webhook") || window.NCD_CONFIG?.webhookUrl || "";

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

  $("brand-icon").innerHTML = ICONS.svg("advantage-die");

  // ---- tabs ----
  const tabs = $("tabs");
  customElements.whenDefined("wa-tab-group").then(() => { tabs.active = store.get("tab", "dice"); });
  tabs.addEventListener("wa-tab-show", (e) => store.set("tab", e.detail.name));

  // ---- toasts ----
  const toast = (message, variant = "neutral") =>
    customElements.whenDefined("wa-toast").then(() => $("toast").create(message, { variant, duration: 4000 }));

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

  let preview = sampleRoll();
  const currentStyle = () => (STYLES[styleGroup.value] ? styleGroup.value : "markdown");
  const username = () => (customName.checked ? "Neon City Dashboard" : undefined);

  function renderPreview() {
    const style = STYLES[currentStyle()];
    const built = style.build(preview);
    const payload = { ...(username() && { username: username() }), ...built.payload };
    $("style-about").textContent = style.about;
    $("payload").textContent = JSON.stringify(payload, null, 2)
      + (built.image ? "\n\n// + result.png uploaded as an attachment" : "");
  }

  styleGroup.addEventListener("change", () => { store.set("style", currentStyle()); renderPreview(); });
  customName.addEventListener("change", () => { store.set("customName", customName.checked ? "1" : "0"); renderPreview(); });

  // Renders a game icon to a tinted PNG, since Discord can't show SVG and only accepts
  // images by public URL or upload. Works from file:// because nothing is fetched.
  const ICON_FOR = { crit: "boon", success: "advantage-die", failure: "challenge-die" };
  async function iconPng(outcome, size = 160) {
    const icon = ICONS.icons[ICON_FOR[outcome]];
    const color = "#" + COLORS[outcome].toString(16).padStart(6, "0");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}" width="${size}" height="${size}">`
      + `<style>.ink{fill:${color}}.paper{fill:#0d0c1a}.paper-stroke{stroke:#0d0c1a}</style>${icon.body}</svg>`;
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    canvas.getContext("2d").drawImage(img, 0, 0, size, size);
    return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  }

  async function post(styleKeys, button) {
    const url = webhookUrl();
    if (!url) { toast("No webhook set. Copy config.example.js to config.js and add one.", "danger"); return; }
    button.loading = true;
    const roll = preview;
    try {
      const image = await iconPng(roll.outcome).catch(() => null);
      for (const [i, key] of styleKeys.entries()) {
        if (i) await new Promise((r) => setTimeout(r, 700)); // stay well under Discord's rate limit
        await send(url, STYLES[key].build(roll), { username: username(), image });
      }
      toast(styleKeys.length > 1 ? `Sent ${styleKeys.length} styles to Discord.` : "Sent to Discord.", "success");
    } catch (err) {
      console.error(err);
      toast(err.message, "danger");
    } finally {
      button.loading = false;
      preview = sampleRoll(); // fresh numbers for next time
      renderPreview();
    }
  }

  $("roll").addEventListener("click", (e) => post([currentStyle()], e.currentTarget));
  $("roll-all").addEventListener("click", (e) => post(Object.keys(STYLES), e.currentTarget));

  customElements.whenDefined("wa-radio-group").then(renderPreview);
})();
