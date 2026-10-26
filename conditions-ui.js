// Conditions on the page (the rules are conditions.js's): chips, the New condition dialog and a condition's dialog.
// Used for a character and their gear (roster.js), and for enemies and the scene in the Scene Runner (scene-runner.js).
// Whoever opens a dialog says how to change the holder: apply(fn) applies fn(holder) → holder and says whether it could.
(function () {
  const K = window.NCD_CONDITIONS;
  const { $, text, escapeHTML } = window.NCD_UTIL;

  // A holder's conditions as chips ("" with none). Clickable chips carry data-condition (its id) and data-condition-of
  // (whose it is: `of`, for the click handler to find the holder again).
  function chipsHTML(holder, { clickable = false, of = "" } = {}) {
    const list = K.conditions(holder);
    if (!list.length) return "";
    return `<div class="condition-list">${list.map((x) => {
      const name = x.intrinsic ? `<i title="Intrinsic">${escapeHTML(x.name)}</i>` : escapeHTML(x.name);
      const sev = K.severityLabel(x.severity);
      const inner = `${name}${sev ? ` <span class="condition-severity">${sev}</span>` : ""}`;
      return clickable
        ? `<button type="button" class="condition" data-severity="${x.severity}" data-condition="${escapeHTML(x.id)}" data-condition-of="${escapeHTML(of ?? "")}">${inner}</button>`
        : `<span class="condition" data-severity="${x.severity}">${inner}</span>`;
    }).join("")}</div>`;
  }

  const showSeverity = (stepper, severity) => {
    stepper.querySelector("[data-severity-value]").textContent = `x${severity}`;
    stepper.querySelector('[data-severity="-1"]').disabled = severity <= 1;
    stepper.querySelector('[data-severity="1"]').disabled = severity >= K.MAX_SEVERITY;
  };
  const showFor = (el, forText) => {
    el.hidden = !forText;
    el.textContent = forText ?? "";
  };
  const stepOf = (e) => Number(e.target.closest("[data-severity]")?.dataset.severity);

  // ---- New condition: suggestions fill in the name; intrinsic: false hides the Intrinsic switch ----
  const addDialog = $("condition-add-dialog");
  const addName = $("condition-name");
  const addSeverity = $("condition-add-severity");
  const addIntrinsic = $("condition-intrinsic");
  let adding = null;
  function openAdd({ forText = "", suggestions = [], intrinsic = true, apply }) {
    adding = { apply, severity: 1, intrinsic };
    showFor($("condition-add-for"), forText);
    $("condition-suggestions").innerHTML = suggestions
      .map((name) => `<button type="button" class="condition" data-suggestion="${escapeHTML(name)}">${escapeHTML(name)}</button>`).join("");
    addName.value = "";
    addIntrinsic.checked = false;
    addIntrinsic.hidden = !intrinsic;
    showSeverity(addSeverity, 1);
    addDialog.open = true;
  }
  function add() {
    const name = text(addName.value);
    if (!name) { addName.focus(); return; }
    const { apply, severity, intrinsic } = adding;
    if (!apply((h) => K.withCondition(h, { name, severity, intrinsic: intrinsic && addIntrinsic.checked }))) return;
    addDialog.open = false;
  }
  $("condition-suggestions").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-suggestion]");
    if (!chip) return;
    addName.value = chip.dataset.suggestion;
    addName.focus();
  });
  addSeverity.addEventListener("click", (e) => {
    const step = stepOf(e);
    if (!step || !adding) return;
    adding.severity = Math.max(1, Math.min(K.MAX_SEVERITY, adding.severity + step));
    showSeverity(addSeverity, adding.severity);
  });
  $("condition-add").addEventListener("click", add);
  addName.addEventListener("keydown", (e) => { if (e.key === "Enter") add(); });

  // ---- a condition (clicking its chip): severity, and remove. holder() is the holder as it is now. ----
  const changeDialog = $("condition-dialog");
  const changeSeverity = $("condition-severity");
  let changing = null;
  const changingCondition = () => K.conditions(changing?.holder()).find((x) => String(x.id) === String(changing.id)) ?? null;
  function showChange() {
    const x = changingCondition();
    if (!x) { changeDialog.open = false; return; }
    changeDialog.label = x.name;
    showFor($("condition-for"), changing.forText);
    $("condition-intrinsic-note").hidden = !x.intrinsic;
    showSeverity(changeSeverity, x.severity);
  }
  function openChange({ id, forText = "", holder, apply }) {
    changing = { id, forText, holder, apply };
    showChange();
    changeDialog.open = true;
  }
  changeSeverity.addEventListener("click", (e) => {
    const step = stepOf(e);
    const x = changingCondition();
    if (!step || !x) return;
    if (changing.apply((h) => K.withSeverity(h, x.id, x.severity + step))) showChange();
  });
  $("condition-remove").addEventListener("click", () => {
    const x = changingCondition();
    if (x && changing.apply((h) => K.withoutCondition(h, x.id))) changeDialog.open = false;
  });

  window.NCD_CONDITIONS_UI = { chipsHTML, openAdd, openChange };
})();
