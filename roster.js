// Roster tab (the saved characters) and the Character tab, which appears once a character is opened.
// A character in the Character tab is in one of three states: display, editing, or running.
// Skill changes made while editing live in `draft` until Save.
(function () {
  const C = window.NCD_CHARACTERS;
  const $ = (id) => document.getElementById(id);
  // localStorage itself can throw when storage is blocked; the character helpers handle a null store.
  const storage = (() => { try { return window.localStorage; } catch { return null; } })();
  const remember = (key, value) => { try { value == null ? storage.removeItem(key) : storage.setItem(key, value); } catch {} };

  const tabs = $("tabs");
  const tab = $("character-tab");
  const rows = $("roster-rows");
  const display = $("character-display");
  const running = $("character-running");
  const fields = $("character-fields");
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
  let state = "display";  // "display" | "editing" | "running"
  let draft = null;       // while editing: a copy holding skill changes until Save

  const escapeHTML = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

  const portraits = C.availablePortraits(window.NCD_PORTRAITS);
  const portraitSrc = (file) => C.PORTRAIT_DIR + file;
  const portraitOptions = portraits.map((file) => [file, C.portraitLabel(file)]);
  const plain = (values) => values.map((value) => [value, value]);
  for (const [name, options] of [["archetype", plain(C.ARCHETYPES)], ["origin", plain(C.ORIGINS)], ["portrait", portraitOptions]]) {
    for (const [value, text] of options) {
      const option = document.createElement("wa-option");
      option.value = value;
      option.textContent = text;
      field(name).append(option);
    }
  }

  // ---- roster ----
  function renderRoster() {
    const list = C.load(storage);
    rows.innerHTML = list.length
      ? list.map((c) => `<tr>
          <td><a href="#" data-open="${escapeHTML(c.id)}">${escapeHTML(C.label(c))}</a></td>
          <td>${escapeHTML(c.archetype)}</td>
          <td>${escapeHTML(c.origin)}</td>
          <td class="actions">
            <wa-button size="s" appearance="outlined" data-export="${escapeHTML(c.id)}">
              <wa-icon slot="start" name="file-export"></wa-icon>Export JSON
            </wa-button>
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
      if (c) { remember("ncd.openCharacter", c.id); show(c, "display"); }
    } else if (exp) {
      const c = find(exp.dataset.export);
      if (c) download(C.toExport(c));
    }
  });

  $("new-character").addEventListener("click", () => show(C.newCharacter(), "editing"));

  // ---- character tab ----
  const setLabel = (handle) => { tab.textContent = C.label({ handle }); };

  function show(character, mode, { activate = true } = {}) {
    current = character;
    state = mode;
    tab.hidden = false;
    setLabel(current.handle);
    render();
    if (activate) customElements.whenDefined("wa-tab-group").then(() => { tabs.active = "character"; });
  }

  function render() {
    display.hidden = state !== "display";
    form.hidden = state !== "editing";
    running.hidden = state !== "running";
    fields.hidden = state === "editing";
    fields.dataset.state = state;
    if (state === "editing") {
      draft = { skills: { ...(current.skills ?? {}) }, wounds: C.wounds(current) };
      for (const name of ["handle", "name", "archetype", "origin"]) field(name).value = current[name] ?? "";
      const luck = C.luck(current);
      field("maxLuck").value = String(luck.max);
      field("currentLuck").value = String(luck.current);
      const inf = C.influence(current);
      field("startingInfluence").value = String(inf.starting);
      field("currentInfluence").value = String(inf.current);
      field("portrait").value = C.portraitFile(current, portraits);
      $("portrait-preview").src = portraitSrc(field("portrait").value);
      woundsEdit.innerHTML = woundBoxes(draft.wounds, true);
      const known = C.knows(current);
      for (const box of knowsEdit.querySelectorAll("wa-checkbox")) box.checked = known.includes(box.value);
      const xp = C.xp(current);
      field("xpAvailable").value = String(xp.available);
      field("xpSpent").value = String(xp.spent);
      showXpTotal();
      const look = C.appearance(current);
      for (const name of ["pronouns", "physical", "network"]) field(name).value = look[name];
      renderSkillsEdit();
    } else {
      renderFields();
      if (state === "display") {
        renderAppearance($("appearance-display"));
        renderSkillsDisplay($("skills-display"));
      }
      else renderSkillsDisplay($("skills-run"), { links: true });
    }
  }

  // Handle, name, etc. Current Luck, Current Influence, and Wounds can be changed while running, and are saved right away.
  function renderFields() {
    $("portrait").src = portraitSrc(C.portraitFile(current, portraits));
    $("portrait").alt = `Portrait of ${C.label(current)}`;
    const luck = C.luck(current);
    const inf = C.influence(current);
    const xp = C.xp(current);
    const values = { ...current, maxLuck: luck.max, currentLuck: luck.current, startingInfluence: inf.starting, currentInfluence: inf.current,
      xpTotal: xp.total, xpAvailable: xp.available, xpSpent: xp.spent };
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
      const step = Number(button.dataset.luck);
      button.hidden = !editable;
      button.disabled = step < 0 ? luck.current <= 0 : luck.current >= luck.max;
    }
    for (const button of currentInfluence.querySelectorAll("[data-influence]")) {
      button.hidden = !editable;
      button.disabled = Number(button.dataset.influence) < 0 && inf.current <= 0;
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
    try {
      current = C.save(storage, { ...current, wounds: C.clickWound(C.wounds(current), n) });
    } catch (err) {
      console.error(err);
    }
    renderFields();
  });
  woundsEdit.addEventListener("click", (e) => {
    const n = clickedWound(e);
    if (!n) return;
    draft.wounds = C.clickWound(draft.wounds, n);
    woundsEdit.innerHTML = woundBoxes(draft.wounds, true);
  });
  currentLuck.addEventListener("click", (e) => {
    const step = Number(e.target.closest("[data-luck]")?.dataset.luck);
    if (!step || state !== "running") return;
    const luck = C.luck(current);
    const value = C.clampCurrentLuck(luck.current + step, luck.max);
    try {
      current = C.save(storage, { ...current, currentLuck: value });
    } catch (err) {
      console.error(err);
    }
    renderFields();
  });
  currentInfluence.addEventListener("click", (e) => {
    const step = Number(e.target.closest("[data-influence]")?.dataset.influence);
    if (!step || state !== "running") return;
    const before = C.influence(current).current;
    const after = C.clampInfluence(before + step);
    if (after === before) return;
    try {
      current = C.save(storage, { ...current, currentInfluence: after });
    } catch (err) {
      console.error(err);
    }
    renderFields();
    window.NCD_ROLLER.postInfluence(after - before, after); // only while running; changes in Edit aren't posted
  });

  $("character-edit").addEventListener("click", () => { state = "editing"; render(); });
  $("character-run").addEventListener("click", () => { state = "running"; render(); });
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

  // ---- XP: the editor shows the total as Available and Spent change ----
  function showXpTotal() {
    $("xp-total-edit").textContent = C.clampXp(field("xpAvailable").value) + C.clampXp(field("xpSpent").value);
  }

  // ---- skills ----
  const icon = window.NCD_ICONS.svg;
  const GROUPS = { mental: "Mental", physical: "Physical", initiative: "Initiative" };
  // Mental fills the first column; Physical and the (short) Initiative group share the second.
  const COLUMNS = [["mental"], ["physical", "initiative"]];
  const columns = (groupHTML) => COLUMNS.map((types) => types.map(groupHTML).join(""))
    .filter(Boolean).map((html) => `<div class="skill-column">${html}</div>`).join("");
  const diceIcons = (st) => (st.adv || st.chal)
    ? `<span class="skill-dice">${`<span class="adv">${icon("advantage-die")}</span>`.repeat(st.adv)}${`<span class="chal">${icon("challenge-die")}</span>`.repeat(st.chal)}</span>`
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

  function renderSkillsEdit() {
    $("skills-edit").innerHTML = columns((type) => `<section class="skill-group"><h3>${GROUPS[type]}</h3><ul>${
      C.SKILLS.filter((sk) => sk.type === type).map((sk) => editRow(sk, C.skill(draft, sk.id))).join("")}</ul></section>`);
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
  for (const group of Object.values(dicePools)) {
    for (let n = 0; n <= C.MAX_DICE; n++) {
      const radio = document.createElement("wa-radio");
      radio.value = String(n);
      radio.setAttribute("appearance", "button");
      radio.textContent = n;
      group.append(radio);
    }
  }
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
  const R = window.NCD_ROLLER;
  const rollDialog = $("skill-dialog");
  const rollTarget = $("skill-target");
  const rollPools = { adv: $("skill-adv"), chal: $("skill-chal") };
  const rollResult = $("skill-result");
  Object.values(rollPools).forEach(R.fillPool);
  const readRollTarget = R.targetField(rollTarget);
  let rollSkill = null; // { id, name, adv, chal }

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
  const resetRollPools = () => {
    rollPools.adv.value = String(rollSkill.adv);
    rollPools.chal.value = String(rollSkill.chal);
  };

  // Used is saved right away; rolling a skill marks it used.
  function setUsed(id, used) {
    if (!C.canBeUsed(current, id)) return; // also covers "Anything else", which isn't a skill
    try {
      current = C.save(storage, C.withUsed(current, id, used));
    } catch (err) {
      console.error(err);
    }
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

  let skillRolling = false;
  async function rollSkillAndPost() {
    if (skillRolling || !rollSkill) return;
    skillRolling = true;
    $("skill-roll").loading = true;
    try {
      const r = window.NCD_DICE.roll({ target: readRollTarget(), advantage: rollPools.adv.value, challenge: rollPools.chal.value });
      resetRollPools();
      rollResult.hidden = false;
      const spinning = R.spin(rollResult);
      rollResult.scrollIntoView({ block: "nearest" });
      await spinning;
      R.showResult(r, true, rollResult);
      rollResult.scrollIntoView({ block: "nearest" }); // on phones the result is below the fold
      setUsed(rollSkill.id, true);
      await R.postToDiscord(r, rollSkill.name);
    } finally {
      skillRolling = false;
      $("skill-roll").loading = false;
    }
  }
  $("skill-roll").addEventListener("click", rollSkillAndPost);
  rollTarget.addEventListener("keydown", (e) => { if (e.key === "Enter") rollSkillAndPost(); });

  form.addEventListener("click", (e) => {
    const button = e.target.closest("[data-reroll]");
    if (!button) return;
    const name = button.dataset.reroll;
    field(name).value = name === "handle" ? C.randomHandle() : C.randomName();
    if (name === "handle") setLabel(field("handle").value);
  });
  field("handle").addEventListener("input", () => setLabel(field("handle").value));
  for (const name of ["xpAvailable", "xpSpent"]) field(name).addEventListener("input", showXpTotal);
  field("portrait").addEventListener("change", () => { $("portrait-preview").src = portraitSrc(field("portrait").value); });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const edited = { ...current };
    for (const name of ["handle", "name", "archetype", "origin"]) edited[name] = String(field(name).value ?? "").trim();
    edited.maxLuck = C.clampMaxLuck(field("maxLuck").value);
    edited.currentLuck = C.clampCurrentLuck(field("currentLuck").value, edited.maxLuck);
    edited.startingInfluence = C.clampInfluence(field("startingInfluence").value);
    edited.currentInfluence = C.clampInfluence(field("currentInfluence").value, edited.startingInfluence);
    // The default is stored as null, so a character follows it if default.png ever changes.
    edited.portrait = field("portrait").value === C.DEFAULT_PORTRAIT ? null : field("portrait").value;
    edited.wounds = draft.wounds;
    edited.xpAvailable = C.clampXp(field("xpAvailable").value);
    edited.xpSpent = C.clampXp(field("xpSpent").value);
    edited.appearance = { pronouns: String(field("pronouns").value ?? "").trim(),
      physical: String(field("physical").value ?? "").trim(), network: String(field("network").value ?? "").trim() };
    edited.knows = [...knowsEdit.querySelectorAll("wa-checkbox")].filter((box) => box.checked).map((box) => box.value);
    edited.skills = draft.skills;
    try {
      current = C.save(storage, edited);
    } catch (err) {
      console.error(err);
      return;
    }
    remember("ncd.openCharacter", current.id);
    state = "display";
    setLabel(current.handle);
    render();
    renderRoster();
  });

  // For the Discord message: the character open in the Character tab, if any.
  window.NCD_ACTIVE_CHARACTER = () => current;

  // ---- start up: reopen the last saved character, if any ----
  renderRoster();
  let openId = null;
  try { openId = storage.getItem("ncd.openCharacter"); } catch {}
  const reopen = C.load(storage).find((c) => c.id === openId);
  if (reopen) show(reopen, "display", { activate: false });
  customElements.whenDefined("wa-tab-group").then(() => {
    if (tabs.active === "character" && !reopen) tabs.active = "roster";
  });
})();
