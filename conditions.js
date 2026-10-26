// Conditions: on anything that holds them (a "holder" with a conditions list): a character, a gear item, an enemy in
// a running scene, or the scene itself. The name and intrinsic never change once added; severity is 1-4, and 1 isn't
// shown. Suggestions are offered when adding one, by what it's going on.
// No page code here, so it can be tested in Node (conditions-ui.js is the chips and dialogs).
(function (root) {
  const MAX_SEVERITY = 4;
  const SUGGESTIONS = {
    character: ["Exhausted", "Memory Loss", "Debilitated", "Overloaded", "Poisoned", "Sickened", "Heavily Encumbered"],
    gear: ["Damaged", "Hard to Work On", "Not Quite Right", "Bulky", "Overclocked", "Overloaded"],
    enemy: ["Exhausted", "Shocked", "Sickened", "Poisoned", "Debilitated", "Corroding", "Swayed", "Enthralled", "Dulled Awareness"],
    scene: ["Obscured", "Dark", "Crowded", "Chaotic", "Burning", "Alarm Raised"],
  };
  const newId = () => (root.crypto?.randomUUID ? root.crypto.randomUUID() : `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`);
  const clampSeverity = (v) => {
    const n = v === "" || v == null || !Number.isFinite(Number(v)) ? 1 : Math.round(Number(v));
    return Math.max(1, Math.min(MAX_SEVERITY, n));
  };
  const conditionKey = (name) => String(name ?? "").trim().toLowerCase();
  // A holder's conditions, cleaned: junk and blank names dropped, each with an id.
  const conditions = (holder) => (Array.isArray(holder?.conditions) ? holder.conditions : [])
    .filter((x) => x && typeof x === "object" && String(x.name ?? "").trim())
    .map((x) => ({ id: x.id ?? newId(), name: String(x.name).trim(), severity: clampSeverity(x.severity), intrinsic: x.intrinsic === true }));
  const severityLabel = (severity) => (severity > 1 ? `x${severity}` : "");
  // Adding a name that's already there (ignoring case) worsens that one instead, as in the rulebook.
  function withCondition(holder, { name, severity = 1, intrinsic = false }) {
    const key = conditionKey(name);
    if (!key) return holder;
    const list = conditions(holder);
    const same = list.find((x) => conditionKey(x.name) === key);
    return { ...holder, conditions: same
      ? list.map((x) => (x === same ? { ...x, severity: clampSeverity(x.severity + clampSeverity(severity)) } : x))
      : [...list, { id: newId(), name: String(name).trim(), severity: clampSeverity(severity), intrinsic: intrinsic === true }] };
  }
  const withSeverity = (holder, id, severity) =>
    ({ ...holder, conditions: conditions(holder).map((x) => (x.id === id ? { ...x, severity: clampSeverity(severity) } : x)) });
  const withoutCondition = (holder, id) => ({ ...holder, conditions: conditions(holder).filter((x) => x.id !== id) });

  root.NCD_CONDITIONS = { MAX_SEVERITY, SUGGESTIONS, conditions, severityLabel, withCondition, withSeverity, withoutCondition };
})(globalThis);
