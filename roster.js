// Roster tab (the saved characters) and the Character tab, which appears once a character is opened.
// A character in the Character tab is in one of three states: display, editing, or running (not built yet).
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
  const form = $("character-form");
  const field = (name) => form.querySelector(`[name="${name}"]`);

  let current = null;     // the character in the Character tab
  let state = "display";  // "display" | "editing" | "running"
  let draft = null;       // while editing: a copy holding skill changes until Save

  const escapeHTML = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

  for (const [name, values] of [["archetype", C.ARCHETYPES], ["origin", C.ORIGINS]]) {
    for (const value of values) {
      const option = document.createElement("wa-option");
      option.value = value;
      option.textContent = value;
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
    if (state === "display") {
      for (const dd of display.querySelectorAll("[data-field]")) dd.textContent = current[dd.dataset.field] || "—";
      renderSkillsDisplay();
    } else if (state === "editing") {
      draft = { skills: { ...(current.skills ?? {}) } };
      for (const name of ["handle", "name", "archetype", "origin"]) field(name).value = current[name] ?? "";
      renderSkillsEdit();
    }
  }

  $("character-edit").addEventListener("click", () => { state = "editing"; render(); });
  $("character-run").addEventListener("click", () => {}); // running comes later

  // ---- skills ----
  const icon = window.NCD_ICONS.svg;
  const GROUPS = [["mental", "Mental"], ["physical", "Physical"]];
  const diceIcons = (st) => (st.adv || st.chal)
    ? `<span class="skill-dice">${`<span class="adv">${icon("advantage-die")}</span>`.repeat(st.adv)}${`<span class="chal">${icon("challenge-die")}</span>`.repeat(st.chal)}</span>`
    : "";

  // Display: only skills with a value or intrinsic dice, then "Anything else" at 50%.
  function renderSkillsDisplay() {
    const groups = GROUPS.map(([type, title]) => {
      const items = C.SKILLS.filter((sk) => sk.type === type)
        .map((sk) => [sk, C.skill(current, sk.id)])
        .filter(([, st]) => C.isNotable(st));
      if (!items.length) return "";
      return `<section class="skill-group"><h3>${title}</h3><ul>${items.map(([sk, st]) => `<li>
          <span class="skill-name">${escapeHTML(sk.name)}</span>${diceIcons(st)}
          <span class="skill-value${st.value == null ? " untrained" : ""}">${C.shownValue(st.value)}%</span>
        </li>`).join("")}</ul></section>`;
    }).join("");
    $("skills-display").innerHTML = groups + `<ul class="anything-else"><li>
        <span class="skill-name">Anything else</span><span class="skill-value untrained">${C.UNTRAINED}%</span></li></ul>`;
  }

  // Editing: every skill, with set / +5 / Set to 55 / Remove, and a button for intrinsic dice.
  function editRow(sk, st) {
    const controls = st.value == null
      ? `<span class="skill-value untrained">${C.UNTRAINED}%</span>
         <wa-button size="s" appearance="outlined" data-action="set-min">Set to ${C.MIN_VALUE}</wa-button>`
      : `<wa-input type="number" size="s" min="${C.MIN_VALUE}" max="${C.MAX_VALUE}" value="${st.value}" data-action="value"
           aria-label="${escapeHTML(sk.name)} %"><span slot="end">%</span></wa-input>
         <wa-button size="s" appearance="outlined" data-action="increment" ${st.value >= C.MAX_VALUE ? "disabled" : ""}>+5</wa-button>
         ${st.value === C.MIN_VALUE ? `<wa-button size="s" appearance="plain" variant="danger" data-action="remove">Remove</wa-button>` : ""}`;
    return `<li data-skill="${sk.id}">
        <span class="skill-name">${escapeHTML(sk.name)}</span>
        <span class="skill-controls">${controls}</span>
        <wa-button size="s" appearance="plain" data-action="dice" title="Intrinsic dice for ${escapeHTML(sk.name)}">
          ${diceIcons(st) || `<wa-icon name="dice" label="Intrinsic dice"></wa-icon>`}
        </wa-button>
      </li>`;
  }

  function renderSkillsEdit() {
    $("skills-edit").innerHTML = GROUPS.map(([type, title]) => `<section class="skill-group"><h3>${title}</h3><ul>${
      C.SKILLS.filter((sk) => sk.type === type).map((sk) => editRow(sk, C.skill(draft, sk.id))).join("")}</ul></section>`).join("");
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

  form.addEventListener("click", (e) => {
    const button = e.target.closest("[data-reroll]");
    if (!button) return;
    const name = button.dataset.reroll;
    field(name).value = name === "handle" ? C.randomHandle() : C.randomName();
    if (name === "handle") setLabel(field("handle").value);
  });
  field("handle").addEventListener("input", () => setLabel(field("handle").value));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const edited = { ...current };
    for (const name of ["handle", "name", "archetype", "origin"]) edited[name] = String(field(name).value ?? "").trim();
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
