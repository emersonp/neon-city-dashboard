// The Planning part of the Administrator's Overlay card on the Dashboard tab: a countdown that takes over the overlay's panel.
// It sends through admin.js's link; the overlay keeps the countdown and reports it in overlayState.
(function () {
  const ADMIN = window.NCD_ADMIN;
  const { planningLeft, fmtClock } = window.NCD_OVERLAY;
  const { $ } = window.NCD_UTIL;
  const card = $("planning-edit");
  const clockEl = $("planning-clock");
  const startEl = $("planning-start");
  const controlsEl = $("planning-controls");

  let connected = false;
  // what the overlay last reported, as { running, left, at } (at is when it arrived), or null when none is on
  let planning = null;
  let timer = null;

  function render() {
    clearInterval(timer);
    startEl.hidden = Boolean(planning);
    controlsEl.hidden = !planning;
    card.querySelectorAll("wa-button").forEach((b) => {
      const action = b.dataset.planning;
      b.disabled = !connected || (action === "play" && planning?.running) || (action === "pause" && !planning?.running);
    });
    const tick = () => { clockEl.textContent = planning ? fmtClock(planningLeft(planning, Date.now())) : ""; };
    tick();
    if (planning?.running) timer = setInterval(tick, 250);
  }

  card.addEventListener("click", (e) => {
    const button = e.target.closest("wa-button");
    if (!button) return;
    if (button.dataset.planningStart) ADMIN.send("planning", { action: "start", seconds: Number(button.dataset.planningStart) });
    else if (button.dataset.planning === "add") ADMIN.send("planning", { action: "add", seconds: 30 });
    else if (button.dataset.planning) ADMIN.send("planning", { action: button.dataset.planning });
  });

  ADMIN.onLink(({ status }) => {
    connected = status === "connected";
    render();
  });

  // When a countdown ends (time's up or Stop), the overlay clears its roll, and the Dice tab's goes too.
  ADMIN.onOverlay((msg) => {
    if (msg.type !== "overlayState") return;
    const ended = planning && !msg.planning;
    planning = msg.planning && { ...msg.planning, at: Date.now() };
    render();
    if (ended) window.NCD_APP.clearResult();
  });
})();
