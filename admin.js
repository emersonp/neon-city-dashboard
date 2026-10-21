// The Administrator (GM): the Settings switch, what only they see, and their one connection to the overlay.
// - Anything marked data-admin in the page shows only while the switch is on (the gm class on <html>, styles.css).
// - The OBS link is opened when the switch goes on and closed when it goes off, and only on a computer with
//   obs-config.js. Every Administrator feature that talks to overlay.html shares it: send() to it, onOverlay() for
//   what the overlay says, onLink() for the connection's state. The messages are in overlay-rules.js.
// app.js calls setGm when the switch changes. Each feature is its own file (admin-overlay.js is the Overlay panel).
(function () {
  const { config, connect } = window.NCD_OBS_LINK;
  const { make, read } = window.NCD_OVERLAY;

  let gm = false;
  let link = null;
  // "off" (not the Administrator), "unconfigured" (no obs-config.js), or the link's own "connecting", "connected",
  // "disconnected" or "error"; detail says why for the last two.
  let state = { status: "off", detail: "" };
  const gmListeners = [], linkListeners = [], overlayListeners = [];

  function setState(status, detail = "") {
    state = { status, detail };
    linkListeners.forEach((fn) => fn(state));
  }

  function start() {
    if (link) return;
    if (!config) { setState("unconfigured"); return; }
    link = connect({
      onStatus(s, detail) {
        setState(s, detail);
        // ask the overlay what it's showing
        if (s === "connected") link.send(make("ping"));
      },
      onMessage(raw) {
        const msg = read(raw);
        if (msg) overlayListeners.forEach((fn) => fn(msg));
      },
    });
  }
  function stop() {
    link?.close();
    link = null;
    setState("off");
  }

  window.NCD_ADMIN = {
    get gm() { return gm; },
    setGm(on) {
      gm = Boolean(on);
      document.documentElement.classList.toggle("gm", gm);
      gm ? start() : stop();
      gmListeners.forEach((fn) => fn(gm));
    },
    // fn(on) now and whenever the switch changes
    onGm(fn) { gmListeners.push(fn); fn(gm); },
    // fn({ status, detail }) now and whenever the connection changes
    onLink(fn) { linkListeners.push(fn); fn(state); },
    // fn(msg) for each message from the overlay, already checked by overlay-rules.js
    onOverlay(fn) { overlayListeners.push(fn); },
    // Sends a message (overlay-rules.js) to the overlay. false when there's no connection to send through.
    send(type, fields) { return link?.send(make(type, fields)) ?? false; },
  };
})();
