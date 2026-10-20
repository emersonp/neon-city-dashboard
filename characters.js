// Characters: rulebook lists, random handles and names, and saving to localStorage.
// No page code here, so it can be tested in Node.
(function (root) {
  const ARCHETYPES = ["Assassin", "Bruiser", "Doc", "Gearhead", "Grifter", "Hacker", "Mastermind", "Merc", "Operator", "Thief"];
  const ORIGINS = ["Cybernetic", "Gene-Spliced", "Psionic", "Synthetic"];
  const KEY = "ncd.characters";

  // ---- skills (from the character sheet: mental, physical, and the two initiatives) ----
  const slug = (name) => name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
  const MENTAL = ["Analyze Data", "Case the Joint", "Convince Someone", "Cover Your Tracks", "Crash a System",
    "Distract Someone", "Fix or Modify Something", "Goad Someone", "Gossip with Citizens", "Gossip with Corporates",
    "Gossip with Criminals", "Heal Someone", "Infiltrate a System", "Intimidate Someone", "Lie to Someone",
    "Override a System", "Play a Game", "Read the Situation", "Size Someone Up", "Throw Money at the Problem"];
  const PHYSICAL = ["Break or Destroy Something", "Climb, Jump, or Tumble", "Conceal an Object", "Drive or Pilot Something",
    "Lift or Move Something", "Run Like Hell", "Shoot Someone", "Slash, Stab, or Strike Someone", "Sneak Around",
    "Throw Something", "Tough It Out"];
  const INITIATIVE = ["Initiative in the World", "Initiative in the Network"];
  const SKILLS = [
    ...MENTAL.map((name) => ({ id: slug(name), name, type: "mental" })),
    ...PHYSICAL.map((name) => ({ id: slug(name), name, type: "physical" })),
    ...INITIATIVE.map((name) => ({ id: slug(name), name, type: "initiative" })),
  ];
  const UNTRAINED = 50;              // what a null skill (and "Anything else") rolls at
  const MIN_VALUE = 55, MAX_VALUE = 95, STEP = 5;

  // Numbers typed into the sheet: whole numbers, kept between min and max; blanks and junk become the fallback.
  const toInt = (v) => (v === "" || v == null || !Number.isFinite(Number(v)) ? null : Math.round(Number(v)));
  const clampInt = (v, { min = 0, max = Infinity, fallback = min } = {}) => Math.max(min, Math.min(max, toInt(v) ?? fallback));

  // The sheet gives a skill at most 2 of each intrinsic die (rolling pools still go to 4).
  const MAX_INTRINSIC = 2;
  const clampIntrinsic = (n) => clampInt(n, { max: MAX_INTRINSIC, fallback: 0 });

  // A skill's stored state: value is null (untrained) or 55-95; adv/chal are intrinsic dice, 0-2.
  function skill(character, id) {
    const s = character?.skills?.[id] ?? {};
    return { value: s.value ?? null, adv: clampIntrinsic(s.adv), chal: clampIntrinsic(s.chal) };
  }
  const shownValue = (value) => value ?? UNTRAINED;
  const isNotable = (s) => s.value != null || s.adv > 0 || s.chal > 0;

  const clampValue = (v) => (toInt(v) == null ? null : clampInt(v, { min: MIN_VALUE, max: MAX_VALUE }));
  const increment = (value) => Math.min(MAX_VALUE, value + STEP);

  // Returns a copy of the character with one skill changed. Skills back at the default are dropped.
  function withSkill(character, id, changes) {
    const next = { ...skill(character, id), ...changes };
    next.adv = clampIntrinsic(next.adv);
    next.chal = clampIntrinsic(next.chal);
    const skills = { ...(character?.skills ?? {}) };
    if (isNotable(next)) skills[id] = next; else delete skills[id];
    return { ...character, skills };
  }

  // ---- luck: current is kept between 0 and max ----
  const DEFAULT_LUCK = 100;
  const clampMaxLuck = (v) => clampInt(v, { fallback: DEFAULT_LUCK });
  const clampCurrentLuck = (v, max) => clampInt(v, { max, fallback: max });
  // Older saves have no luck yet; they start full.
  function luck(character) {
    const max = clampMaxLuck(character?.maxLuck);
    return { max, current: clampCurrentLuck(character?.currentLuck, max) };
  }

  // ---- influence: whole numbers, 0 or more ----
  const DEFAULT_INFLUENCE = 1;
  const clampInfluence = (v, fallback = DEFAULT_INFLUENCE) => clampInt(v, { fallback });
  // Older saves have no influence yet; current starts at the starting value.
  function influence(character) {
    const starting = clampInfluence(character?.startingInfluence);
    return { starting, current: clampInfluence(character?.currentInfluence, starting) };
  }

  // ---- portraits: image files in portraits/, listed in portraits/portraits.js ----
  // default.png is only the Discord avatar for a character without a portrait; the app shows a placeholder instead.
  // administrator.png is the GM's Discord avatar. Neither can be picked for a character.
  const DEFAULT_PORTRAIT = "default.png";
  const ADMIN_PORTRAIT = "administrator.png";
  const PORTRAIT_DIR = "portraits/";
  // The portraits a character can pick: the listed ones, minus the default and the administrator's.
  const availablePortraits = (listed) =>
    [...new Set(Array.isArray(listed) ? listed : [])].filter((file) => file !== DEFAULT_PORTRAIT && file !== ADMIN_PORTRAIT);
  // The character's portrait if it's still listed, otherwise null (they haven't picked one).
  const portraitFile = (character, available = []) =>
    available.includes(character?.portrait) ? character.portrait : null;
  // "street-samurai.png" -> "Street Samurai"
  const portraitLabel = (file) => file.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());

  // ---- XP: total = spent + available ----
  const clampXp = (v) => clampInt(v);
  function xp(character) {
    const spent = clampXp(character?.xpSpent), available = clampXp(character?.xpAvailable);
    return { spent, available, total: spent + available };
  }

  // ---- appearance: free text ----
  const appearance = (character) => {
    const a = character?.appearance ?? {};
    return { pronouns: String(a.pronouns ?? ""), physical: String(a.physical ?? ""), network: String(a.network ?? "") };
  };

  // ---- things the character knows something about (checkboxes on the sheet) ----
  const KNOWLEDGE = ["Citizens", "Computers", "Corporations", "Criminals", "Cybernetics", "Executives", "Genetics", "Government",
    "Medicine", "Military", "Network", "Psionics", "Robotics", "Security", "Vehicles", "Weapons"];
  // The checked ones, in sheet order; anything not on the list is dropped.
  const knows = (character) => KNOWLEDGE.filter((k) => Array.isArray(character?.knows) && character.knows.includes(k));

  // ---- gear: everything a character carries ----
  // For now every item is a prop (just a description). Other kinds, with rules attached, come later,
  // so each item records its kind. Starter marks gear the character began play with.
  const gear = (character) => (Array.isArray(character?.gear) ? character.gear : [])
    .filter((item) => item && typeof item === "object" && item.id != null)
    .map((item) => ({ ...item, kind: item.kind || "prop", description: String(item.description ?? "").trim(), starter: item.starter === true,
      conditions: conditions(item) }));
  const newProp = (description, starter = false) =>
    ({ id: newId(), kind: "prop", description: String(description ?? "").trim(), starter: starter === true });
  // Replaces the item with the same id, or adds it at the end.
  function withGear(character, item) {
    const list = gear(character);
    return { ...character, gear: list.some((g) => g.id === item.id) ? list.map((g) => (g.id === item.id ? item : g)) : [...list, item] };
  }
  const withoutGear = (character, id) => ({ ...character, gear: gear(character).filter((g) => g.id !== id) });

  // ---- conditions: on a character or a gear item (a "holder"); the name and intrinsic never change once added ----
  // Severity is 1-4; 1 isn't shown. Suggestions are offered when adding one.
  const MAX_SEVERITY = 4;
  const CONDITION_SUGGESTIONS = { character: ["Exhausted"], gear: ["Damaged"] };
  const clampSeverity = (v) => clampInt(v, { min: 1, max: MAX_SEVERITY, fallback: 1 });
  const conditionKey = (name) => String(name ?? "").trim().toLowerCase();
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

  // ---- abilities (perks and augmentations): ids from the catalog in abilities.js ----
  // The saved ids, without junk or repeats. Ids not in the catalog are kept (a broken abilities.js mustn't erase them);
  // abilities() skips them for display.
  const abilityIds = (character) => [...new Set((Array.isArray(character?.abilities) ? character.abilities : [])
    .filter((id) => typeof id === "string"))];
  // The character's abilities as catalog entries, in the order they were added.
  const abilities = (character, catalog) =>
    abilityIds(character).map((id) => catalog.find((a) => a.id === id)).filter(Boolean);
  const withAbility = (character, id) =>
    ({ ...character, abilities: abilityIds(character).includes(id) ? abilityIds(character) : [...abilityIds(character), id] });
  const withoutAbility = (character, id) => ({ ...character, abilities: abilityIds(character).filter((a) => a !== id) });
  // "Augmentation · Cybernetic · Assassin"
  const abilityTag = (a) => [a.type === "perk" ? "Perk" : "Augmentation", a.origin, a.archetype].filter(Boolean).join(" · ");
  // For the picker: abilities whose name contains the query, minus the excluded ids, grouped like the rulebook
  // ("Cybernetic Assassin Augmentations"): perks first, then by origin and archetype in list order (none first), names sorted.
  function findAbilities(catalog, query = "", exclude = []) {
    const q = String(query).trim().toLowerCase();
    const rank = (list, v) => (v == null ? -1 : list.indexOf(v));
    const order = (a) => [a.type === "perk" ? 0 : 1, rank(ORIGINS, a.origin), rank(ARCHETYPES, a.archetype)];
    const groups = new Map();
    for (const a of catalog) {
      if (exclude.includes(a.id) || !a.name.toLowerCase().includes(q)) continue;
      const heading = [a.origin, a.archetype, a.type === "perk" ? "Perks" : "Augmentations"].filter(Boolean).join(" ");
      if (!groups.has(heading)) groups.set(heading, { heading, key: order(a), items: [] });
      groups.get(heading).items.push(a);
    }
    const byKey = (x, y) => x.key.reduce((diff, v, i) => diff || v - y.key[i], 0);
    return [...groups.values()].sort(byKey)
      .map(({ heading, items }) => ({ heading, items: items.sort((x, y) => x.name.localeCompare(y.name)) }));
  }

  // ---- used skills: marked while running (by hand, or by rolling the skill) ----
  // Only trained skills (a value above 50) can be used; dice alone don't count.
  const canBeUsed = (character, id) => skill(character, id).value != null;
  const isUsed = (character, id) => Boolean(character?.used?.[id]);
  function withUsed(character, id, used) {
    const next = { ...(character?.used ?? {}) };
    if (used) next[id] = true; else delete next[id];
    return { ...character, used: next };
  }

  // ---- wounds: 0-4; clicking box n marks boxes 1..n, clicking the last marked box unmarks it ----
  const MAX_WOUNDS = 4;
  const wounds = (character) => clampInt(character?.wounds, { max: MAX_WOUNDS });
  const clickWound = (current, n) => (n === current ? n - 1 : n);

  const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];

  // ---- hacker handles ----
  const HANDLE_A = ["Null", "Zero", "Ghost", "Static", "Byte", "Neon", "Glitch", "Hex", "Crypt", "Vanta", "Echo", "Proxy",
    "Rogue", "Cipher", "Volt", "Chrome", "Shade", "Kernel", "Daemon", "Pixel", "Razor", "Flux", "Void", "Lucid", "Nova"];
  const HANDLE_B = ["Runner", "Jack", "Wire", "Burn", "Fox", "Viper", "Spark", "Shift", "Loop", "Trace", "Lock", "Mantis",
    "Wraith", "Drift", "Blade", "Signal", "Root", "Patch", "Moth", "Kite", "Hound", "Fang", "Sync", "Pulse"];
  const LEET = { a: "4", e: "3", i: "1", o: "0", s: "5" };

  function randomHandle(rng = Math.random) {
    const a = pick(HANDLE_A, rng), b = pick(HANDLE_B, rng);
    switch (Math.floor(rng() * 5)) {
      case 0: return `${a}_${b}`.toLowerCase();
      case 1: return `${a}${Math.floor(rng() * 90) + 10}`;
      case 2: return `${a}${b}`.replace(/[aeios]/, (ch) => LEET[ch]);
      case 3: return b;
      default: return `${a}${b}`;
    }
  }

  // ---- international names ----
  // familyFirst: the family name is written first in that culture.
  const CULTURES = [
    { given: ["Haruka", "Kenji", "Yui", "Takeshi", "Aiko", "Ren", "Sora", "Daichi"], family: ["Sato", "Tanaka", "Nakamura", "Kobayashi", "Watanabe", "Fujita"], familyFirst: true },
    { given: ["Adaeze", "Chidi", "Folake", "Emeka", "Ngozi", "Tunde", "Ifeoma", "Segun"], family: ["Okafor", "Adeyemi", "Okonkwo", "Balogun", "Eze", "Nwosu"] },
    { given: ["Valeria", "Mateo", "Ximena", "Diego", "Camila", "Joaquín", "Renata", "Emiliano"], family: ["Hernández", "García", "Morales", "Castillo", "Reyes", "Vargas"] },
    { given: ["Ji-woo", "Min-jun", "Seo-yeon", "Do-hyun", "Ha-eun", "Ye-jun"], family: ["Kim", "Park", "Choi", "Jung", "Kang", "Yoon"], familyFirst: true },
    { given: ["Priya", "Arjun", "Ananya", "Rohan", "Kavya", "Vikram", "Meera", "Dev"], family: ["Sharma", "Iyer", "Patel", "Reddy", "Nair", "Banerjee"] },
    { given: ["Beatriz", "Thiago", "Larissa", "Rafael", "Juliana", "Caio"], family: ["Silva", "Santos", "Oliveira", "Costa", "Ferreira", "Almeida"] },
    { given: ["Mei", "Wei", "Lian", "Jun", "Xiu", "Hao", "Yan", "Bo"], family: ["Wang", "Li", "Chen", "Zhang", "Liu", "Zhao"], familyFirst: true },
    { given: ["Layla", "Omar", "Yasmin", "Karim", "Nour", "Tarek", "Salma", "Ziad"], family: ["Haddad", "Mansour", "Farouk", "Nasser", "Khalil", "Saleh"] },
    { given: ["Siobhan", "Cian", "Aoife", "Declan", "Niamh", "Oisín"], family: ["Murphy", "O'Brien", "Kelly", "Byrne", "Walsh", "Doyle"] },
    { given: ["Lena", "Felix", "Mia", "Jonas", "Clara", "Lukas"], family: ["Müller", "Schmidt", "Becker", "Wagner", "Hoffmann", "Krüger"] },
    { given: ["Linh", "Minh", "Thao", "Duc", "Lan", "Quang"], family: ["Nguyen", "Tran", "Le", "Pham", "Vo", "Dang"], familyFirst: true },
    { given: ["Elif", "Emre", "Zeynep", "Can", "Defne", "Burak"], family: ["Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Arslan"] },
    { given: ["Astrid", "Erik", "Freja", "Nils", "Saga", "Viktor"], family: ["Lindqvist", "Berg", "Holm", "Nyström", "Ek", "Sandberg"] },
    { given: ["Maricel", "Jomar", "Andrea", "Paolo", "Rhea", "Migs"], family: ["Dela Cruz", "Reyes", "Bautista", "Villanueva", "Mendoza", "Santiago"] },
    { given: ["Ama", "Kwame", "Akosua", "Kofi", "Efua", "Yaw"], family: ["Mensah", "Owusu", "Boateng", "Asante", "Darko", "Appiah"] },
  ];

  function randomName(rng = Math.random) {
    const culture = pick(CULTURES, rng);
    const given = pick(culture.given, rng), family = pick(culture.family, rng);
    return culture.familyFirst ? `${family} ${given}` : `${given} ${family}`;
  }

  const newId = () => (root.crypto?.randomUUID ? root.crypto.randomUUID() : `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`);

  function newCharacter() {
    const now = Date.now();
    return {
      id: newId(),
      handle: randomHandle(),
      name: randomName(),
      archetype: null,
      origin: null,
      maxLuck: DEFAULT_LUCK,
      currentLuck: DEFAULT_LUCK,
      startingInfluence: DEFAULT_INFLUENCE,
      currentInfluence: DEFAULT_INFLUENCE,
      wounds: 0,
      portrait: null,
      knows: [],
      gear: [],
      conditions: [],
      abilities: [],
      xpSpent: 0,
      xpAvailable: 0,
      appearance: { pronouns: "", physical: "", network: "" },
      skills: {},
      createdAt: now,
      updatedAt: now,
      creation: newCreation(),
    };
  }

  // ---- Create mode: choices live in character.creation; applyCreation derives the sheet from them ----
  const STEPS = ["archetype", "skills", "perk", "origin", "details", "review"];
  const BUMP_COUNT = 4;
  const isCreating = (character) => character?.creation != null && typeof character.creation === "object";
  const newCreation = () => ({ step: "archetype", archetype: null, knows: [], bumps: [], perk: null, gear: {}, origin: null,
    augmentations: [], option: null, placements: {}, optionBumps: [] });
  // Fills in anything a stored creation is missing, so a partial one (e.g. `creation: {}`) doesn't throw.
  const fullCreation = (creation) => ({ ...newCreation(), ...creation });
  // Rules lookup by name; own keys only, so "constructor" and the like aren't archetypes or origins.
  const ruleFor = (table, name) => (typeof name === "string" && Object.hasOwn(table, name) ? table[name] : undefined);
  // Who the Dice tab rolls as: never a character still in creation.
  const playingAs = (character) => (character && !isCreating(character) ? character : null);

  const optionOf = (creation, rules) => ruleFor(rules.origins, creation.origin)?.options.find((o) => o.id === creation.option) ?? null;
  const baseValue = (creation, rules, id) => ruleFor(rules.archetypes, creation.archetype)?.skills[id]?.value ?? null;
  // Mental and physical skills the archetype leaves below 95 (the initiatives have their own section in the book).
  function bumpable(creation, rules) {
    const cr = fullCreation(creation);
    return !ruleFor(rules.archetypes, cr.archetype) ? []
      : SKILLS.filter((s) => s.type !== "initiative" && shownValue(baseValue(cr, rules, s.id)) < MAX_VALUE).map((s) => s.id);
  }
  // Skills the option's placement `key` may go on. Checked against the archetype's own dice, so the order of picking doesn't matter.
  function placeable(creation, key, rules) {
    const cr = fullCreation(creation);
    const arch = ruleFor(rules.archetypes, cr.archetype), p = optionOf(cr, rules)?.placements.find((x) => x.key === key);
    if (!arch || !p) return [];
    const other = p.differentFrom ? cr.placements?.[p.differentFrom] : null;
    return SKILLS.filter((s) => s.type === p.category && s.id !== other
      && (arch.skills[s.id]?.[p.kind] ?? 0) + p.count <= MAX_INTRINSIC).map((s) => s.id);
  }

  const bumped = (s) => ({ ...s, value: Math.min(MAX_VALUE, shownValue(s.value) + STEP) });
  // Builds the sheet from scratch: base skills, initiative, bumps, option bumps, then option dice.
  function applyCreation(character, rules, catalog) {
    const cr = fullCreation(character.creation), arch = ruleFor(rules.archetypes, cr.archetype);
    const origin = ruleFor(rules.origins, cr.origin), option = optionOf(cr, rules);
    const skills = {};
    const put = (id, s) => { if (isNotable(s)) skills[id] = s; };
    for (const [id, s] of Object.entries(arch?.skills ?? {})) put(id, { value: s.value, adv: s.adv, chal: s.chal });
    if (arch) {
      const init = (n) => (n === UNTRAINED ? null : n);
      put("initiative-in-the-world", { value: init(arch.initiative.world), adv: 0, chal: 0 });
      put("initiative-in-the-network", { value: init(arch.initiative.network), adv: 0, chal: 0 });
    }
    const get = (id) => skills[id] ?? { value: null, adv: 0, chal: 0 };
    for (const id of [...cr.bumps, ...cr.optionBumps]) skills[id] = bumped(get(id));
    for (const p of option?.placements ?? []) {
      const id = cr.placements?.[p.key];
      if (id) skills[id] = { ...get(id), [p.kind]: Math.min(MAX_INTRINSIC, get(id)[p.kind] + p.count) };
    }
    const augs = [...(origin?.augmentations ?? []), ...cr.augmentations];
    const lines = (arch?.gear ?? []).map((line, i) => [i, typeof line === "string" ? line : line.choose[cr.gear?.[i]]]).filter(([, text]) => text);
    const gear = [
      ...lines.map(([i, text]) => ({ ...newProp(text, true), id: `create-gear-${i}` })),
      ...augs.flatMap((id) => (ruleFor(rules.augmentationGear, id) ?? []).map((text, n) => ({ ...newProp(text, true), id: `create-aug-${id}-${n}` }))),
    ];
    const luck = DEFAULT_LUCK + (option?.luck ?? 0);
    return {
      ...character,
      archetype: cr.archetype, origin: cr.origin, skills,
      knows: [...cr.knows],
      abilities: [cr.perk, ...augs, option?.perk].filter(Boolean),
      gear,
      maxLuck: luck, currentLuck: luck,
      startingInfluence: DEFAULT_INFLUENCE, currentInfluence: DEFAULT_INFLUENCE,
    };
  }

  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // Merges changes into creation. A changed archetype, origin or option clears what depended on it (unless the same call sets that too).
  function withCreation(character, changes, rules, catalog) {
    const cur = fullCreation(character.creation), resets = {};
    const changed = (k) => k in changes && !same(changes[k], cur[k]);
    if (changed("archetype")) Object.assign(resets, { knows: [], perk: null, gear: {}, augmentations: [], placements: {} });
    if (changed("origin")) Object.assign(resets, { augmentations: [], option: null, placements: {}, optionBumps: [] });
    if (changed("option")) Object.assign(resets, { placements: {}, optionBumps: [] });
    const next = { ...cur, ...resets, ...changes };
    if (changed("archetype")) { const legal = bumpable(next, rules); next.bumps = next.bumps.filter((id) => legal.includes(id)); }
    if (changed("option") && !optionOf(next, rules)?.extraAugmentation) next.augmentations = next.augmentations.slice(0, 1);
    return applyCreation({ ...character, creation: next }, rules, catalog);
  }

  const isDistinctSet = (list, size, allowed) =>
    Array.isArray(list) && list.length === size && new Set(list).size === size && list.every((id) => allowed.includes(id));
  // Takes the whole character because the details step needs its handle.
  function stepComplete(character, step, rules, catalog) {
    const cr = fullCreation(character.creation), arch = ruleFor(rules.archetypes, cr.archetype);
    switch (step) {
      case "archetype": return Boolean(arch);
      case "skills": return Boolean(arch) && isDistinctSet(cr.knows, arch.knows.count, arch.knows.from)
        && isDistinctSet(cr.bumps, BUMP_COUNT, bumpable(cr, rules));
      case "perk": {
        const perk = catalog.find((a) => a.id === cr.perk);
        return Boolean(arch) && perk?.type === "perk" && perk.archetype === cr.archetype
          && arch.gear.every((line, i) => typeof line === "string" || (Number.isInteger(cr.gear?.[i]) && cr.gear[i] >= 0 && cr.gear[i] < line.choose.length));
      }
      case "origin": {
        if (!arch || !ruleFor(rules.origins, cr.origin)) return false;
        const option = optionOf(cr, rules);
        if (cr.option != null && !option) return false;
        const fits = catalog.filter((a) => a.type === "augmentation" && a.origin === cr.origin && a.archetype === cr.archetype).map((a) => a.id);
        if (!isDistinctSet(cr.augmentations, option?.extraAugmentation ? 2 : 1, fits)) return false;
        if (!(option?.placements ?? []).every((p) => placeable(cr, p.key, rules).includes(cr.placements?.[p.key]))) return false;
        const bumps = option?.bumps;
        return isDistinctSet(cr.optionBumps, bumps?.count ?? 0, SKILLS.filter((s) => s.type === bumps?.category).map((s) => s.id));
      }
      case "details": return String(character.handle ?? "").trim() !== "";
      case "review": return STEPS.slice(0, -1).every((s) => stepComplete(character, s, rules, catalog));
      default: return false;
    }
  }
  const firstIncomplete = (character, rules, catalog) => STEPS.find((s) => !stepComplete(character, s, rules, catalog)) ?? null;
  const finishCreation = ({ creation, ...character }) => character;

  const label = (c) => (c?.handle && String(c.handle).trim()) || "Character";

  // ---- storage (pass in localStorage, or anything with getItem/setItem) ----
  function load(storage) {
    try {
      const list = JSON.parse(storage?.getItem(KEY) ?? "[]");
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function save(storage, character) {
    const list = load(storage);
    const saved = { ...character, updatedAt: Date.now() };
    const i = list.findIndex((c) => c.id === saved.id);
    if (i >= 0) list[i] = saved; else list.push(saved);
    storage.setItem(KEY, JSON.stringify(list));
    return saved;
  }

  function remove(storage, id) {
    storage.setItem(KEY, JSON.stringify(load(storage).filter((c) => c.id !== id)));
  }

  function toExport(character) {
    const base = String(character.handle ?? "").trim().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
    return { filename: `${base || "character"}.json`, json: JSON.stringify(character, null, 2) };
  }

  root.NCD_CHARACTERS = {
    ARCHETYPES, ORIGINS, CULTURES, SKILLS, UNTRAINED, MIN_VALUE, MAX_VALUE, MAX_INTRINSIC,
    randomHandle, randomName, newCharacter, label, load, save, remove, toExport,
    STEPS, BUMP_COUNT, newCreation, fullCreation, ruleFor, isCreating, playingAs, applyCreation, withCreation, bumpable, placeable, stepComplete, firstIncomplete, finishCreation,
    skill, shownValue, isNotable, clampValue, increment, withSkill,
    DEFAULT_LUCK, luck, clampMaxLuck, clampCurrentLuck,
    DEFAULT_INFLUENCE, influence, clampInfluence,
    MAX_WOUNDS, wounds, clickWound,
    canBeUsed, isUsed, withUsed,
    KNOWLEDGE, knows, xp, clampXp, appearance,
    gear, newProp, withGear, withoutGear,
    MAX_SEVERITY, CONDITION_SUGGESTIONS, conditions, severityLabel, withCondition, withSeverity, withoutCondition,
    abilityIds, abilities, withAbility, withoutAbility, abilityTag, findAbilities,
    DEFAULT_PORTRAIT, ADMIN_PORTRAIT, PORTRAIT_DIR, availablePortraits, portraitFile, portraitLabel,
  };
})(globalThis);
