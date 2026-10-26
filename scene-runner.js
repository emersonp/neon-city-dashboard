// The Administrator's Scene Runner tab: the page code for scene-rules.js (which has the rules and storage).
// - List (the first tab): the saved scenes; New, Edit, Duplicate, Delete and Run. The running scene can't be edited, deleted or run.
// - Custom: the Administrator's own enemies, objectives and hazards (a list on the left, the one picked on the right),
//   Copy from rulebook, and Export / Import of everything (custom items and scenes) as one JSON file.
// - Builder (only while a scene is being built) and Runner (only while one is running). One scene is open at a time:
//   starting to build or run another asks to Save, Discard or Cancel.
// The Runner's turn arrows send through admin.js's link like the Initiative card (admin-initiative.js), and the run
// follows what the overlay reports, so the two stay in step. Without the link, the run counts turns itself.
(function () {
  const S = window.NCD_SCENES;
  const APP = window.NCD_APP;
  const ADMIN = window.NCD_ADMIN;
  const DICE = window.NCD_DICE;
  const INITIATIVE = window.NCD_INITIATIVE;
  const P = window.NCD_PLACES;
  const { NO_CONFLICT, PHASES, PHASE_NAMES, stepInitiative } = window.NCD_OVERLAY;
  const { formatDescription } = window.NCD_FORMAT;
  const { svg: icon } = window.NCD_ICONS;
  const { $, text, escapeHTML } = window.NCD_UTIL;
  const storage = window.NCD_STORE.raw;
  const RULEBOOK = { enemies: window.NCD_ENEMIES.enemies, tables: window.NCD_TABLES, hazards: window.NCD_HAZARDS.hazards };
  const ENEMY_TYPES = window.NCD_ENEMIES.TYPES;
  const { damageLabel } = window.NCD_HAZARDS;
  const { PORTRAIT_DIR } = window.NCD_CHARACTERS;
  const K = window.NCD_CONDITIONS;
  const CUI = window.NCD_CONDITIONS_UI;

  const ICON_COLOR = { "advantage-die": "adv", boon: "adv", "challenge-die": "chal", drawback: "chal" };
  const rich = (s) => `<div class="ability-text">${formatDescription(s, (name) => icon(name, ICON_COLOR[name] ?? ""))}</div>`;
  const esc = escapeHTML;
  const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const KIND_NAMES = { enemy: "Enemy", objective: "Objective", hazard: "Hazard" };
  const KIND_PLURALS = { enemy: "Enemies", objective: "Objectives", hazard: "Hazards" };
  const LISTS = { enemy: "enemies", objective: "objectives", hazard: "hazards" };
  const TIMING_NAMES = { urgent: "Urgent", timed: "Timed" };

  let custom = S.loadCustom(storage);
  let scenes = S.loadScenes(storage);
  // null, { mode: "build", scene } or { mode: "run", run }
  let open = S.loadOpen(storage);
  let lib = S.library(RULEBOOK, custom);

  const tabs = $("scene-tabs");
  const builderTab = $("scene-builder-tab");
  const runnerTab = $("scene-runner-tab");

  // Radios are added here, not written in the page: Firefox would wipe their values restoring form state on reload.
  const radios = (group, options) => {
    group.innerHTML = options.map(([value, label]) => `<wa-radio appearance="button" value="${esc(value)}">${esc(label)}</wa-radio>`).join("");
  };

  // ---- keeping things ----
  function customChanged() {
    S.saveCustom(storage, custom);
    lib = S.library(RULEBOOK, custom);
    APP.showCustomLists({ enemies: lib.enemies.filter((i) => i.source === "custom"), hazards: lib.hazards.filter((i) => i.source === "custom") });
  }
  const scenesChanged = () => S.saveScenes(storage, scenes);
  function setOpen(next) {
    open = next;
    S.saveOpen(storage, open);
    builderTab.hidden = open?.mode !== "build";
    runnerTab.hidden = open?.mode !== "run";
  }
  // Shows a subtab once it's there to show (a tab that was hidden a moment ago needs the group to catch up).
  const show = (panel) => customElements.whenDefined("wa-tab-group").then(() => requestAnimationFrame(() => { tabs.active = panel; }));

  // ---- dialogs ----
  // Asks to confirm; onOk runs on the danger button.
  let confirmOk = null;
  function confirm(label, message, okLabel, onOk) {
    const dialog = $("scene-confirm-dialog");
    dialog.label = label;
    $("scene-confirm-text").textContent = message;
    $("scene-confirm-label").textContent = okLabel;
    confirmOk = onOk;
    dialog.open = true;
  }
  $("scene-confirm-ok").addEventListener("click", () => {
    $("scene-confirm-dialog").open = false;
    const fn = confirmOk;
    confirmOk = null;
    fn?.();
  });

  // Before building or running a scene: if one's open, ask whether to save it (a scene being built) or discard it
  // (a draft thrown away, or a run ended), or cancel. then() runs once nothing's open.
  let afterOpen = null;
  function whenClosed(then) {
    if (!open) { then(); return; }
    afterOpen = then;
    const building = open.mode === "build";
    const name = text(building ? open.scene.name : open.run.name) || "Untitled scene";
    $("scene-open-text").textContent = building
      ? `“${name}” is being built. Save it first, or discard the changes?`
      : `“${name}” is running. End the run first? Its tracking is cleared; the saved scene stays as it is.`;
    $("scene-open-save").hidden = !building;
    $("scene-open-discard").textContent = building ? "Discard" : "End run";
    $("scene-open-dialog").open = true;
  }
  $("scene-open-save").addEventListener("click", () => {
    if (!saveDraft()) return;
    $("scene-open-dialog").open = false;
    const then = afterOpen;
    afterOpen = null;
    then?.();
  });
  $("scene-open-discard").addEventListener("click", () => {
    $("scene-open-dialog").open = false;
    if (open?.mode === "run") endRun(); else setOpen(null);
    const then = afterOpen;
    afterOpen = null;
    then?.();
    renderAll();
  });

  // ================= Custom =================
  let picked = null; // { kind, id } of the custom item open in the editor (id null for a new one), with base for a copy
  const customFilter = $("custom-filter");
  radios(customFilter, [["all", "All"], ["enemy", "Enemies"], ["objective", "Objectives"], ["hazard", "Hazards"]]);
  customFilter.addEventListener("change", () => renderCustomList());

  const customItem = (kind, id) => custom[LISTS[kind]].find((i) => i.id === id);
  const byName = (a, b) => a.name.localeCompare(b.name);

  function renderCustomList() {
    const f = customFilter.value || "all";
    const groups = S.KINDS.filter((k) => f === "all" || f === k).map((kind) => {
      const items = [...custom[LISTS[kind]]].sort(byName);
      return `<h3>${KIND_PLURALS[kind]}</h3>${items.length ? `<ul class="scene-items">${items.map((i) =>
        `<li><button type="button" class="scene-item${picked?.id === i.id ? " on" : ""}" data-custom-pick="${kind}:${esc(i.id)}">${esc(i.name)}${
          kind === "enemy" ? `<span class="scene-item-tag">${esc(i.type)}</span>` : ""}</button></li>`).join("")}</ul>`
        : `<p class="scene-empty">None yet.</p>`}`;
    });
    $("custom-list").innerHTML = groups.join("");
  }

  // One [name, text] row of an enemy's attacks or perks.
  const pairRow = (field, [name, txt] = ["", ""]) => `<div class="pair-row" data-pair="${field}">
      <wa-input size="s" placeholder="Name" value="${esc(name)}" data-pair-name></wa-input>
      <wa-input size="s" placeholder="${field === "attacks" ? "75%; 45 physical damage" : "What it does"}" value="${esc(txt)}" data-pair-text></wa-input>
      <wa-button size="s" appearance="plain" data-pair-remove title="Remove"><wa-icon name="xmark" label="Remove"></wa-icon></wa-button>
    </div>`;
  const pairs = (field, list) => `<div class="pair-list" data-pairs="${field}">${list.map((p) => pairRow(field, p)).join("")}</div>
    <wa-button size="s" appearance="outlined" data-pair-add="${field}"><wa-icon slot="start" name="plus"></wa-icon>${field === "attacks" ? "Attack" : "Perk"}</wa-button>`;
  const field = (name, label, value, extra = "") => `<wa-input name="${name}" label="${label}" value="${esc(value ?? "")}" autocomplete="off" ${extra}></wa-input>`;
  const area = (name, label, value) => `<wa-textarea name="${name}" label="${label}" value="${esc(value ?? "")}" rows="3" resize="auto"></wa-textarea>`;

  function editorForm(kind, item) {
    if (kind === "enemy") {
      return `${field("name", "Name", item.name)}
        <wa-select name="type" label="Type" value="${esc(item.type ?? "Antagonist")}">${ENEMY_TYPES.map((t) => `<wa-option value="${esc(t)}">${esc(t)}</wa-option>`).join("")}</wa-select>
        <div data-luck-field ${item.type === "Minion squad" ? "hidden" : ""}>${field("luck", "Luck", item.luck ?? 50, 'type="number" min="1"')}</div>
        ${area("text", "Description", item.text)}
        <h3>Skills and attacks</h3>
        <p class="scene-hint">Write each attack the rulebook's way, so the Runner can roll it: "75%; 45 physical damage", or
          "50%; physical damage equal to the squad's size x5".</p>
        ${pairs("attacks", item.attacks ?? [])}
        <h3>Perks</h3>${pairs("perks", item.perks ?? [])}`;
    }
    const timing = `<wa-radio-group name="timing" label="${kind === "hazard" ? "Timing" : "Urgent or Timed"}" orientation="horizontal" value="${item.timing ?? ""}" data-radios="timing"></wa-radio-group>`;
    if (kind === "objective") {
      return `${field("name", "Name", item.name)}${area("text", "Description", item.text)}
        ${field("difficulty", "Difficulty", item.difficulty ?? 50, 'type="number" min="1" step="10"')}${timing}`;
    }
    const mode = item.damage === null ? "none" : item.damage === "round" || item.damage == null ? "round" : "fixed";
    return `${field("name", "Name", item.name)}${area("text", "Description", item.text)}
      <div class="scene-form-row">${field("difficulty", "Difficulty", item.difficulty ?? 50, 'type="number" min="1" step="10"')}
        ${field("hit", "Hit %", item.hit ?? 50, 'type="number" min="1" max="100"')}</div>
      <wa-radio-group name="damageMode" label="Damage" orientation="horizontal" value="${mode}" data-radios="damage"></wa-radio-group>
      <div data-fixed-field ${mode === "fixed" ? "" : "hidden"}>${field("damage", "Damage on a hit", mode === "fixed" ? item.damage : 20, 'type="number" min="1"')}</div>
      ${area("effect", "Effect", item.effect)}`;
  }

  function renderCustomEditor() {
    const el = $("custom-editor");
    if (!picked) {
      el.innerHTML = `<p class="scene-empty">Pick one of your own on the left, or make a new enemy, objective or hazard. Rulebook entries stay as the book has them; Copy from rulebook starts one of your own from them.</p>`;
      return;
    }
    const { kind, id, base } = picked;
    const item = id ? customItem(kind, id) : base ?? {};
    el.innerHTML = `<form class="scene-form" id="custom-form" data-kind="${kind}">
        <h2>${id ? `${esc(item.name)} <span class="databank-tag">Custom ${KIND_NAMES[kind].toLowerCase()}</span>` : `New ${KIND_NAMES[kind].toLowerCase()}`}</h2>
        ${editorForm(kind, item)}
        <div class="scene-actions">
          ${id ? `<wa-button appearance="outlined" variant="danger" id="custom-delete"><wa-icon slot="start" name="trash"></wa-icon>Delete</wa-button>` : ""}
          <wa-button appearance="outlined" id="custom-cancel">Cancel</wa-button>
          <wa-button variant="brand" id="custom-save"><wa-icon slot="start" name="floppy-disk"></wa-icon>Save</wa-button>
        </div>
      </form>`;
    for (const group of el.querySelectorAll("[data-radios]")) {
      const value = group.getAttribute("value");
      radios(group, group.dataset.radios === "timing" ? [["", "Neither"], ["urgent", "Urgent"], ["timed", "Timed"]]
        : [["round", "10 × round"], ["fixed", "Fixed"], ["none", "None"]]);
      group.value = value;
    }
  }

  // The editor's form as a custom item, cleaned (null without a name).
  function readCustomForm() {
    const form = $("custom-form");
    const kind = form.dataset.kind;
    const val = (name) => form.querySelector(`[name="${name}"]`)?.value ?? "";
    const pairList = (f) => [...form.querySelectorAll(`[data-pair="${f}"]`)]
      .map((row) => [row.querySelector("[data-pair-name]").value, row.querySelector("[data-pair-text]").value]);
    const raw = { id: picked.id ?? newId(), name: val("name"), text: val("text") };
    if (kind === "enemy") Object.assign(raw, { type: val("type"), luck: val("luck"), attacks: pairList("attacks"), perks: pairList("perks") });
    if (kind !== "enemy") Object.assign(raw, { difficulty: val("difficulty"), timing: val("timing") || null });
    if (kind === "hazard") {
      const mode = val("damageMode");
      Object.assign(raw, { hit: val("hit"), effect: val("effect"), damage: mode === "none" ? null : mode === "fixed" ? val("damage") : "round" });
    }
    return S.cleanCustom(kind, raw);
  }

  function pickCustom(next) {
    picked = next;
    renderCustomList();
    renderCustomEditor();
  }

  document.querySelector('wa-tab-panel[name="scenes-custom"]').addEventListener("click", (e) => {
    const newKind = e.target.closest("[data-custom-new]")?.dataset.customNew;
    if (newKind) { pickCustom({ kind: newKind, id: null }); return; }
    const pick = e.target.closest("[data-custom-pick]")?.dataset.customPick;
    if (pick) {
      const [kind, ...id] = pick.split(":");
      pickCustom({ kind, id: id.join(":") });
      return;
    }
    const add = e.target.closest("[data-pair-add]")?.dataset.pairAdd;
    if (add) {
      const list = $("custom-form").querySelector(`[data-pairs="${add}"]`);
      list.insertAdjacentHTML("beforeend", pairRow(add));
      list.lastElementChild.querySelector("wa-input")?.focus();
      return;
    }
    if (e.target.closest("[data-pair-remove]")) { e.target.closest(".pair-row").remove(); return; }
    if (e.target.closest("#custom-cancel")) { pickCustom(null); return; }
    if (e.target.closest("#custom-save")) {
      const item = readCustomForm();
      if (!item) { APP.toast("Give it a name first.", "warning"); return; }
      const { kind } = picked;
      const list = custom[LISTS[kind]];
      custom = { ...custom, [LISTS[kind]]: list.some((i) => i.id === item.id) ? list.map((i) => (i.id === item.id ? item : i)) : [...list, item] };
      customChanged();
      pickCustom({ kind, id: item.id });
      APP.toast(`Saved ${item.name}.`, "success");
      return;
    }
    if (e.target.closest("#custom-delete")) {
      const { kind, id } = picked;
      const item = customItem(kind, id);
      confirm(`Delete ${KIND_NAMES[kind].toLowerCase()}`, `Delete ${item.name}? Scenes with a copy of it keep their copy.`, "Delete", () => {
        custom = { ...custom, [LISTS[kind]]: custom[LISTS[kind]].filter((i) => i.id !== id) };
        customChanged();
        pickCustom(null);
      });
    }
  });
  // Luck is only for an enemy that isn't a minion squad; a fixed damage only with Fixed picked.
  $("custom-editor").addEventListener("change", (e) => {
    const form = $("custom-form");
    if (e.target.getAttribute?.("name") === "type") form.querySelector("[data-luck-field]").hidden = e.target.value === "Minion squad";
    if (e.target.getAttribute?.("name") === "damageMode") form.querySelector("[data-fixed-field]").hidden = e.target.value !== "fixed";
  });

  // Copy from rulebook: a new custom item with a rulebook item's fields.
  const copyKind = $("scene-copy-kind");
  const copyItem = $("scene-copy-item");
  radios(copyKind, [["enemy", "Enemy"], ["objective", "Objective"], ["hazard", "Hazard"]]);
  const rulebookOf = (kind) => lib[LISTS[kind]].filter((i) => i.source === "rulebook").sort(byName);
  const fillCopyItems = () => {
    copyItem.innerHTML = rulebookOf(copyKind.value).map((i) => `<wa-option value="${esc(i.id)}">${esc(i.name)}</wa-option>`).join("");
    copyItem.value = "";
  };
  copyKind.addEventListener("change", fillCopyItems);
  $("custom-copy").addEventListener("click", () => {
    copyKind.value = picked?.kind ?? "enemy";
    fillCopyItems();
    $("scene-copy-dialog").open = true;
  });
  $("scene-copy-confirm").addEventListener("click", () => {
    const item = rulebookOf(copyKind.value).find((i) => i.id === copyItem.value);
    if (!item) { APP.toast("Choose one to copy.", "warning"); return; }
    $("scene-copy-dialog").open = false;
    const { id, kind, source, ...fields } = structuredClone(item);
    show("scenes-custom");
    pickCustom({ kind, id: null, base: S.cleanCustom(kind, { ...fields, id: "copy" }) });
  });

  // Export and Import: everything (custom items and scenes) as one JSON file.
  $("scenes-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(S.exportDoc(custom, scenes), null, 2)], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "neon-city-scenes.json" });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  const importFile = $("scenes-import-file");
  $("scenes-import").addEventListener("click", () => importFile.click());
  importFile.addEventListener("change", async () => {
    const file = importFile.files?.[0];
    importFile.value = "";
    if (!file) return;
    const result = S.importDoc(await file.text().catch(() => ""));
    if (result.error) { APP.toast(`Import: ${result.error} Nothing was changed.`, "danger"); return; }
    const count = (c) => c.enemies.length + c.objectives.length + c.hazards.length;
    confirm("Import", `Replace your ${count(custom)} custom items and ${scenes.length} scenes with the file's ${count(result.custom)} custom items and ${result.scenes.length} scenes?`, "Replace", () => {
      custom = result.custom;
      scenes = result.scenes;
      customChanged();
      scenesChanged();
      picked = null;
      selectedScene = null;
      renderAll();
      APP.toast("Imported.", "success");
    });
  });

  // ================= List =================
  let selectedScene = null; // its id
  const sceneById = (id) => scenes.find((s) => s.id === id);
  const runningId = () => (open?.mode === "run" ? open.run.sceneId : null);
  const modeName = (mode) => (mode === "conflict" ? "Conflict" : "Legwork");

  // An element's kind and what's set on its copy, in a line: "Antagonist · 70 luck", "Objective · Difficulty 30 · Urgent".
  function elementTag(e) {
    if (e.kind === "enemy") return [e.def.type, S.isSquad(e.def) ? `size ${e.size}` : `${e.def.luck} luck`].join(" · ");
    return [KIND_NAMES[e.kind], `Difficulty ${e.difficulty}`, TIMING_NAMES[e.timing],
      e.kind === "hazard" && `${e.def.hit}% · ${damageLabel(e.def.damage)}`].filter(Boolean).join(" · ");
  }
  const sourceName = (e) => (e.def.name !== e.name ? ` <span class="databank-tag">${esc(e.def.name)}</span>` : "");

  function renderSceneList() {
    $("scene-list").innerHTML = scenes.length ? `<ul class="scene-items">${[...scenes].sort((a, b) => (a.name || "").localeCompare(b.name || "")).map((s) =>
      `<li><button type="button" class="scene-item${selectedScene === s.id ? " on" : ""}" data-scene-pick="${esc(s.id)}">${esc(s.name || "Untitled scene")}<span class="scene-item-tag">${
        runningId() === s.id ? "Running" : modeName(s.mode)}</span></button></li>`).join("")}</ul>`
      : `<p class="scene-empty">No scenes yet.</p>`;
  }

  function renderSceneDetail() {
    const s = sceneById(selectedScene);
    if (!s) { $("scene-detail").innerHTML = `<p class="scene-empty">Pick a scene on the left, or start a new one.</p>`; return; }
    const running = runningId() === s.id;
    $("scene-detail").innerHTML = `<section class="sheet-column databank-section scene-card">
        <h2>${esc(s.name || "Untitled scene")}</h2>
        <p class="ability-tag">${modeName(s.mode)}${running ? " · Running" : ""}</p>
        ${P.placeLabel(s.place) ? `<p class="scene-where">${esc(P.placeLabel(s.place))}</p>` : ""}
        ${s.notes ? rich(s.notes) : ""}
        ${s.elements.length ? `<ul class="scene-elements">${s.elements.map((e) => `<li${e.id === s.mainGoal ? ' class="main-goal"' : ""}>
            <strong>${esc(e.name)}</strong>${sourceName(e)}${e.id === s.mainGoal ? ' <span class="goal-badge">Main Goal</span>' : ""}
            <span class="scene-element-tag">${esc(elementTag(e))}</span></li>`).join("")}</ul>`
          : `<p class="scene-empty">No elements yet.</p>`}
        <div class="scene-actions">
          <wa-button appearance="outlined" data-scene-action="edit" ${running ? "disabled" : ""}><wa-icon slot="start" name="pen"></wa-icon>Edit</wa-button>
          <wa-button appearance="outlined" data-scene-action="duplicate"><wa-icon slot="start" name="clone"></wa-icon>Duplicate</wa-button>
          <wa-button appearance="outlined" variant="danger" data-scene-action="delete" ${running ? "disabled" : ""}><wa-icon slot="start" name="trash"></wa-icon>Delete</wa-button>
          <wa-button variant="brand" data-scene-action="run" ${running ? "disabled" : ""}><wa-icon slot="start" name="play"></wa-icon>Run</wa-button>
        </div>
      </section>`;
  }

  const startBuild = (scene) => { setOpen({ mode: "build", scene }); renderAll(); show("scenes-builder"); };
  $("scene-new").addEventListener("click", () => {
    if (open?.mode === "build" && !sceneById(open.scene.id) && !open.scene.elements.length && !text(open.scene.name)) { show("scenes-builder"); return; }
    whenClosed(() => startBuild(S.newScene(newId())));
  });
  $("scene-list").addEventListener("click", (e) => {
    const id = e.target.closest("[data-scene-pick]")?.dataset.scenePick;
    if (!id) return;
    selectedScene = id;
    renderSceneList();
    renderSceneDetail();
  });
  $("scene-detail").addEventListener("click", (e) => {
    const action = e.target.closest("[data-scene-action]:not([disabled])")?.dataset.sceneAction;
    const s = sceneById(selectedScene);
    if (!action || !s) return;
    if (action === "edit") {
      if (open?.mode === "build" && open.scene.id === s.id) { show("scenes-builder"); return; }
      whenClosed(() => startBuild(structuredClone(sceneById(s.id) ?? s)));
    } else if (action === "duplicate") {
      const copy = { ...structuredClone(s), id: newId(), name: `${s.name || "Untitled scene"} (copy)` };
      scenes = [...scenes, copy];
      scenesChanged();
      selectedScene = copy.id;
      renderSceneList();
      renderSceneDetail();
    } else if (action === "delete") {
      confirm("Delete scene", `Delete “${s.name || "Untitled scene"}”? This can't be undone (except from an exported file).`, "Delete", () => {
        scenes = scenes.filter((x) => x.id !== s.id);
        scenesChanged();
        selectedScene = null;
        renderAll();
      });
    } else if (action === "run") {
      // the scene as saved by then (Save in the prompt may have just changed it)
      whenClosed(() => startRun(sceneById(s.id) ?? s));
    }
  });

  // ================= Adding copies (the Builder, and the Runner mid-run) =================
  // A kind and an item from the lists (rulebook and custom; the enemies by name), and Add. extra is more HTML before the button.
  const pickerList = (kind) => kind === "enemy" ? [...lib.enemies].sort((a, b) => a.name.localeCompare(b.name)) : lib[LISTS[kind]];
  const pickerItems = (kind) => pickerList(kind).map((i) => `<wa-option value="${esc(i.id)}">${esc(i.name)}${
    i.source === "custom" ? " (custom)" : kind === "enemy" ? ` · ${esc(i.type)}` : kind === "objective" ? ` · ${i.difficulty}` : ""}</wa-option>`).join("");
  const addPicker = (where, extra = "") => `<div class="add-picker" data-add-picker="${where}">
      <wa-radio-group label="Add" orientation="horizontal" value="enemy" data-add-kind></wa-radio-group>
      <wa-select placeholder="Choose one" data-add-item>${pickerItems("enemy")}</wa-select>
      ${extra}
      <wa-button variant="brand" data-add-go><wa-icon slot="start" name="plus"></wa-icon>Add</wa-button>
    </div>`;
  function wirePicker(el) {
    const kind = el.querySelector("[data-add-kind]");
    radios(kind, [["enemy", "Enemy"], ["objective", "Objective"], ["hazard", "Hazard"]]);
    kind.value = "enemy";
    kind.addEventListener("change", () => {
      el.querySelector("[data-add-item]").innerHTML = pickerItems(kind.value);
      el.querySelector("[data-add-item]").value = "";
    });
  }
  // The picked item as a new copy for this scene (a second copy of a name gets a number), or null.
  function pickedCopy(el, scene) {
    const kind = el.querySelector("[data-add-kind]").value;
    const item = lib[LISTS[kind]].find((i) => i.id === el.querySelector("[data-add-item]").value);
    if (!item) { APP.toast("Choose one to add.", "warning"); return null; }
    return S.copy(item, newId(), { name: S.freeName(scene, item.name) });
  }

  // ================= Builder =================
  const draft = () => open.scene;
  const changeDraft = (scene, rerender = false) => {
    setOpen({ mode: "build", scene });
    if (rerender) renderBuilder();
  };

  // Where the scene is set: District, Type of Place and Alternative (its type's), each a list from places.js (the
  // options' values are their places in the lists), a Location typed in, and Randomize for the three lists.
  function placeFields(place) {
    const p = P.cleanPlace(place);
    const select = (field, label, list, value, extra = "") => `<wa-select size="s" label="${label}" placeholder="None" with-clear
        value="${list.indexOf(value) < 0 ? "" : list.indexOf(value)}" data-place-field="${field}"${extra}>
        ${list.map((name, i) => `<wa-option value="${i}">${esc(name)}</wa-option>`).join("")}</wa-select>`;
    const alternatives = P.alternatives(p.type);
    return `<div class="scene-place">
        ${select("district", "District", P.DISTRICTS, p.district)}
        ${select("type", "Type of Place", P.TYPES.map((t) => t.name), p.type)}
        ${select("alternative", "Alternative", alternatives, p.alternative, alternatives.length ? "" : " disabled")}
        <wa-input size="s" label="Location" value="${esc(p.location)}" data-place-field="location" autocomplete="off"></wa-input>
        <wa-button size="s" appearance="outlined" data-place-random><wa-icon slot="start" name="dice"></wa-icon>Randomize</wa-button>
      </div>`;
  }
  // The list a place field picks from, to turn an option's value back into its name.
  const placeList = (field, place) => (field === "district" ? P.DISTRICTS
    : field === "type" ? P.TYPES.map((t) => t.name) : P.alternatives(P.cleanPlace(place).type));

  function builderRow(e, scene) {
    const goal = scene.mainGoal === e.id;
    const copyField = e.kind === "enemy"
      ? (S.isSquad(e.def) ? `<wa-input size="s" type="number" min="0" label="Squad size" value="${e.size}" data-el-field="size"></wa-input>` : "")
      : `<wa-input size="s" type="number" min="1" step="10" label="Difficulty" value="${e.difficulty}" data-el-field="difficulty"></wa-input>
         <wa-radio-group size="s" label="Timing" orientation="horizontal" value="${e.timing ?? ""}" data-el-field="timing" data-radios="timing"></wa-radio-group>`;
    return `<li class="builder-row${goal ? " main-goal" : ""}" data-el="${esc(e.id)}">
        <div class="builder-row-head">
          <span class="kind-badge" data-kind="${e.kind}">${KIND_NAMES[e.kind]}</span>
          <span class="scene-element-tag">${esc(e.def.name)} · ${esc(elementTag(e))}</span>
        </div>
        <div class="builder-row-fields">
          <wa-input size="s" label="Name" value="${esc(e.name)}" data-el-field="name"></wa-input>
          ${copyField}
        </div>
        <div class="builder-row-actions">
          <wa-button size="s" appearance="${goal ? "filled" : "outlined"}" variant="${goal ? "brand" : "neutral"}" data-el-goal>
            <wa-icon slot="start" name="flag-checkered"></wa-icon>${goal ? "Main Goal" : "Make Main Goal"}</wa-button>
          <wa-button size="s" appearance="plain" variant="danger" data-el-remove title="Remove"><wa-icon name="trash" label="Remove"></wa-icon></wa-button>
        </div>
      </li>`;
  }

  function renderBuilder() {
    const el = $("scene-builder");
    if (open?.mode !== "build") { el.innerHTML = ""; return; }
    const scene = draft();
    el.innerHTML = `<div class="builder">
        <section class="scene-form builder-about">
          <h2>${sceneById(scene.id) ? "Edit scene" : "New scene"}</h2>
          <wa-input label="Name" value="${esc(scene.name)}" data-scene-field="name" autocomplete="off"></wa-input>
          <wa-radio-group label="Kind" orientation="horizontal" value="${scene.mode}" data-scene-field="mode" data-radios="mode"></wa-radio-group>
          ${placeFields(scene.place)}
          <wa-textarea label="Notes" value="${esc(scene.notes)}" rows="3" resize="auto" data-scene-field="notes"></wa-textarea>
          <p class="scene-hint">Mark one element as the Main Goal; everything else is an obstacle. Obstacles can be objectives or
            enemies, as the rulebook suggests (an antagonist or a size 5 squad for one obstacle, a minor villain or a size 10 squad for two).</p>
        </section>
        <section class="builder-elements">
          ${scene.elements.length ? `<ol class="builder-rows">${scene.elements.map((e) => builderRow(e, scene)).join("")}</ol>`
            : `<p class="scene-empty">No elements yet: add enemies, objectives and hazards below.</p>`}
          ${addPicker("builder")}
        </section>
        <div class="scene-actions">
          <wa-button appearance="outlined" variant="danger" id="builder-discard">Discard changes</wa-button>
          <wa-button variant="brand" id="builder-save"><wa-icon slot="start" name="floppy-disk"></wa-icon>Save</wa-button>
        </div>
      </div>`;
    for (const group of el.querySelectorAll("[data-radios]")) {
      const value = group.getAttribute("value");
      radios(group, group.dataset.radios === "mode" ? [["legwork", "Legwork"], ["conflict", "Conflict"]] : [["", "Neither"], ["urgent", "Urgent"], ["timed", "Timed"]]);
      group.value = value;
    }
    wirePicker(el.querySelector("[data-add-picker]"));
  }

  // Saves the scene being built to the list (true), or says what's stopping it (false).
  function saveDraft() {
    if (open?.mode !== "build") return true;
    const scene = draft();
    const problems = S.sceneProblems(scene);
    if (problems.length) { APP.toast(problems.join(" "), "warning"); show("scenes-builder"); return false; }
    scenes = sceneById(scene.id) ? scenes.map((s) => (s.id === scene.id ? scene : s)) : [...scenes, scene];
    scenesChanged();
    selectedScene = scene.id;
    setOpen(null);
    return true;
  }

  const builder = $("scene-builder");
  // Typing changes the draft (kept, so a reload loses nothing) without drawing it again.
  const onBuilderField = (e) => {
    const sceneField = e.target.closest("[data-scene-field]")?.dataset.sceneField;
    if (sceneField) { changeDraft({ ...draft(), [sceneField]: e.target.value }); return; }
    const placeField = e.target.closest("[data-place-field]")?.dataset.placeField;
    if (placeField === "location") { changeDraft({ ...draft(), place: P.changePlace(draft().place, { location: e.target.value }) }); return; }
    if (placeField) {
      // a list's pick draws the Builder again on change (a new type of place has its own alternatives)
      if (e.type !== "change") return;
      const name = e.target.value === "" || e.target.value == null ? "" : placeList(placeField, draft().place)[Number(e.target.value)] ?? "";
      changeDraft({ ...draft(), place: P.changePlace(draft().place, { [placeField]: name }) }, true);
      return;
    }
    const elField = e.target.closest("[data-el-field]")?.dataset.elField;
    if (!elField) return;
    const id = e.target.closest("[data-el]").dataset.el;
    const value = elField === "timing" ? e.target.value || null : e.target.value;
    // a cleared number box keeps the copy as it was until there's a number in it
    if ((elField === "size" || elField === "difficulty") && value === "") return;
    changeDraft(S.changeElement(draft(), id, { [elField]: value }));
  };
  builder.addEventListener("input", onBuilderField);
  builder.addEventListener("change", onBuilderField);
  builder.addEventListener("click", (e) => {
    if (e.target.closest("#builder-save")) { if (saveDraft()) { renderAll(); show("scenes-list"); APP.toast("Scene saved.", "success"); } return; }
    if (e.target.closest("#builder-discard")) { setOpen(null); renderAll(); show("scenes-list"); return; }
    if (e.target.closest("[data-place-random]")) { changeDraft({ ...draft(), place: P.randomPlace(draft().place) }, true); return; }
    const row = e.target.closest("[data-el]");
    if (row && e.target.closest("[data-el-goal]")) {
      const id = row.dataset.el;
      changeDraft(S.setMainGoal(draft(), draft().mainGoal === id ? null : id), true);
      return;
    }
    if (row && e.target.closest("[data-el-remove]")) { changeDraft(S.removeElement(draft(), row.dataset.el), true); return; }
    const picker = e.target.closest("[data-add-picker]");
    if (picker && e.target.closest("[data-add-go]")) {
      const element = pickedCopy(picker, draft());
      if (element) changeDraft(S.addElement(draft(), element), true);
    }
  });

  // ================= Runner =================
  let linked = false; // the OBS link is up: the overlay keeps the initiative
  const run = () => open.run;
  function dispatch(action) {
    const next = S.apply(run(), action);
    setOpen(next ? { mode: "run", run: next } : null);
    renderRunner();
  }
  // The run's initiative to the overlay (when there's a link). true if it went.
  const sendInitiative = (initiative) => linked && ADMIN.send("initiative", initiative);

  function startRun(scene) {
    setOpen({ mode: "run", run: S.apply(null, { type: "start", scene }) });
    sendInitiative(run().initiative);
    APP.emptyResult($("runner-result"));
    $("runner-roll-label").textContent = "Click an attack to roll it.";
    renderAll();
    show("scenes-runner");
  }
  function endRun() {
    sendInitiative(NO_CONFLICT);
    setOpen(null);
  }
  // A turn on or back: through the overlay when it's linked (the run follows what it reports), else here.
  // The round set by hand (here, or on the Initiative card): a correction, so no round starts anew. Then the overlay's
  // round too, when there's a link; its report back then changes nothing.
  function setRound(round) {
    if (open?.mode !== "run") return;
    dispatch({ type: "setRound", round });
    sendInitiative(run().initiative);
  }
  INITIATIVE.onRoundSet((round) => { if (open?.mode === "run") dispatch({ type: "setRound", round }); });

  function stepTurn(step) {
    if (!sendInitiative(stepInitiative(run().initiative, step))) dispatch({ type: "step", step });
  }

  const stepper = (action, id, value, steps, label) => `<div class="run-stepper"><span class="sheet-label">${label}</span>
      <span class="run-steps">${steps.filter((n) => n < 0).map((n) => `<wa-button size="s" appearance="outlined" data-run="${action}" data-id="${esc(id)}" data-by="${n}">−${-n}</wa-button>`).join("")}
      <span class="run-value">${value}</span>
      ${steps.filter((n) => n > 0).map((n) => `<wa-button size="s" appearance="outlined" data-run="${action}" data-id="${esc(id)}" data-by="${n}">+${n}</wa-button>`).join("")}</span></div>`;
  // A box to take damage off luck, or add progress, in one go.
  const quick = (action, id, label, sign) => `<form class="run-quick" data-run-quick="${action}" data-id="${esc(id)}" data-sign="${sign}">
      <wa-input size="s" type="number" min="1" placeholder="${label}" aria-label="${label}"></wa-input>
      <wa-button size="s" type="submit" appearance="outlined">${sign < 0 ? "Take" : "Add"}</wa-button></form>`;

  // An enemy's conditions (of its id), or the scene's (of ""): the chips, each opening its dialog, and a button to add one.
  const runConditions = (holder, of) => `<div class="run-conditions">${CUI.chipsHTML(holder, { clickable: true, of })}
      <wa-button size="s" appearance="plain" data-add-condition="${esc(of)}"><wa-icon slot="start" name="plus"></wa-icon>condition</wa-button></div>`;

  function runCard(e, state, on) {
    const t = state.track[e.id];
    const goal = state.mainGoal === e.id;
    const done = S.done(state, e.id);
    const parts = [];
    if (e.kind === "enemy") {
      if (t.luck != null) parts.push(stepper("luck", e.id, `${t.luck} / ${e.def.luck}`, [-5, -1, 1, 5], "Luck"), quick("luck", e.id, "Damage", -1));
      if (t.size != null) parts.push(stepper("size", e.id, t.size, [-1, 1], "Squad size"));
      if (S.isVillain(e.def)) {
        parts.push(stepper("wounds", e.id, t.wounds, [-1, 1], "Wounds"),
          `<wa-switch size="s" data-run-toggle="defeated" data-id="${esc(e.id)}" ${t.defeated ? "checked" : ""}>Defeated</wa-switch>`);
      }
      parts.push(runConditions(t, e.id));
    } else {
      parts.push(stepper("progress", e.id, `${t.progress} / ${e.difficulty}`, [-10, -1, 1, 10], "Progress"));
      if (!t.irreparable) parts.push(quick("progress", e.id, "Progress", 1));
      const status = [TIMING_NAMES[e.timing], t.deteriorating && `Deteriorating ×${t.deteriorating}`, t.irreparable && "Irreparable"].filter(Boolean);
      if (status.length) parts.push(`<p class="run-status${t.irreparable ? " irreparable" : ""}">${esc(status.join(" · "))}</p>`);
    }
    if (!goal) parts.push(`<wa-switch size="s" data-run-toggle="dealt" data-id="${esc(e.id)}" ${S.dealtWith(state, e.id) ? "checked" : ""} ${
      !t.dealt && S.dealtWith(state, e.id) ? "disabled" : ""}>Dealt with</wa-switch>`);
    const rolls = S.attacks(state, e.id);
    const rollButtons = rolls.length ? `<div class="run-attacks">${rolls.map((a, i) => `<wa-button size="s" appearance="outlined" data-roll="${esc(e.id)}" data-attack="${i}" title="${esc(a.text)}">
        <wa-icon slot="start" name="dice-d20"></wa-icon>${esc(a.name)}<span class="run-attack-numbers">${
          a.hit == null ? "d100" : `${a.hit}%${a.damage != null ? ` · ${a.damage}` : ""}`}</span></wa-button>`).join("")}</div>` : "";
    const statBlock = e.kind === "enemy"
      ? [e.def.text && `*${e.def.text}*`, ...e.def.attacks.map(([n, x]) => `**${n}:** ${x}`), ...e.def.perks.map(([n, x]) => `**${n}:** ${x}`)]
      : [e.def.text, e.kind === "hazard" && e.def.effect];
    return `<article class="run-element${done ? " done" : ""}${on ? " on" : ""}${goal ? " main-goal" : ""}" data-kind="${e.kind}" data-turn="${e.kind === "hazard" ? "hazard" : "antagonists"}">
        <header>${e.kind === "enemy" && e.def.portrait ? `<img class="portrait run-portrait" src="${PORTRAIT_DIR}enemies/${esc(e.def.portrait)}" alt="" width="256" height="256" loading="lazy">` : ""}
          <div><h3>${esc(e.name)}${goal ? ' <span class="goal-badge">Main Goal</span>' : ""}</h3>
          <p class="ability-tag"><span class="kind-badge" data-kind="${e.kind}">${KIND_NAMES[e.kind]}</span> ${esc([e.def.name !== e.name && e.def.name, elementTag(e)].filter(Boolean).join(" · "))}</p></div></header>
        ${rollButtons}${parts.join("")}
        <details class="run-details"><summary>${e.kind === "enemy" ? "Stat block" : "Description"}</summary>${rich(statBlock.filter(Boolean).join("\n\n") || "*No description.*")}</details>
      </article>`;
  }

  function renderRunner() {
    if (open?.mode !== "run") return;
    const state = run();
    const { conflict, phase, round } = state.initiative;
    $("runner-head").innerHTML = `<section class="runner-head">
        <div><h2>${esc(state.name || "Untitled scene")}</h2>
          <p class="ability-tag">${modeName(state.mode)}${state.mode === "legwork" && conflict ? " · now a conflict" : ""}${linked ? "" : " · counting turns here (no overlay)"}</p>
          ${P.placeLabel(state.place) ? `<p class="scene-where">${esc(P.placeLabel(state.place))}</p>` : ""}
          ${state.notes ? rich(state.notes) : ""}
          ${runConditions(state, "")}</div>
        ${conflict ? `<div class="initiative-cycle runner-initiative" data-phase="${phase}">
            <div class="initiative-turn">
              <wa-button size="s" appearance="outlined" data-turn-step="-1"><wa-icon name="arrow-left" label="Previous turn"></wa-icon></wa-button>
              <span class="initiative-phase">${PHASE_NAMES[phase]}</span>
              <wa-button size="s" appearance="outlined" data-turn-step="1"><wa-icon name="arrow-right" label="Next turn"></wa-icon></wa-button>
            </div>
            <div class="initiative-track-row"><ol class="initiative-track">${PHASES.map((p) => `<li data-phase="${p}"${p === phase ? ' class="on"' : ""}>${PHASE_NAMES[p]}</li>`).join("")}</ol>
              <button type="button" class="initiative-round" data-set-round title="Set the round">Round <b>${round}</b></button></div>
          </div>` : ""}
        <div class="scene-actions">
          ${conflict ? "" : `<wa-button appearance="outlined" id="runner-conflict"><wa-icon slot="start" name="bolt"></wa-icon>Make it a conflict</wa-button>`}
          <wa-button variant="danger" appearance="outlined" id="runner-end"><wa-icon slot="start" name="stop"></wa-icon>End run</wa-button>
        </div>
      </section>`;
    const goal = state.elements.find((e) => e.id === state.mainGoal);
    const left = S.obstaclesLeft(state);
    const goalNote = goal ? `<div class="runner-goal">${rich(`**Main Goal: ${goal.name}.** ${left
      ? `${left} obstacle${left > 1 ? "s" : ""} left. If the crew goes for the goal past them, add [challenge][challenge] to the roll for each one ignored (or [heat][heat] if that fits better).`
      : "No obstacles left in the way."}`)}</div>` : "";
    const notices = state.notices.map((n) => {
      const e = state.elements.find((x) => x.id === n.id);
      return n.irreparable ? `<p class="runner-notice bad"><strong>${esc(e.name)} is Irreparable.</strong> Describe the consequences, and add heat.</p>`
        : `<p class="runner-notice">${esc(e.name)} is now Deteriorating ×${n.deteriorating}: describe how it gets worse.</p>`;
    });
    $("runner-notices").innerHTML = goalNote + notices.join("");
    const on = new Set(S.highlighted(state));
    $("runner-elements").innerHTML = state.elements.map((e) => runCard(e, state, on.has(e.id))).join("") || `<p class="scene-empty">No elements in this scene.</p>`;
    if (!$("runner-add").firstChild) {
      $("runner-add").innerHTML = addPicker("runner", `<wa-checkbox data-add-save>Also add to the saved scene</wa-checkbox>`);
      wirePicker($("runner-add").querySelector("[data-add-picker]"));
    }
  }

  const runnerPanel = document.querySelector('wa-tab-panel[name="scenes-runner"]');
  runnerPanel.addEventListener("click", (e) => {
    if (open?.mode !== "run") return;
    const stepBy = Number(e.target.closest("[data-turn-step]")?.dataset.turnStep);
    if (stepBy) { stepTurn(stepBy); return; }
    if (e.target.closest("[data-set-round]")) {
      INITIATIVE.openSetRound({ round: run().initiative.round, set: setRound });
      return;
    }
    if (e.target.closest("#runner-conflict")) { dispatch({ type: "conflict" }); sendInitiative(run().initiative); return; }
    if (e.target.closest("#runner-end")) {
      confirm("End run", `End the run of “${run().name || "Untitled scene"}”? Everything tracked is cleared; the saved scene stays as it is.`, "End run", () => {
        endRun();
        renderAll();
        show("scenes-list");
      });
      return;
    }
    const button = e.target.closest("[data-run]");
    if (button) {
      const by = Number(button.dataset.by), id = button.dataset.id, action = button.dataset.run;
      if (action === "size") dispatch({ type: "size", id, size: run().track[id].size + by });
      else dispatch({ type: action, id, delta: by });
      return;
    }
    const roll = e.target.closest("[data-roll]");
    if (roll) { rollAttack(roll.dataset.roll, Number(roll.dataset.attack)); return; }
    const addCondition = e.target.closest("[data-add-condition]");
    if (addCondition) { openAddCondition(addCondition.dataset.addCondition || null); return; }
    const chip = e.target.closest(".condition[data-condition]");
    if (chip) { openCondition(chip.dataset.conditionOf || null, chip.dataset.condition); return; }
    const picker = e.target.closest("[data-add-picker]");
    if (picker && e.target.closest("[data-add-go]")) {
      const element = pickedCopy(picker, { elements: run().elements });
      if (!element) return;
      dispatch({ type: "add", element });
      const saved = sceneById(run().sceneId);
      if (picker.querySelector("[data-add-save]").checked && saved) {
        scenes = scenes.map((s) => (s.id === saved.id ? S.addElement(s, element) : s));
        scenesChanged();
        renderSceneList();
        renderSceneDetail();
      }
      APP.toast(`Added ${element.name}.`, "success");
    }
  });
  runnerPanel.addEventListener("change", (e) => {
    const toggle = e.target.closest("[data-run-toggle]");
    if (toggle && open?.mode === "run") dispatch({ type: toggle.dataset.runToggle, id: toggle.dataset.id });
  });
  runnerPanel.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-run-quick]");
    if (!form) return;
    e.preventDefault();
    const n = Math.abs(Math.round(Number(form.querySelector("wa-input").value)));
    if (n) dispatch({ type: form.dataset.runQuick, id: form.dataset.id, delta: n * Number(form.dataset.sign) });
  });
  // wa-button type="submit" inside a form submits it; Enter in the box does too
  runnerPanel.addEventListener("keydown", (e) => {
    const form = e.target.closest?.("[data-run-quick]");
    if (form && e.key === "Enter") { e.preventDefault(); form.requestSubmit(); }
  });

  // ---- conditions: an enemy's (id) or the scene's (id null), through conditions-ui.js's dialogs ----
  const conditionHolder = (id) => (open?.mode !== "run" ? null : id == null ? run() : run().track[id] ?? null);
  const conditionFor = (id) => (id == null ? "The scene" : run().elements.find((e) => e.id === id)?.name ?? "");
  function applyCondition(id, fn) {
    const holder = conditionHolder(id);
    if (!holder) return false;
    dispatch({ type: "conditions", id, conditions: fn(holder).conditions });
    return true;
  }
  const openAddCondition = (id) => CUI.openAdd({
    forText: conditionFor(id), suggestions: K.SUGGESTIONS[id == null ? "scene" : "enemy"], intrinsic: false,
    apply: (fn) => applyCondition(id, fn),
  });
  const openCondition = (id, conditionId) => CUI.openChange({
    id: conditionId, forText: conditionFor(id), holder: () => conditionHolder(id), apply: (fn) => applyCondition(id, fn),
  });

  // One click rolls an attack: its hit chance as the target (a plain d100 when its text can't be read), with the
  // advantage and challenge dice picked beside the roll (reset after each roll, like the Dashboard's). It goes where
  // Dashboard rolls go (the overlay, and Discord with Send to Discord on), unless Keep hidden is on for it.
  let rolling = false;
  async function rollAttack(id, index) {
    const a = S.attacks(run(), id)[index];
    if (!a || rolling) return;
    rolling = true;
    const hiddenSwitch = $("runner-hidden");
    const hidden = hiddenSwitch.checked;
    hiddenSwitch.checked = false;
    const damage = a.damage != null ? `${a.damage}${a.type ? ` ${a.type}` : ""} damage` : null;
    const what = a.hit == null ? `a plain roll (the text doesn't say a hit chance): ${a.text}`
      : `${a.hit}%${damage ? `, ${damage} on a hit` : ""}`;
    // An enemy's roll goes to Discord as the enemy, naming the attack; a hazard's as the Administrator, naming the hazard.
    const e = run().elements.find((x) => x.id === id);
    const as = e.kind === "enemy" ? { name: e.name, portrait: e.def.portrait && `enemies/${e.def.portrait}` } : null;
    $("runner-roll-label").textContent = `${a.label}: ${what}${hidden ? " · kept hidden" : ""}`;
    try {
      const pools = { advantage: $("runner-adv").value, challenge: $("runner-chal").value };
      $("runner-adv").value = $("runner-chal").value = "0";
      await APP.playRoll(DICE.roll({ target: a.hit, ...pools }), {
        result: $("runner-result"), skill: as ? a.name : a.label, hidden, as, damage,
      });
    } finally {
      rolling = false;
    }
  }

  ADMIN.onLink(({ status }) => {
    linked = status === "connected";
    renderRunner();
  });
  ADMIN.onOverlay((msg) => {
    if (msg.type !== "overlayState" || !msg.initiative || open?.mode !== "run") return;
    dispatch({ type: "initiative", initiative: msg.initiative });
  });

  // ---- drawing it all ----
  function renderAll() {
    renderCustomList();
    renderCustomEditor();
    renderSceneList();
    renderSceneDetail();
    renderBuilder();
    $("runner-add").innerHTML = ""; // drawn again with the lists as they are now
    renderRunner();
  }

  APP.emptyResult($("runner-result"));
  setOpen(open);
  customChanged();
  renderAll();
})();
