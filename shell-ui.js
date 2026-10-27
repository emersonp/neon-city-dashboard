// The Load Shell dialog (the rules are shells.js's): pick a shell the character can load, then make the choices its
// sheet asks for (Shell Identity, Capabilities, augmentations, Shell Source, a name and an appearance), and Load.
// roster.js opens it while running a character; onLoad gets shells.js's load result, which roster.js saves.
(function () {
  const S = window.NCD_SHELLS;
  const C = window.NCD_CHARACTERS;
  const { $, text, escapeHTML } = window.NCD_UTIL;
  const { formatDescription } = window.NCD_FORMAT;
  const icon = window.NCD_ICONS.svg;
  const APP = window.NCD_APP;

  const dialog = $("shell-dialog");
  const form = $("shell-form");
  // The sheet's text, with its icons sized and colored like the ability dialog's.
  const ICON_COLOR = { "advantage-die": "adv", "challenge-die": "chal" };
  const rules = (s) => `<div class="ability-text">${formatDescription(s, (name) => icon(name, ICON_COLOR[name] ?? ""))}</div>`;

  let opened = null; // { character, catalog, onLoad, choices }

  // The choices start over when the shell changes; the name and appearance are kept.
  const fresh = (shell, { name = "", appearance = "" } = {}) => ({ shell, identity: null, major: [null, null, null, null], minor: [null, null],
    augmentations: [null, null], source: null, name, appearance });

  // A select whose options are grouped (<small> headings); options picked in the other slots are disabled.
  function slotSelect(key, i, label, groups, taken) {
    const value = opened.choices[key][i];
    return `<wa-select size="s" data-slot="${key}" data-index="${i}" aria-label="${escapeHTML(label)}" placeholder="${escapeHTML(label)}…"
        ${value ? `value="${escapeHTML(value)}"` : ""}>${groups.map(([heading, items]) => `<small>${escapeHTML(heading)}</small>${items.map(([id, name]) =>
        `<wa-option value="${escapeHTML(id)}" ${taken.includes(id) && id !== value ? "disabled" : ""}>${escapeHTML(name)}</wa-option>`).join("")}`).join("")}</wa-select>`;
  }
  const SKILL_GROUPS = [["Mental", "mental"], ["Physical", "physical"]]
    .map(([heading, type]) => [heading, C.SKILLS.filter((s) => s.type === type).map((s) => [s.id, s.name])]);
  // A radio group of [value, title, rules text, disabled] options.
  const radios = (key, label, options) => `<wa-radio-group data-choice="${key}" label="${escapeHTML(label)}" ${opened.choices[key] ? `value="${escapeHTML(opened.choices[key])}"` : ""}>
      ${options.map(([value, title, about, disabled]) => `<wa-radio value="${escapeHTML(value)}" ${disabled ? "disabled" : ""}>
        <span class="shell-option"><b>${escapeHTML(title)}</b>${about ? `<span class="shell-option-text">${rules(about)}</span>` : ""}</span></wa-radio>`).join("")}
    </wa-radio-group>`;
  const part = (title, html) => `<section class="shell-part"><h4>${escapeHTML(title)}</h4>${html}</section>`;

  function render() {
    const { character, catalog, choices } = opened;
    const shell = S.byId(choices.shell);
    let html = radios("shell", "Shell", S.SHELLS.map((s) => [s.id, s.name, null, !S.canLoad(character, s)]))
      + `<p class="shell-hint">${S.isSynthetic(character) ? "A synthetic mind loads only into synthetic shells." : "A human mind loads only into human shells."}</p>`;
    if (shell) {
      html += `<p class="shell-about">${escapeHTML(shell.about)}</p>`;
      if (shell.synthetic == null) {
        const synthetic = S.isSynthetic(character);
        html += part("Body Type", `<p><b>${synthetic ? "Synthetic" : "Human"}:</b> ${escapeHTML(S.BODY_TYPES[synthetic ? "synthetic" : "human"])}</p>`);
      }
      if (shell.perks.length || shell.augmentations.length) {
        const augs = shell.augmentations.map((id) => catalog.find((a) => a.id === id)).filter(Boolean);
        html += part("Body Perks", [...augs, ...shell.perks].map((p) => `<div class="shell-perk"><b>${escapeHTML(p.name)}</b>${rules(p.description ?? p.text)}</div>`).join(""));
      }
      if (shell.identity) {
        html += part("Shell Identity", radios("identity", "Choose one", Object.entries(S.IDENTITIES).map(([id, i]) => [id, i.name, i.text])));
      }
      if (shell.capabilities) {
        const taken = [...choices.major, ...choices.minor].filter(Boolean);
        html += part("Capabilities", `<div class="shell-rules">${rules(S.CAPABILITIES_TEXT)}</div>
          <div class="shell-slots">${choices.major.map((_, i) => slotSelect("major", i, `Skill ${i + 1}`, SKILL_GROUPS, taken)).join("")}</div>
          <div class="shell-slots">${choices.minor.map((_, i) => slotSelect("minor", i, `Minor skill ${i + 1}`, SKILL_GROUPS, taken)).join("")}</div>`);
      }
      if (shell.choose) {
        // grouped by archetype, as the rulebook lists them
        const groups = new Map();
        for (const a of S.augmentationChoices(catalog)) {
          const heading = a.archetype ?? "Synthetic";
          groups.set(heading, [...(groups.get(heading) ?? []), [a.id, a.name]]);
        }
        html += part("Synthetic Augmentations", `<p>Choose ${shell.choose} of the following augmentations for this body.</p>
          <div class="shell-slots">${choices.augmentations.map((_, i) => slotSelect("augmentations", i, `Augmentation ${i + 1}`, [...groups],
            choices.augmentations.filter(Boolean))).join("")}</div>`);
      }
      const sources = S.sourcesFor(character, shell);
      html += part("Shell Source", sources.length
        ? radios("source", "How you obtained this shell", sources.map((id) => [id, S.SOURCES[id].name, S.SOURCES[id].text, !S.canAfford(character, id)]))
        : `<p>Device Driver: you load into this shell without choosing a Shell Source.</p>`);
      html += part("Description", `${shell.named ? `<wa-input data-text="name" label="Shell name" autocomplete="off" value="${escapeHTML(choices.name)}"></wa-input>` : ""}
        <wa-textarea data-text="appearance" label="Physical appearance" rows="2" resize="auto" value="${escapeHTML(choices.appearance)}"></wa-textarea>`);
    }
    form.innerHTML = html;
  }

  form.addEventListener("change", (e) => {
    if (!opened) return;
    const group = e.target.closest("[data-choice]"), slot = e.target.closest("[data-slot]");
    if (group) {
      const key = group.dataset.choice;
      opened.choices = key === "shell" ? fresh(group.value, opened.choices) : { ...opened.choices, [key]: group.value || null };
      render();
    } else if (slot) {
      const list = [...opened.choices[slot.dataset.slot]];
      list[Number(slot.dataset.index)] = slot.value || null;
      opened.choices = { ...opened.choices, [slot.dataset.slot]: list };
      render();
    }
  });
  // Typing doesn't redraw, so the box keeps its focus.
  form.addEventListener("input", (e) => {
    const box = e.target.closest("[data-text]");
    if (opened && box) opened.choices = { ...opened.choices, [box.dataset.text]: text(box.value) };
  });

  // What to point at when a choice is missing.
  const MISSING = {
    shell: ['[data-choice="shell"]', "Pick a shell this character can load."],
    identity: ['[data-choice="identity"]', "Pick a Shell Identity."],
    major: ['[data-slot="major"]', "Pick 4 different skills for the shell's capabilities."],
    minor: ['[data-slot="minor"]', "Pick 2 more different skills for its minor capabilities."],
    augmentations: ['[data-slot="augmentations"]', "Pick 2 different augmentations."],
    source: ['[data-choice="source"]', "Pick how you obtained this shell."],
    name: ['[data-text="name"]', "Give the shell a name."],
  };
  $("shell-load").addEventListener("click", () => {
    if (!opened) return;
    const { character, catalog, choices, onLoad } = opened;
    const missing = S.missing(character, choices, catalog);
    if (missing) {
      const [selector, message] = MISSING[missing];
      form.querySelector(selector)?.focus();
      APP.toast(message, "warning");
      return;
    }
    if (onLoad(S.load(character, choices, catalog)) === false) return;
    dialog.open = false;
    opened = null;
  });

  // onLoad(result) saves shells.js's load result; returning false (a failed save) keeps the dialog open.
  function open({ character, catalog = [], onLoad }) {
    const loadable = S.SHELLS.filter((s) => S.canLoad(character, s));
    opened = { character, catalog, onLoad, choices: fresh(loadable.length === 1 ? loadable[0].id : null) };
    render();
    dialog.open = true;
  }

  window.NCD_SHELL_UI = { open };
})();
