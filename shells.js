// Shells: bodies a character's mind can load into during a job, overlaying the default body (characters.js keeps the
// split between mind and body). The shell sheets, who can load which, the Load Shell choices, and loading, going back
// to the default body, and a shell being destroyed.
// No page code here, so it can be tested in Node (shell-ui.js is the Load Shell dialog). Needs characters.js.
(function (root) {
  const C = root.NCD_CHARACTERS;

  // ---- Shell Source: how the shell was obtained. Kidnapping adds heat to the GM's pool; a deal costs 1 Influence ----
  const SOURCES = {
    scene: { name: "Another Scene", text: "You gained access to this shell during another scene." },
    larceny: { name: "Kidnapping or Larceny", heat: 4,
      text: "You acquired this shell by some means of criminal activity that you describe. Add 4 heat [heat][heat][heat][heat] to the heat pool." },
    people: { name: "The Right Kind of People", influence: 1,
      text: "You made a deal that you describe with other criminals to get loaded into this shell, which they had in their possession. Spend 1 Influence [influence]." },
  };

  // ---- the Quick Shell's Shell Identity: 1 intrinsic challenge die on each of three skills ----
  const IDENTITIES = {
    specific: { name: "Specific Individual", chal: ["convince-someone", "intimidate-someone", "lie-to-someone"],
      text: "Select this option if the shell belongs to someone whose specific identity, allegiance, societal role, or profession matters to how the shell is to be used. Mark 1 intrinsic challenge die [challenge] for the Convince Someone, Intimidate Someone, and Lie to Someone skills." },
    anonymous: { name: "Anonymous Identity", chal: ["gossip-with-citizens", "gossip-with-corporates", "throw-money-at-the-problem"],
      text: "Select this option if the value of the shell comes from its capabilities instead of its perceived identity. Mark 1 intrinsic challenge die [challenge] for the Gossip with Citizens, Gossip with Corporates, and Throw Money at the Problem skills." },
  };

  // ---- Capabilities: 4 different skills, then 2 more; a mental one gets advantage dice, a physical one a chance ----
  const CAPABILITIES = {
    major: { count: 4, adv: 2, value: 75 },
    minor: { count: 2, adv: 1, value: 65 },
  };
  const CAPABILITIES_TEXT = "Choose 4 different skills that best reflect the capabilities of this shell. For each mental skill you choose, mark 2 intrinsic advantage dice [advantage][advantage] for that skill; for each physical skill you choose, write a 75% chance of success for that skill. Then, choose 2 different skills that reflect some minor capabilities of this shell. For each mental skill you choose, mark 1 intrinsic advantage die [advantage] for that skill; for each physical skill you choose, write a 65% chance of success for that skill.";
  const CAPABLE = C.SKILLS.filter((s) => s.type !== "initiative");

  // ---- the shells ----
  // synthetic: true (only synthetic minds load into it), false (only human ones), or null (the Quick Shell's Body Type,
  // which is whichever fits the character). skills: fixed full skill states (only the body's halves count).
  // augmentations: catalog ids it always has; perks: its own body perks, as text; conditions: its intrinsic conditions.
  // deviceDriver: the Device Driver perk loads it without a Shell Source.
  const SYNTHETIC_BODY = "synthetic-body";
  const STOCK_MODEL = { name: "Stock Model", text: "While in this shell, you have the **Inconspicuous x2** positive condition. When you load into this shell, you can describe its appearance however you like, provided that it would be imminently forgettable by most humans." };
  const FRESH_INSTALL = { name: "Fresh Install", text: "Remove 2 heat [heat][heat] from the heat pool at the start of any scene you are in." };
  const STOCK_SKILLS = {
    "analyze-data": { adv: 1 }, "gossip-with-ai": { adv: 2 }, "gossip-with-citizens": { chal: 1 }, "lie-to-someone": { adv: 1 },
    "conceal-an-object": { value: 75 }, "sneak-around": { value: 70 },
  };
  const INCONSPICUOUS = { name: "Inconspicuous", severity: 2, intrinsic: true };
  const stock = (id, name, about) => ({ id, name, kind: "Synthetic Shell", synthetic: true, about, skills: STOCK_SKILLS,
    augmentations: [SYNTHETIC_BODY], perks: [STOCK_MODEL, FRESH_INSTALL], conditions: [INCONSPICUOUS],
    sources: ["scene", "people"], deviceDriver: true });
  const SHELLS = [
    { id: "quick", name: "Quick Shell", kind: "Shell", synthetic: null, identity: true, capabilities: true, named: true,
      about: "A quick shell can represent a wide variety of forms.",
      augmentations: [], perks: [], conditions: [], sources: ["scene", "larceny", "people"] },
    stock("synth", "Mass-Produced Synth", "This shell is one of the mass-produced baseline bodies granted to synthetic intelligences upon being recognized as sentient. This shell can only be loaded into by synthetic characters."),
    stock("utility-robot", "Utility Robot", "This shell is a robot drone built for a specialized purpose, which you have taken over and loaded your mind into."),
    { id: "cyborg", name: "Total Conversion Cyborg", kind: "Synthetic Shell", synthetic: false, capabilities: true, named: true,
      choose: 2, about: "A human brain in an entirely synthetic body.",
      augmentations: [], conditions: [], sources: ["scene", "larceny", "people"],
      perks: [{ name: "Living Brain, Synthetic Body", text: "Only human minds can load into this shell. This shell cannot be affected by poisons or diseases." }] },
  ];
  const byId = (id) => SHELLS.find((s) => s.id === id) ?? null;
  // The Body Type options' text, for the Quick Shell (set by the character's origin).
  const BODY_TYPES = {
    human: "Only human minds can load into this shell.",
    synthetic: "This shell can only be occupied by synthetic intelligences and cannot be affected by poisons, diseases, or non-physical psionic attacks.",
  };

  // ---- who can load what ----
  // Synthetic intelligences only load into electronic brains, and humans only into human ones.
  const isSynthetic = (character) => character?.origin === "Synthetic";
  const canLoad = (character, shell) => Boolean(shell) && (shell.synthetic == null || shell.synthetic === isSynthetic(character));
  // Device Driver loads the Synth or the Utility Robot without a Shell Source.
  const DEVICE_DRIVER = "device-driver";
  const skipsSource = (character, shell) => Boolean(shell?.deviceDriver) && C.abilityIds(C.withoutShell(character)).includes(DEVICE_DRIVER);
  // The Shell Source options it offers this character ([] when there's no Source to choose).
  const sourcesFor = (character, shell) => (!shell || skipsSource(character, shell) ? [] : shell.sources);
  const canAfford = (character, source) => (SOURCES[source]?.influence ?? 0) <= C.influence(character).current;
  // The Cyborg's augmentations: the book's list is still a placeholder, so any Synthetic augmentation but Synthetic
  // Body (its Living Brain, Synthetic Body replaces that).
  const augmentationChoices = (catalog) =>
    catalog.filter((a) => a.type === "augmentation" && a.origin === "Synthetic" && a.id !== SYNTHETIC_BODY);

  // ---- the choices: { shell, identity, major: [4 ids], minor: [2 ids], augmentations: [2 ids], source, name, appearance } ----
  const filled = (list, n) => Array.isArray(list) && list.length === n && list.every((x) => typeof x === "string" && x);
  // What's still missing ("shell", "identity", "major", "minor", "augmentations", "source", "name"), or null.
  function missing(character, choices = {}, catalog = []) {
    const shell = byId(choices.shell);
    if (!canLoad(character, shell)) return "shell";
    if (shell.identity && !IDENTITIES[choices.identity]) return "identity";
    if (shell.capabilities) {
      const ids = CAPABLE.map((s) => s.id);
      const major = choices.major, minor = choices.minor;
      if (!filled(major, CAPABILITIES.major.count) || new Set(major).size !== major.length || !major.every((id) => ids.includes(id))) return "major";
      if (!filled(minor, CAPABILITIES.minor.count) || new Set([...major, ...minor]).size !== major.length + minor.length
        || !minor.every((id) => ids.includes(id))) return "minor";
    }
    if (shell.choose) {
      const allowed = augmentationChoices(catalog).map((a) => a.id), picked = choices.augmentations;
      if (!filled(picked, shell.choose) || new Set(picked).size !== picked.length || !picked.every((id) => allowed.includes(id))) return "augmentations";
    }
    const sources = sourcesFor(character, shell);
    if (sources.length && (!sources.includes(choices.source) || !canAfford(character, choices.source))) return "source";
    if (shell.named && !String(choices.name ?? "").trim()) return "name";
    return null;
  }

  // The shell's body, from the choices (which must be complete).
  function build(character, choices, catalog = []) {
    const shell = byId(choices.shell);
    const full = {};
    const add = (id, part) => {
      const s = full[id] ?? { value: null, adv: 0, chal: 0 };
      full[id] = { value: part.value ?? s.value, adv: Math.min(C.MAX_INTRINSIC, s.adv + (part.adv ?? 0)),
        chal: Math.min(C.MAX_INTRINSIC, s.chal + (part.chal ?? 0)) };
    };
    for (const [id, s] of Object.entries(shell.skills ?? {})) add(id, s);
    if (shell.identity) for (const id of IDENTITIES[choices.identity].chal) add(id, { chal: 1 });
    if (shell.capabilities) {
      for (const [key, rule] of Object.entries(CAPABILITIES)) {
        for (const id of choices[key]) add(id, C.SKILLS.find((s) => s.id === id).type === "mental" ? { adv: rule.adv } : { value: rule.value });
      }
    }
    const synthetic = shell.synthetic ?? isSynthetic(character);
    const augmentations = [...shell.augmentations, ...(shell.synthetic == null && synthetic ? [SYNTHETIC_BODY] : []),
      ...(shell.choose ? choices.augmentations : [])];
    const source = sourcesFor(character, shell).length ? choices.source : null;
    return {
      ...C.newBody(),
      type: shell.id,
      name: String(shell.named ? choices.name : shell.name).trim(),
      synthetic,
      identity: shell.identity ? choices.identity : null,
      source,
      skills: C.bodySkills(full),
      augmentations,
      appearance: String(choices.appearance ?? "").trim(),
      conditions: shell.conditions.reduce((holder, x) => C.withCondition(holder, x), { conditions: [] }).conditions,
    };
  }

  // ---- loading, going back, and the shell being destroyed ----
  // Loads the shell (replacing any loaded one) and pays its Source: { character, shell, source } (source: SOURCES' key,
  // or null), or null when a choice is missing.
  function load(character, choices, catalog = []) {
    if (missing(character, choices, catalog)) return null;
    const shell = build(character, choices, catalog);
    const cost = SOURCES[shell.source]?.influence ?? 0;
    const next = { ...character, shell, currentInfluence: C.influence(character).current - cost };
    return { character: next, shell, source: shell.source };
  }
  const returnToDefault = (character) => C.withoutShell(character);
  // Dying in a shell destroys it: back in the default body, with Memory Loss (worse if it's already there from a death
  // this job). It's an ordinary condition, so the end of the job clears it.
  const MEMORY_LOSS = "Memory Loss";
  const destroy = (character) => C.withCondition(C.withoutShell(character), { name: MEMORY_LOSS });

  // ---- reading a loaded shell ----
  // Its sheet (SHELLS' entry), or null when there's no shell.
  const sheetOf = (character) => (C.inShell(character) ? byId(character.shell.type) : null);
  // "Night Janitor · Quick Shell", or the sheet's name alone when the shell is named after it.
  function label(character) {
    const sheet = sheetOf(character), name = character?.shell?.name;
    if (!C.inShell(character)) return "";
    return !sheet ? name || "Shell" : !name || name === sheet.name ? sheet.name : `${name} · ${sheet.name}`;
  }
  // Gear installed in the default body (the Cybernetic keyword) can't be used while in a shell.
  const CYBERNETIC = "Cybernetic";
  const isInstalled = (item) => [...(item?.keywords ?? []), ...(item?.fixed ?? [])].includes(CYBERNETIC);

  root.NCD_SHELLS = {
    SHELLS, SOURCES, IDENTITIES, CAPABILITIES, CAPABILITIES_TEXT, BODY_TYPES, MEMORY_LOSS, DEVICE_DRIVER,
    byId, isSynthetic, canLoad, skipsSource, sourcesFor, canAfford, augmentationChoices,
    missing, build, load, returnToDefault, destroy, sheetOf, label, isInstalled,
  };
})(globalThis);
