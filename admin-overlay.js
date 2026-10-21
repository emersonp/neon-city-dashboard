// The Administrator's Overlay and Ticker cards on the Dashboard tab: Heat, Group Influence, Day and the ticker on
// overlay.html. (Planning, in the Overlay card, is admin-planning.js.)
// It sends through admin.js's link and shows what the overlay reports (the overlay keeps the values).
(function () {
  const ADMIN = window.NCD_ADMIN;
  const { STATS, clampStat, tidyTicker } = window.NCD_OVERLAY;
  const { $, text } = window.NCD_UTIL;
  const panel = $("admin-panel");
  const statusEl = $("obs-status");

  const stats = Object.fromEntries(Object.keys(STATS).map((k) => [k, 0]));
  const rows = Object.fromEntries([...panel.querySelectorAll("[data-overlay-stat]")].map((row) => [row.dataset.overlayStat, row]));

  // Day 0 is the Broker phase.
  function render() {
    for (const k in STATS) rows[k].querySelector("[data-step-value]").textContent = k === "day" && stats[k] === 0 ? "Broker" : stats[k];
  }

  for (const k in STATS) {
    rows[k].addEventListener("click", (e) => {
      const step = Number(e.target.closest("[data-step]")?.dataset.step);
      if (!step) return;
      const value = clampStat(k, stats[k] + step);
      if (value === stats[k] || !ADMIN.send("stat", { key: k, value })) return;
      stats[k] = value;
      render();
    });
  }
  // Wipes the dice, total, verdict and Boons/Drawbacks off the overlay (also stops a roll mid-spin).
  $("clear-overlay").addEventListener("click", () => ADMIN.send("clearRoll"));

  // The ticker along the bottom of the camera: one box per item, run together on the overlay. There's always a blank
  // box at the end for the next item. Enter or Update sends them all; clearing a box takes its item down right away.
  const tickerList = $("ticker-items");
  const tickerBoxes = () => [...tickerList.querySelectorAll("wa-input")];
  const sendTicker = () => ADMIN.send("ticker", { items: tickerBoxes().map((box) => box.value) });

  function addTickerBox(value = "") {
    const box = document.createElement("wa-input");
    box.value = value;
    box.placeholder = "Add a ticker item";
    box.setAttribute("autocomplete", "off");
    box.setAttribute("with-clear", "");
    box.setAttribute("aria-label", "Ticker item");
    tickerList.append(box);
    return box;
  }
  function tidy() {
    const boxes = tickerBoxes();
    const { remove, addBlank } = tidyTicker(boxes.map((box) => text(box.value)), boxes.findIndex((box) => box.matches(":focus-within")));
    remove.forEach((i) => boxes[i].remove());
    if (addBlank) addTickerBox();
  }
  function showTicker(items) {
    tickerList.replaceChildren();
    items.forEach((item) => addTickerBox(item));
    tidy();
  }

  tickerList.addEventListener("input", tidy);
  tickerList.addEventListener("focusout", () => queueMicrotask(tidy));
  tickerList.addEventListener("keydown", (e) => { if (e.key === "Enter") sendTicker(); });
  tickerList.addEventListener("wa-clear", (e) => queueMicrotask(() => {
    if (e.target !== tickerBoxes().at(-1)) e.target.remove();
    tidy();
    sendTicker();
  }));
  $("ticker-send").addEventListener("click", sendTicker);
  tidy();

  // The buttons only work while the overlay can hear them. (admin-planning.js looks after Planning's.)
  const linkButtons = [...document.querySelectorAll("#admin-panel wa-button, #ticker-card wa-button")].filter((b) => !b.closest("#planning-edit"));
  ADMIN.onLink(({ status, detail }) => {
    linkButtons.forEach((b) => { b.disabled = status !== "connected"; });
    statusEl.textContent =
      status === "off" ? "" :
      status === "unconfigured" ? "Not set up for OBS: copy obs-config.example.js to obs-config.js and fill it in." :
      status === "connected" ? "Connected to OBS" :
      status === "connecting" ? statusEl.textContent || "Connecting to OBS…" :
      detail || "Disconnected, retrying…";
    statusEl.classList.toggle("ok", status === "connected");
  });

  ADMIN.onOverlay((msg) => {
    if (msg.type !== "overlayState") return;
    for (const k in STATS) if (msg[k] != null) stats[k] = msg[k];
    render();
    // show what's running, unless the Administrator is mid-edit
    if (msg.ticker && !tickerList.matches(":focus-within")) showTicker(msg.ticker);
  });

  render();
})();
