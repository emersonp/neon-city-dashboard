// Characters: rulebook lists, random handles and names, and saving to localStorage.
// No page code here, so it can be tested in Node.
(function (root) {
  const ARCHETYPES = ["Assassin", "Bruiser", "Doc", "Gearhead", "Grifter", "Hacker", "Mastermind", "Merc", "Operator", "Thief"];
  const ORIGINS = ["Cybernetic", "Gene-Spliced", "Psionic", "Synthetic"];
  const KEY = "ncd.characters";

  // ---- skills (from the character sheet: the first block is mental, the second physical) ----
  const slug = (name) => name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
  const MENTAL = ["Analyze Data", "Case the Joint", "Convince Someone", "Cover Your Tracks", "Crash a System",
    "Distract Someone", "Fix or Modify Something", "Goad Someone", "Gossip with Citizens", "Gossip with Corporates",
    "Gossip with Criminals", "Heal Someone", "Infiltrate a System", "Intimidate Someone", "Lie to Someone",
    "Override a System", "Play a Game", "Read the Situation", "Size Someone Up", "Throw Money at the Problem"];
  const PHYSICAL = ["Break or Destroy Something", "Climb, Jump, or Tumble", "Conceal an Object", "Drive or Pilot Something",
    "Lift or Move Something", "Run Like Hell", "Shoot Someone", "Slash, Stab, or Strike Someone", "Sneak Around",
    "Throw Something", "Tough It Out"];
  const SKILLS = [
    ...MENTAL.map((name) => ({ id: slug(name), name, type: "mental" })),
    ...PHYSICAL.map((name) => ({ id: slug(name), name, type: "physical" })),
  ];
  const UNTRAINED = 50;              // what a null skill (and "Anything else") rolls at
  const MIN_VALUE = 55, MAX_VALUE = 95, STEP = 5;
  const MAX_DICE = 4;

  // A skill's stored state: value is null (untrained) or 55-95; adv/chal are intrinsic dice, 0-4.
  function skill(character, id) {
    const s = character?.skills?.[id] ?? {};
    return { value: s.value ?? null, adv: s.adv ?? 0, chal: s.chal ?? 0 };
  }
  const shownValue = (value) => value ?? UNTRAINED;
  const isNotable = (s) => s.value != null || s.adv > 0 || s.chal > 0;

  function clampValue(v) {
    if (v === "" || v == null) return null;
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.max(MIN_VALUE, Math.min(MAX_VALUE, n)) : null;
  }
  const increment = (value) => Math.min(MAX_VALUE, value + STEP);
  const clampDice = (n) => Math.max(0, Math.min(MAX_DICE, Math.trunc(Number(n) || 0)));

  // Returns a copy of the character with one skill changed. Skills back at the default are dropped.
  function withSkill(character, id, changes) {
    const next = { ...skill(character, id), ...changes };
    next.adv = clampDice(next.adv);
    next.chal = clampDice(next.chal);
    const skills = { ...(character?.skills ?? {}) };
    if (isNotable(next)) skills[id] = next; else delete skills[id];
    return { ...character, skills };
  }

  // ---- luck: current is kept between 0 and max ----
  const DEFAULT_LUCK = 100;
  const toInt = (v) => (v === "" || v == null || !Number.isFinite(Number(v)) ? null : Math.round(Number(v)));
  const clampMaxLuck = (v) => Math.max(0, toInt(v) ?? DEFAULT_LUCK);
  const clampCurrentLuck = (v, max) => Math.max(0, Math.min(max, toInt(v) ?? max));
  // Older saves have no luck yet; they start full.
  function luck(character) {
    const max = clampMaxLuck(character?.maxLuck);
    return { max, current: clampCurrentLuck(character?.currentLuck, max) };
  }

  // ---- influence: whole numbers, 0 or more ----
  const DEFAULT_INFLUENCE = 1;
  const clampInfluence = (v, fallback = DEFAULT_INFLUENCE) => Math.max(0, toInt(v) ?? fallback);
  // Older saves have no influence yet; current starts at the starting value.
  function influence(character) {
    const starting = clampInfluence(character?.startingInfluence);
    return { starting, current: clampInfluence(character?.currentInfluence, starting) };
  }

  // ---- portraits: image files in portraits/, listed in portraits/portraits.js ----
  const DEFAULT_PORTRAIT = "default.png";
  const PORTRAIT_DIR = "portraits/";
  // The listed portraits, always including the default.
  const availablePortraits = (listed) => [...new Set([DEFAULT_PORTRAIT, ...(Array.isArray(listed) ? listed : [])])];
  // The character's portrait if it's still listed, otherwise the default. null means "use the default".
  const portraitFile = (character, available = [DEFAULT_PORTRAIT]) =>
    available.includes(character?.portrait) ? character.portrait : DEFAULT_PORTRAIT;
  // "street-samurai.png" -> "Street Samurai"
  const portraitLabel = (file) => file.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());

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
  const wounds = (character) => Math.max(0, Math.min(MAX_WOUNDS, Math.trunc(Number(character?.wounds) || 0)));
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
      archetype: "Assassin",
      origin: "Cybernetic",
      maxLuck: DEFAULT_LUCK,
      currentLuck: DEFAULT_LUCK,
      startingInfluence: DEFAULT_INFLUENCE,
      currentInfluence: DEFAULT_INFLUENCE,
      wounds: 0,
      portrait: null,
      skills: {},
      createdAt: now,
      updatedAt: now,
    };
  }

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

  function toExport(character) {
    const base = String(character.handle ?? "").trim().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
    return { filename: `${base || "character"}.json`, json: JSON.stringify(character, null, 2) };
  }

  root.NCD_CHARACTERS = {
    ARCHETYPES, ORIGINS, CULTURES, SKILLS, UNTRAINED, MIN_VALUE, MAX_VALUE, MAX_DICE,
    randomHandle, randomName, newCharacter, label, load, save, toExport,
    skill, shownValue, isNotable, clampValue, increment, withSkill,
    DEFAULT_LUCK, luck, clampMaxLuck, clampCurrentLuck,
    DEFAULT_INFLUENCE, influence, clampInfluence,
    MAX_WOUNDS, wounds, clickWound,
    canBeUsed, isUsed, withUsed,
    DEFAULT_PORTRAIT, PORTRAIT_DIR, availablePortraits, portraitFile, portraitLabel,
  };
})(globalThis);
