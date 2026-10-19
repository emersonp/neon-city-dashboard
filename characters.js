// Characters: rulebook lists, random handles and names, and saving to localStorage.
// No page code here, so it can be tested in Node.
(function (root) {
  const ARCHETYPES = ["Assassin", "Bruiser", "Doc", "Gearhead", "Grifter", "Hacker", "Mastermind", "Merc", "Operator", "Thief"];
  const ORIGINS = ["Cybernetic", "Gene-Spliced", "Psionic", "Synthetic"];
  const KEY = "ncd.characters";

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

  root.NCD_CHARACTERS = { ARCHETYPES, ORIGINS, CULTURES, randomHandle, randomName, newCharacter, label, load, save, toExport };
})(globalThis);
