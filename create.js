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
  const placeholder = (body) => { body.innerHTML = `<p class="create-placeholder">Coming soon.</p>`; };
  const needsArchetype = (body) => { body.innerHTML = `<p class="create-placeholder">Pick an archetype first.</p>`; };

  // A selectable card: a button with a name and a line of text, plus `more` (shown below the button, e.g. rules text).
  const card = (attr, value, on, name, line, more = "") => `<div class="create-card${on ? " selected" : ""}">
      <button type="button" class="create-card-pick" ${attr}="${esc(value)}" aria-pressed="${on}">
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
      card("data-archetype", name, name === picked, name, rules().archetypes[name]?.pitch)).join("")}</div>`;
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
    const cr = character.creation, arch = rules().archetypes[cr.archetype];
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
      const now = ctx.current().creation, max = rules().archetypes[now.archetype]?.knows.count ?? 0;
      if (box.dataset.know) ctx.choose({ knows: toggled(now.knows, box.dataset.know, box.checked, max) }, `[data-know="${box.dataset.know}"]`);
      else ctx.choose({ bumps: toggled(now.bumps, box.dataset.bump, box.checked, C.BUMP_COUNT) }, `[data-bump="${box.dataset.bump}"]`);
    });
  }

  // Perk & Gear: the archetype's five perks (the picked one shows its rules text), then the starting gear,
  // fixed lines as written and each "choose one" line as radio buttons.
  function renderPerk(body, character) {
    const cr = character.creation, arch = rules().archetypes[cr.archetype];
    if (!arch) { needsArchetype(body); return; }
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
          : `<li><wa-radio-group label="Choose one" data-gear="${i}" ${cr.gear?.[i] != null ? `value="${cr.gear[i]}"` : ""}>${
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

  // Each is (body, character, ctx); origin comes in a later task.
  const STEP_RENDERERS = {
    archetype: renderArchetype,
    skills: renderSkills,
    perk: renderPerk,
    origin: placeholder,
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
