// Gear rules: what each kind of gear is, the keywords it always has, which keywords it can take, and how it's shown.
// Everything comes from databank.js, so the sheet, the gear dialog, Create and the Databank tab agree.
// No page code here, so it can be tested in Node. Needs characters.js and databank.js loaded first.
//
// An item (see gear() in characters.js) has kind, description (its name), quantity, keywords (added), fixed (granted
// against the usual rules, never checked or removed), and its kind's fields:
//   weapon     category: a databank weapon name
//   kit        set: a tool set name; quality: improvised / standard / exceptional; special: a skill id (hyper-specialized);
//              consumable: true/false
//   equipment  entry: an EQUIPMENT name; choice: a skill id or one of the entry's choice options
//   armor      level: 1-4
//   vehicle    vehicle: a databank vehicle name
(function (root) {
  const D = root.NCD_DATABANK, C = root.NCD_CHARACTERS;
  const KINDS = ["weapon", "kit", "equipment", "armor", "vehicle", "prop"];
  const KIND_FIELDS = ["category", "set", "quality", "special", "consumable", "entry", "choice", "level", "vehicle"];

  const byName = (list, name) => list.find((x) => x.name === name) ?? null;
  const strings = (list) => (Array.isArray(list) ? list.filter((k) => typeof k === "string") : []);
  const unique = (list) => [...new Set(list)];
  const entries = (title) => D.gear.find((s) => s.title === title)?.entries ?? [];
  const skillName = (id) => C.SKILLS.find((s) => s.id === id)?.name ?? null;

  // ---- what each kind can be ----
  const KIT_QUALITIES = entries("Specialized tool kits").filter((e) => e.quality);
  const QUALITIES = Object.fromEntries(KIT_QUALITIES.map((e) => [e.quality, e.impact]));
  // Specialized equipment: every entry you can own outside Gear basics and the tool kits.
  const EQUIPMENT = D.gear.filter((s) => !["Gear basics", "Specialized tool kits"].includes(s.title))
    .flatMap((s) => s.entries.filter((e) => !e.reference).map((e) => ({ section: s.title, ...e })));

  const weaponOf = (item) => (item?.kind === "weapon" ? byName(D.weapons, item.category) : null);
  const toolSetOf = (item) => (item?.kind === "kit" ? byName(D.toolSets, item.set) : null);
  const equipmentOf = (item) => (item?.kind === "equipment" ? byName(EQUIPMENT, item.entry) : null);
  const vehicleOf = (item) => (item?.kind === "vehicle" ? byName(D.vehicles, item.vehicle) : null);
  function armorLevel(item) {
    const n = Number(item?.level);
    return item?.kind === "armor" && Number.isInteger(n) && n >= 1 && n <= D.armor.levels.length ? n : null;
  }

  // ---- keywords ----
  const GEAR_KEYWORDS = [...D.keywords.positive.map((k) => ({ ...k, group: "positive" })), ...D.keywords.negative.map((k) => ({ ...k, group: "negative" }))];
  const WEAPON_KEYWORDS = D.keywords.weapon.map((k) => ({ ...k, group: "weapon" }));
  const ALL_KEYWORDS = [...GEAR_KEYWORDS, ...WEAPON_KEYWORDS];
  // On a weapon, Compact is the weapon keyword; anywhere else it's the gear one.
  const keyword = (name, item) => (item?.kind === "weapon" && byName(WEAPON_KEYWORDS, name)) || byName(GEAR_KEYWORDS, name) || byName(WEAPON_KEYWORDS, name);
  // Exclusions are written on one side only, so check both.
  const excludes = (a, b) => ALL_KEYWORDS.some((k) => (k.name === a && k.excludes?.includes(b)) || (k.name === b && k.excludes?.includes(a)));

  // What the item always has: its weapon category's intrinsic keywords, its armor level's keywords, and fixed ones.
  const builtIn = (item) => unique([...(weaponOf(item)?.intrinsic ?? []),
    ...(armorLevel(item) ? D.armor.levels[armorLevel(item) - 1] : []), ...strings(item?.fixed).filter((k) => keyword(k, item))]);
  // Built-in keywords, then the added ones that are real keywords.
  const keywordsOf = (item) => unique([...builtIn(item), ...strings(item?.keywords).filter((k) => keyword(k, item))]);

  // Whether this kind of item takes the keyword at all: weapon keywords only from the category's allowed list.
  function offered(item, name) {
    const k = keyword(name, item);
    if (!k) return false;
    if (k.group === "weapon") return Boolean(weaponOf(item)?.allowed.includes(name));
    return !(["weapon", "vehicle"].includes(item?.kind) && k.notOn?.includes(item.kind));
  }
  // Whether the keyword can go on alongside `others` (all the item's other keywords, built-in ones included).
  function canAdd(item, name, others = keywordsOf(item)) {
    if (others.includes(name) || !offered(item, name)) return false;
    return !others.some((o) => excludes(name, o)) && (keyword(name, item).requires ?? []).every((r) => others.includes(r));
  }

  // Every keyword the item could show in a picker: weapon keywords (weapons only), then gear keywords.
  function keywordChoices(item) {
    const all = keywordsOf(item), always = builtIn(item);
    const names = [...(weaponOf(item)?.allowed ?? []).map((name) => [name, "weapon"]),
      ...GEAR_KEYWORDS.filter((k) => !(item?.kind === "weapon" && k.name === "Compact")).map((k) => [k.name, "gear"])];
    return names.map(([name, group]) => {
      const isBuiltIn = always.includes(name);
      return { name, group, text: keyword(name, item).text, builtIn: isBuiltIn, checked: all.includes(name),
        allowed: isBuiltIn || canAdd(item, name, all.filter((n) => n !== name)) };
    });
  }

  // Drops added keywords the item can't have (in order, so the earlier of two clashing keywords stays), then any
  // whose requirement went with them.
  function legalize(item) {
    let kept = [];
    for (const k of strings(item?.keywords)) {
      const others = keywordsOf({ ...item, keywords: kept });
      if (!builtIn(item).includes(k) && offered(item, k) && !others.includes(k) && !others.some((o) => excludes(k, o))) kept.push(k);
    }
    for (let changed = true; changed;) {
      const all = keywordsOf({ ...item, keywords: kept });
      const next = kept.filter((k) => (keyword(k, item).requires ?? []).every((r) => all.includes(r)));
      changed = next.length !== kept.length;
      kept = next;
    }
    return { ...item, keywords: kept };
  }

  // Another kind: keeps the name, quantity, starter, conditions and keywords that still fit; drops the old kind's fields
  // and any fixed keywords (an ability granted those to this kind of item).
  function retype(item, kind) {
    const next = { ...item, kind };
    if (kind !== item.kind) for (const f of [...KIND_FIELDS, "fixed"]) delete next[f];
    return legalize(next);
  }

  // ---- what it shows ----
  function stats(item) {
    switch (item?.kind) {
      case "weapon": {
        const w = weaponOf(item);
        if (!w) return {};
        const mods = keywordsOf(item).map((k) => keyword(k, item));
        return { hands: mods.find((k) => k.hands)?.hands ?? w.hands, damage: mods.reduce((sum, k) => sum + (k.damage ?? 0), w.damage) };
      }
      case "kit": return QUALITIES[item.quality] ? { impact: QUALITIES[item.quality] } : {};
      case "armor": return armorLevel(item) ? { armored: armorLevel(item) } : {};
      case "vehicle": return vehicleOf(item) ? { size: vehicleOf(item).size } : {};
      default: return {};
    }
  }

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const armored = (n) => `Armored${n > 1 ? ` x${n}` : ""}`;
  const choiceName = (e, choice) => (e?.choice?.skill ? skillName(choice) : e?.choice?.options.includes(choice) ? choice : null);
  // The muted line after an item's name, e.g. "Pistol · 1h · +20 dmg". Anything unknown shows as "?".
  function label(item) {
    const s = stats(item), join = (parts) => parts.filter(Boolean).join(" · ");
    switch (item?.kind ?? "prop") {
      case "weapon": {
        const w = weaponOf(item);
        return w ? join([w.name, s.hands && `${s.hands}h`, `+${s.damage} dmg`]) : "Weapon · ?";
      }
      case "kit": return join(["Kit", toolSetOf(item)?.name ?? "?", s.impact ? cap(item.quality) : "?", s.impact && `+${s.impact} impact`,
        skillName(item.special) && `for ${skillName(item.special)}`, item.consumable === true && "consumable"]);
      case "equipment": {
        const e = equipmentOf(item);
        if (!e) return "Equipment · ?";
        return join(["Equipment", e.section, e.name.toLowerCase() !== String(item.description ?? "").toLowerCase() && e.name, choiceName(e, item.choice)]);
      }
      case "armor": return `Armor · ${armorLevel(item) ? armored(armorLevel(item)) : "?"}`;
      case "vehicle": return vehicleOf(item) ? `Vehicle · ${vehicleOf(item).name} · ${s.size}` : "Vehicle · ?";
      case "prop": return "prop";
      default: return "?";
    }
  }

  // A name for an item the player didn't name, from what it is: "Improvised Hacker's Deck", "Rail Pistol",
  // "Environment Suit (Underwater)", "Body Armor x2". Each word starts with a capital.
  const title = (s) => s.replace(/(^|\s)(\S)/g, (_, gap, c) => gap + c.toUpperCase());
  const WEAPON_NOUN = { "One-handed melee": "One-handed melee weapon", "Two-handed melee": "Two-handed melee weapon", Thrown: "Thrown weapon" };
  function defaultName(item) {
    const named = (base, extra) => title(base) + (extra ? ` (${extra})` : "");
    switch (item?.kind ?? "prop") {
      case "weapon": {
        const w = weaponOf(item);
        if (!w) return "Weapon";
        const added = strings(item.keywords).filter((k) => keyword(k, item)?.group === "weapon" && !builtIn(item).includes(k));
        return title([...added, WEAPON_NOUN[w.name] ?? w.name].join(" "));
      }
      case "kit": {
        const set = toolSetOf(item);
        return set ? named([QUALITIES[item.quality] ? item.quality : "", set.name].filter(Boolean).join(" "), skillName(item.special)) : "Kit";
      }
      case "equipment": {
        const e = equipmentOf(item);
        if (!e) return "Equipment";
        return named(e.section === "Guided skill software" ? `${e.name} ${e.section}` : e.name, choiceName(e, item.choice));
      }
      case "armor": return `Body Armor${armorLevel(item) > 1 ? ` x${armorLevel(item)}` : ""}`;
      case "vehicle": return vehicleOf(item)?.name ?? "Vehicle";
      case "prop": return "Prop";
      default: return "Gear";
    }
  }

  // The pop-up text for an item, in the format.js description format: each of its keywords and what it does.
  const rulesText = (item) => keywordsOf(item).map((name) => `**${name}:** ${keyword(name, item).text}`).join("\n\n");

  // ---- Create: starting gear from the rules.js templates and the player's picks ----
  // creation.gear holds the "choose one" answers by line; creation.gearPicks holds, by item id, { category?, vehicle?,
  // keywords } and, under "weapon-mount", Weapon Mount's { target: item id, keywords: [one] }. Picks that don't fit are
  // ignored, so stale ones (from another option or a dropped augmentation) do no harm.
  const MOUNT = "weapon-mount";
  const picksOf = (cr) => (cr?.gearPicks && typeof cr.gearPicks === "object" ? cr.gearPicks : {});
  const augmentationsOf = (cr, rules) => [...(C.ruleFor(rules.origins, cr?.origin)?.augmentations ?? []),
    ...(Array.isArray(cr?.augmentations) ? cr.augmentations : [])];

  function fromTemplate(t, id, pick) {
    const category = t.categories ? (t.categories.includes(pick?.category) ? pick.category : undefined) : t.category;
    const vehicle = t.vehicles ? (t.vehicles.includes(pick?.vehicle) ? pick.vehicle : undefined) : t.vehicle;
    const item = C.newGear({ id, kind: t.kind, description: t.name, starter: true, quantity: t.quantity ?? 1, fixed: t.fixed ?? [],
      ...(category && { category }), ...(vehicle && { vehicle }), ...(t.set && { set: t.set, quality: t.quality }) });
    // the book's keywords first, so a pick that clashes with one is the one dropped
    return legalize({ ...item, keywords: [...(t.keywords ?? []), ...strings(pick?.keywords).slice(0, t.pick ?? 0)] });
  }

  // Every starting item, before Weapon Mount: archetype lines (step "perk"), then augmentation gear (step "origin").
  function baseSlots(cr, rules) {
    const picks = picksOf(cr), slots = [];
    const add = (id, step, template) => slots.push({ id, step, template, item: fromTemplate(template, id, picks[id]) });
    (C.ruleFor(rules.archetypes, cr?.archetype)?.gear ?? []).forEach((line, i) => {
      const n = line.choose ? cr.gear?.[i] : 0;
      const option = line.choose ? (Number.isInteger(n) ? line.choose[n] : null) : line;
      option?.items.forEach((t, j) => add(`create-gear-${i}-${n}-${j}`, "perk", t));
    });
    for (const aug of augmentationsOf(cr, rules)) (C.ruleFor(rules.augmentationGear, aug) ?? []).forEach((t, j) => add(`create-aug-${aug}-${j}`, "origin", t));
    return slots;
  }

  // Weapon Mount: a starting weapon that can be Mounted, one-handed (or Miniaturized), and isn't Mounted already.
  const mountable = (slots) => slots.filter(({ item }) => weaponOf(item)?.allowed.includes("Mounted")
    && stats(item).hands === 1 && !keywordsOf(item).includes("Mounted")).map((s) => s.id);
  const weaponMountTargets = (creation, rules) => mountable(baseSlots(creation, rules));

  // [{ id, step, template, item }] for every starting item, with Weapon Mount applied to its target.
  function starterSlots(creation, rules) {
    const slots = baseSlots(creation, rules), mount = picksOf(creation)[MOUNT];
    if (augmentationsOf(creation, rules).includes(MOUNT) && mountable(slots).includes(mount?.target)) {
      const slot = slots.find((s) => s.id === mount.target);
      slot.item = legalize({ ...slot.item, keywords: [...slot.item.keywords, "Mounted", ...strings(mount.keywords).slice(0, 1)] });
    }
    return slots;
  }

  // What a slot still needs: a category or vehicle (true while missing), and how many keywords are left to pick.
  function slotOpen({ template: t, item }, pick) {
    const picked = strings(pick?.keywords).slice(0, t.pick ?? 0).filter((k) => item.keywords.includes(k));
    return { keywords: (t.pick ?? 0) - picked.length, ...(t.categories && { category: !item.category }), ...(t.vehicles && { vehicle: !item.vehicle }) };
  }

  // Whether every starting item from that step ("perk" or "origin") has all its picks, and none extra.
  function gearComplete(creation, rules, step) {
    const picks = picksOf(creation), slots = starterSlots(creation, rules);
    const done = slots.filter((s) => s.step === step).every((s) => {
      const open = slotOpen(s, picks[s.id]);
      return !open.category && !open.vehicle && open.keywords === 0 && strings(picks[s.id]?.keywords).length === (s.template.pick ?? 0);
    });
    if (!done || step !== "origin" || !augmentationsOf(creation, rules).includes(MOUNT)) return done;
    const mount = picks[MOUNT], k = strings(mount?.keywords);
    if (!weaponMountTargets(creation, rules).includes(mount?.target) || k.length !== 1) return false;
    const before = baseSlots(creation, rules).find((s) => s.id === mount.target).item;
    return !keywordsOf(before).includes(k[0]) && slots.find((s) => s.id === mount.target).item.keywords.includes(k[0]);
  }

  root.NCD_GEAR = { KINDS, QUALITIES, EQUIPMENT, keyword, builtIn, keywordsOf, canAdd, keywordChoices, legalize, retype, stats, label, defaultName, rulesText,
    starterSlots, weaponMountTargets, slotOpen, gearComplete };
})(globalThis);
