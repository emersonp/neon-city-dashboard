// What the dashboard and overlay.html say to each other through OBS, and the rules both sides share: each stat's
// limits and how ticker items are cleaned. No page code here, so it can be tested in Node.
//
// Messages (each is { type, ...fields }):
// stat          { key, value }                    dashboard → overlay: set Heat, Group Influence or Day
// roll          { tens, ones, target, adv, chal } dashboard → overlay: play a roll (dice.js's result)
// clearRoll     {}                                dashboard → overlay: wipe the roll off
// ticker        { items }                         dashboard → overlay: the ticker's items, in order
// planning      { action, seconds }               dashboard → overlay: start, pause, play, stop or add to the countdown
// ping          {}                                dashboard → overlay: ask what it's showing
// overlayState  { heat, influence, day, ticker,   overlay → dashboard: what it's showing (on connect, on ping, and
//                 planning }                        whenever the countdown changes)
//
// make() builds a message to send and read() checks one that arrived; both clean the fields, so a value out of
// range or of the wrong kind never gets through. read() returns null for anything it doesn't know.
(function (root) {
  // Day 0 is the Broker phase.
  const STATS = {
    heat:      { min: 0, max: 99 },
    influence: { min: 0, max: 99 },
    day:       { min: 0, max: 10 },
  };

  // A stat's value as a whole number within its limits; null for a key that isn't a stat.
  function clampStat(key, value) {
    if (!Object.hasOwn(STATS, key)) return null;
    const { min, max } = STATS[key];
    return Math.min(max, Math.max(min, Math.round(Number(value) || 0)));
  }

  // Ticker items as trimmed text, blanks dropped. A single item may come as a string.
  const cleanTicker = (items) => (Array.isArray(items) ? items : [items]).map((t) => String(t ?? "").trim()).filter(Boolean);

  // The dashboard's ticker boxes: blank ones go (except the one being typed in), and there's always one blank box at
  // the end for the next item. values are the boxes' text in order; focused is the index of the box being typed in
  // (or -1). Returns the indexes of boxes to remove and whether to add a blank box at the end.
  function tidyTicker(values, focused = -1) {
    const blank = (v) => !String(v ?? "").trim();
    const remove = values.slice(0, -1).flatMap((v, i) => (blank(v) && i !== focused ? [i] : []));
    return { remove, addBlank: !values.length || !blank(values.at(-1)) };
  }

  // ---- Planning: a countdown (15:00, 3:00 or 0:30) that takes over the overlay's panel ----
  // The overlay keeps it as { running, left, at }: left is the ms remaining as of the time at. It reports
  // { running, left } as of now, and null when no countdown is on.
  const PLANNING_ACTIONS = ["start", "pause", "play", "stop", "add"];
  const PLANNING_MAX = (99 * 60 + 59) * 1000;
  const clampMs = (ms) => Math.min(PLANNING_MAX, Math.max(0, Math.round(Number(ms) || 0)));

  const planningLeft = (state, now) => (!state ? 0 : state.running ? clampMs(state.left - (now - state.at)) : state.left);

  // What the countdown is after an action, as of now. seconds is for start and add.
  function planningStep(state, { action, seconds = 0 }, now) {
    const left = planningLeft(state, now);
    const ms = clampMs(seconds * 1000);
    if (action === "start") return ms ? { running: true, left: ms, at: now } : state;
    if (action === "stop") return null;
    if (!state) return null;
    if (action === "pause") return { running: false, left, at: now };
    if (action === "play") return { running: true, left, at: now };
    if (action === "add") return { running: state.running, left: clampMs(left + ms), at: now };
    return state;
  }

  // A countdown kept from before (in storage, say), or null if it's not one or it has already run out.
  function cleanPlanning(state, now) {
    if (!state || typeof state !== "object" || !Number.isFinite(state.left) || !Number.isFinite(state.at)) return null;
    const clean = { running: Boolean(state.running), left: clampMs(state.left), at: state.at };
    return planningLeft(clean, now) ? clean : null;
  }

  // "MM:SS", counting whole seconds up (so 14:59.4 left shows 15:00, and 00:00 is the moment it runs out).
  function fmtClock(ms) {
    const s = Math.ceil(clampMs(ms) / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }

  const digit = (n) => Number.isInteger(n) && n >= 0 && n <= 9;
  const bools = (a) => (Array.isArray(a) ? a.map(Boolean) : []);

  // Each type's fields, cleaned; null when the message can't be used.
  const FIELDS = {
    stat: ({ key, value }) => (Object.hasOwn(STATS, key) ? { key, value: clampStat(key, value) } : null),
    roll: ({ tens, ones, target, adv, chal }) => (digit(tens) && digit(ones)
      ? { tens, ones, target: target == null ? null : Number(target), adv: bools(adv), chal: bools(chal) }
      : null),
    clearRoll: () => ({}),
    ticker: ({ items }) => ({ items: cleanTicker(items) }),
    planning: ({ action, seconds }) => (PLANNING_ACTIONS.includes(action)
      ? { action, seconds: clampMs(seconds * 1000) / 1000 }
      : null),
    ping: () => ({}),
    // stats it doesn't report stay null; so does the ticker. planning is null when no countdown is on.
    overlayState: (m) => ({
      ...Object.fromEntries(Object.keys(STATS).map((k) => [k, m[k] == null ? null : clampStat(k, m[k])])),
      ticker: Array.isArray(m.ticker) ? cleanTicker(m.ticker) : null,
      planning: m.planning && typeof m.planning === "object"
        ? { running: Boolean(m.planning.running), left: clampMs(m.planning.left) }
        : null,
    }),
  };

  function read(msg) {
    if (!msg || typeof msg !== "object" || !Object.hasOwn(FIELDS, msg.type)) return null;
    const fields = FIELDS[msg.type](msg);
    return fields && { type: msg.type, ...fields };
  }

  // Throws for an unknown type or unusable fields: that's a mistake in the sending page, not something to send.
  function make(type, fields = {}) {
    const msg = read({ ...fields, type });
    if (!msg) throw new Error(`Not an overlay message: ${type}`);
    return msg;
  }

  root.NCD_OVERLAY = {
    STATS, clampStat, cleanTicker, tidyTicker,
    PLANNING_MAX, planningLeft, planningStep, cleanPlanning, fmtClock,
    make, read,
  };
})(globalThis);
