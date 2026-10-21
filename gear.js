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
    ...(armorLevel(item) ? D.armor.levels[armorLevel(item) - 1] : []), ...strings(item?.fixed)]);
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

  // Another kind: keeps the name, quantity, starter, conditions and keywords that still fit; drops the old kind's fields.
  function retype(item, kind) {
    const next = { ...item, kind };
    if (kind !== item.kind) for (const f of KIND_FIELDS) delete next[f];
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
  // The muted line after an item's name, e.g. "Pistol · 1h · +20". Anything unknown shows as "?".
  function label(item) {
    const s = stats(item), join = (parts) => parts.filter(Boolean).join(" · ");
    switch (item?.kind ?? "prop") {
      case "weapon": {
        const w = weaponOf(item);
        return w ? join([w.name, s.hands && `${s.hands}h`, `+${s.damage}`]) : "Weapon · ?";
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

  // Its rules, in the format.js description format: what the book says about it, then each of its keywords.
  function rulesText(item) {
    const parts = [];
    switch (item?.kind ?? "prop") {
      case "weapon": {
        const w = weaponOf(item);
        if (w) parts.push(`**${w.name}** (${label(item)} damage)`, `*${w.examples}*`);
        break;
      }
      case "kit": {
        const set = toolSetOf(item), quality = KIT_QUALITIES.find((e) => e.quality === item.quality);
        if (set) parts.push(`**${set.name}:** ${set.skills.map(skillName).join(", ")}`);
        if (quality) parts.push(`**${quality.name}:** ${quality.text}`);
        if (skillName(item.special)) parts.push(`**Hyper-specialized for ${skillName(item.special)}:** ${byName(entries("Specialized tool kits"), "Hyper-Specialized Tools").text}`);
        if (item.consumable === true) parts.push(`**Consumable:** ${byName(entries("Specialized tool kits"), "Consumable Tools").text}`);
        break;
      }
      case "equipment": {
        const e = equipmentOf(item);
        if (e) parts.push(`**${e.section} · ${e.name}**${e.tag ? ` (${e.tag})` : ""}`, e.text);
        if (choiceName(e, item.choice)) parts.push(`**${e.choice.label}:** ${choiceName(e, item.choice)}`);
        break;
      }
      case "armor": parts.push(`**${armorLevel(item) ? armored(armorLevel(item)) : D.armor.name}**`, D.armor.text); break;
      case "vehicle": {
        const v = vehicleOf(item);
        if (v) parts.push(`**${v.name}** (${v.size})`, `*${v.blurb}*`, v.text);
        break;
      }
      case "prop": parts.push(byName(entries("Gear basics"), "Props").text); break;
    }
    for (const name of keywordsOf(item)) parts.push(`**${name}:** ${keyword(name, item).text}`);
    return parts.join("\n\n");
  }

  root.NCD_GEAR = { KINDS, QUALITIES, EQUIPMENT, keyword, builtIn, keywordsOf, canAdd, keywordChoices, legalize, retype, stats, label, rulesText };
})(globalThis);
