// The New Avatar dialog (the rules are avatars.js's): a Quick Avatar, or an Enhanced one with the perk; then the
// username, the appearance, the Enhanced skills, the software the perks allow, and a description, and Create.
// roster.js opens it while running a character; onCreate gets the character with the new avatar, which roster.js saves.
(function () {
  const V = window.NCD_AVATARS;
  const C = window.NCD_CHARACTERS;
  const { $, text, escapeHTML } = window.NCD_UTIL;
  const { formatDescription } = window.NCD_FORMAT;
  const icon = window.NCD_ICONS.svg;
  const APP = window.NCD_APP;

  const dialog = $("avatar-dialog");
  const form = $("avatar-form");
  // The sheet's text, with its icons sized and colored like the ability dialog's.
  const ICON_COLOR = { "advantage-die": "adv", boon: "adv", "challenge-die": "chal" };
  const rules = (s) => `<div class="ability-text">${formatDescription(s, (name) => icon(name, ICON_COLOR[name] ?? ""))}</div>`;

  let opened = null; // { character, onCreate, choices }

  // A select of mental skills; ones picked in the other slots are disabled.
  function slotSelect(key, i, label, taken) {
    const value = opened.choices[key][i];
    return `<wa-select size="s" data-slot="${key}" data-index="${i}" aria-label="${escapeHTML(label)}" placeholder="${escapeHTML(label)}…"
        ${value ? `value="${escapeHTML(value)}"` : ""}>${V.ENHANCEABLE.map((s) =>
        `<wa-option value="${escapeHTML(s.id)}" ${taken.includes(s.id) && s.id !== value ? "disabled" : ""}>${escapeHTML(s.name)}</wa-option>`).join("")}</wa-select>`;
  }
  // A radio group of [value, title, rules text] options.
  const radios = (key, label, options) => `<wa-radio-group data-choice="${key}" label="${escapeHTML(label)}" ${opened.choices[key] ? `value="${escapeHTML(opened.choices[key])}"` : ""}>
      ${options.map(([value, title, about]) => `<wa-radio value="${escapeHTML(value)}">
        <span class="shell-option"><b>${escapeHTML(title)}</b>${about ? `<span class="shell-option-text">${rules(about)}</span>` : ""}</span></wa-radio>`).join("")}
    </wa-radio-group>`;
  const part = (title, html) => `<section class="shell-part"><h4>${escapeHTML(title)}</h4>${html}</section>`;

  function render() {
    const { character, choices } = opened;
    const kinds = V.kindsFor(character), count = V.softwareCount(character, choices.kind);
    let html = kinds.length > 1 ? radios("kind", "Avatar", kinds.map((k) => [k, V.KINDS[k].name, V.KINDS[k].about])) : "";
    html += `<p class="shell-about">${escapeHTML(V.ABOUT)}</p>`;
    html += part("Appearance", radios("appearance", "Choose one", Object.entries(V.APPEARANCES).map(([id, a]) => [id, a.name, a.text])));
    if (choices.kind === "enhanced") {
      const taken = [...choices.major, ...choices.minor].filter(Boolean);
      html += part("Software Upgrades", `<div class="shell-rules">${rules(V.ENHANCEMENTS_TEXT)}</div>
        <div class="shell-slots">${choices.major.map((_, i) => slotSelect("major", i, `Skill ${i + 1}`, taken)).join("")}</div>
        <div class="shell-slots">${choices.minor.map((_, i) => slotSelect("minor", i, `Other skill ${i + 1}`, taken)).join("")}</div>`);
    }
    if (count) {
      const why = choices.kind === "enhanced" ? "Enhanced Avatars, kept for yourself" : "Installation Wizard";
      html += part("Installed Software", `<p class="shell-hint">${escapeHTML(why)}: check ${count === 1 ? "1 box" : `${count} boxes`}.</p>
        <div class="avatar-software">${Object.entries(V.SOFTWARE).map(([id, s]) => {
          const on = choices.software.includes(id);
          return `<wa-checkbox data-software="${escapeHTML(id)}" ${on ? "checked" : ""} ${!on && choices.software.length >= count ? "disabled" : ""}>
            <span class="shell-option"><b>${escapeHTML(s.name)}</b><span class="shell-option-text">${rules(s.text)}</span></span></wa-checkbox>`;
        }).join("")}</div>`);
    }
    html += part("Description", `<wa-input data-text="username" label="Network username" autocomplete="off"
        placeholder="${escapeHTML(C.label(character))}" value="${escapeHTML(choices.username)}"></wa-input>
      <wa-textarea data-text="description" label="Description" rows="2" resize="auto" value="${escapeHTML(choices.description)}"></wa-textarea>`);
    form.innerHTML = html;
  }

  form.addEventListener("change", (e) => {
    if (!opened) return;
    const group = e.target.closest("[data-choice]"), slot = e.target.closest("[data-slot]"), box = e.target.closest("[data-software]");
    if (group) {
      const key = group.dataset.choice;
      // a new kind starts its own skills and software over
      opened.choices = key === "kind" ? { ...opened.choices, kind: group.value, major: [null, null], minor: [null, null], software: [] }
        : { ...opened.choices, [key]: group.value || null };
    } else if (slot) {
      const list = [...opened.choices[slot.dataset.slot]];
      list[Number(slot.dataset.index)] = slot.value || null;
      opened.choices = { ...opened.choices, [slot.dataset.slot]: list };
    } else if (box) {
      const id = box.dataset.software, rest = opened.choices.software.filter((x) => x !== id);
      opened.choices = { ...opened.choices, software: box.checked ? [...rest, id] : rest };
    } else return;
    render();
  });
  // Typing doesn't redraw, so the box keeps its focus.
  form.addEventListener("input", (e) => {
    const box = e.target.closest("[data-text]");
    if (opened && box) opened.choices = { ...opened.choices, [box.dataset.text]: text(box.value) };
  });

  // What to point at when a choice is missing.
  const MISSING = {
    kind: ['[data-choice="kind"]', "Pick a kind of avatar."],
    appearance: ['[data-choice="appearance"]', "Pick an appearance."],
    major: ['[data-slot="major"]', "Pick 2 different skills for 2 advantage dice each."],
    minor: ['[data-slot="minor"]', "Pick 2 other different skills for 1 advantage die each."],
    software: ["[data-software]", "Check the software boxes the perks allow."],
  };
  $("avatar-create").addEventListener("click", () => {
    if (!opened) return;
    const { character, choices, onCreate } = opened;
    const missing = V.missing(character, choices);
    if (missing) {
      const [selector, message] = MISSING[missing];
      form.querySelector(selector)?.focus();
      APP.toast(message, "warning");
      return;
    }
    if (onCreate(V.create(character, choices)) === false) return;
    dialog.open = false;
    opened = null;
  });

  // onCreate(character) saves the character with its new avatar; returning false (a failed save) keeps the dialog open.
  function open({ character, onCreate }) {
    opened = { character, onCreate, choices: { kind: "quick", appearance: null, username: "", description: V.defaultDescription(character),
      major: [null, null], minor: [null, null], software: [] } };
    render();
    dialog.open = true;
  }

  window.NCD_AVATAR_UI = { open };
})();
