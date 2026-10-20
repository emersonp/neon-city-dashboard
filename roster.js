// Roster tab (the saved characters) and the Character tab, which appears once a character is opened.
// A character in the Character tab is in one of four states: display, editing, running, or creating.
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
  // The character helpers take localStorage itself, and handle it being null.
  const storage = store.raw;

  const tabs = $("tabs");
  const tab = $("character-tab");
  const rows = $("roster-rows");
  const display = $("character-display");
  const running = $("character-running");
  const fields = $("character-fields");
  const create = $("character-create");
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
  let state = "display";  // "display" | "editing" | "running" | "creating"
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
  ];

  // ---- roster ----
  function renderRoster() {
    const list = C.load(storage);
    rows.innerHTML = list.length
      ? list.map((c) => `<tr>
          <td><a href="#" data-open="${escapeHTML(c.id)}">${escapeHTML(C.label(c))}</a></td>
          <td>${C.isCreating(c) ? `<wa-badge variant="warning" appearance="outlined">In creation</wa-badge>` : escapeHTML(c.archetype)}</td>
          <td>${C.isCreating(c) ? "" : escapeHTML(c.origin)}</td>
          <td class="actions">${C.isCreating(c) ? "" : `
            <wa-button size="s" appearance="outlined" data-export="${escapeHTML(c.id)}">
              <wa-icon slot="start" name="file-export"></wa-icon>Export JSON
            </wa-button>`}
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
    const find = (id) => C.load(storage).find((c) => c.id === id);
    if (open) {
      e.preventDefault();
      const c = find(open.dataset.open);
      if (c) { store.set("openCharacter", c.id); show(c, C.isCreating(c) ? "creating" : "display"); }
    } else if (exp) {
      const c = find(exp.dataset.export);
      if (c) download(C.toExport(c));
    }
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
    // In creation: Create only. Finished: never Create.
    state = C.isCreating(character) ? "creating" : mode === "creating" ? "display" : mode;
    tab.hidden = false;
    setLabel(current.handle);
    render();
    if (activate) customElements.whenDefined("wa-tab-group").then(() => { tabs.active = "character"; });
  }

  function render() {
    display.hidden = state !== "display";
    form.hidden = state !== "editing";
    running.hidden = state !== "running";
    create.hidden = state !== "creating";
    fields.hidden = state === "editing" || state === "creating";
    fields.dataset.state = state;
    if (state === "creating") {
      window.NCD_CREATE.render(create, current, createHooks);
    } else if (state === "editing") {
      draft = {
        skills: { ...(current.skills ?? {}) }, wounds: C.wounds(current), gear: C.gear(current),
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
      renderGear($("gear-edit"), draft, { editable: true });
      renderAbilitiesEdit();
    } else {
      renderFields();
      if (state === "display") {
        renderAppearance($("appearance-display"));
        renderSkillsDisplay($("skills-display"));
        $("gear-display-section").hidden = !C.gear(current).length;
        renderGear($("gear-display"), current);
        renderAbilities($("abilities-display"), C.abilities(current, ABILITIES));
      } else {
        renderSkillsDisplay($("skills-run"), { links: true });
        renderGear($("gear-run"), current);
        renderAbilities($("abilities-run"), C.abilities(current, ABILITIES));
      }
    }
  }

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

  // Edit and Run aren't for a character still being created.
  const enter = (mode) => () => { if (C.isCreating(current)) return; state = mode; render(); };
  $("character-edit").addEventListener("click", enter("editing"));
  $("character-run").addEventListener("click", enter("running"));
  $("character-stop").addEventListener("click", () => { state = "display"; render(); });

  // ---- appearance: shown in full on the sheet, and in a dialog while running ----
  const APPEARANCE = [["pronouns", "Pronouns"], ["physical", "Physical Appearance"], ["network", "Network Default"]];
  function renderAppearance(el) {
    const look = C.appearance(current);
    el.innerHTML = APPEARANCE.map(([key, title]) =>
      `<div class="sheet-field"><dt>${title}</dt><dd>${escapeHTML(look[key].trim() || "—")}</dd></div>`).join("");
  }
  $("character-appearance").addEventListener("click", () => {
    const dialog = $("appearance-dialog");
    dialog.label = `Appearance: ${C.label(current)}`;
    renderAppearance(dialog.querySelector(".appearance"));
    dialog.open = true;
  });

  // ---- gear: props for now, each shown as "description [prop]" ----
  // Run can add gear (saved right away, never Starter). Edit can add, change, or remove gear and set Starter; kept in the draft until Save.
  function renderGear(el, character, { editable = false } = {}) {
    const items = C.gear(character);
    el.innerHTML = items.length
      ? `<ul class="gear-list">${items.map((g) => `<li data-gear="${escapeHTML(g.id)}">
          <span class="gear-text">${escapeHTML(g.description)} <span class="gear-kind">[${escapeHTML(g.kind)}]</span></span>
          ${editable ? `<wa-button size="s" appearance="plain" data-gear-action="edit" title="Change">
              <wa-icon name="pen" label="Change"></wa-icon></wa-button>
            <wa-button size="s" appearance="plain" variant="danger" data-gear-action="remove" title="Remove">
              <wa-icon name="trash" label="Remove"></wa-icon></wa-button>` : ""}
        </li>`).join("")}</ul>`
      : `<p class="gear-empty">None</p>`;
  }

  const gearDialog = $("gear-dialog");
  const gearDescription = $("gear-description");
  const gearStarter = $("gear-starter");
  let gearChanging = null; // the item being changed in Edit, or null for new gear
  function openGearDialog(item = null) {
    gearChanging = item;
    gearDialog.label = item ? "Change gear" : "New gear";
    gearDescription.value = item?.description ?? "";
    gearStarter.checked = item?.starter ?? false;
    gearStarter.hidden = state !== "editing";
    gearDialog.open = true;
  }
  function saveGear() {
    const description = text(gearDescription.value);
    if (!description) { gearDescription.focus(); return; }
    if (state === "editing") {
      const starter = gearStarter.checked;
      draft = C.withGear(draft, gearChanging ? { ...gearChanging, description, starter } : C.newProp(description, starter));
      renderGear($("gear-edit"), draft, { editable: true });
    } else if (state === "running") {
      if (!commit(C.withGear(current, C.newProp(description)))) return;
      renderGear($("gear-run"), current);
    }
    gearDialog.open = false;
  }
  $("gear-save").addEventListener("click", saveGear);
  gearDescription.addEventListener("keydown", (e) => { if (e.key === "Enter") saveGear(); });
  for (const el of [running, form]) {
    el.addEventListener("click", (e) => { if (e.target.closest("[data-add-gear]")) openGearDialog(); });
  }
  $("gear-edit").addEventListener("click", (e) => {
    const button = e.target.closest("[data-gear-action]");
    const id = button?.closest("[data-gear]")?.dataset.gear;
    if (!id) return;
    if (button.dataset.gearAction === "edit") openGearDialog(draft.gear.find((g) => g.id === id));
    else {
      draft = C.withoutGear(draft, id);
      renderGear($("gear-edit"), draft, { editable: true });
    }
  });

  // ---- abilities: Perks and Augmentations, each name opening its full text ----
  const ABILITY_TYPES = [["perk", "Perks"], ["augmentation", "Augmentations"]];
  function renderAbilities(el, list) {
    el.innerHTML = ABILITY_TYPES.map(([type, heading]) => {
      const items = list.filter((a) => a.type === type);
      return items.length ? `<section class="ability-group"><h3>${heading}</h3><ul class="ability-list">${items.map((a) => `<li>
          <button type="button" class="ability-name" data-ability="${escapeHTML(a.id)}">${escapeHTML(a.name)}</button>
          ${a.summary ? `<span class="ability-summary">${escapeHTML(a.summary)}</span>` : ""}
        </li>`).join("")}</ul></section>` : "";
    }).join("");
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

  // Display: only skills with a value or intrinsic dice, then "Anything else" at 50%.
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
        .filter(([, st]) => C.isNotable(st));
      if (!items.length) return "";
      return `<section class="skill-group"><h3>${title}</h3><ul>${items.map(([sk, st]) => `<li>
          ${skillName(sk.id, sk.name, links)}${diceIcons(st)}
          <span class="skill-value${st.value == null ? " untrained" : ""}">${C.shownValue(st.value)}%</span>
          ${!links ? "" : C.canBeUsed(current, sk.id)
            ? `<wa-checkbox size="s" class="used" data-used="${sk.id}" ${C.isUsed(current, sk.id) ? "checked" : ""}>Used</wa-checkbox>`
            : `<span class="used"></span>`}
        </li>`).join("")}</ul></section>`;
    });
    // Untrained skills and "Anything else" can't be marked used; an empty slot keeps the values lined up.
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
  let rollSkill = null; // { id, name, adv, chal }

  const resetRollPools = () => {
    rollPools.adv.value = String(rollSkill.adv);
    rollPools.chal.value = String(rollSkill.chal);
  };
  function openRollDialog(id) {
    const sk = C.SKILLS.find((s) => s.id === id);
    const st = sk ? C.skill(current, id) : { value: null, adv: 0, chal: 0 };
    rollSkill = { id, name: sk ? sk.name : "Anything else", adv: st.adv, chal: st.chal };
    rollDialog.label = `Roll ${rollSkill.name}`;
    rollTarget.value = String(C.shownValue(st.value));
    resetRollPools();
    rollResult.hidden = true;
    rollResult.innerHTML = "";
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
  });
  $("skill-roll").addEventListener("click", rollSkillAndPost);
  rollTarget.addEventListener("keydown", (e) => { if (e.key === "Enter") rollSkillAndPost(); });

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
    edited.abilities = draft.abilities;
    if (!commit(edited)) return;
    store.set("openCharacter", current.id);
    state = "display";
    setLabel(current.handle);
    render();
    renderRoster();
  });

  // ---- creating: create.js draws the steps; these hooks save, finish, and discard ----
  // The Detail sheet, read-only, for Create's review step: a copy of the sheet head, then appearance, skills, gear, abilities.
  function renderSummary(el) {
    renderFields();
    const head = fields.cloneNode(true);
    head.hidden = false;
    for (const node of [head, ...head.querySelectorAll("[id]")]) node.removeAttribute("id");
    for (const button of head.querySelectorAll("[data-luck], [data-influence]")) button.remove();
    el.innerHTML = `<dl class="appearance"></dl><div class="skills"></div>
      <section class="gear"><div class="gear-head"><h3>Gear</h3></div><div class="summary-gear"></div></section>
      <div class="abilities"></div>`;
    el.prepend(head);
    renderAppearance(el.querySelector(".appearance"));
    renderSkillsDisplay(el.querySelector(".skills"));
    el.querySelector("section.gear").hidden = !C.gear(current).length;
    renderGear(el.querySelector(".summary-gear"), current);
    renderAbilities(el.querySelector(".abilities"), C.abilities(current, ABILITIES));
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
      store.set("openCharacter", null);
      setCurrent(null);
      state = "display";
      tab.hidden = true;
      customElements.whenDefined("wa-tab-group").then(() => { tabs.active = "roster"; });
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
