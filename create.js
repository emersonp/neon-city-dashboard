// Create mode: a new character built step by step from the rulebook (rules.js), shown in the Character tab.
// The choices live in character.creation (characters.js); roster.js saves every change right away (hooks.change).
// The step header and Back / Next / Finish / Discard are shared; each step's controls come from STEP_RENDERERS.
(function (root) {
  const C = root.NCD_CHARACTERS;

  const LABELS = { archetype: "Archetype", skills: "Skills", perk: "Perk & Gear", origin: "Origin", details: "Details", review: "Review" };

  // The character and hooks of the latest render. Handlers read it when they run, so a kept step body never acts on an old copy.
  let shown = null;
  const esc = (s) => root.NCD_UTIL.escapeHTML(s);
  const text = (v) => root.NCD_UTIL.text(v);
  const rules = () => root.NCD_RULES;
  const catalog = () => root.NCD_ABILITIES ?? [];

  // What each step renderer gets as `ctx`:
  //   current()          the character as it is now (use this in event handlers)
  //   choose(changes, focus?)  saves creation choices: withCreation (resets and re-derives the sheet), then commit.
  //                      The step body is rebuilt, so `focus` (a selector in the new body) gets focus back afterwards.
  //   save(character)    saves a changed character as is (handle, name, appearance, portrait)
  //   hooks, rules, catalog
  const ctx = {
    current: () => shown.character,
    choose: (changes, focus) => {
      shown.hooks.change(C.withCreation(shown.character, changes, rules(), catalog()));
      // after a frame: Web Awesome controls in the new body only become focusable once they've rendered
      if (focus) root.requestAnimationFrame(() => shown.el.querySelector(`.create-body ${focus}`)?.focus());
    },
    save: (character) => shown.hooks.change(character),
    get hooks() { return shown.hooks; },
    get rules() { return rules(); },
    get catalog() { return catalog(); },
  };

  // ---- steps: each renders its controls into `body` ----
  const needsArchetype = (body) => { body.innerHTML = `<p class="create-placeholder">Pick an archetype first.</p>`; };

  // A selectable card: a button with a name and a line of text, plus `more` (shown below the button, e.g. rules text).
  // `off` disables the button (a list that is already full).
  const card = (attr, value, on, name, line, more = "", off = false) => `<div class="create-card${on ? " selected" : ""}${off ? " off" : ""}">
      <button type="button" class="create-card-pick" ${attr}="${esc(value)}" aria-pressed="${on}"${off ? " disabled" : ""}>
        <span class="create-card-name">${esc(name)}</span>${line ? `<span class="create-card-text">${esc(line)}</span>` : ""}</button>
      ${more}</div>`;
  // Checking a box adds the value, unchecking removes it; a list already at `max` stays as it is.
  const toggled = (list, value, on, max) => (!on ? list.filter((v) => v !== value)
    : list.includes(value) || list.length >= max ? list : [...list, value]);

  // Archetype: one card each. Changing it clears the knowledge, perk, gear, and augmentation picks made for the old one.
  const hasPicks = (cr) => cr.knows.length > 0 || cr.perk != null || Object.keys(cr.gear ?? {}).length > 0 || cr.augmentations.length > 0;
  function renderArchetype(body, character) {
    const picked = character.creation.archetype;
    body.innerHTML = `<div class="create-cards" role="group" aria-label="Archetype">${C.ARCHETYPES.map((name) =>
      card("data-archetype", name, name === picked, name, C.ruleFor(rules().archetypes, name)?.pitch)).join("")}</div>`;
    body.addEventListener("click", (e) => {
      const archetype = e.target.closest("[data-archetype]")?.dataset.archetype;
      if (!archetype) return;
      const before = ctx.current().creation;
      ctx.choose({ archetype }, `[data-archetype="${archetype}"]`);
      if (hasPicks(before) && !hasPicks(ctx.current().creation)) {
        root.NCD_APP.toast("Changing archetype cleared your perk, gear, knowledge, and augmentation picks.", "warning");
      }
    });
  }

  // Skills: the archetype's Things You Know About, then every skill as the archetype (and bumps) leave it, with a +5 toggle
  // on each skill that can take one. The initiatives are shown but can't be bumped.
  function renderSkills(body, character) {
    const cr = character.creation, arch = C.ruleFor(rules().archetypes, cr.archetype);
    if (!arch) { needsArchetype(body); return; }
    const { count, from } = arch.knows, knowsFull = cr.knows.length >= count;
    const legal = C.bumpable(cr, rules()), bumpsFull = cr.bumps.length >= C.BUMP_COUNT;
    const row = (sk) => {
      const st = C.skill(character, sk.id), on = cr.bumps.includes(sk.id);
      const toggle = legal.includes(sk.id)
        ? `<wa-checkbox size="s" class="bump" data-bump="${sk.id}" ${on ? "checked" : ""} ${!on && bumpsFull ? "disabled" : ""}>+5<span
            class="visually-hidden"> to ${esc(sk.name)}</span></wa-checkbox>`
        : `<span class="bump"></span>`;
      return `<li${on ? ` class="bumped"` : ""}><span class="skill-name">${esc(sk.name)}</span>${ctx.hooks.diceIcons(st)}
          <span class="skill-value${st.value == null ? " untrained" : ""}">${C.shownValue(st.value)}%</span>${toggle}</li>`;
    };
    body.innerHTML = `<div class="knows-edit" role="group" aria-labelledby="create-knows-label">
        <span class="sheet-label" id="create-knows-label">Knows something about… <span class="create-hint">Choose ${count}</span></span>
        <div class="knows-boxes">${from.map((k) => {
          const on = cr.knows.includes(k);
          return `<wa-checkbox data-know="${esc(k)}" ${on ? "checked" : ""} ${!on && knowsFull ? "disabled" : ""}>${esc(k)}</wa-checkbox>`;
        }).join("")}</div>
      </div>
      <p class="create-count">Bumps: ${cr.bumps.length} / ${C.BUMP_COUNT} <span class="create-hint">+5% to ${C.BUMP_COUNT} different skills</span></p>
      <div class="skills create-skill-list">${ctx.hooks.skillGroups(row)}</div>`;
    body.addEventListener("change", (e) => {
      const box = e.target.closest("[data-know], [data-bump]");
      if (!box) return;
      const now = ctx.current().creation, max = C.ruleFor(rules().archetypes, now.archetype)?.knows.count ?? 0;
      if (box.dataset.know) ctx.choose({ knows: toggled(now.knows, box.dataset.know, box.checked, max) }, `[data-know="${box.dataset.know}"]`);
      else ctx.choose({ bumps: toggled(now.bumps, box.dataset.bump, box.checked, C.BUMP_COUNT) }, `[data-bump="${box.dataset.bump}"]`);
    });
  }

  // Perk & Gear: the archetype's five perks (the picked one shows its rules text), then the starting gear,
  // fixed lines as written and each "choose one" line as radio buttons.
  function renderPerk(body, character) {
    const cr = character.creation, arch = C.ruleFor(rules().archetypes, cr.archetype);
    if (!arch) { needsArchetype(body); return; }
    // several "choose one" lines each get their own label, so screen readers can tell them apart
    const choices = arch.gear.filter((line) => typeof line !== "string").length;
    let nth = 0;
    const perks = C.findAbilities(catalog().filter((a) => a.type === "perk" && a.archetype === cr.archetype))[0]?.items ?? [];
    body.innerHTML = `<section class="create-perks">
        <h3 class="create-heading">Perk <span class="create-hint">Choose 1</span></h3>
        <div class="create-cards create-perk-cards" role="group" aria-label="Perk">${perks.map((a) => {
          const on = a.id === cr.perk;
          return card("data-perk", a.id, on, a.name, a.summary,
            on && a.description ? `<div class="ability-text">${ctx.hooks.abilityText(a)}</div>` : "");
        }).join("")}</div>
      </section>
      <section class="gear">
        <h3 class="create-heading">Starting Gear</h3>
        <ul class="gear-list create-gear">${arch.gear.map((line, i) => typeof line === "string"
          ? `<li><span class="gear-text">${esc(line)}</span></li>`
          : `<li><wa-radio-group label="Choose one${choices > 1 ? ` (${++nth} of ${choices})` : ""}" data-gear="${i}" ${cr.gear?.[i] != null ? `value="${cr.gear[i]}"` : ""}>${
              line.choose.map((option, n) => `<wa-radio value="${n}">${esc(option)}</wa-radio>`).join("")}</wa-radio-group></li>`).join("")}</ul>
      </section>`;
    body.addEventListener("click", (e) => {
      const perk = e.target.closest("[data-perk]")?.dataset.perk;
      if (perk) ctx.choose({ perk }, `[data-perk="${perk}"]`);
    });
    body.addEventListener("change", (e) => {
      const group = e.target.closest("[data-gear]");
      if (!group || group.value === "" || group.value == null) return;
      const i = group.dataset.gear, n = Number(group.value);
      ctx.choose({ gear: { ...ctx.current().creation.gear, [i]: n } }, `[data-gear="${i}"] wa-radio[value="${n}"]`);
    });
  }

  // Origin: one card each (with the augmentations it grants), then the starting augmentation(s) for this origin and archetype,
  // then the optional origin option with its dice placements (and Lycanthropy's +5%s), previewed on the skills they touch.
  const DICE_KIND = { adv: "advantage", chal: "challenge" };
  const placementLabel = (p) => `${p.count} ${DICE_KIND[p.kind]} ${p.count === 1 ? "die" : "dice"} on a ${p.differentFrom ? "different " : ""}${p.category} skill`;
  const skillName = (id) => C.SKILLS.find((s) => s.id === id)?.name ?? id;
  const abilityName = (id) => catalog().find((a) => a.id === id)?.name ?? id;
  const augmentationsFor = (cr) => C.findAbilities(catalog().filter((a) =>
    a.type === "augmentation" && a.origin === cr.origin && a.archetype === cr.archetype))[0]?.items ?? [];
  // Physical skills Lycanthropy's +5% can go on (as with the 4 bumps, not ones the archetype already has at 95)
  const optionBumpable = (cr, category) => C.bumpable(cr, rules()).filter((id) => C.SKILLS.find((s) => s.id === id)?.type === category);

  function renderOrigin(body, character) {
    const cr = character.creation, arch = C.ruleFor(rules().archetypes, cr.archetype);
    if (!arch) { needsArchetype(body); return; }
    const origins = rules().origins, origin = C.ruleFor(origins, cr.origin);
    const option = origin?.options.find((o) => o.id === cr.option) ?? null;
    const originCards = `<div class="create-cards" role="group" aria-label="Origin">${C.ORIGINS.map((name) => {
      const autos = C.ruleFor(origins, name)?.augmentations ?? [];
      return card("data-origin", name, name === cr.origin, name, C.ruleFor(origins, name)?.pitch,
        autos.length ? `<p class="create-card-note">Includes ${esc(autos.map(abilityName).join(" and "))}.</p>` : "");
    }).join("")}</div>`;
    if (!origin) { body.innerHTML = originCards; wireOrigin(body); return; }

    const max = option?.extraAugmentation ? 2 : 1, augsFull = cr.augmentations.length >= max;
    const augs = augmentationsFor(cr).map((a) => {
      const on = cr.augmentations.includes(a.id);
      return card("data-aug", a.id, on, a.name, a.summary,
        a.description ? `<div class="ability-text">${ctx.hooks.abilityText(a)}</div>` : "", max > 1 && augsFull && !on);
    }).join("");

    const options = `<wa-radio-group label="Origin option" data-option value="${esc(cr.option ?? "none")}">
        <wa-radio value="none"><span class="create-option-name">None</span></wa-radio>
        ${origin.options.map((o) => `<wa-radio value="${esc(o.id)}"><span class="create-option-name">${esc(o.name)}</span>
          <span class="create-option-text">${esc(o.text)}</span></wa-radio>`).join("")}
      </wa-radio-group>`;

    const places = (option?.placements ?? []).map((p) => {
      const at = cr.placements?.[p.key];
      return `<wa-select data-place="${esc(p.key)}" label="${esc(placementLabel(p))}" placeholder="Choose a skill" with-clear
          ${at ? `value="${esc(at)}"` : ""}>${C.placeable(cr, p.key, rules()).map((id) =>
            `<wa-option value="${esc(id)}">${esc(skillName(id))}</wa-option>`).join("")}</wa-select>`;
    }).join("");

    const ob = option?.bumps, obFull = ob && cr.optionBumps.length >= ob.count;
    const optionBumps = !ob ? "" : `<div class="knows-edit" role="group" aria-labelledby="create-option-bumps-label">
        <span class="sheet-label" id="create-option-bumps-label">+5% to ${ob.count} ${esc(ob.category)} skills
          <span class="create-hint">${cr.optionBumps.length} / ${ob.count}</span></span>
        <div class="knows-boxes">${optionBumpable(cr, ob.category).map((id) => {
          const on = cr.optionBumps.includes(id);
          return `<wa-checkbox data-obump="${esc(id)}" ${on ? "checked" : ""} ${!on && obFull ? "disabled" : ""}>${esc(skillName(id))}</wa-checkbox>`;
        }).join("")}</div>
      </div>`;

    // the skills the option touches, as they end up (in sheet order)
    const touched = new Set([...Object.values(cr.placements ?? {}), ...cr.optionBumps]);
    const preview = !touched.size ? "" : `<div class="skills create-skill-list"><section class="skill-group">
        <h3>Affected Skills</h3><ul>${C.SKILLS.filter((s) => touched.has(s.id)).map((sk) => {
          const st = C.skill(character, sk.id);
          return `<li><span class="skill-name">${esc(sk.name)}</span>${ctx.hooks.diceIcons(st)}
            <span class="skill-value${st.value == null ? " untrained" : ""}">${C.shownValue(st.value)}%</span></li>`;
        }).join("")}</ul></section></div>`;

    // The option comes first: it decides how many augmentations to pick (Chop Shop takes two).
    body.innerHTML = `${originCards}
      <section class="create-option">
        <h3 class="create-heading">Origin Option <span class="create-hint">Optional</span></h3>
        ${options}
        ${places || optionBumps ? `<div class="create-placements">${places}</div>${optionBumps}` : ""}
        ${preview}
      </section>
      <section class="create-augs">
        <h3 class="create-heading">Augmentation <span class="create-hint">${max > 1 ? `Choose ${max} different` : "Choose 1"}</span></h3>
        <div class="create-cards create-perk-cards" role="group" aria-label="Starting augmentation">${augs}</div>
      </section>`;
    wireOrigin(body);
  }

  function wireOrigin(body) {
    body.addEventListener("click", (e) => {
      const pick = e.target.closest("[data-origin], [data-aug]");
      if (!pick || pick.disabled) return;
      if (pick.dataset.origin) { ctx.choose({ origin: pick.dataset.origin }, `[data-origin="${pick.dataset.origin}"]`); return; }
      const cr = ctx.current().creation, id = pick.dataset.aug, on = cr.augmentations.includes(id);
      const max = C.ruleFor(rules().origins, cr.origin)?.options.find((o) => o.id === cr.option)?.extraAugmentation ? 2 : 1;
      // with room for only one, picking another swaps it
      const augmentations = max === 1 && !on ? [id] : toggled(cr.augmentations, id, !on, max);
      ctx.choose({ augmentations }, `[data-aug="${id}"]`);
    });
    body.addEventListener("change", (e) => {
      const cr = ctx.current().creation;
      const group = e.target.closest("[data-option]");
      if (group) {
        if (!group.value) return;
        const option = group.value === "none" ? null : group.value;
        ctx.choose({ option }, `[data-option] wa-radio[value="${group.value}"]`);
        return;
      }
      const select = e.target.closest("[data-place]");
      if (select) {
        const key = select.dataset.place, id = select.value || null;
        const placements = { ...cr.placements };
        if (id) placements[key] = id; else delete placements[key];
        ctx.choose({ placements }, `[data-place="${key}"]`);
        return;
      }
      const box = e.target.closest("[data-obump]");
      if (box) {
        const max = C.ruleFor(rules().origins, cr.origin)?.options.find((o) => o.id === cr.option)?.bumps?.count ?? 0;
        ctx.choose({ optionBumps: toggled(cr.optionBumps, box.dataset.obump, box.checked, max) }, `[data-obump="${box.dataset.obump}"]`);
      }
    });
  }

  // Details: who they are. Saved on every keystroke; the inputs aren't rebuilt meanwhile (see LIVE_STEPS), so they keep focus.
  const APPEARANCE = [["pronouns", "Pronouns"], ["physical", "Physical Appearance"], ["network", "Network Default"]];
  const reroll = (name, label) => `<wa-button slot="end" appearance="plain" size="s" data-reroll="${name}" title="${label}">
      <wa-icon name="dice" label="${label}"></wa-icon></wa-button>`;
  const portraits = () => C.availablePortraits(root.NCD_PORTRAITS);
  function showPortrait(body, file) {
    const img = body.querySelector(".create-portrait img");
    img.closest(".portrait-frame").classList.toggle("missing", !file);
    if (file) img.src = C.PORTRAIT_DIR + file; else img.removeAttribute("src");
  }
  function renderDetails(body, character) {
    body.innerHTML = `<div class="sheet-who">
        <div class="portrait-pick create-portrait">
          <span class="portrait-frame"><img class="portrait" alt=""><span class="portrait portrait-missing" role="img"
            aria-label="No portrait"><wa-icon name="user"></wa-icon></span><wa-button class="portrait-edit" size="s" data-portrait
            title="Choose portrait" ${portraits().length ? "" : "hidden"}><wa-icon name="pen" label="Choose portrait"></wa-icon></wa-button></span>
        </div>
        <div class="sheet-identity">
          <wa-input class="wide" data-detail="handle" label="Handle" autocomplete="off" required>${reroll("handle", "New random handle")}</wa-input>
          <wa-input class="wide" data-detail="name" label="Name" autocomplete="off">${reroll("name", "New random name")}</wa-input>
        </div>
      </div>
      <div class="appearance appearance-edit">${APPEARANCE.map(([key, label]) => key === "pronouns"
        ? `<wa-input data-detail="${key}" label="${label}" autocomplete="off"></wa-input>`
        : `<wa-textarea data-detail="${key}" label="${label}" rows="3" resize="auto"></wa-textarea>`).join("")}</div>`;
    const look = C.appearance(character);
    for (const el of body.querySelectorAll("[data-detail]")) {
      const key = el.dataset.detail;
      el.value = key === "handle" || key === "name" ? character[key] ?? "" : look[key];
    }
    showPortrait(body, C.portraitFile(character, portraits()));

    const saveDetail = (key, value) => {
      const c = ctx.current();
      ctx.save(key === "handle" || key === "name"
        ? { ...c, [key]: text(value) }
        : { ...c, appearance: { ...C.appearance(c), [key]: text(value) } });
    };
    body.addEventListener("input", (e) => {
      const el = e.target.closest("[data-detail]");
      if (el) saveDetail(el.dataset.detail, el.value);
    });
    body.addEventListener("click", (e) => {
      const name = e.target.closest("[data-reroll]")?.dataset.reroll;
      if (name) {
        const value = name === "handle" ? C.randomHandle() : C.randomName();
        body.querySelector(`[data-detail="${name}"]`).value = value;
        saveDetail(name, value);
      } else if (e.target.closest("[data-portrait]")) {
        ctx.hooks.pickPortrait().then((file) => {
          if (!file) return;
          showPortrait(body, file);
          ctx.save({ ...ctx.current(), portrait: file });
        });
      }
    });
  }

  // Review: the sheet as it will be, read-only.
  function renderReview(body, character) {
    body.innerHTML = `<p class="create-totals">Influence ${C.influence(character).starting} · Luck ${C.luck(character).max}</p>
      <div class="create-summary"></div>`;
    ctx.hooks.renderSummary(body.querySelector(".create-summary"));
  }

  // Each is (body, character, ctx).
  const STEP_RENDERERS = {
    archetype: renderArchetype,
    skills: renderSkills,
    perk: renderPerk,
    origin: renderOrigin,
    details: renderDetails,
    review: renderReview,
  };
  // Steps whose body is kept when the same step re-renders (only the header and buttons are redrawn), so typing keeps focus.
  // Their handlers must update their own inputs and read ctx.current().
  const LIVE_STEPS = new Set(["details"]);

  // ---- header and buttons ----
  const stepOf = (character) => (C.STEPS.includes(character.creation.step) ? character.creation.step : C.STEPS[0]);

  function renderHead(character, step) {
    const r = rules(), cat = catalog();
    const first = C.firstIncomplete(character, r, cat);
    // You can go to any step up to the first one left to do (all of them once everything is done).
    const reachable = first == null ? C.STEPS.length - 1 : C.STEPS.indexOf(first);
    return `<ol class="create-steps">${C.STEPS.map((s, i) => {
      const done = s !== "review" && C.stepComplete(character, s, r, cat);
      const cls = [s === step && "current", done && "done"].filter(Boolean).join(" ");
      return `<li class="${cls}"><button type="button" data-step="${s}" ${i > reachable || s === step ? "disabled" : ""}
          ${s === step ? `aria-current="step"` : ""}>
          <span class="create-step-mark">${done ? `<wa-icon name="check" label="Done"></wa-icon>` : i + 1}</span>
          <span class="create-step-label">${esc(LABELS[s])}</span></button></li>`;
    }).join("")}</ol>`;
  }

  function renderNav(character, step) {
    const i = C.STEPS.indexOf(step), last = i === C.STEPS.length - 1;
    const ready = C.stepComplete(character, step, rules(), catalog());
    return `<wa-button appearance="plain" variant="danger" data-nav="discard">
        <wa-icon slot="start" name="trash"></wa-icon>Discard</wa-button>
      <span class="create-nav-moves">
        <wa-button appearance="outlined" data-nav="back" ${i === 0 ? "disabled" : ""}>
          <wa-icon slot="start" name="arrow-left"></wa-icon>Back</wa-button>
        ${last
          ? `<wa-button variant="brand" data-nav="finish" ${ready ? "" : "disabled"}><wa-icon slot="start" name="check"></wa-icon>Finish</wa-button>`
          : `<wa-button variant="brand" data-nav="next" ${ready ? "" : "disabled"}>Next<wa-icon slot="end" name="arrow-right"></wa-icon></wa-button>`}
      </span>`;
  }

  // Next goes one step on, but never past a step left undone (going back can undo a later step's choices).
  function nextStep(character, step) {
    const first = C.firstIncomplete(character, rules(), catalog());
    const i = C.STEPS.indexOf(step) + 1;
    return C.STEPS[first == null ? i : Math.min(i, C.STEPS.indexOf(first))];
  }

  // ---- discard: confirmed in a dialog ----
  let discardWired = false;
  function openDiscard() {
    const dialog = root.document.getElementById("discard-dialog");
    if (!discardWired) {
      discardWired = true;
      root.document.getElementById("discard-confirm").addEventListener("click", () => {
        dialog.open = false;
        shown?.hooks.discard();
      });
    }
    root.document.getElementById("discard-text").textContent = `Discard ${C.label(shown.character)}? This can't be undone.`;
    dialog.open = true;
  }

  // Renders the character's current step into `el`. hooks (from roster.js): change(next), finish(), discard(),
  // pickPortrait() -> Promise<file | null>, renderSummary(el), and the sheet's own pieces: diceIcons(skillState),
  // abilityText(ability) -> HTML, skillGroups(rowHTML) -> every skill in the sheet's columns.
  function render(el, character, hooks) {
    character = { ...character, creation: C.fullCreation(character.creation) }; // steps can read every creation field
    const step = stepOf(character);
    const keep = LIVE_STEPS.has(step) && shown?.character.id === character.id && el.dataset.step === step;
    shown = { character, hooks, el };
    el.dataset.step = step;
    if (!el.dataset.wired) {
      el.dataset.wired = "true";
      el.innerHTML = `<nav class="create-head" aria-label="Steps"></nav><div class="create-body"></div><div class="create-nav"></div>`;
      el.addEventListener("click", (e) => {
        const c = shown.character, at = stepOf(c);
        const to = e.target.closest(".create-head [data-step]")?.dataset.step;
        const nav = e.target.closest(".create-nav [data-nav]");
        if (to) ctx.choose({ step: to });
        if (!nav || nav.disabled) return;
        switch (nav.dataset.nav) {
          case "back": ctx.choose({ step: C.STEPS[C.STEPS.indexOf(at) - 1] }); break;
          case "next": ctx.choose({ step: nextStep(c, at) }); break;
          case "finish": shown.hooks.finish(); break;
          case "discard": openDiscard(); break;
        }
      });
    }
    el.querySelector(".create-head").innerHTML = renderHead(character, step);
    el.querySelector(".create-nav").innerHTML = renderNav(character, step);
    if (keep) return;
    // a new element each time, so a step's listeners go with it
    const body = root.document.createElement("div");
    body.className = `create-body create-${step}`;
    el.querySelector(".create-body").replaceWith(body);
    STEP_RENDERERS[step](body, character, ctx);
  }

  root.NCD_CREATE = { LABELS, STEP_RENDERERS, LIVE_STEPS, render };
})(globalThis);
