// The Scene Runner's rules (scene-runner.js is its page code): the lists of enemies, objectives and hazards, the
// Administrator's own (custom) ones, scenes built from copies of them, reading an attack's numbers, and running a scene.
// No page code here, so it can be tested in Node.
//
// Lists. library(rulebook, custom) merges the rulebook's (enemies.js, tables.js's tagged objectives, hazards.js) and the
// custom ones into one list per kind, each item { id, kind, source ("rulebook" or "custom"), name, ... }:
//   enemy      { type, luck (none for a minion squad), text, attacks: [[name, text]], perks: [[name, text]],
//                page?, portrait?, network? }
//   objective  { text, difficulty, timing ("urgent", "timed" or null), tag?, page? }
//   hazard     { text, difficulty, hit, damage ("round", a number, or null), effect, page? }
(function (root) {
  const KINDS = ["enemy", "objective", "hazard"];
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Every entry in tables.js tagged "Objective · Difficulty N", wherever it is.
  function taggedObjectives(tables) {
    const found = [];
    const walk = (x) => {
      if (Array.isArray(x)) return x.forEach(walk);
      if (!x || typeof x !== "object") return;
      const m = /^Objective · Difficulty (\d+)$/.exec(x.tag ?? "");
      if (m && x.name) found.push({ name: x.name, text: x.text ?? "", difficulty: Number(m[1]), timing: null, tag: x.tag });
      if (x.entries) walk(x.entries);
    };
    Object.values(tables ?? {}).forEach(walk);
    return found;
  }

  function library(rulebook, custom) {
    const mark = (kind, list) => list.map((item) => ({ ...item, id: `rulebook:${kind}:${slug(item.name)}`, kind, source: "rulebook" }));
    const own = (kind, list) => (list ?? []).map((item) => ({ ...item, kind, source: "custom" }));
    return {
      enemies: [...mark("enemy", rulebook.enemies), ...own("enemy", custom?.enemies)],
      objectives: [...mark("objective", taggedObjectives(rulebook.tables)), ...own("objective", custom?.objectives)],
      hazards: [...mark("hazard", rulebook.hazards), ...own("hazard", custom?.hazards)],
    };
  }

  // ---- cleaning: anything read back from storage or an import file goes through these ----
  const ENEMY_TYPES = root.NCD_ENEMIES?.TYPES ?? ["Minion squad", "Antagonist", "Minor villain", "Major villain"];
  const TIMINGS = ["urgent", "timed"];
  const DEFAULTS = { luck: 50, difficulty: root.NCD_HAZARDS?.DEFAULT_DIFFICULTY ?? 50, hit: root.NCD_HAZARDS?.DEFAULT_HIT ?? 50 };
  const str = (v) => (typeof v === "string" || typeof v === "number" ? String(v).trim() : "");
  // A whole number from min to max; fallback if it isn't one.
  const whole = (v, min, max, fallback) => {
    const n = Number(v);
    if (v === "" || v == null || !Number.isFinite(n)) return fallback;
    return Number.isInteger(n) && n >= min ? Math.min(max, n) : fallback;
  };
  // [[name, text]] with both filled in.
  const pairs = (list) => (Array.isArray(list) ? list : [])
    .filter(Array.isArray).map(([n, t]) => [str(n), str(t)]).filter(([n, t]) => n && t);
  const timing = (v) => (TIMINGS.includes(v) ? v : null);
  // "round" (10 × the round), a whole number above 0, or null for none. Anything else is the default, "round".
  const damage = (v) => (v === null ? null : v === "round" ? "round" : whole(v, 1, 9999, "round"));

  const FIELDS = {
    enemy(raw) {
      const type = ENEMY_TYPES.includes(raw.type) ? raw.type : "Antagonist";
      return {
        name: str(raw.name), type,
        ...(type !== "Minion squad" && { luck: whole(raw.luck, 1, 9999, DEFAULTS.luck) }),
        text: str(raw.text), attacks: pairs(raw.attacks), perks: pairs(raw.perks),
      };
    },
    objective: (raw) => ({ name: str(raw.name), text: str(raw.text), difficulty: whole(raw.difficulty, 1, 9999, DEFAULTS.difficulty), timing: timing(raw.timing) }),
    hazard: (raw) => ({
      name: str(raw.name), text: str(raw.text), difficulty: whole(raw.difficulty, 1, 9999, DEFAULTS.difficulty),
      hit: whole(raw.hit, 1, 100, DEFAULTS.hit),
      damage: damage(raw.damage), effect: str(raw.effect),
    }),
  };

  // A custom enemy, objective or hazard, cleaned to its kind's fields; null without an id or a name.
  function cleanCustom(kind, raw) {
    if (!FIELDS[kind] || !raw || typeof raw !== "object" || !str(raw.id)) return null;
    const item = { id: str(raw.id), ...FIELDS[kind](raw) };
    return item.name ? item : null;
  }

  // ---- copies: a scene's elements ----
  // An element is a copy of a list item taken when it's added: { id, kind, from (the item's id), name, def (the item as
  // it was then) }, plus what a copy may change: an enemy's name and, for a minion squad, size; an objective's or
  // hazard's name, difficulty and timing ("urgent", "timed" or null).
  const SQUAD_SIZE = 5;
  const isSquad = (def) => def?.type === "Minion squad";
  const isVillain = (def) => def?.type === "Minor villain" || def?.type === "Major villain";

  // The parts of an element a copy may change, cleaned, from changes over what it has now (or its definition's).
  function copyFields(kind, def, current, changes = {}) {
    const name = str(changes.name) || current.name || def.name;
    if (kind === "enemy") return { name, ...(isSquad(def) && { size: whole(changes.size, 0, 999, current.size ?? SQUAD_SIZE) }) };
    return {
      name,
      difficulty: whole(changes.difficulty, 1, 9999, current.difficulty ?? def.difficulty),
      timing: "timing" in changes ? timing(changes.timing) : current.timing ?? def.timing ?? null,
    };
  }

  // A copy of a list item (from library()) as an element with this id, with changes to what a copy may change.
  function copy(item, id, changes = {}) {
    const { id: from, kind, source, ...def } = structuredClone(item);
    return { id, kind, from, def, ...copyFields(kind, def, {}, changes) };
  }

  // A copy's definition, cleaned like a custom item's, keeping what only the rulebook's have (its page, portrait, tag,
  // and whether it's a Network threat).
  function cleanDef(kind, raw) {
    if (!FIELDS[kind] || !raw || typeof raw !== "object") return null;
    const def = FIELDS[kind](raw);
    if (!def.name) return null;
    if (whole(raw.page, 1, 9999, null)) def.page = whole(raw.page, 1, 9999, null);
    if (kind === "enemy" && str(raw.portrait)) def.portrait = str(raw.portrait);
    if (kind === "enemy" && raw.network === true) def.network = true;
    if (kind === "objective" && str(raw.tag)) def.tag = str(raw.tag);
    return def;
  }

  // An element read back from storage, or null if it can't be used.
  function cleanElement(raw) {
    if (!raw || typeof raw !== "object" || !KINDS.includes(raw.kind) || !str(raw.id)) return null;
    const def = cleanDef(raw.kind, raw.def);
    return def && { id: str(raw.id), kind: raw.kind, from: str(raw.from), def, ...copyFields(raw.kind, def, {}, raw) };
  }

  // ---- scenes: { id, name, mode ("legwork" or "conflict"), notes, elements (in order), mainGoal (an element's id, or
  // null) }. Everything other than the Main Goal is an obstacle. ----
  const MODES = ["legwork", "conflict"];
  const newScene = (id) => ({ id, name: "", mode: "legwork", notes: "", elements: [], mainGoal: null });
  const addElement = (scene, element) => ({ ...scene, elements: [...scene.elements, element] });
  const removeElement = (scene, id) => ({
    ...scene, elements: scene.elements.filter((e) => e.id !== id), mainGoal: scene.mainGoal === id ? null : scene.mainGoal,
  });
  // Changes what a copy may change (copyFields); anything else in changes is ignored.
  const changeElement = (scene, id, changes) => ({
    ...scene, elements: scene.elements.map((e) => (e.id === id ? { ...e, ...copyFields(e.kind, e.def, e, changes) } : e)),
  });
  // The Main Goal is one of the scene's elements, or none (null); an id that isn't one changes nothing.
  const setMainGoal = (scene, id) => (id === null || scene.elements.some((e) => e.id === id) ? { ...scene, mainGoal: id } : scene);
  // name, or name with the first number from 2 that no element in the scene has yet ("Vex 2").
  function freeName(scene, name) {
    const taken = new Set(scene.elements.map((e) => e.name));
    if (!taken.has(name)) return name;
    let n = 2;
    while (taken.has(`${name} ${n}`)) n++;
    return `${name} ${n}`;
  }
  // What stops a scene being saved, as sentences to show; none for a good one.
  function sceneProblems(scene) {
    const problems = [];
    if (!str(scene.name)) problems.push("Give the scene a name.");
    if (scene.mainGoal != null && !scene.elements.some((e) => e.id === scene.mainGoal)) problems.push("The Main Goal isn't one of the scene's elements.");
    return problems;
  }
  // A scene read back from storage or an import file: unusable elements dropped, and a Main Goal that isn't one of the
  // rest is none. null without an id.
  function cleanScene(raw) {
    if (!raw || typeof raw !== "object" || !str(raw.id)) return null;
    const elements = (Array.isArray(raw.elements) ? raw.elements : []).map(cleanElement).filter(Boolean);
    return {
      id: str(raw.id), name: str(raw.name), mode: MODES.includes(raw.mode) ? raw.mode : "legwork", notes: str(raw.notes),
      elements, mainGoal: elements.some((e) => e.id === raw.mainGoal) ? raw.mainGoal : null,
    };
  }

  // ---- attacks: the rulebook writes them "75%; 45 physical damage; ..." ----
  // { hit, damage, type } read from an attack's text: hit is its % chance, damage what a hit deals now (null if the text
  // doesn't say) and type "physical", "mental", "digital" or null. Damage can be fixed ("45 physical damage"), from a
  // squad's size ("damage equal to 5 + (the squad's size x5)"), or 10 × the round ("damage equal to 10 × the round").
  // null when the text has no hit chance it can read: then it's a plain percentile roll.
  const TYPE = "(?:(physical|mental|digital) )?";
  const DAMAGE = [
    [new RegExp(`^${TYPE}damage equal to (?:(\\d+) \\+ )?\\(?the squad's size x(\\d+)\\)?`, "i"),
      (m, { size }) => Number(m[2] ?? 0) + size * Number(m[3])],
    [new RegExp(`^${TYPE}damage equal to 10 [×x] (?:the )?(?:number of )?rounds?`, "i"), (m, { round }) => 10 * round],
    [new RegExp(`^10 [×x] (?:the )?rounds? ${TYPE}damage`, "i"), (m, { round }) => 10 * round],
    [new RegExp(`^(\\d+) ${TYPE}damage`, "i"), (m) => Number(m[1]), 2],
  ];
  function readAttack(text, { size = 0, round = 1 } = {}) {
    const m = /^\s*(\d{1,3})%\s*[;,]?\s*(.*)$/s.exec(String(text ?? ""));
    const hit = m && Number(m[1]);
    if (!hit || hit > 100) return null;
    for (const [re, amount, typeAt = 1] of DAMAGE) {
      const d = re.exec(m[2]);
      if (d) return { hit, damage: amount(d, { size, round }), type: d[typeAt]?.toLowerCase() ?? null };
    }
    return { hit, damage: null, type: null };
  }

  // ---- running a scene: apply(state, action) → state ----
  // The run state is { sceneId, name, mode, notes, mainGoal, elements (copied from the saved scene when the run
  // starts, plus any added during it), track: { [element id]: tracking }, initiative: { conflict, phase, round },
  // notices }. An element's tracking is { luck (null without), size (a squad's, else null), wounds, defeated, progress,
  // dealt (marked Dealt with by hand), deteriorating (0 to 4), irreparable, progressed (this round) }.
  // notices are what the last round's start did to objectives: [{ id, deteriorating }] or [{ id, irreparable: true }].
  const OVERLAY = () => root.NCD_OVERLAY;
  const MAX_DETERIORATING = 4;

  const newTrack = (e) => ({
    luck: e.kind === "enemy" && !isSquad(e.def) ? e.def.luck : null,
    size: e.kind === "enemy" && isSquad(e.def) ? e.size : null,
    wounds: 0, defeated: false, progress: 0, dealt: false, deteriorating: 0, irreparable: false, progressed: false,
  });
  const startInitiative = (conflict) => ({ ...OVERLAY().NO_CONFLICT, conflict });
  const element = (state, id) => state.elements.find((e) => e.id === id);
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  // Changes one element's tracking with fn(tracking, element), for an element that's in the run.
  function retrack(state, id, fn) {
    const e = element(state, id);
    return e ? { ...state, track: { ...state.track, [id]: { ...state.track[id], ...fn(state.track[id], e) } } } : state;
  }

  // The start of a new round: each Timed objective, and each Urgent one that wasn't progressed in the round before,
  // gains or worsens Deteriorating, or past ×4 becomes Irreparable; one that's dealt with or already Irreparable is
  // left alone. Then nothing has been progressed this round yet.
  function newRound(state) {
    const notices = [];
    const track = Object.fromEntries(state.elements.map((e) => {
      const t = state.track[e.id];
      const worsens = e.kind !== "enemy" && !t.irreparable && !dealtWith(state, e.id)
        && (e.timing === "timed" || (e.timing === "urgent" && !t.progressed));
      if (!worsens) return [e.id, { ...t, progressed: false }];
      const irreparable = t.deteriorating >= MAX_DETERIORATING;
      const deteriorating = irreparable ? t.deteriorating : t.deteriorating + 1;
      notices.push(irreparable ? { id: e.id, irreparable: true } : { id: e.id, deteriorating });
      return [e.id, { ...t, deteriorating, irreparable, progressed: false }];
    }));
    return { ...state, track, notices };
  }
  // The initiative as it is now (from a step here, or what the overlay reports): each round it's gone on starts anew.
  function toInitiative(state, initiative) {
    const next = OVERLAY().cleanInitiative(initiative);
    let out = { ...state, initiative: next, notices: [] };
    for (let r = state.initiative.round; r < next.round; r++) out = { ...newRound(out), initiative: next };
    return out;
  }

  const ACTIONS = {
    start(state, { scene }) {
      const elements = structuredClone(scene.elements);
      return {
        sceneId: scene.id, name: scene.name, mode: scene.mode, notes: scene.notes, mainGoal: scene.mainGoal, elements,
        track: Object.fromEntries(elements.map((e) => [e.id, newTrack(e)])),
        initiative: startInitiative(scene.mode === "conflict"), notices: [],
      };
    },
    luck: (state, { id, delta }) => retrack(state, id, (t, e) => (t.luck == null ? {} : { luck: clamp(t.luck + delta, 0, e.def.luck) })),
    size: (state, { id, size }) => retrack(state, id, (t) => (t.size == null ? {} : { size: Math.max(0, Math.round(size) || 0) })),
    wounds: (state, { id, delta }) => retrack(state, id, (t, e) => (isVillain(e.def) ? { wounds: Math.max(0, t.wounds + delta) } : {})),
    defeated: (state, { id }) => retrack(state, id, (t, e) => (isVillain(e.def) ? { defeated: !t.defeated } : {})),
    // An irreparable objective takes no more progress.
    progress: (state, { id, delta }) => retrack(state, id, (t, e) => (e.kind === "enemy" || t.irreparable ? {}
      : { progress: clamp(t.progress + delta, 0, e.difficulty), progressed: t.progressed || delta > 0 })),
    dealt: (state, { id }) => retrack(state, id, (t) => ({ dealt: !t.dealt })),
    // A turn on (step 1) or back (-1), when the Runner keeps the initiative itself (no OBS)...
    step: (state, { step }) => toInitiative(state, OVERLAY().stepInitiative(state.initiative, step)),
    // ...or what the overlay says it is, when it does.
    initiative: (state, { initiative }) => toInitiative(state, initiative),
    // A Legwork scene escalating: initiative on, at Hazard, round 1.
    conflict: (state) => ({ ...state, initiative: startInitiative(true), notices: [] }),
    // A copy added to this run only (an id already in it changes nothing).
    add: (state, { element: e }) => (element(state, e.id) ? state
      : { ...state, elements: [...state.elements, structuredClone(e)], track: { ...state.track, [e.id]: newTrack(e) } }),
    end: () => null,
  };

  // The run state after an action (see ACTIONS); null is no run. An action it doesn't know changes nothing.
  function apply(state, action) {
    const fn = ACTIONS[action?.type];
    if (!fn || (!state && action.type !== "start")) return state;
    return fn(state, action);
  }

  // ---- what the run state says ----
  // Whether an element is dealt with: marked by hand, or its progress full, or its luck or squad size down to 0.
  function dealtWith(state, id) {
    const e = element(state, id), t = state.track[id];
    if (!e) return false;
    return t.dealt || (e.kind === "enemy" ? t.luck === 0 || t.size === 0 : t.progress >= e.difficulty);
  }
  // Out of the way: dealt with, or a villain defeated.
  const done = (state, id) => dealtWith(state, id) || Boolean(state.track[id]?.defeated);
  // How many obstacles (everything but the Main Goal) are still in the way.
  const obstaclesLeft = (state) => state.elements.filter((e) => e.id !== state.mainGoal && !done(state, e.id)).length;

  // Whose turn it is in the scene, as element ids: the hazards on the Hazard turn, the enemies on the Antagonists turn.
  function highlighted(state) {
    const { conflict, phase } = state.initiative;
    const kind = conflict && { hazard: "hazard", antagonists: "enemy" }[phase];
    return kind ? state.elements.filter((e) => e.kind === kind).map((e) => e.id) : [];
  }

  // What each of an element's rolls is, now: [{ label ("Vex — Shock Pistol"), name, hit, damage, type, text }]. An
  // enemy has one per attack (hit null for one it can't read: a plain percentile roll), a hazard one ("Hazard"), and an
  // objective none.
  function attacks(state, id) {
    const e = element(state, id);
    if (!e || e.kind === "objective") return [];
    const label = (name) => `${e.name} — ${name}`;
    const { round } = state.initiative;
    if (e.kind === "hazard") {
      const { hit, damage: d } = e.def;
      const text = `${hit}%; ${root.NCD_HAZARDS?.damageLabel(d) ?? ""}`;
      return [{ label: label("Hazard"), name: "Hazard", hit, damage: d === "round" ? 10 * round : d, type: null, text }];
    }
    return e.def.attacks.map(([name, text]) => ({
      label: label(name), name, ...(readAttack(text, { size: state.track[id].size ?? 0, round }) ?? { hit: null, damage: null, type: null }), text,
    }));
  }

  // A run state read back from storage, or null if it can't be used.
  function cleanRun(raw) {
    if (!raw || typeof raw !== "object" || !str(raw.sceneId)) return null;
    const elements = (Array.isArray(raw.elements) ? raw.elements : []).map(cleanElement).filter(Boolean);
    const count = (v, max = 99999) => whole(v, 0, max, 0);
    const track = Object.fromEntries(elements.map((e) => {
      const fresh = newTrack(e), t = raw.track?.[e.id] ?? {};
      return [e.id, {
        luck: fresh.luck == null ? null : clamp(whole(t.luck, 0, 99999, fresh.luck), 0, e.def.luck),
        size: fresh.size == null ? null : whole(t.size, 0, 999, fresh.size),
        wounds: count(t.wounds), defeated: t.defeated === true, progress: clamp(count(t.progress), 0, e.difficulty ?? 0),
        dealt: t.dealt === true, deteriorating: count(t.deteriorating, MAX_DETERIORATING),
        irreparable: t.irreparable === true, progressed: t.progressed === true,
      }];
    }));
    const ids = new Set(elements.map((e) => e.id));
    const notices = (Array.isArray(raw.notices) ? raw.notices : []).filter((n) => ids.has(n?.id))
      .map((n) => (n.irreparable === true ? { id: n.id, irreparable: true } : { id: n.id, deteriorating: count(n.deteriorating, MAX_DETERIORATING) }));
    return {
      sceneId: str(raw.sceneId), name: str(raw.name), mode: MODES.includes(raw.mode) ? raw.mode : "legwork", notes: str(raw.notes),
      mainGoal: ids.has(raw.mainGoal) ? raw.mainGoal : null, elements, track,
      initiative: OVERLAY().cleanInitiative(raw.initiative), notices,
    };
  }

  // ---- storage (pass in localStorage, or anything with getItem/setItem/removeItem), under the app's "ncd." ----
  // Missing, broken or throwing storage loads as nothing saved, and saving to it does nothing.
  const KEYS = { custom: "ncd.sceneCustom", scenes: "ncd.scenes", open: "ncd.sceneOpen" };
  const read = (storage, key) => { try { return JSON.parse(storage?.getItem(key) ?? "null"); } catch { return null; } };
  const write = (storage, key, value) => {
    try { value == null ? storage?.removeItem(key) : storage?.setItem(key, JSON.stringify(value)); } catch {}
  };
  const listOf = (v) => (Array.isArray(v) ? v : []);
  const KIND_LISTS = { enemy: "enemies", objective: "objectives", hazard: "hazards" };
  // { enemies, objectives, hazards }, each cleaned.
  const cleanCustomLists = (raw) => Object.fromEntries(KINDS.map((kind) =>
    [KIND_LISTS[kind], listOf(raw?.[KIND_LISTS[kind]]).map((item) => cleanCustom(kind, item)).filter(Boolean)]));
  const cleanScenes = (raw) => listOf(raw).map(cleanScene).filter(Boolean);
  // The open scene: being built ({ mode: "build", scene }), running ({ mode: "run", run }), or neither (null).
  function cleanOpen(raw) {
    if (raw?.mode === "build") { const scene = cleanScene(raw.scene); return scene && { mode: "build", scene }; }
    if (raw?.mode === "run") { const state = cleanRun(raw.run); return state && { mode: "run", run: state }; }
    return null;
  }
  const loadCustom = (storage) => cleanCustomLists(read(storage, KEYS.custom));
  const saveCustom = (storage, custom) => write(storage, KEYS.custom, custom);
  const loadScenes = (storage) => cleanScenes(read(storage, KEYS.scenes));
  const saveScenes = (storage, scenes) => write(storage, KEYS.scenes, scenes);
  const loadOpen = (storage) => cleanOpen(read(storage, KEYS.open));
  const saveOpen = (storage, open) => write(storage, KEYS.open, open);

  // ---- Export and Import: all the custom items and scenes as one JSON document ----
  const EXPORT_VERSION = 1;
  const exportDoc = (custom, scenes) => ({ format: "neon-city-scenes", version: EXPORT_VERSION, custom, scenes });
  // { custom, scenes } from an exported document (or its JSON text), cleaned, or { error } saying why it can't be used.
  function importDoc(doc) {
    let raw = doc;
    if (typeof doc === "string") {
      try { raw = JSON.parse(doc); } catch { return { error: "That file isn't JSON." }; }
    }
    if (!raw || typeof raw !== "object" || Array.isArray(raw) || raw.format !== "neon-city-scenes") {
      return { error: "That file isn't a Scene Runner export." };
    }
    if (raw.version !== EXPORT_VERSION) return { error: `That file is version ${raw.version}; this page reads version ${EXPORT_VERSION}.` };
    if (!raw.custom || typeof raw.custom !== "object" || !Array.isArray(raw.scenes)) return { error: "That file is missing its custom items or scenes." };
    return { custom: cleanCustomLists(raw.custom), scenes: cleanScenes(raw.scenes) };
  }

  root.NCD_SCENES = {
    KINDS, SQUAD_SIZE, MODES, library, cleanCustom, copy, isSquad, isVillain,
    newScene, addElement, removeElement, changeElement, setMainGoal, freeName, sceneProblems, cleanScene,
    readAttack, apply, dealtWith, done, obstaclesLeft, highlighted, attacks,
    loadCustom, saveCustom, loadScenes, saveScenes, loadOpen, saveOpen, exportDoc, importDoc,
  };
})(globalThis);
