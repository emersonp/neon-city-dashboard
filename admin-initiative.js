// The Administrator's Initiative card on the Dashboard tab: whether a conflict scene is on, and whose turn it is
// (Hazard, Fast, Antagonists, Slow, round and round, counting the rounds). It sends through admin.js's link; the overlay
// keeps the state, shows it in its conflict layout, and reports it in overlayState. The Scene Runner's turn arrows
// (scene-runner.js) send the same message, so the two stay in step through what the overlay reports.
(function () {
  const ADMIN = window.NCD_ADMIN;
  const { PHASES, PHASE_NAMES, NO_CONFLICT, stepInitiative } = window.NCD_OVERLAY;
  const { $ } = window.NCD_UTIL;
  const toggle = $("conflict-scene");
  const cycle = $("initiative-cycle");
  const phaseEl = $("initiative-phase");
  const track = $("initiative-track");
  const roundEl = $("initiative-round");

  let connected = false;
  // what the overlay last reported
  let initiative = NO_CONFLICT;

  track.innerHTML = PHASES.map((p) => `<li data-phase="${p}">${PHASE_NAMES[p]}</li>`).join("");

  function render() {
    const { conflict, phase, round } = initiative;
    roundEl.textContent = `Round ${round}`;
    toggle.checked = conflict;
    toggle.disabled = !connected;
    cycle.hidden = !conflict;
    cycle.dataset.phase = phase;
    phaseEl.textContent = PHASE_NAMES[phase];
    track.querySelectorAll("li").forEach((li) => li.classList.toggle("on", li.dataset.phase === phase));
    cycle.querySelectorAll("wa-button").forEach((b) => { b.disabled = !connected; });
  }

  // Shows the change right away; if there's no link to send it through, it goes back.
  function change(next) {
    if (ADMIN.send("initiative", next)) initiative = next;
    render();
  }

  // A conflict scene starts on Hazard, round 1.
  toggle.addEventListener("change", () => change({ conflict: toggle.checked, phase: PHASES[0], round: 1 }));
  cycle.addEventListener("click", (e) => {
    const step = Number(e.target.closest("[data-phase-step]")?.dataset.phaseStep);
    if (step) change(stepInitiative(initiative, step));
  });

  ADMIN.onLink(({ status }) => {
    connected = status === "connected";
    render();
  });

  ADMIN.onOverlay((msg) => {
    if (msg.type !== "overlayState" || !msg.initiative) return;
    initiative = msg.initiative;
    render();
  });
})();
