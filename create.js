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
  //   choose(changes)    saves creation choices: withCreation (resets and re-derives the sheet), then commit
  //   save(character)    saves a changed character as is (handle, name, appearance, portrait)
  //   hooks, rules, catalog
  const ctx = {
    current: () => shown.character,
    choose: (changes) => shown.hooks.change(C.withCreation(shown.character, changes, rules(), catalog())),
    save: (character) => shown.hooks.change(character),
    get hooks() { return shown.hooks; },
    get rules() { return rules(); },
    get catalog() { return catalog(); },
  };

  // ---- steps: each renders its controls into `body` ----
  const placeholder = (body) => { body.innerHTML = `<p class="create-placeholder">Coming soon.</p>`; };

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

  // Tasks to come fill in archetype, skills, perk and origin; each is (body, character, ctx).
  const STEP_RENDERERS = {
    archetype: placeholder,
    skills: placeholder,
    perk: placeholder,
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
  // pickPortrait() -> Promise<file | null>, renderSummary(el).
  function render(el, character, hooks) {
    const step = stepOf(character);
    const keep = LIVE_STEPS.has(step) && shown?.character.id === character.id && el.dataset.step === step;
    shown = { character, hooks };
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
