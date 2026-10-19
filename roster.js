// Roster tab (the saved characters) and the Character tab, which appears once a character is opened.
// A character in the Character tab is in one of three states: display, editing, or running (not built yet).
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
    } else if (state === "editing") {
      for (const name of ["handle", "name", "archetype", "origin"]) field(name).value = current[name] ?? "";
    }
  }

  $("character-edit").addEventListener("click", () => { state = "editing"; render(); });

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
