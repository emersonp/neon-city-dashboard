// Advancement: spending XP after a job. One table for every origin (the book has one per origin; they differ only in
// the costs ORIGIN_COST lists, and in which origins' body augmentations a character can add).
// What a player buys is a list of purchases, applied in order: each one's cost is worked out from the character as the
// purchases before it left them (a second perk costs more than the first). No page code here, so it can be tested in Node.
(function (root) {
  const C = root.NCD_CHARACTERS;
  const G = () => root.NCD_GEAR; // loaded after this file in the page; looked up when it's needed

  // Humans add body augmentations from the three human origins; synthetics from Synthetic and Cybernetic.
  const HUMAN = ["Cybernetic", "Gene-Spliced", "Psionic"];
  const augmentationOrigins = (origin) => (origin === "Synthetic" ? ["Synthetic", "Cybernetic"] : HUMAN);
  // The costs that depend on the character's origin; `default` is every origin not listed.
  const ORIGIN_COST = {
    augmentationOwn: { Synthetic: 1, default: 2 },
    augmentationOther: { Synthetic: 2, default: 3 },
    augmentationBody: { Synthetic: 2, default: 4 },
    initiativeWorld: { Cybernetic: 3, default: 2 },
    initiativeNetwork: { Cybernetic: 2, Synthetic: 1, default: 3 },
  };
  const originCost = (key, origin) => ORIGIN_COST[key][origin] ?? ORIGIN_COST[key].default;
  // For the table: "2 (Cybernetic: 3)", or with `plus` "2 + the number of … (Synthetic: 1 + that number)".
  const originCostText = (key, plus = "") => {
    const { default: base, ...others } = ORIGIN_COST[key];
    const notes = Object.entries(others).map(([origin, n]) => `${origin}: ${n}${plus ? " + that number" : ""}`);
    return `${base}${plus ? ` + ${plus}` : ""}${notes.length ? ` (${notes.join("; ")})` : ""}`;
  };

  const owned = (character, catalog, type) => C.abilities(character, catalog).filter((a) => a.type === type);
  const notOwned = (character, catalog, test) => catalog.filter((a) => !C.abilityIds(character).includes(a.id) && test(a));
  const abilityOption = (a) => ({ value: a.id, label: a.name, group: [a.origin, a.archetype].filter(Boolean).join(" ") || "Any" });
  const perks = (character, catalog) => owned(character, catalog, "perk").length;
  const augmentations = (character, catalog) => owned(character, catalog, "augmentation").length;
  const skillOption = (s) => ({ value: s.id, label: s.name });
  const MAX_INITIATIVE = C.MAX_VALUE;
  const AUGMENTATIONS_YOU_HAVE = "the number of body augmentations you have";

  // Everything that can be bought, in the book's order. Each benefit has:
  //   text     the table's Benefit column; costText its XP Cost column; short (below) its name on Spend XP
  //   pick     what the player picks: "ability", "skill", "gear" (an acquired item), "keyword" ({ gear, keyword }),
  //            "item" (new gear), or none
  //   options(state, catalog)       what can be picked: [{ value, label, group? }] (for "keyword", the starting gear)
  //   cost(state, value, catalog)   XP, from the character as the earlier purchases left them
  //   apply(state, value, catalog)  the new state
  // A state is { character, acquired }: acquired is the gear picked up on the job that hasn't been made starting gear.
  const withCharacter = (state, character) => ({ ...state, character });
  const initiative = (id, key, name) => ({
    id, text: `Increase your ${name} chance of success by 5%`, costText: originCostText(key),
    cost: ({ character }) => originCost(key, character.origin),
    available: ({ character }) => C.shownValue(C.skill(character, id).value) < MAX_INITIATIVE,
    apply: (state) => withCharacter(state, C.withSkill(state.character, id,
      { value: Math.min(MAX_INITIATIVE, C.shownValue(C.skill(state.character, id).value) + C.STEP) })),
  });
  const ability = (id, text, costText, cost, test) => ({
    id, text, costText, pick: "ability",
    options: ({ character }, catalog) => notOwned(character, catalog, (a) => test(a, character)).map(abilityOption),
    cost: ({ character }, value, catalog) => cost(character, catalog),
    apply: (state, value) => withCharacter(state, C.withAbility(state.character, value)),
  });
  const ownArchetype = (a, c) => a.archetype === c.archetype;
  // Keywords the item could take that it doesn't have yet.
  const keywordsFor = (item) => G().keywordChoices(item).filter((k) => k.allowed && !k.checked && !k.builtIn).map((k) => k.name);
  const starterById = (character, id) => C.starterGear(character).find((g) => String(g.id) === String(id)) ?? null;

  const BENEFITS = [
    {
      id: "influence", text: "+1 starting influence", costText: "1 + your current starting influence",
      cost: ({ character }) => 1 + C.influence(character).starting,
      apply: (state) => withCharacter(state, { ...state.character, startingInfluence: C.influence(state.character).starting + 1 }),
    },
    ability("perk-own", "Gain a character perk from your archetype", "1 + the number of character perks you have",
      (c, cat) => 1 + perks(c, cat), (a, c) => a.type === "perk" && ownArchetype(a, c)),
    ability("perk-other", "Gain a character perk from another archetype", "3 + the number of character perks you have",
      (c, cat) => 3 + perks(c, cat), (a, c) => a.type === "perk" && a.archetype != null && !ownArchetype(a, c)),
    // An augmentation of your origin with no archetype is for every archetype, so it's "your archetype" here.
    ability("augmentation-own", "Gain an augmentation of your origin associated with your archetype",
      originCostText("augmentationOwn", AUGMENTATIONS_YOU_HAVE),
      (c, cat) => originCost("augmentationOwn", c.origin) + augmentations(c, cat),
      (a, c) => a.type === "augmentation" && a.origin === c.origin && (a.archetype == null || ownArchetype(a, c))),
    ability("augmentation-other", "Gain an augmentation of your origin associated with another archetype",
      originCostText("augmentationOther", AUGMENTATIONS_YOU_HAVE),
      (c, cat) => originCost("augmentationOther", c.origin) + augmentations(c, cat),
      (a, c) => a.type === "augmentation" && a.origin === c.origin && a.archetype != null && !ownArchetype(a, c)),
    ability("augmentation-body", "Gain a body augmentation from another origin (humans: Cybernetic, Gene-Spliced or Psionic; synthetics: Cybernetic)",
      originCostText("augmentationBody", AUGMENTATIONS_YOU_HAVE),
      (c, cat) => originCost("augmentationBody", c.origin) + augmentations(c, cat),
      (a, c) => a.type === "augmentation" && a.origin !== c.origin && augmentationOrigins(c.origin).includes(a.origin)),
    {
      id: "luck", text: "Increase your maximum luck by 5", costText: "1", cost: () => 1,
      apply: (state) => withCharacter(state, { ...state.character, maxLuck: C.luck(state.character).max + 5 }),
    },
    {
      id: "skill", text: "Choose a skill you do not have and gain it with a 55% chance of success", costText: "2", pick: "skill",
      options: ({ character }) => C.untrainedSkills(character).map((id) => skillOption(C.SKILLS.find((s) => s.id === id))),
      cost: () => 2,
      apply: (state, value) => withCharacter(state, C.withSkill(state.character, value, { value: C.MIN_VALUE })),
    },
    {
      id: "keep-gear", text: "Make a piece of gear you acquired in this job a piece of your starting gear", costText: "1", pick: "gear",
      options: ({ acquired }) => acquired.map((g) => ({ value: String(g.id), label: g.description })),
      cost: () => 1,
      apply: (state, value) => {
        const item = state.acquired.find((g) => String(g.id) === value);
        return { character: C.withGear(state.character, { ...item, starter: true }), acquired: state.acquired.filter((g) => g !== item) };
      },
    },
    {
      id: "keyword", text: "Add a keyword to a starting weapon or piece of gear you have", costText: "1 + the number of keywords it already has",
      pick: "keyword",
      options: ({ character }) => C.starterGear(character).filter((g) => keywordsFor(g).length)
        .map((g) => ({ value: String(g.id), label: g.description })),
      keywords: ({ character }, gearId) => { const item = starterById(character, gearId); return item ? keywordsFor(item) : []; },
      cost: ({ character }, value) => { const item = starterById(character, value?.gear); return item ? 1 + G().keywordsOf(item).length : 1; },
      valid: (state, value) => BENEFIT.keyword.keywords(state, value?.gear).includes(value?.keyword),
      apply: (state, { gear, keyword }) => {
        const item = starterById(state.character, gear);
        return withCharacter(state, C.withGear(state.character, G().legalize({ ...item, keywords: [...item.keywords, keyword] })));
      },
    },
    {
      id: "common-gear", text: "Gain an item of common gear with no keywords as a starting item", costText: "1", pick: "item",
      cost: () => 1,
      valid: (state, value) => Boolean(value && typeof value === "object" && String(value.description ?? "").trim()),
      apply: (state, value) => withCharacter(state, C.withGear(state.character, C.newGear({ ...value, id: undefined, keywords: [], starter: true }))),
    },
    {
      id: "advantage", text: "Fill in the dot under a permanent advantage die for a skill", costText: "3 for the first; 5 for the second",
      pick: "skill",
      options: ({ character }) => C.SKILLS.filter((s) => s.type !== "initiative" && C.skill(character, s.id).adv < C.MAX_INTRINSIC)
        .map((s) => ({ ...skillOption(s), label: `${s.name} (${C.skill(character, s.id).adv ? "second" : "first"})` })),
      cost: ({ character }, value) => (value && C.skill(character, value).adv >= 1 ? 5 : 3),
      apply: (state, value) => withCharacter(state, C.withSkill(state.character, value, { adv: C.skill(state.character, value).adv + 1 })),
    },
    initiative("initiative-in-the-world", "initiativeWorld", "Initiative in the World"),
    initiative("initiative-in-the-network", "initiativeNetwork", "Initiative in the Network"),
  ];
  // What Spend XP calls each purchase, before what was picked ("Perk: Deadshot").
  const SHORT = {
    influence: "+1 starting influence", "perk-own": "Perk", "perk-other": "Perk", "augmentation-own": "Augmentation",
    "augmentation-other": "Augmentation", "augmentation-body": "Body augmentation", luck: "+5 maximum luck", skill: "New skill at 55%",
    "keep-gear": "Starting gear", keyword: "Keyword", "common-gear": "Common gear", advantage: "Advantage die",
    "initiative-in-the-world": "+5% Initiative in the World", "initiative-in-the-network": "+5% Initiative in the Network",
  };
  for (const b of BENEFITS) b.short = SHORT[b.id];
  const BENEFIT = Object.fromEntries(BENEFITS.map((b) => [b.id, b]));

  // Whether the benefit can be bought with this pick, as the earlier purchases left the character.
  function canBuy(benefit, state, value, catalog) {
    if (benefit.valid) return benefit.valid(state, value, catalog);
    if (benefit.options) return benefit.options(state, catalog).some((o) => o.value === value);
    return benefit.available ? benefit.available(state) : true;
  }

  // Applies the purchases ({ benefit, value }) in order to the character, with `available` XP to spend and the gear
  // acquired on the job. A purchase that's no longer possible (one before it was removed) or that there's no XP left for
  // is skipped. Returns the new state, the purchases kept (each with its cost), and the XP spent and remaining.
  function applyPurchases(character, purchases, { catalog = [], acquired = [], available = C.xp(character).available } = {}) {
    let state = { character, acquired: [...acquired] }, spent = 0;
    const kept = [];
    for (const p of purchases) {
      const b = BENEFIT[p?.benefit];
      if (!b || !canBuy(b, state, p.value, catalog)) continue;
      const cost = b.cost(state, p.value, catalog);
      if (spent + cost > available) continue;
      state = b.apply(state, p.value, catalog);
      spent += cost;
      kept.push({ ...p, cost });
    }
    return { ...state, purchases: kept, spent, remaining: available - spent };
  }

  // ---- the step after Finish Job: the character is saved with `advancement` until Spend XP is confirmed ----
  // advancement.acquired: the gear they had at the end of the job that wasn't starting gear, without its temporary conditions.
  const isSpending = (character) => character?.advancement != null && typeof character.advancement === "object";
  const acquiredGear = (character) => (Array.isArray(character?.advancement?.acquired) ? C.gear({ gear: character.advancement.acquired }) : []);
  // `before` is the character on the job; `finished` is C.finishJob's character.
  function beginSpending(before, finished) {
    const starters = C.starterGear(before).map((g) => g.id);
    const acquired = C.gear(before).filter((g) => !starters.includes(g.id))
      .map((g) => ({ ...g, starter: false, conditions: C.conditions(g).filter((x) => x.intrinsic) }));
    return { ...finished, advancement: { acquired } };
  }
  // Applies the purchases, moves the XP spent from available to spent, and resets to starting values (more Luck or
  // starting Influence shows in full). Unbought acquired gear is gone.
  function finishSpending(character, purchases, catalog = []) {
    const { advancement, ...rest } = character;
    const result = applyPurchases(rest, purchases, { catalog, acquired: acquiredGear(character) });
    const { spent, available } = C.xp(result.character);
    const next = C.resetToStarting({ ...result.character, xpAvailable: available - result.spent, xpSpent: spent + result.spent });
    return { character: next, purchases: result.purchases, spent: result.spent, remaining: result.remaining };
  }

  // The Databank's XP table.
  const TABLE = { head: ["Benefit", "XP cost"], rows: BENEFITS.map((b) => [b.text, b.costText]) };
  const TABLE_INTRO = "At the end of each job, after Finish Job, you can spend XP to improve your character. Costs that differ by "
    + "origin are noted in brackets. Humans (Cybernetic, Gene-Spliced and Psionic) can add body augmentations from any of those three "
    + "origins; synthetics can add them from the Synthetic and Cybernetic origins.";

  root.NCD_ADVANCEMENT = {
    HUMAN, ORIGIN_COST, augmentationOrigins, originCost, BENEFITS, BENEFIT, canBuy, applyPurchases,
    isSpending, acquiredGear, beginSpending, finishSpending, TABLE, TABLE_INTRO,
  };
})(globalThis);
