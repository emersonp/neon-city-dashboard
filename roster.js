// Roster tab (the saved characters) and the Character tab, which appears once a character is opened.
// A character in the Character tab is in one of six states: display, editing, running, finishing (Finish Job's page),
// spending (Spend XP, after Finish Job), or creating. Run starts a job (C.startJob) if they aren't on one.
// A character saved while spending XP (A.isSpending) is only shown in Spend XP until it's confirmed, like one in creation.
// Skill changes made while editing live in `draft` until Save. A character still being created (C.isCreating) is only
// ever shown in Create (create.js), never Edit or Run.
(function () {
  const C = window.NCD_CHARACTERS;
  const APP = window.NCD_APP;
  const store = window.NCD_STORE;
  const SESSION = window.NCD_SESSION;
  const { $, text, escapeHTML } = window.NCD_UTIL;
  const icon = window.NCD_ICONS.svg;
  const ABILITIES = window.NCD_ABILITIES ?? [];
  const { formatDescription } = window.NCD_FORMAT;
  const GEAR_UI = window.NCD_GEAR_UI;
  const G = window.NCD_GEAR;
  const DICE = window.NCD_DICE;
  // The character helpers take localStorage itself, and handle it being null.
  const storage = store.raw;

  const tabs = $("tabs");
  const tab = $("character-tab");
  const rows = $("roster-rows");
  const display = $("character-display");
  const running = $("character-running");
  const fields = $("character-fields");
  const create = $("character-create");
  const finish = $("character-finish");
  const spend = $("character-spend");
  const A = window.NCD_ADVANCEMENT;
  const currentLuck = $("current-luck");
  const currentInfluence = $("current-influence");
  const woundsFields = $("wounds-fields");
  const woundsEdit = $("wounds-edit");
  const knowsEdit = $("knows-edit");
  for (const k of C.KNOWLEDGE) {
    const box = document.createElement("wa-checkbox");
    box.value = k;
    box.textContent = k;
    knowsEdit.append(box);
  }
  const form = $("character-form");
  const field = (name) => form.querySelector(`[name="${name}"]`);

  let current = null;     // the character in the Character tab
  let state = "display";  // "display" | "editing" | "running" | "finishing" | "spending" | "creating"
  let draft = null;       // while editing: a copy holding skill, wound, gear, and ability changes until Save

  // A character still in creation stays out of SESSION, so Dice-tab rolls don't post as it; Finish sets it.
  const setCurrent = (character) => { current = character; SESSION.character = C.playingAs(character); };

  // Saves the character right away (changes made while running, and Used). A failed save keeps the old one.
  function commit(next) {
    try {
      setCurrent(C.save(storage, next));
      return true;
    } catch (err) {
      console.error(err);
      APP.toast("Couldn't save the character.", "danger");
      return false;
    }
  }

  const portraits = C.availablePortraits(window.NCD_PORTRAITS);
  const portraitSrc = (file) => C.PORTRAIT_DIR + file;
  // Shows the portrait in an <img> inside a .portrait-frame, or the frame's placeholder when there's no file.
  function showPortrait(img, file, alt = "") {
    img.closest(".portrait-frame").classList.toggle("missing", !file);
    if (file) img.src = portraitSrc(file); else img.removeAttribute("src");
    img.alt = alt;
  }
  for (const [name, values] of [["archetype", C.ARCHETYPES], ["origin", C.ORIGINS]]) {
    for (const value of values) {
      const option = document.createElement("wa-option");
      option.value = value;
      option.textContent = value;
      field(name).append(option);
    }
  }

  // ---- the character's fields ----
  // Each editor field: how it's filled from the character (`load`), and how Save writes it back (`save`).
  // Save runs in this order, so Current Luck and Current Influence are checked against the new Max and Starting values.
  // The sheet's [data-field] boxes show the same `load` values.
  const textField = (name) => ({ name, load: (c) => c[name] ?? "", save: (e, v) => { e[name] = text(v); } });
  const appearanceField = (name) => ({
    name, load: (c) => C.appearance(c)[name], save: (e, v) => { e.appearance = { ...C.appearance(e), [name]: text(v) }; },
  });
  const FIELDS = [
    ...["handle", "name", "archetype", "origin"].map(textField),
    { name: "maxLuck", load: (c) => C.luck(c).max, save: (e, v) => { e.maxLuck = C.clampMaxLuck(v); } },
    { name: "currentLuck", load: (c) => C.luck(c).current, save: (e, v) => { e.currentLuck = C.clampCurrentLuck(v, e.maxLuck); } },
    { name: "startingInfluence", load: (c) => C.influence(c).starting, save: (e, v) => { e.startingInfluence = C.clampInfluence(v); } },
    { name: "currentInfluence", load: (c) => C.influence(c).current,
      save: (e, v) => { e.currentInfluence = C.clampInfluence(v, e.startingInfluence); } },
    { name: "xpAvailable", load: (c) => C.xp(c).available, save: (e, v) => { e.xpAvailable = C.clampXp(v); } },
    { name: "xpSpent", load: (c) => C.xp(c).spent, save: (e, v) => { e.xpSpent = C.clampXp(v); } },
    // No portrait is stored as null.
    { name: "portrait", load: (c) => C.portraitFile(c, portraits) ?? "", save: (e, v) => { e.portrait = v || null; } },
    ...["pronouns", "physical", "network"].map(appearanceField),
    textField("liability"),
    textField("story"),
  ];

  // ---- roster ----
  function renderRoster() {
    const list = C.load(storage);
    rows.innerHTML = list.length
      ? list.map((c) => `<tr>
          <td><a href="#" data-open="${escapeHTML(c.id)}">${escapeHTML(C.label(c))}</a>${A.isSpending(c)
            ? ` <wa-badge variant="brand" appearance="outlined">Spending XP</wa-badge>` : ""}</td>
          <td>${C.isCreating(c) ? `<wa-badge variant="warning" appearance="outlined">In creation</wa-badge>` : escapeHTML(c.archetype)}</td>
          <td>${C.isCreating(c) ? "" : escapeHTML(c.origin)}</td>
          <td class="actions">${!C.inJob(c) ? "" : `
            <wa-button size="s" appearance="outlined" variant="danger" data-abandon="${escapeHTML(c.id)}">
              <wa-icon slot="start" name="person-running"></wa-icon>Abandon Job
            </wa-button>`}${C.isCreating(c) ? "" : `
            <wa-button size="s" appearance="outlined" data-export="${escapeHTML(c.id)}">
              <wa-icon slot="start" name="file-export"></wa-icon>Export JSON
            </wa-button>`}
            <wa-button size="s" appearance="plain" variant="danger" data-delete="${escapeHTML(c.id)}" title="Delete">
              <wa-icon name="trash" label="Delete"></wa-icon></wa-button>
          </td>
        </tr>`).join("")
      : `<tr><td colspan="4" class="empty">No characters yet</td></tr>`;
  }

  function download({ filename, json }) {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  rows.addEventListener("click", (e) => {
    const open = e.target.closest("[data-open]");
    const exp = e.target.closest("[data-export]");
    const del = e.target.closest("[data-delete]");
    const abandon = e.target.closest("[data-abandon]");
    const find = (id) => C.load(storage).find((c) => c.id === id);
    if (open) {
      e.preventDefault();
      const c = find(open.dataset.open);
      if (c) { store.set("openCharacter", c.id); show(c, C.isCreating(c) ? "creating" : "display"); }
    } else if (exp) {
      const c = find(exp.dataset.export);
      if (c) download(C.toExport(c));
    } else if (del) {
      const c = find(del.dataset.delete);
      if (c) openDelete(c);
    } else if (abandon) {
      const c = find(abandon.dataset.abandon);
      if (c) openAbandon(c);
    }
  });

  // Abandon Job ends the job without finishing it: back to starting values and gear, with no XP or improvement.
  const abandonDialog = $("abandon-dialog");
  let abandoning = null;
  function openAbandon(character) {
    abandoning = character;
    $("abandon-text").textContent = `End ${C.label(character)}'s job without finishing it? They go back to their starting `
      + "values and starting gear, with no XP or improvement.";
    abandonDialog.open = true;
  }
  $("abandon-confirm").addEventListener("click", () => {
    const next = abandoning && C.abandonJob(C.load(storage).find((c) => c.id === abandoning.id) ?? abandoning);
    abandoning = null;
    abandonDialog.open = false;
    if (!next) return;
    if (current?.id === next.id) {
      if (!commit(next)) return;
      if (state !== "creating") state = "display";
      render();
    } else {
      try {
        C.save(storage, next);
      } catch (err) {
        console.error(err);
        APP.toast("Couldn't save the character.", "danger");
        return;
      }
    }
    renderRoster();
  });

  // Delete asks for the character's handle (C.label: "Character" when there's none) before it turns on.
  const deleteDialog = $("delete-dialog");
  const deleteHandle = $("delete-handle");
  const deleteConfirm = $("delete-confirm");
  let deleting = null;
  const handleTyped = () => deleting && deleteHandle.value.trim() === C.label(deleting);
  function openDelete(character) {
    deleting = character;
    $("delete-text").textContent = `Type ${C.label(character)} to delete them. This can't be undone.`;
    deleteHandle.value = "";
    deleteConfirm.disabled = true;
    deleteDialog.open = true;
  }
  deleteHandle.addEventListener("input", () => { deleteConfirm.disabled = !handleTyped(); });
  deleteConfirm.addEventListener("click", () => {
    if (!handleTyped()) return;
    try {
      C.remove(storage, deleting.id);
    } catch (err) {
      console.error(err);
      APP.toast("Couldn't delete the character.", "danger");
      return;
    }
    deleteDialog.open = false;
    if (current?.id === deleting.id) closeCharacter();
    deleting = null;
    renderRoster();
  });

  // Saved right away, so it's on the Roster while it's being created.
  $("new-character").addEventListener("click", () => {
    if (!commit(C.newCharacter())) return;
    store.set("openCharacter", current.id);
    renderRoster();
    show(current, "creating");
  });

  // ---- character tab ----
  const setLabel = (handle) => { tab.textContent = C.label({ handle }); };

  function show(character, mode, { activate = true } = {}) {
    setCurrent(character);
    // In creation: Create only. Finished: never Create. Spending XP: Spend XP only, and only then.
    state = C.isCreating(character) ? "creating" : A.isSpending(character) ? "spending"
      : mode === "creating" || mode === "spending" ? "display" : mode;
    tab.hidden = false;
    setLabel(current.handle);
    render();
    if (activate) customElements.whenDefined("wa-tab-group").then(() => { tabs.active = "character"; });
  }

  // Hides the Character tab and goes back to the Roster.
  function closeCharacter() {
    store.set("openCharacter", null);
    setCurrent(null);
    state = "display";
    tab.hidden = true;
    customElements.whenDefined("wa-tab-group").then(() => { tabs.active = "roster"; });
  }

  function render() {
    display.hidden = state !== "display";
    form.hidden = state !== "editing";
    running.hidden = state !== "running";
    finish.hidden = state !== "finishing";
    spend.hidden = state !== "spending";
    create.hidden = state !== "creating";
    fields.hidden = ["editing", "creating", "finishing", "spending"].includes(state);
    fields.dataset.state = state;
    if (state === "creating") {
      window.NCD_CREATE.render(create, current, createHooks);
    } else if (state === "editing") {
      draft = {
        skills: { ...(current.skills ?? {}) }, wounds: C.wounds(current), gear: C.gear(current), conditions: C.conditions(current),
        // all saved ids, even ones not in the catalog: if abilities.js fails to load, Save mustn't erase them
        abilities: C.abilityIds(current),
      };
      for (const f of FIELDS) field(f.name).value = String(f.load(current));
      showPortrait($("portrait-preview"), field("portrait").value);
      showSteppers();
      woundsEdit.innerHTML = woundBoxes(draft.wounds, true);
      const known = C.knows(current);
      for (const box of knowsEdit.querySelectorAll("wa-checkbox")) box.checked = known.includes(box.value);
      showXpTotal();
      renderSkillsEdit();
      renderConditions($("conditions-edit"), draft, { clickable: true });
      renderGear($("gear-edit"), draft, { editable: true });
      renderAbilitiesEdit();
    } else if (state === "finishing") {
      renderFinish();
    } else if (state === "spending") {
      renderSpend();
    } else {
      renderFields();
      if (state === "display") {
        display.querySelector("[data-run-label]").textContent = C.inJob(current) ? "Run" : "Start Job";
        renderAppearance($("appearance-display"));
        $("story-display-section").hidden = !C.story(current);
        renderStory($("story-display"));
        $("conditions-display-section").hidden = !C.conditions(current).length;
        renderConditions($("conditions-display"), current);
        renderSkillsDisplay($("skills-display"));
        renderGear($("gear-display"), current);
        renderAbilities($("abilities-display"), C.abilities(current, ABILITIES));
      } else {
        renderConditions($("conditions-run"), current, { clickable: true });
        renderAppearance($("appearance-run"));
        renderStory($("story-run"));
        renderSkillsDisplay($("skills-run"), { links: true });
        renderGear($("gear-run"), current, { running: true });
        renderAbilities($("abilities-run"), C.abilities(current, ABILITIES));
      }
    }
    showSheetTab();
    copyActions();
  }

  // ---- sheet tabs: Skills, Gear, Abilities, Story ----
  // Display, Running, and Edit each have their own tab group; switching modes keeps the same tab, and it's remembered.
  // Panels are named sheet-*, so form.querySelector('[name="story"]') still finds Edit's field, not its tab panel.
  const SHEET_TABS = ["sheet-skills", "sheet-gear", "sheet-abilities", "sheet-story"];
  let sheetTab = SHEET_TABS.includes(store.get("sheetTab")) ? store.get("sheetTab") : SHEET_TABS[0];
  function showSheetTab() {
    const group = [display, running, form].find((section) => !section.hidden)?.querySelector(".sheet-tabs");
    if (group) customElements.whenDefined("wa-tab-group").then(() => { group.active = sheetTab; });
  }
  $("character-card").addEventListener("wa-tab-show", (e) => {
    if (!e.target.classList.contains("sheet-tabs") || !SHEET_TABS.includes(e.detail.name)) return;
    sheetTab = e.detail.name;
    store.set("sheetTab", sheetTab);
  });

  // Handle, name, etc. Current Luck, Current Influence, and Wounds can be changed while running, and are saved right away.
  function renderFields() {
    showPortrait($("portrait"), C.portraitFile(current, portraits), `Portrait of ${C.label(current)}`);
    const values = Object.fromEntries(FIELDS.map((f) => [f.name, f.load(current)]));
    values.xpTotal = C.xp(current).total;
    const known = C.knows(current);
    $("knows-field").hidden = !known.length;
    $("knows").textContent = known.join(", ");
    for (const dd of fields.querySelectorAll("[data-field]")) {
      const v = values[dd.dataset.field];
      dd.textContent = v == null || v === "" ? "—" : v;
    }
    const editable = state === "running";
    // Running shows only the current luck and influence, labelled plainly.
    $("max-luck").hidden = editable;
    $("starting-influence").hidden = editable;
    $("xp-stat").hidden = editable;
    $("luck-label").textContent = editable ? "Luck" : "Current Luck";
    $("influence-label").textContent = editable ? "Influence" : "Current Influence";
    for (const button of currentLuck.querySelectorAll("[data-luck]")) {
      button.hidden = !editable;
      button.disabled = Number(button.dataset.luck) < 0 ? values.currentLuck <= 0 : values.currentLuck >= values.maxLuck;
    }
    for (const button of currentInfluence.querySelectorAll("[data-influence]")) {
      button.hidden = !editable;
      button.disabled = Number(button.dataset.influence) < 0 && values.currentInfluence <= 0;
    }
    woundsFields.innerHTML = woundBoxes(C.wounds(current), editable);
  }

  const SKULL = `<wa-icon name="skull"></wa-icon>`;
  // Four boxes, like the sheet. Editable boxes are buttons: box n marks 1..n.
  function woundBoxes(n, editable) {
    return Array.from({ length: C.MAX_WOUNDS }, (_, i) => {
      const on = i < n ? " on" : "";
      return editable
        ? `<button type="button" class="wound${on}" data-wound="${i + 1}" aria-pressed="${i < n}" aria-label="Wound ${i + 1}">${SKULL}</button>`
        : `<span class="wound${on}">${SKULL}</span>`;
    }).join("") + (editable ? "" : `<span class="visually-hidden">${n} of ${C.MAX_WOUNDS}</span>`);
  }
  const clickedWound = (e) => Number(e.target.closest("[data-wound]")?.dataset.wound) || 0;

  // Running: saved right away. Editing: kept in the draft until Save.
  woundsFields.addEventListener("click", (e) => {
    const n = clickedWound(e);
    if (!n || state !== "running") return;
    if (commit({ ...current, wounds: C.clickWound(C.wounds(current), n) })) renderFields();
  });
  woundsEdit.addEventListener("click", (e) => {
    const n = clickedWound(e);
    if (!n) return;
    draft.wounds = C.clickWound(draft.wounds, n);
    woundsEdit.innerHTML = woundBoxes(draft.wounds, true);
  });

  // Running: the −/+ buttons beside a stat (data-<attr>="step"). `value` reads the stat, `clamp` keeps it in range,
  // and `changed(delta, after)` runs once the new value is saved.
  function stepper(el, attr, { key, value, clamp, changed = () => {} }) {
    el.addEventListener("click", (e) => {
      const step = Number(e.target.closest(`[data-${attr}]`)?.dataset[attr]);
      if (!step || state !== "running") return;
      const before = value(), after = clamp(before + step);
      if (after === before || !commit({ ...current, [key]: after })) return;
      renderFields();
      changed(after - before, after);
    });
  }
  stepper(currentLuck, "luck", {
    key: "currentLuck", value: () => C.luck(current).current, clamp: (n) => C.clampCurrentLuck(n, C.luck(current).max),
  });
  // Only changes made while running are posted to Discord; changes in Edit aren't.
  stepper(currentInfluence, "influence", {
    key: "currentInfluence", value: () => C.influence(current).current, clamp: (n) => C.clampInfluence(n), changed: APP.postInfluence,
  });

  // Edit and Run aren't for a character still being created, or spending XP.
  const settled = () => !C.isCreating(current) && !A.isSpending(current);
  const enter = (mode) => () => { if (!settled()) return; state = mode; render(); };

  // ---- appearance: in the Story tab ----
  // The liability goes under it, except in Create's review (it's picked at the first End Session or Finish Job).
  const APPEARANCE = [["pronouns", "Pronouns"], ["physical", "Physical Appearance"], ["network", "Network Default"]];
  function renderAppearance(el, { liability = true } = {}) {
    const look = C.appearance(current);
    const field = (title, value, cls = "") => `<div class="sheet-field${cls}"><dt>${title}</dt><dd>${escapeHTML(value.trim() || "—")}</dd></div>`;
    el.innerHTML = APPEARANCE.map(([key, title]) => field(title, look[key])).join("")
      + (liability ? field("Liability", C.liability(current), " liability") : "");
  }

  // ---- repercussions and story rewards: in Display's and Running's Story tab; Running's pencil changes them in a dialog ----
  // (Edit has a box for them, and Finish Job's page starts with one.)
  const renderStory = (el) => { el.textContent = C.story(current) || "—"; };
  const storyDialog = $("story-dialog");
  const storyInput = $("story-input");
  running.addEventListener("click", (e) => {
    if (!e.target.closest("[data-edit-story]")) return;
    storyInput.value = C.story(current);
    storyDialog.open = true;
  });
  $("story-save").addEventListener("click", () => {
    if (!commit(C.withStory(current, storyInput.value))) return;
    storyDialog.open = false;
    render();
  });

  // ---- action bars ----
  // Each mode's bar sits at the bottom of its section (Display, Running, Edit's form) and is copied to the top of the
  // card (except data-bottom-only buttons, like Close), so a new button only goes in the bottom bar. Buttons say what
  // they do with data-sheet-action; Save is a submit button tied to the form with form=, so its copy outside the form
  // still submits.
  // Stop and Discard both go back to Display; Discard drops Edit's changes (the draft and form) unsaved.
  const toDisplay = () => { state = "display"; render(); };
  // Run, from Display (Start Job until they're on a job) or Finish Job's Back.
  function run() {
    if (!settled()) return;
    if (!C.inJob(current)) {
      if (!commit(C.startJob(current))) return;
      renderRoster();
    }
    state = "running";
    render();
  }
  const SHEET_ACTIONS = { edit: enter("editing"), run, stop: toDisplay, "discard-edit": toDisplay,
    close: closeCharacter, "end-session": endSession, "finish-job": enter("finishing"),
    "confirm-finish": confirmFinish, "spend-done": openSpendConfirm };
  $("character-card").addEventListener("click", (e) => SHEET_ACTIONS[e.target.closest("[data-sheet-action]")?.dataset.sheetAction]?.());
  function copyActions() {
    const topActions = $("character-actions-top");
    const bar = [display, running, finish, spend, form].find((section) => !section.hidden)?.querySelector(":scope > .character-actions");
    topActions.hidden = !bar;
    topActions.replaceChildren(...(bar ? [...bar.querySelectorAll(":scope > :not([data-bottom-only])")].map((button) => button.cloneNode(true)) : []));
  }

  // ---- gear: each item shown as "name ×N [label]" with its keyword chips (gear-ui.js); its name opens its rules ----
  // Run and Edit can add, change, or remove gear. Run saves right away and never sets Starter (a changed item keeps its own);
  // Edit also sets Starter, and keeps it all in the draft until Save.
  // Each item's conditions show under it; Run and Edit can add them ("+ condition") and click them.
  // While running, an item with rolls (G.rollOf: weapons, kits, vehicles) has a dice button that opens the roll dialog,
  // or, for a kit's three skills, a menu of them to pick from first.
  const skillNameOf = (id) => C.SKILLS.find((s) => s.id === id)?.name ?? id;
  function rollButtonHTML(item) {
    const skills = G.rollOf(item)?.skills ?? [];
    if (!skills.length) return "";
    const button = (attrs, title) => `<wa-button size="s" appearance="plain" ${attrs} title="${escapeHTML(title)}">
        <wa-icon name="dice-d20" label="Roll"></wa-icon></wa-button>`;
    if (skills.length === 1) return button(`data-gear-action="roll" data-skill="${skills[0]}"`, `Roll ${skillNameOf(skills[0])}`);
    return `<wa-dropdown class="gear-roll" data-gear-roll>${button(`slot="trigger" with-caret`, "Roll…")}${
      skills.map((id) => `<wa-dropdown-item value="${id}">${escapeHTML(skillNameOf(id))}</wa-dropdown-item>`).join("")}</wa-dropdown>`;
  }
  function renderGear(el, character, { editable = false, running = false } = {}) {
    const items = C.gear(character);
    const changeable = editable || running;
    el.innerHTML = items.length
      ? `<ul class="gear-list">${items.map((g) => `<li data-gear="${escapeHTML(g.id)}">
          ${GEAR_UI.rowHTML(g, { starter: !editable })}
          ${editable ? `<wa-switch size="small" class="gear-starter-toggle" data-gear-starter ${g.starter ? "checked" : ""}>Starting</wa-switch>` : ""}
          ${running ? rollButtonHTML(g) : ""}
          ${changeable ? `<wa-button size="s" appearance="plain" data-gear-action="condition" title="Add a condition">
            <wa-icon slot="start" name="plus"></wa-icon>condition</wa-button>` : ""}
          ${changeable ? `<wa-button size="s" appearance="plain" data-gear-action="edit" title="Change">
              <wa-icon name="pen" label="Change"></wa-icon></wa-button>
            <wa-button size="s" appearance="plain" variant="danger" data-gear-action="remove" title="Remove">
              <wa-icon name="trash" label="Remove"></wa-icon></wa-button>` : ""}
          ${GEAR_UI.keywordChipsHTML(g)}
          ${conditionsHTML(g, { clickable: changeable, gearId: g.id })}
        </li>`).join("")}</ul>`
      : `<p class="gear-empty">None</p>`;
  }

  // Any mode (and Create's Review): an item's name opens its rules, from the draft while editing.
  const gearInfo = $("gear-info-dialog");
  for (const el of [$("gear-display"), $("gear-run"), $("gear-edit"), create]) {
    el.addEventListener("click", (e) => {
      const id = e.target.closest(el === create ? ".create-summary [data-gear-info]" : "[data-gear-info]")?.dataset.gearInfo;
      const item = id != null && C.gear(state === "editing" ? draft : current).find((g) => String(g.id) === id);
      if (!item) return;
      gearInfo.label = item.description;
      $("gear-info-body").innerHTML = `${GEAR_UI.tagHTML(item)}${GEAR_UI.rulesHTML(item)}`;
      gearInfo.open = true;
    });
  }

  // The gear dialog edits a working copy of the item: changing the type (G.retype) or a field (G.legalize) drops
  // keywords that no longer fit, and the fields and keyword picker are redrawn after every change.
  const D = window.NCD_DATABANK;
  const gearDialog = $("gear-dialog");
  const gearKind = $("gear-kind");
  // Built here, not in index.html: Firefox restores form state into the page's own radios on reload, blanking their values.
  gearKind.innerHTML = G.KINDS.map((k) => `<wa-radio appearance="button" value="${k}">${k[0].toUpperCase() + k.slice(1)}</wa-radio>`).join("");
  const gearDescription = $("gear-description");
  const gearQuantity = $("gear-quantity");
  const gearFields = $("gear-fields");
  const gearKeywords = $("gear-keywords");
  const gearStarter = $("gear-starter");
  let gearChanging = null; // the item being changed in Edit, or null for new gear
  let working = null;      // the item as the dialog has it
  let autoName = false;    // new gear: the name follows G.defaultName until the player types their own
  // The name box: filled from the formula while it's automatic; the formula is always its placeholder (a blank name saves as it).
  function refreshGearName() {
    const name = G.defaultName(working);
    gearDescription.placeholder = name;
    if (autoName) gearDescription.value = name;
  }
  const SKILL_CHOICES = C.SKILLS.filter((s) => s.type !== "initiative");
  // A select of `options` ([value, label]); values are indexes or ids, never names (which can have spaces).
  const select = (fieldName, label, options, value, extra = "") => `<wa-select data-field="${fieldName}" label="${escapeHTML(label)}" ${extra}
      ${value != null ? `value="${escapeHTML(value)}"` : ""} placeholder="Choose…">${options.map(([v, text]) =>
      v == null ? `<small>${escapeHTML(text)}</small>` : `<wa-option value="${escapeHTML(v)}">${escapeHTML(text)}</wa-option>`).join("")}</wa-select>`;
  const indexOf = (list, name) => { const i = list.findIndex((x) => x.name === name); return i < 0 ? null : String(i); };
  // Spend XP's common gear offers only what Gear basics calls common (G.isCommon).
  const commonOnly = () => state === "spending";
  function renderGearFields() {
    const w = working;
    switch (w.kind) {
      case "weapon":
        gearFields.innerHTML = select("category", "Category", D.weapons.flatMap((x, i) => (commonOnly() && x.common === false ? [] : [[String(i), x.name]])),
          indexOf(D.weapons, w.category));
        break;
      case "kit": {
        const set = D.toolSets.find((t) => t.name === w.set);
        gearFields.innerHTML = `${select("set", "Tool set", D.toolSets.map((t, i) => [String(i), t.name]), indexOf(D.toolSets, w.set))}
          <wa-radio-group data-field="quality" label="Quality" orientation="horizontal" ${w.quality ? `value="${escapeHTML(w.quality)}"` : ""}>${
            Object.keys(G.QUALITIES).map((q) => `<wa-radio appearance="button" value="${q}">${q[0].toUpperCase() + q.slice(1)}</wa-radio>`).join("")}</wa-radio-group>
          ${set ? select("special", "Hyper-specialized for", [["none", "None"], ...set.skills.map((id) => [id, C.SKILLS.find((x) => x.id === id)?.name ?? id])], w.special ?? "none") : ""}
          <wa-switch data-field="consumable" ${w.consumable === true ? "checked" : ""}>Consumable</wa-switch>
          ${commonOnly() ? `<p class="gear-empty">Common tool kits are improvised, or standard and consumable.</p>` : ""}`;
        break;
      }
      case "equipment": {
        const e = G.EQUIPMENT.find((x) => x.name === w.entry);
        const listed = G.EQUIPMENT.map((x, i) => [x, i]).filter(([x]) => !commonOnly() || G.isCommon({ kind: "equipment", entry: x.name }));
        const grouped = listed.flatMap(([x, i], n) => [...(n === 0 || listed[n - 1][0].section !== x.section ? [[null, x.section]] : []), [String(i), x.name]]);
        const choices = e?.choice?.skill ? SKILL_CHOICES.map((x) => [x.id, x.name]) : (e?.choice?.options ?? []).map((o, i) => [String(i), o]);
        const choiceValue = e?.choice?.skill ? w.choice : (e?.choice?.options.indexOf(w.choice) ?? -1) >= 0 ? String(e.choice.options.indexOf(w.choice)) : null;
        gearFields.innerHTML = select("entry", "Equipment", grouped, indexOf(G.EQUIPMENT, w.entry)) + (e?.choice ? select("choice", e.choice.label, choices, choiceValue) : "");
        break;
      }
      case "armor":
        gearFields.innerHTML = select("level", "Armor", D.armor.levels.map((k, i) => [String(i + 1), `Armored${i ? ` x${i + 1}` : ""}${k.length ? ` (${k.join(", ")})` : ""}`]), String(w.level ?? 1));
        break;
      case "vehicle":
        gearFields.innerHTML = select("vehicle", "Vehicle", D.vehicles.map((v, i) => [String(i), `${v.name} (${v.size})`]), indexOf(D.vehicles, w.vehicle));
        break;
      default: gearFields.innerHTML = "";
    }
  }
  const renderGearKeywords = () => { gearKeywords.innerHTML = GEAR_UI.keywordPickerHTML(working); };
  function openGearDialog(item = null) {
    gearChanging = item;
    working = item ? { ...item } : C.newGear({ description: "" });
    // Spend XP's common gear: a new starting item with no keywords.
    gearDialog.label = item ? "Change gear" : state === "spending" ? "Common gear (no keywords)" : "New gear";
    gearKeywords.hidden = commonOnly();
    for (const radio of gearKind.querySelectorAll("wa-radio")) radio.hidden = commonOnly() && !G.COMMON_KINDS.includes(radio.value);
    gearKind.value = working.kind;
    autoName = !item;
    gearDescription.value = working.description;
    gearQuantity.value = String(working.quantity);
    gearStarter.checked = item?.starter ?? false;
    gearStarter.hidden = state !== "editing";
    renderGearFields();
    renderGearKeywords();
    refreshGearName();
    gearDialog.open = true;
  }
  gearKind.addEventListener("change", () => {
    if (!working || gearKind.value === working.kind) return;
    working = G.retype(working, gearKind.value);
    if (working.kind === "armor") working.level = 1;
    renderGearFields();
    renderGearKeywords();
    refreshGearName();
  });
  // A field's control gives an index or id; this turns it into what the item stores.
  const FIELD_VALUE = {
    category: (v) => D.weapons[v]?.name, set: (v) => D.toolSets[v]?.name, quality: (v) => v || undefined,
    special: (v) => (v && v !== "none" ? v : undefined), entry: (v) => G.EQUIPMENT[v]?.name, level: (v) => Number(v) || 1,
    vehicle: (v) => D.vehicles[v]?.name,
    choice: (v) => { const e = G.EQUIPMENT.find((x) => x.name === working.entry); return e?.choice?.skill ? v || undefined : e?.choice?.options[v]; },
  };
  gearFields.addEventListener("change", (e) => {
    const control = e.target.closest("[data-field]");
    if (!control || !working) return;
    const name = control.dataset.field;
    const next = { ...working, [name]: name === "consumable" ? control.checked : FIELD_VALUE[name](control.value) };
    if (name === "set") delete next.special;   // the old set's skill doesn't belong to the new one
    if (name === "entry") delete next.choice;
    working = G.legalize(next);
    if (["set", "entry"].includes(name)) renderGearFields();
    renderGearKeywords();
    refreshGearName();
  });
  gearKeywords.addEventListener("change", (e) => {
    const box = e.target.closest("[data-keyword]");
    if (!box || !working) return;
    const k = box.dataset.keyword;
    working = G.legalize({ ...working, keywords: box.checked ? [...working.keywords, k] : working.keywords.filter((x) => x !== k) });
    renderGearKeywords();
    refreshGearName();
  });
  // What a type needs before it can be saved (armor always has a level).
  function gearMissing(w) {
    switch (w.kind) {
      case "weapon": return !w.category && "category";
      case "kit": return (!w.set && "set") || (!w.quality && "quality");
      case "equipment": {
        const e = G.EQUIPMENT.find((x) => x.name === w.entry);
        return (!e && "entry") || (e.choice && !w.choice && "choice");
      }
      case "vehicle": return !w.vehicle && "vehicle";
      default: return false;
    }
  }
  function saveGear() {
    const description = text(gearDescription.value) || G.defaultName(working);
    const missing = gearMissing(working);
    if (missing) { gearFields.querySelector(`[data-field="${missing}"]`)?.focus(); return; }
    const quantity = Math.max(1, Math.round(Number(gearQuantity.value)) || 1);
    if (state === "editing") {
      draft = C.withGear(draft, C.newGear({ ...working, description, quantity, starter: gearStarter.checked }));
      renderGear($("gear-edit"), draft, { editable: true });
    } else if (state === "running") {
      if (!commit(C.withGear(current, C.newGear({ ...working, description, quantity, starter: gearChanging?.starter ?? false })))) return;
      renderGear($("gear-run"), current, { running: true });
    } else if (state === "spending") {
      const item = { ...working, description, quantity, keywords: [] };
      if (!G.isCommon(item)) { APP.toast("That isn't common gear (Databank: Gear Basics, Common Gear).", "warning"); return; }
      gearDialog.open = false;
      buy("common-gear", item);
      return;
    }
    gearDialog.open = false;
  }
  $("gear-save").addEventListener("click", saveGear);
  gearDescription.addEventListener("keydown", (e) => { if (e.key === "Enter") saveGear(); });
  // typing a name stops the automatic one; clearing the box brings it back
  gearDescription.addEventListener("input", () => { autoName = !text(gearDescription.value); });
  for (const el of [running, form]) {
    el.addEventListener("click", (e) => { if (e.target.closest("[data-add-gear]")) openGearDialog(); });
  }
  for (const el of [$("gear-edit"), $("gear-run")]) {
    el.addEventListener("click", (e) => {
      const button = e.target.closest("[data-gear-action]");
      const id = button?.closest("[data-gear]")?.dataset.gear;
      if (!id || button.dataset.gearAction === "condition") return;
      const base = state === "editing" ? draft : current;
      const item = C.gear(base).find((g) => String(g.id) === id);
      if (!item) return;
      if (button.dataset.gearAction === "roll") openGearRoll(item, button.dataset.skill);
      else if (button.dataset.gearAction === "edit") openGearDialog(item);
      else if (state === "editing") {
        draft = C.withoutGear(draft, item.id); // Save (or not) is the confirmation
        renderGear($("gear-edit"), draft, { editable: true });
      } else openRemoveGear(item);
    });
  }
  // Edit: each row's Starting toggle marks the item as starting gear (or not) in the draft.
  $("gear-edit").addEventListener("change", (e) => {
    const toggle = e.target.closest("[data-gear-starter]");
    const id = toggle?.closest("[data-gear]")?.dataset.gear;
    const item = id != null && state === "editing" && C.gear(draft).find((g) => String(g.id) === id);
    if (item) draft = C.withGear(draft, { ...item, starter: toggle.checked });
  });
  // Removing while running asks first, since it saves right away.
  const removeDialog = $("gear-remove-dialog");
  let removing = null;
  function openRemoveGear(item) {
    removing = item;
    $("gear-remove-item").innerHTML = `<span class="gear-remove-name">${escapeHTML(item.description)}${item.quantity > 1 ? ` ×${item.quantity}` : ""}</span>
      <span class="gear-kind">${escapeHTML(G.label(item))}</span>`;
    removeDialog.open = true;
  }
  $("gear-remove-confirm").addEventListener("click", () => {
    removeDialog.open = false;
    if (removing && state === "running" && commit(C.withoutGear(current, removing.id))) {
      renderGear($("gear-run"), current, { running: true });
    }
    removing = null;
  });

  // ---- conditions: chips on the character and under gear; in Run and Edit a chip opens its dialog ----
  // Run saves each change right away; Edit keeps them in the draft until Save. Nothing posts to Discord.
  function conditionsHTML(holder, { clickable = false, gearId = null } = {}) {
    const list = C.conditions(holder);
    if (!list.length) return "";
    return `<div class="condition-list">${list.map((x) => {
      const name = x.intrinsic ? `<i title="Intrinsic">${escapeHTML(x.name)}</i>` : escapeHTML(x.name);
      const sev = C.severityLabel(x.severity);
      const inner = `${name}${sev ? ` <span class="condition-severity">${sev}</span>` : ""}`;
      return clickable
        ? `<button type="button" class="condition" data-severity="${x.severity}" data-condition="${escapeHTML(x.id)}" data-gear-of="${escapeHTML(gearId ?? "")}">${inner}</button>`
        : `<span class="condition" data-severity="${x.severity}">${inner}</span>`;
    }).join("")}</div>`;
  }
  function renderConditions(el, holder, options = {}) {
    el.innerHTML = conditionsHTML(holder, options) || `<p class="gear-empty">None</p>`;
  }

  // The character (gearId null) or one of its gear items, from the draft while editing.
  function holderOf(gearId) {
    const base = state === "editing" ? draft : current;
    return gearId == null ? base : C.gear(base).find((g) => String(g.id) === String(gearId)) ?? null;
  }
  function refreshConditions() {
    if (state === "editing") {
      renderConditions($("conditions-edit"), draft, { clickable: true });
      renderGear($("gear-edit"), draft, { editable: true });
    } else if (state === "running") {
      renderConditions($("conditions-run"), current, { clickable: true });
      renderGear($("gear-run"), current, { running: true });
    }
  }
  // Applies fn(holder) → holder to the character or a gear item.
  function changeHolder(gearId, fn) {
    const item = holderOf(gearId);
    if (!item) return false;
    if (state === "editing") {
      draft = gearId == null ? fn(draft) : C.withGear(draft, fn(item));
    } else if (state === "running") {
      if (!commit(gearId == null ? fn(current) : C.withGear(current, fn(item)))) return false;
    } else return false;
    refreshConditions();
    return true;
  }
  const showSeverity = (stepper, severity) => {
    stepper.querySelector("[data-severity-value]").textContent = `x${severity}`;
    stepper.querySelector('[data-severity="-1"]').disabled = severity <= 1;
    stepper.querySelector('[data-severity="1"]').disabled = severity >= C.MAX_SEVERITY;
  };
  const showFor = (el, gearId) => {
    el.hidden = gearId == null;
    el.textContent = gearId == null ? "" : holderOf(gearId)?.description ?? "";
  };

  const addDialog = $("condition-add-dialog");
  const addName = $("condition-name");
  const addSeverity = $("condition-add-severity");
  const addIntrinsic = $("condition-intrinsic");
  let adding = { gearId: null, severity: 1 };
  function openAddCondition(gearId = null) {
    adding = { gearId, severity: 1 };
    showFor($("condition-add-for"), gearId);
    $("condition-suggestions").innerHTML = C.CONDITION_SUGGESTIONS[gearId == null ? "character" : "gear"]
      .map((name) => `<button type="button" class="condition" data-suggestion="${escapeHTML(name)}">${escapeHTML(name)}</button>`).join("");
    addName.value = "";
    addIntrinsic.checked = false;
    showSeverity(addSeverity, 1);
    addDialog.open = true;
  }
  function addCondition() {
    const name = text(addName.value);
    if (!name) { addName.focus(); return; }
    if (!changeHolder(adding.gearId, (h) => C.withCondition(h, { name, severity: adding.severity, intrinsic: addIntrinsic.checked }))) return;
    addDialog.open = false;
  }
  $("condition-suggestions").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-suggestion]");
    if (!chip) return;
    addName.value = chip.dataset.suggestion;
    addName.focus();
  });
  addSeverity.addEventListener("click", (e) => {
    const step = Number(e.target.closest("[data-severity]")?.dataset.severity);
    if (!step) return;
    adding.severity = Math.max(1, Math.min(C.MAX_SEVERITY, adding.severity + step));
    showSeverity(addSeverity, adding.severity);
  });
  $("condition-add").addEventListener("click", addCondition);
  addName.addEventListener("keydown", (e) => { if (e.key === "Enter") addCondition(); });

  const conditionDialog = $("condition-dialog");
  const conditionSeverity = $("condition-severity");
  let changing = { gearId: null, id: null };
  const changingCondition = () => C.conditions(holderOf(changing.gearId)).find((x) => String(x.id) === String(changing.id)) ?? null;
  function showConditionDialog() {
    const x = changingCondition();
    if (!x) { conditionDialog.open = false; return; }
    conditionDialog.label = x.name;
    showFor($("condition-for"), changing.gearId);
    $("condition-intrinsic-note").hidden = !x.intrinsic;
    showSeverity(conditionSeverity, x.severity);
  }
  function openCondition(gearId, id) {
    changing = { gearId, id };
    showConditionDialog();
    conditionDialog.open = true;
  }
  conditionSeverity.addEventListener("click", (e) => {
    const step = Number(e.target.closest("[data-severity]")?.dataset.severity);
    const x = changingCondition();
    if (!step || !x) return;
    if (changeHolder(changing.gearId, (h) => C.withSeverity(h, x.id, x.severity + step))) showConditionDialog();
  });
  $("condition-remove").addEventListener("click", () => {
    const x = changingCondition();
    if (x && changeHolder(changing.gearId, (h) => C.withoutCondition(h, x.id))) conditionDialog.open = false;
  });

  for (const el of [running, form]) {
    el.addEventListener("click", (e) => {
      if (e.target.closest("[data-add-condition]")) { openAddCondition(null); return; }
      const add = e.target.closest('[data-gear-action="condition"]');
      if (add) { openAddCondition(add.closest("[data-gear]").dataset.gear); return; }
      const chip = e.target.closest(".condition[data-condition]");
      if (chip) openCondition(chip.dataset.gearOf || null, chip.dataset.condition);
    });
  }

  // ---- abilities: Perks and Augmentations, each name opening its full text ----
  const ABILITY_TYPES = [["perk", "Perks"], ["augmentation", "Augmentations"]];
  // `none`: say so when there are none (the sheet's Abilities tab), rather than showing nothing (Create's review).
  function renderAbilities(el, list, { none = true } = {}) {
    el.innerHTML = ABILITY_TYPES.map(([type, heading]) => {
      const items = list.filter((a) => a.type === type);
      return items.length ? `<section class="ability-group"><h3>${heading}</h3><ul class="ability-list">${items.map((a) => `<li>
          <button type="button" class="ability-name" data-ability="${escapeHTML(a.id)}">${escapeHTML(a.name)}</button>
          ${a.summary ? `<span class="ability-summary">${escapeHTML(a.summary)}</span>` : ""}
        </li>`).join("")}</ul></section>` : "";
    }).join("") || (none ? `<p class="gear-empty">None</p>` : "");
  }

  // Icons in ability text: advantage and boon in the good color, challenge and drawback in the bad one, others in brand.
  const ICON_COLOR = { "advantage-die": "adv", boon: "adv", "challenge-die": "chal", drawback: "chal" };
  const abilityIcon = (name) => icon(name, ICON_COLOR[name] ?? "");
  const abilityDialog = $("ability-dialog");
  function openAbility(id) {
    const a = ABILITIES.find((x) => x.id === id);
    if (!a) return;
    abilityDialog.label = a.name;
    $("ability-body").innerHTML = `<p class="ability-tag">${escapeHTML(C.abilityTag(a))}</p>
      ${a.summary ? `<p class="ability-lead">${escapeHTML(a.summary)}</p>` : ""}
      ${a.description ? `<div class="ability-text">${formatDescription(a.description, abilityIcon)}</div>` : ""}`;
    abilityDialog.open = true;
  }
  for (const el of [$("abilities-display"), $("abilities-run")]) {
    el.addEventListener("click", (e) => {
      const id = e.target.closest("[data-ability]")?.dataset.ability;
      if (id) openAbility(id);
    });
  }

  // Edit: the draft's abilities with a remove button each, and the picker for adding more (kept in the draft until Save).
  function renderAbilitiesEdit() {
    const list = C.abilities(draft, ABILITIES);
    $("abilities-edit").innerHTML = list.length
      ? `<ul class="gear-list">${list.map((a) => `<li data-ability-row="${escapeHTML(a.id)}">
          <span class="gear-text"><button type="button" class="ability-name" data-ability="${escapeHTML(a.id)}">${escapeHTML(a.name)}</button>
            <span class="gear-kind">${escapeHTML(C.abilityTag(a))}</span></span>
          <wa-button size="s" appearance="plain" variant="danger" data-ability-action="remove" title="Remove">
            <wa-icon name="trash" label="Remove"></wa-icon></wa-button>
        </li>`).join("")}</ul>`
      : `<p class="gear-empty">None</p>`;
  }
  $("abilities-edit").addEventListener("click", (e) => {
    const id = e.target.closest("[data-ability-row]")?.dataset.abilityRow;
    if (!id) return;
    if (e.target.closest("[data-ability-action='remove']")) {
      draft = C.withoutAbility(draft, id);
      renderAbilitiesEdit();
    } else if (e.target.closest("[data-ability]")) openAbility(id);
  });

  const picker = $("ability-picker");
  const search = $("ability-search");
  const choices = $("ability-choices");
  function renderChoices() {
    const groups = C.findAbilities(ABILITIES, search.value, draft.abilities);
    choices.innerHTML = groups.length
      ? groups.map((g) => `<h4>${escapeHTML(g.heading)}</h4><ul class="ability-choices">${g.items.map((a) => `<li>
          <button type="button" class="ability-choice" data-ability="${escapeHTML(a.id)}">
            <span class="ability-choice-name">${escapeHTML(a.name)}</span>
            ${a.summary ? `<span class="ability-summary">${escapeHTML(a.summary)}</span>` : ""}
          </button></li>`).join("")}</ul>`).join("")
      : `<p class="gear-empty">No matches</p>`;
  }
  form.addEventListener("click", (e) => {
    if (!e.target.closest("[data-add-ability]")) return;
    search.value = "";
    renderChoices();
    picker.open = true;
  });
  search.addEventListener("input", renderChoices);
  search.addEventListener("wa-clear", renderChoices);
  choices.addEventListener("click", (e) => {
    const id = e.target.closest("[data-ability]")?.dataset.ability;
    if (!id) return;
    draft = C.withAbility(draft, id);
    renderAbilitiesEdit();
    picker.open = false;
  });

  // ---- editing Luck and Influence: the same −/+ buttons as Running, each value kept in its hidden field ----
  // In this order, so lowering Max Luck pulls Current Luck down with it.
  const STEPPED = {
    maxLuck: (v) => C.clampMaxLuck(v),
    currentLuck: (v) => C.clampCurrentLuck(v, Number(field("maxLuck").value)),
    startingInfluence: (v) => C.clampInfluence(v),
    currentInfluence: (v) => C.clampInfluence(v),
  };
  function showSteppers() {
    for (const [name, clamp] of Object.entries(STEPPED)) {
      const v = clamp(field(name).value);
      field(name).value = String(v);
      const el = form.querySelector(`[data-stepper="${name}"]`);
      el.querySelector("[data-step-value]").textContent = v;
      for (const button of el.querySelectorAll("[data-step]")) button.disabled = clamp(v + Number(button.dataset.step)) === v;
    }
  }
  form.addEventListener("click", (e) => {
    const button = e.target.closest("[data-step]");
    const name = button?.closest("[data-stepper]")?.dataset.stepper;
    if (!name) return;
    field(name).value = String(Number(field(name).value) + Number(button.dataset.step));
    showSteppers();
  });

  // ---- XP: the editor shows the total as Available and Spent change ----
  function showXpTotal() {
    $("xp-total-edit").textContent = C.clampXp(field("xpAvailable").value) + C.clampXp(field("xpSpent").value);
  }

  // ---- skills ----
  const GROUPS = { mental: "Mental", physical: "Physical", initiative: "Initiative" };
  // Mental fills the first column; Physical and the (short) Initiative group share the second.
  const COLUMNS = [["mental"], ["physical", "initiative"]];
  const columns = (groupHTML) => COLUMNS.map((types) => types.map(groupHTML).join(""))
    .filter(Boolean).map((html) => `<div class="skill-column">${html}</div>`).join("");
  const diceIcons = (st) => (st.adv || st.chal)
    ? `<span class="skill-dice">${["adv", "chal"].map((kind) =>
        `<span class="${kind}">${icon(APP.KINDS[kind].die)}</span>`.repeat(st[kind])).join("")}</span>`
    : "";

  // Display: only skills with a value or intrinsic dice (and both initiatives, always), then "Anything else" at 50%.
  // When running, each skill name is a link that opens the roll dialog.
  const ANYTHING_ELSE = "anything-else";
  const skillName = (id, name, links) => links
    ? `<a href="#" class="skill-name" data-roll="${id}">${escapeHTML(name)}</a>`
    : `<span class="skill-name">${escapeHTML(name)}</span>`;
  function renderSkillsDisplay(el, { links = false } = {}) {
    const groups = columns((type) => {
      const title = GROUPS[type];
      const items = C.SKILLS.filter((sk) => sk.type === type)
        .map((sk) => [sk, C.skill(current, sk.id)])
        .filter(([, st]) => type === "initiative" || C.isNotable(st));
      if (!items.length) return "";
      return `<section class="skill-group"><h3>${title}</h3><ul>${items.map(([sk, st]) => `<li>
          ${skillName(sk.id, sk.name, links)}${diceIcons(st)}
          <span class="skill-value${st.value == null ? " untrained" : ""}">${C.shownValue(st.value)}%</span>
          ${!links ? "" : C.canBeUsed(current, sk.id)
            ? `<wa-checkbox size="s" class="used" data-used="${sk.id}" ${C.isUsed(current, sk.id) ? "checked" : ""}>Used</wa-checkbox>`
            : `<span class="used"></span>`}
        </li>`).join("")}</ul></section>`;
    });
    // Untrained skills, the initiatives, and "Anything else" can't be marked used; an empty slot keeps the values lined up.
    el.innerHTML = groups + `<ul class="anything-else"><li>
        ${skillName(ANYTHING_ELSE, "Anything else", links)}<span class="skill-value untrained">${C.UNTRAINED}%</span>
        ${links ? `<span class="used"></span>` : ""}</li></ul>`;
    // "Anything else" goes at the bottom of the last column
    const last = el.querySelector(".skill-column:last-of-type");
    if (last) last.append(el.querySelector(".anything-else"));
  }

  // Editing: every skill, with set / +5 / Set to 55 / Remove, and a button for intrinsic dice.
  // The controls sit in fixed slots (value, Set to 55 or +5, Remove) so buttons don't move as the value changes.
  function editRow(sk, st) {
    const controls = st.value == null
      ? `<span class="skill-value untrained">${C.UNTRAINED}%</span>
         <wa-button size="s" appearance="outlined" data-action="set-min">Set to ${C.MIN_VALUE}</wa-button>
         <span></span>`
      : `<wa-input type="number" size="s" min="${C.MIN_VALUE}" max="${C.MAX_VALUE}" value="${st.value}" data-action="value"
           aria-label="${escapeHTML(sk.name)} %"><span slot="end">%</span></wa-input>
         <wa-button size="s" appearance="outlined" data-action="increment" ${st.value >= C.MAX_VALUE ? "disabled" : ""}>+5</wa-button>
         ${st.value === C.MIN_VALUE ? `<wa-button size="s" appearance="plain" variant="danger" data-action="remove">Remove</wa-button>` : "<span></span>"}`;
    return `<li data-skill="${sk.id}">
        <span class="skill-name">${escapeHTML(sk.name)}</span>
        <span class="skill-controls">${controls}</span>
        <wa-button size="s" appearance="plain" data-action="dice" title="Intrinsic dice for ${escapeHTML(sk.name)}">
          ${diceIcons(st) || `<wa-icon name="dice" label="Intrinsic dice"></wa-icon>`}
        </wa-button>
      </li>`;
  }

  // Every skill in the sheet's columns; rowHTML(skill) returns its <li>. Create's skills step uses it too.
  const skillGroups = (rowHTML) => columns((type) => `<section class="skill-group"><h3>${GROUPS[type]}</h3><ul>${
    C.SKILLS.filter((sk) => sk.type === type).map(rowHTML).join("")}</ul></section>`);
  function renderSkillsEdit() {
    $("skills-edit").innerHTML = skillGroups((sk) => editRow(sk, C.skill(draft, sk.id)));
  }

  const updateSkill = (id, changes) => { draft = C.withSkill(draft, id, changes); renderSkillsEdit(); };

  $("skills-edit").addEventListener("click", (e) => {
    const button = e.target.closest("wa-button[data-action]");
    const id = button?.closest("[data-skill]")?.dataset.skill;
    if (!id) return;
    const st = C.skill(draft, id);
    switch (button.dataset.action) {
      case "set-min": updateSkill(id, { value: C.MIN_VALUE }); break;
      case "increment": updateSkill(id, { value: C.increment(st.value) }); break;
      case "remove": updateSkill(id, { value: null }); break;
      case "dice": openDiceDialog(id); break;
    }
  });

  // Typed values are clamped to 55-95; clearing the box keeps the old value (use Remove at 55 instead).
  $("skills-edit").addEventListener("change", (e) => {
    const input = e.target.closest("wa-input[data-action='value']");
    const id = input?.closest("[data-skill]")?.dataset.skill;
    if (!id) return;
    updateSkill(id, { value: C.clampValue(input.value) ?? C.skill(draft, id).value });
  });

  // ---- intrinsic dice dialog ----
  const dialog = $("dice-dialog");
  const dicePools = { adv: $("dice-adv"), chal: $("dice-chal") };
  let diceSkill = null;
  function openDiceDialog(id) {
    diceSkill = id;
    const st = C.skill(draft, id);
    dialog.label = `Intrinsic dice: ${C.SKILLS.find((sk) => sk.id === id).name}`;
    dicePools.adv.value = String(st.adv);
    dicePools.chal.value = String(st.chal);
    dialog.open = true;
  }
  for (const [kind, group] of Object.entries(dicePools)) {
    group.addEventListener("change", () => { if (diceSkill) updateSkill(diceSkill, { [kind]: Number(group.value) }); });
  }

  // ---- rolling a skill (running) ----
  // The dialog starts at the skill's value and intrinsic dice; the dice go back to those after each roll.
  const rollDialog = $("skill-dialog");
  const rollTarget = $("skill-target");
  const rollPools = { adv: $("skill-adv"), chal: $("skill-chal") };
  const rollResult = $("skill-result");
  const rollImpact = $("skill-impact");
  let rollSkill = null; // { id, name, adv, chal }

  const resetRollPools = () => {
    rollPools.adv.value = String(rollSkill.adv);
    rollPools.chal.value = String(rollSkill.chal);
  };
  // From gear (openGearRoll): extra Advantage dice on top of the skill's own, and an impact to start with.
  function openRollDialog(id, { adv = 0, impact = null } = {}) {
    const sk = C.SKILLS.find((s) => s.id === id);
    const st = sk ? C.skill(current, id) : { value: null, adv: 0, chal: 0 };
    rollSkill = { id, name: sk ? sk.name : "Anything else", adv: DICE.clampPool(st.adv + adv), chal: st.chal };
    rollDialog.label = `Roll ${rollSkill.name}`;
    rollTarget.value = String(C.shownValue(st.value));
    rollImpact.value = impact ? String(impact) : "";
    resetRollPools();
    APP.emptyResult(rollResult);
    rollDialog.open = true;
  }

  // Used is saved right away; rolling a skill marks it used.
  function setUsed(id, used) {
    if (!C.canBeUsed(current, id)) return; // also covers "Anything else", which isn't a skill
    commit(C.withUsed(current, id, used));
    if (state === "running") renderSkillsDisplay($("skills-run"), { links: true });
  }
  $("skills-run").addEventListener("change", (e) => {
    const box = e.target.closest("[data-used]");
    if (box) setUsed(box.dataset.used, box.checked);
  });

  // ---- sessions and jobs ----
  // The skills that went up, by name (not their new values).
  const bumpedHTML = (ids) => ids.length
    ? `<ul class="session-bumped">${ids.map((id) => `<li>${escapeHTML(skillNameOf(id))}</li>`).join("")}</ul>`
    : `<p class="gear-empty">No skills were used.</p>`;
  // A table to pick from or roll on (tables.js), in el. Returns a function giving the pick so far ("" until there is one).
  function rowPicker(el, title, rows) {
    let picked = "";
    APP.tablePicker(el, { head: ["d100", title], rows }, (row) => { picked = row[1]; });
    return () => picked;
  }
  // A liability for a character without one (End Session and Finish Job).
  const liabilityPicker = (el) => rowPicker(el, "Liability", window.NCD_TABLES.liabilities);

  // End Session: each used skill goes up by 1 and Used is cleared; a dialog lists them, over Display.
  // A character without a liability picks one there too: the dialog stays open until they do, and OK saves it.
  const sessionDialog = $("session-dialog");
  let sessionLiability = null; // the dialog's liability picker, while it has one
  function endSession() {
    const { character, bumped } = C.endSession(current);
    if (!commit(character)) return;
    state = "display";
    render();
    $("session-bumped").innerHTML = bumpedHTML(bumped);
    const needs = C.needsLiability(current);
    sessionDialog.querySelector(".session-liability").hidden = !needs;
    sessionLiability = needs ? liabilityPicker($("session-liability")) : null;
    sessionDialog.open = true;
  }
  $("session-ok").addEventListener("click", () => {
    if (sessionLiability) {
      if (!sessionLiability()) { APP.toast("Pick a liability first.", "warning"); return; }
      if (!commit(C.withLiability(current, sessionLiability()))) return;
      sessionLiability = null;
      render();
    }
    sessionDialog.open = false;
  });
  // Escape and the close button wait for the liability too.
  sessionDialog.addEventListener("wa-hide", (e) => { if (e.target === sessionDialog && sessionLiability) e.preventDefault(); });

  // Finish Job's page: its choices stay in the controls until Confirm, which saves it all (C.finishJob) and goes to Display.
  const finishImprovement = $("finish-improvement");
  const finishSkill = $("finish-skill");
  const finishSuccess = $("finish-success");
  const finishXp = $("finish-xp");
  const finishReward = $("finish-reward");
  const finishProp = $("finish-prop");
  const finishGear = $("finish-gear");
  const finishFeatureEl = $("finish-feature");
  const finishStory = $("finish-story");
  const radio = (group, value) => group.querySelector(`wa-radio[value="${value}"]`);
  let finishLiability = () => "";
  let finishFeature = () => ""; // the distinctive feature reward's trait, added to the physical appearance
  function renderFinish() {
    $("finish-bumped").innerHTML = bumpedHTML(C.endSession(current).bumped);
    finishStory.value = C.story(current);
    const needs = C.needsLiability(current);
    $("finish-liability-part").hidden = !needs;
    finishLiability = needs ? liabilityPicker($("finish-liability")) : () => "";
    finishFeature = rowPicker(finishFeatureEl, "Distinctive visual trait", window.NCD_TABLES.distinctiveTraits);
    const untrained = C.untrainedSkills(current);
    finishSkill.innerHTML = untrained.map((id) => `<wa-option value="${id}">${escapeHTML(skillNameOf(id))}</wa-option>`).join("");
    const targets = C.cyberneticTargets(current);
    finishGear.innerHTML = targets.map((g) => `<wa-option value="${escapeHTML(g.id)}">${escapeHTML(g.description)}</wa-option>`).join("");
    radio(finishImprovement, "skill").disabled = !untrained.length;
    radio(finishReward, "cybernetic").disabled = !targets.length;
    for (const control of [finishImprovement, finishSkill, finishSuccess, finishReward, finishGear]) control.value = "";
    finishXp.value = "0";
    finishProp.value = "";
    showFinish();
  }
  // Shows the fields the choices so far need. A failed job earns 1 XP, shown in the locked XP box.
  function showFinish() {
    const success = finishSuccess.value;
    finishSkill.hidden = finishImprovement.value !== "skill";
    finishXp.hidden = !success;
    finishXp.disabled = success === "no";
    $("finish-failed-note").hidden = success !== "no";
    $("finish-reward-part").hidden = success !== "yes";
    finishFeatureEl.hidden = finishReward.value !== "feature";
    finishProp.hidden = finishReward.value !== "prop";
    finishGear.hidden = finishReward.value !== "cybernetic";
  }
  for (const control of [finishImprovement, finishReward]) control.addEventListener("change", showFinish);
  finishSuccess.addEventListener("change", () => {
    finishXp.value = finishSuccess.value === "no" ? "1" : "0";
    showFinish();
  });
  // XP: digits only.
  finishXp.addEventListener("input", () => {
    const v = String(finishXp.value ?? "").replace(/\D/g, "").slice(0, 3);
    if (v !== finishXp.value) finishXp.value = v;
  });
  const FINISH_CONTROLS = { liability: $("finish-liability"), improvement: finishImprovement, skill: finishSkill, success: finishSuccess, reward: finishReward,
    feature: finishFeatureEl, prop: finishProp, gear: finishGear };
  function confirmFinish() {
    if (state !== "finishing") return;
    const success = finishSuccess.value;
    const choices = {
      liability: finishLiability(), story: finishStory.value, improvement: finishImprovement.value, skill: finishSkill.value,
      successful: success === "yes" ? true : success === "no" ? false : null,
      xp: finishXp.value, reward: finishReward.value, feature: finishFeature(), prop: text(finishProp.value), gearId: finishGear.value,
    };
    const missing = C.finishMissing(current, choices);
    if (missing) {
      FINISH_CONTROLS[missing].focus();
      APP.toast("Make every choice before confirming.", "warning");
      return;
    }
    // Saved as spending XP, keeping the gear acquired on the job until Spend XP is confirmed.
    if (!commit(A.beginSpending(current, C.finishJob(current, choices).character))) return;
    spendPurchases = [];
    state = "spending";
    render();
    renderRoster();
  }

  // ---- Spend XP: purchases (A.BENEFITS) are kept in spendPurchases and applied in order, saved on Confirm ----
  // Removing one re-applies the rest, dropping any that no longer work (a keyword on gear that's no longer kept, say).
  let spendPurchases = [];
  const spendBenefits = $("spend-benefits");
  const spendResult = () => A.applyPurchases(current, spendPurchases, { catalog: ABILITIES, acquired: A.acquiredGear(current) });
  // What was picked, by name: [benefit's short name, pick].
  function purchaseLabel({ benefit, value }, result) {
    const b = A.BENEFIT[benefit];
    const gearName = (id) => [...C.gear(result.character), ...A.acquiredGear(current)].find((g) => String(g.id) === String(id))?.description ?? "";
    switch (b.pick) {
      case "ability": return [b.short, ABILITIES.find((a) => a.id === value)?.name ?? value];
      case "skill": return [b.short, skillNameOf(value)];
      case "gear": return [b.short, gearName(value)];
      case "keyword": return [b.short, `${value.keyword} on ${gearName(value.gear)}`];
      case "item": return [b.short, value.description];
      default: return [b.short, ""];
    }
  }
  const boughtHTML = (result) => result.purchases.length
    ? `<ul class="spend-bought">${result.purchases.map((p, i) => {
        const [name, pick] = purchaseLabel(p, result);
        return `<li><span class="gear-text">${escapeHTML(name)}${pick ? `: <b>${escapeHTML(pick)}</b>` : ""}</span>
          <span class="spend-cost">${p.cost} XP</span>
          <wa-button size="s" appearance="plain" variant="danger" data-unbuy="${i}" title="Remove">
            <wa-icon name="xmark" label="Remove"></wa-icon></wa-button></li>`;
      }).join("")}</ul>`
    : `<p class="gear-empty">Nothing yet</p>`;
  // A select of a benefit's options, grouped by their `group` (abilities: origin and archetype).
  function pickSelect(name, label, options) {
    if (!options.length) return `<span class="gear-empty">None available</span>`;
    let group = null;
    return `<wa-select size="s" data-pick="${name}" placeholder="${escapeHTML(label)}…" aria-label="${escapeHTML(label)}">${options.map((o) => {
      const heading = o.group && o.group !== group ? `<small>${escapeHTML((group = o.group))}</small>` : "";
      return `${heading}<wa-option value="${escapeHTML(o.value)}">${escapeHTML(o.label)}</wa-option>`;
    }).join("")}</wa-select>`;
  }
  const PICK_LABEL = { ability: "Choose", skill: "Skill", gear: "Gear", item: "" };
  function benefitHTML(b, result) {
    let picks = "";
    if (b.pick === "keyword") {
      picks = pickSelect("gear", "Starting gear", b.options(result, ABILITIES))
        + `<wa-select size="s" data-pick="keyword" placeholder="Keyword…" aria-label="Keyword" disabled></wa-select>`;
    } else if (b.options) {
      picks = pickSelect("value", PICK_LABEL[b.pick], b.options(result, ABILITIES));
      if (b.pick === "ability") picks += `<wa-button size="s" appearance="plain" data-spend-info title="Read it" disabled>
          <wa-icon name="circle-info" label="Read it"></wa-icon></wa-button>`;
    }
    return `<li data-benefit="${b.id}">
        <span class="spend-text">${escapeHTML(b.text)}</span>
        <span class="spend-picks">${picks}</span>
        <span class="spend-cost"></span>
        <wa-button size="s" variant="brand" appearance="outlined" data-buy>Buy</wa-button>
      </li>`;
  }
  // The row's pick, as its purchase's value (undefined until picked).
  function rowValue(row) {
    const b = A.BENEFIT[row.dataset.benefit];
    const pick = (name) => row.querySelector(`[data-pick="${name}"]`)?.value || undefined;
    return b.pick === "keyword" ? { gear: pick("gear"), keyword: pick("keyword") } : pick("value");
  }
  // A row's cost (for its pick, once there is one) and whether Buy works. Common gear's Buy opens the gear dialog.
  function refreshRow(row, result) {
    const b = A.BENEFIT[row.dataset.benefit], value = rowValue(row);
    const cost = b.cost(result, value, ABILITIES);
    row.querySelector(".spend-cost").textContent = `${cost} XP`;
    const possible = b.pick === "item" || A.canBuy(b, result, value, ABILITIES);
    row.querySelector("[data-buy]").disabled = !possible || cost > result.remaining;
    const info = row.querySelector("[data-spend-info]");
    if (info) info.disabled = !value;
  }
  function renderSpend() {
    const result = spendResult();
    spendPurchases = result.purchases.map(({ cost, ...p }) => p);
    $("spend-total").textContent = C.xp(current).available;
    $("spend-remaining").textContent = result.remaining;
    $("spend-bought").innerHTML = boughtHTML(result);
    spendBenefits.innerHTML = A.BENEFITS.map((b) => benefitHTML(b, result)).join("");
    for (const row of spendBenefits.querySelectorAll("[data-benefit]")) refreshRow(row, result);
  }
  function buy(benefit, value) {
    spendPurchases = [...spendPurchases, { benefit, value }];
    renderSpend();
    // all spent: straight to the confirmation
    if (spendResult().remaining === 0) openSpendConfirm();
  }
  spendBenefits.addEventListener("change", (e) => {
    const row = e.target.closest("[data-benefit]");
    if (!row) return;
    const result = spendResult();
    if (e.target.closest('[data-pick="gear"]') && row.dataset.benefit === "keyword") {
      const keyword = row.querySelector('[data-pick="keyword"]');
      const names = A.BENEFIT.keyword.keywords(result, rowValue(row).gear);
      keyword.innerHTML = names.map((k) => `<wa-option value="${escapeHTML(k)}">${escapeHTML(k)}</wa-option>`).join("");
      keyword.value = "";
      keyword.disabled = !names.length;
    }
    refreshRow(row, result);
  });
  spendBenefits.addEventListener("click", (e) => {
    const row = e.target.closest("[data-benefit]");
    if (!row) return;
    if (e.target.closest("[data-spend-info]")) { const id = rowValue(row); if (id) openAbility(id); return; }
    if (!e.target.closest("[data-buy]")) return;
    if (row.dataset.benefit === "common-gear") { openGearDialog(); return; }
    buy(row.dataset.benefit, rowValue(row));
  });
  $("spend-bought").addEventListener("click", (e) => {
    const i = e.target.closest("[data-unbuy]")?.dataset.unbuy;
    if (i == null) return;
    spendPurchases = spendPurchases.filter((_, n) => n !== Number(i));
    renderSpend();
  });

  const spendDialog = $("spend-dialog");
  function openSpendConfirm() {
    if (state !== "spending") return;
    const result = spendResult();
    $("spend-summary").innerHTML = `${result.purchases.length
      ? `<ul class="spend-bought">${result.purchases.map((p) => {
          const [name, pick] = purchaseLabel(p, result);
          return `<li><span class="gear-text">${escapeHTML(name)}${pick ? `: <b>${escapeHTML(pick)}</b>` : ""}</span><span class="spend-cost">${p.cost} XP</span></li>`;
        }).join("")}</ul>`
      : `<p class="gear-empty">Nothing bought.</p>`}
      <p class="spend-left"><b>${result.remaining}</b> XP left unspent${result.acquired.length
        ? `. Not kept, so lost: ${escapeHTML(result.acquired.map((g) => g.description).join(", "))}` : ""}.</p>`;
    spendDialog.open = true;
  }
  $("spend-confirm").addEventListener("click", () => {
    if (state !== "spending") return;
    if (!commit(A.finishSpending(current, spendPurchases, ABILITIES).character)) return;
    spendDialog.open = false;
    spendPurchases = [];
    state = "display";
    render();
    renderRoster();
  });

  // `skill` is one of the item's (G.rollOf) skills.
  function openGearRoll(item, skill) {
    const r = G.rollOf(item);
    if (r?.skills.includes(skill)) openRollDialog(skill, r);
  }
  // A kit's menu: picking a skill rolls it.
  $("gear-run").addEventListener("wa-select", (e) => {
    const id = e.target.closest("[data-gear]")?.dataset.gear;
    const item = id != null && C.gear(current).find((g) => String(g.id) === id);
    if (item) openGearRoll(item, e.detail.item.value);
  });

  $("skills-run").addEventListener("click", (e) => {
    const link = e.target.closest("[data-roll]");
    if (!link) return;
    e.preventDefault();
    openRollDialog(link.dataset.roll);
  });

  const rollSkillAndPost = APP.makeRoller({
    button: $("skill-roll"),
    readTarget: APP.targetField(rollTarget),
    pools: rollPools,
    result: rollResult,
    resetPools: resetRollPools,
    scroll: true,
    onRoll: () => setUsed(rollSkill.id, true),
    skill: () => rollSkill.name,
    initiative: () => (C.isInitiative(rollSkill.id) ? { handle: text(current.handle) } : null),
    readImpact: () => DICE.cleanImpact(rollImpact.value),
  });
  $("skill-roll").addEventListener("click", rollSkillAndPost);
  rollTarget.addEventListener("keydown", (e) => { if (e.key === "Enter") rollSkillAndPost(); });
  // Impact: digits only, and never zero.
  rollImpact.addEventListener("input", () => {
    const v = String(rollImpact.value ?? "").replace(/\D/g, "").replace(/^0+/, "").slice(0, 3);
    if (v !== rollImpact.value) rollImpact.value = v;
  });
  rollImpact.addEventListener("keydown", (e) => { if (e.key === "Enter") rollSkillAndPost(); });

  // ---- editing ----
  form.addEventListener("click", (e) => {
    const button = e.target.closest("[data-reroll]");
    if (!button) return;
    const name = button.dataset.reroll;
    field(name).value = name === "handle" ? C.randomHandle() : C.randomName();
    if (name === "handle") setLabel(field("handle").value);
  });
  field("handle").addEventListener("input", () => setLabel(field("handle").value));
  for (const name of ["xpAvailable", "xpSpent"]) field(name).addEventListener("input", showXpTotal);

  // ---- portrait picker: a dialog showing every portrait; picking one closes it ----
  const portraitDialog = $("portrait-dialog");
  const portraitChoices = $("portrait-choices");
  portraitChoices.innerHTML = portraits.map((file) =>
    `<button type="button" class="portrait-choice" data-portrait="${escapeHTML(file)}" aria-pressed="false">
      <img class="portrait" src="${escapeHTML(portraitSrc(file))}" alt="${escapeHTML(C.portraitLabel(file))}">
    </button>`).join("");
  $("portrait-choose").hidden = !portraits.length;
  let portraitPicked = null; // Create's pickPortrait: resolves with the file picked, or null if the dialog closes without one
  function openPortraits(selected) {
    for (const button of portraitChoices.querySelectorAll("[data-portrait]")) {
      button.setAttribute("aria-pressed", String(button.dataset.portrait === selected));
    }
    portraitDialog.open = true;
  }
  $("portrait-choose").addEventListener("click", () => openPortraits(field("portrait").value));
  const pickPortrait = () => new Promise((resolve) => {
    if (!portraits.length) { resolve(null); return; }
    portraitPicked?.(null);
    portraitPicked = resolve;
    openPortraits(C.portraitFile(current, portraits));
  });
  const resolvePortrait = (file) => { const resolve = portraitPicked; portraitPicked = null; resolve?.(file); };
  portraitDialog.addEventListener("wa-after-hide", (e) => { if (e.target === portraitDialog) resolvePortrait(null); });
  portraitChoices.addEventListener("click", (e) => {
    const file = e.target.closest("[data-portrait]")?.dataset.portrait;
    if (!file) return;
    if (portraitPicked) {
      resolvePortrait(file);
      portraitDialog.open = false;
      return;
    }
    field("portrait").value = file;
    showPortrait($("portrait-preview"), file);
    portraitDialog.open = false;
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const edited = { ...current };
    for (const f of FIELDS) f.save(edited, field(f.name).value);
    edited.knows = [...knowsEdit.querySelectorAll("wa-checkbox")].filter((box) => box.checked).map((box) => box.value);
    edited.wounds = draft.wounds;
    edited.skills = draft.skills;
    edited.gear = draft.gear;
    edited.conditions = draft.conditions;
    edited.abilities = draft.abilities;
    if (!commit(edited)) return;
    store.set("openCharacter", current.id);
    state = "display";
    setLabel(current.handle);
    render();
    renderRoster();
  });

  // ---- creating: create.js draws the steps; these hooks save, finish, and discard ----
  // The Detail sheet, read-only, for Create's review step: a copy of the sheet head, then skills, gear, abilities, appearance.
  function renderSummary(el) {
    renderFields();
    const head = fields.cloneNode(true);
    head.hidden = false;
    for (const node of [head, ...head.querySelectorAll("[id]")]) node.removeAttribute("id");
    for (const button of head.querySelectorAll("[data-luck], [data-influence]")) button.remove();
    el.innerHTML = `<div class="skills"></div>
      <section class="gear"><div class="gear-head"><h3>Gear</h3></div><div class="summary-gear"></div></section>
      <div class="abilities"></div><dl class="appearance"></dl>`;
    el.prepend(head);
    renderAppearance(el.querySelector(".appearance"), { liability: false });
    renderSkillsDisplay(el.querySelector(".skills"));
    el.querySelector("section.gear").hidden = !C.gear(current).length;
    renderGear(el.querySelector(".summary-gear"), current);
    renderAbilities(el.querySelector(".abilities"), C.abilities(current, ABILITIES), { none: false });
  }
  create.addEventListener("click", (e) => {
    const id = e.target.closest(".create-summary [data-ability]")?.dataset.ability;
    if (id) openAbility(id);
  });

  const createHooks = {
    change(next) {
      if (!commit(next)) return;
      setLabel(current.handle);
      render();
      renderRoster();
    },
    finish() {
      if (!commit(C.finishCreation(current))) return;
      renderRoster();
      show(current, "display");
    },
    discard() {
      try {
        C.remove(storage, current.id);
      } catch (err) {
        console.error(err);
        APP.toast("Couldn't discard the character.", "danger");
        return;
      }
      closeCharacter();
      renderRoster();
    },
    pickPortrait,
    renderSummary,
    // Sheet pieces Create's steps draw with, so they look like Detail:
    diceIcons,                                                     // a skill's intrinsic dice icons ("" when none)
    abilityText: (a) => formatDescription(a.description, abilityIcon), // rules text as HTML, icons colored like the dialog
    skillGroups,                                                   // every skill in the sheet's columns (see above)
  };

  // ---- start up: reopen the last saved character, if any ----
  renderRoster();
  const openId = store.get("openCharacter");
  const reopen = C.load(storage).find((c) => c.id === openId);
  if (reopen) show(reopen, C.isCreating(reopen) ? "creating" : "display", { activate: false });
  customElements.whenDefined("wa-tab-group").then(() => {
    if (tabs.active === "character" && !reopen) tabs.active = "roster";
  });
})();
