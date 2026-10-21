// The Databank's Archetypes and Origins pages, and the text Create shows for an archetype, built from rules.js (the book's
// text and numbers), abilities.js (perks and augmentations) and advancement.js (the XP table). Nothing is written here
// twice: a fix in one of those files shows everywhere. No page code here, so it can be tested in Node.
//
// archetype(name) and origin(name) give the page's sections, in the book's order, each
//   { title, intro?, table?, outro?, entries?: [{ name, tag?, text }], double?, wide? }
// where intro, outro and text are in the format.js format, and a table is { head, rows, format? } (format: its cells
// are format.js text too, for dice icons).
(function (root) {
  const C = root.NCD_CHARACTERS;
  const R = () => root.NCD_RULES;
  const catalog = () => root.NCD_ABILITIES ?? [];
  const skillName = (id) => C.SKILLS.find((s) => s.id === id)?.name ?? id;
  const abilityName = (id) => catalog().find((a) => a.id === id)?.name ?? id;
  const list = (items) => items.map((s) => `- ${s}`).join("\n");
  const abilityEntry = (a, tag) => ({ name: a.name, ...(tag ? { tag } : {}), text: a.description ?? a.summary ?? "" });
  const byName = (a, b) => a.name.localeCompare(b.name);

  // An archetype's opening paragraph, and "What Does the … Do on the Job?": each lead line, then its list.
  const introText = (arch) => `*${arch.pitch}*\n\n${arch.intro}`;
  const jobTitle = (name) => `What Does the ${name} Do on the Job?`;
  const jobText = (arch) => arch.job.map((b) => `${b.lead}\n\n${list(b.items)}`).join("\n\n");

  const dice = (n, token) => `[${token}]`.repeat(n);
  function archetype(name) {
    const r = R(), arch = r.archetypes[name], t = r.text;
    const { count, from } = arch.knows;
    // runs of plain lines are one list; a "choose one" line is its own "Your choice of:" and list
    const gear = arch.gear.map((line) => (line.choose ? `Your choice of:\n\n${list(line.choose.map((o) => o.text))}` : `- ${line.text}`))
      .reduce((text, block, i) => `${text}${i && !(arch.gear[i].choose || arch.gear[i - 1].choose) ? "\n" : "\n\n"}${block}`, "");
    const perks = catalog().filter((a) => a.type === "perk" && a.archetype === name);
    return [
      { title: name, intro: introText(arch) },
      { title: jobTitle(name), intro: jobText(arch) },
      { title: "Things You Know About", intro: from.length === C.KNOWLEDGE.length ? t.knowsAny(count) : t.knowsFrom(count, from) },
      { title: "Initiative", intro: `${t.initiative}\n\n${list([["In the World", "world"], ["In the Network", "network"]]
        .map(([label, key]) => `**${label}:** ${C.shownValue(arch.initiative[key])}%`))}` },
      {
        title: "Skills", intro: t.skills, outro: t.bumps(C.BUMP_COUNT), double: true,
        table: { head: ["Skill", "Chance of Success", "Advantage/Challenge Dice"], format: true,
          rows: Object.entries(arch.skills).map(([id, s]) => [skillName(id), s.value == null ? "-" : `${s.value}%`,
            `${dice(s.adv, "advantage")}${dice(s.chal, "challenge")}` || "—"]) },
      },
      { title: "Starting Gear", intro: `${t.gear}${gear}` },
      { title: `${name} Perks`, intro: t.perks(name), entries: perks.map((a) => abilityEntry(a)), double: true },
      // what each origin gives this archetype to start with (the origin's page has them all)
      ...C.ORIGINS.map((origin) => ({
        title: `${origin} ${name} Augmentations`,
        entries: catalog().filter((a) => a.type === "augmentation" && a.origin === origin && a.archetype === name).map((a) => abilityEntry(a)),
      })),
    ];
  }

  function origin(name) {
    const r = R(), o = r.origins[name], t = r.text;
    const xpTable = t.xpTable(o.xpTable, name);
    const augmentations = catalog().filter((a) => a.type === "augmentation" && a.origin === name);
    const perks = catalog().filter((a) => a.type === "perk" && a.origin === name);
    const steps = [...o.augmentations.map((id) => t.grantedAugmentation(abilityName(id))), t.chooseAugmentation, t.options];
    return [
      { title: name, intro: introText(o) },
      { title: "When Creating Your Character", intro: `${t.creating}\n\n${list(steps)}`,
        entries: o.options.map((x) => ({ name: x.name, text: x.text })) },
      { title: "Advancement", intro: `${t.advancement(xpTable)} ${o.advancement}` },
      { title: xpTable, table: root.NCD_ADVANCEMENT.tableFor(name), wide: true },
      ...(perks.length ? [{ title: `${name} Character Perks`, intro: o.perksIntro, entries: perks.map((a) => abilityEntry(a)) }] : []),
      // the book's per-archetype tables, as one
      { title: `${name} Augmentations by Archetype`, double: true,
        table: { head: ["Archetype", "Augmentations"], rows: C.ARCHETYPES.map((arch) => [arch,
          augmentations.filter((a) => a.archetype === arch).map((a) => a.name).join(", ")]) } },
      { title: `${name} Augmentations`, intro: t.augmentations(name),
        entries: [...augmentations].sort(byName).map((a) => abilityEntry(a, a.archetype ?? "")) },
    ];
  }

  root.NCD_PROFILES = { introText, jobTitle, jobText, archetype, origin };
})(globalThis);
