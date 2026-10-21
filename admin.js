// The Administrator's overlay panel on the Dice tab: Heat, Group Influence and Day on overlay.html, sent through OBS.
// Only the Administrator connects, and only on a computer with obs-config.js. app.js calls setGm when the Settings
// switch changes, and sendRoll for every roll so it plays on the overlay too.
(function () {
  const { config, connect } = window.NCD_OBS_LINK;
  const { $ } = window.NCD_UTIL;
  const panel = $("admin-panel");
  const statusEl = $("obs-status");

  // The overlay owns the values (it keeps them across OBS restarts); the panel mirrors what it reports.
  const STATS = { heat: { min: 0, max: 99 }, influence: { min: 0, max: 99 }, day: { min: 0, max: 10 } };
  const stats = { heat: 0, influence: 0, day: 0 };
  const rows = Object.fromEntries([...panel.querySelectorAll("[data-overlay-stat]")].map((row) => [row.dataset.overlayStat, row]));

  let link = null;
  // false when there's no connection to send through
  const send = (msg) => link?.send(msg) ?? false;

  function showStatus(message, ok = false) {
    statusEl.textContent = message;
    statusEl.classList.toggle("ok", ok);
  }
  // The buttons only work while the overlay can hear them.
  const setConnected = (on) => panel.querySelectorAll("wa-button").forEach((b) => { b.disabled = !on; });

  // Day 0 is the Broker phase.
  function render() {
    for (const k in STATS) rows[k].querySelector("[data-step-value]").textContent = k === "day" && stats[k] === 0 ? "Broker" : stats[k];
  }

  for (const k in STATS) {
    rows[k].addEventListener("click", (e) => {
      const step = Number(e.target.closest("[data-step]")?.dataset.step);
      if (!step) return;
      const value = Math.min(STATS[k].max, Math.max(STATS[k].min, stats[k] + step));
      if (value === stats[k] || !send({ type: "stat", key: k, value })) return;
      stats[k] = value;
      render();
    });
  }
  // Wipes the dice, total, verdict and Boons/Drawbacks off the overlay (also stops a roll mid-spin).
  $("clear-overlay").addEventListener("click", () => send({ type: "clearRoll" }));

  function start() {
    if (link) return;
    link = connect({
      onStatus(s, detail) {
        setConnected(s === "connected");
        showStatus(
          s === "connected" ? "Connected to OBS" :
          s === "connecting" ? statusEl.textContent || "Connecting to OBS…" :
          detail || "Disconnected, retrying…",
          s === "connected");
        // ask the overlay what it's showing
        if (s === "connected") link.send({ type: "ping" });
      },
      onMessage(msg) {
        if (msg.type !== "overlayState") return;
        for (const k in STATS) if (msg[k] != null) stats[k] = msg[k];
        render();
      },
    });
  }
  function stop() {
    link?.close();
    link = null;
    showStatus("");
  }

  setConnected(false);
  render();

  window.NCD_ADMIN = {
    setGm(on) {
      panel.hidden = !on;
      if (!config) showStatus("Not set up for OBS: copy obs-config.example.js to obs-config.js and fill it in.");
      else if (on) start();
      else stop();
    },
    // A roll from dice.js; plays on the overlay when connected, otherwise does nothing.
    sendRoll(r) {
      send({ type: "roll", tens: r.tens, ones: r.ones, target: r.target, adv: r.adv, chal: r.chal });
    },
  };
})();
