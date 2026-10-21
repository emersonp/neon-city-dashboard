// Gear on the page: an item's row (name, its label, keyword chips), its rules text for the gear dialog, and the keyword
// picker the gear dialog and Create share. Needs gear.js, format.js and icons.js.
(function () {
  const G = window.NCD_GEAR;
  const { escapeHTML } = window.NCD_UTIL;
  const { formatDescription } = window.NCD_FORMAT;
  const icon = window.NCD_ICONS.svg;
  const ICON_COLOR = { "advantage-die": "adv", boon: "adv", "challenge-die": "chal", drawback: "chal" };
  const rich = (s) => formatDescription(s, (name) => icon(name, ICON_COLOR[name] ?? ""));

  // Keywords as a quiet line of text, unlike condition chips: built-in (and fixed) ones in italics, negative ones in red.
  function keywordChipsHTML(item) {
    const always = G.builtIn(item), list = G.keywordsOf(item);
    if (!list.length) return "";
    return `<div class="gear-keywords">${list.map((name) => {
      const negative = G.keyword(name, item)?.group === "negative", built = always.includes(name);
      const label = built ? `<i>${escapeHTML(name)}</i>` : escapeHTML(name);
      return `<span class="gear-keyword${negative ? " negative" : ""}">${label}</span>`;
    }).join("")}</div>`;
  }
  const nameHTML = (item) => `<button type="button" class="ability-name" data-gear-info="${escapeHTML(item.id)}">${escapeHTML(item.description)}${
    item.quantity > 1 ? ` <span class="gear-quantity">×${item.quantity}</span>` : ""}</button>`;
  const rowHTML = (item) => `<span class="gear-text">${nameHTML(item)} <span class="gear-kind">[${escapeHTML(G.label(item))}]</span></span>`;
  const rulesHTML = (item) => `<div class="ability-text">${rich(G.rulesText(item))}</div>`;

  // Checkboxes for every keyword the item could take, in a weapon group and a gear group, each with its rules text in a
  // tooltip on an info button (hover, or focus, which a tap gives). Built-in keywords are ticked and locked; ones the rules forbid are
  // disabled. With a limit, once that many of `pickable` are ticked the rest of `pickable` lock too.
  let pickers = 0;
  function keywordPickerHTML(item, { limit = null, pickable = null } = {}) {
    const n = ++pickers, choices = G.keywordChoices(item);
    const counted = choices.filter((k) => k.checked && !k.builtIn && (!pickable || pickable.includes(k.name))).length;
    const box = (k, i) => {
      const id = `kw-${n}-${i}`;
      const full = limit != null && !k.checked && counted >= limit && (!pickable || pickable.includes(k.name));
      const locked = k.builtIn || (pickable && k.checked && !pickable.includes(k.name));
      return `<span class="keyword-option">
          <wa-checkbox size="small" data-keyword="${escapeHTML(k.name)}" ${k.checked ? "checked" : ""} ${locked || full || !k.allowed ? "disabled" : ""}>${
            k.builtIn ? `<i>${escapeHTML(k.name)}</i>` : escapeHTML(k.name)}</wa-checkbox>
          <wa-button id="${id}" size="small" appearance="plain" class="keyword-info"><wa-icon name="circle-info" label="What ${escapeHTML(k.name)} does"></wa-icon></wa-button>
          <wa-tooltip for="${id}" trigger="hover focus"><div class="keyword-tip ability-text">${rich(k.text)}</div></wa-tooltip>
        </span>`;
    };
    const group = (title, list) => (list.length ? `<fieldset class="keyword-group"><legend>${title}</legend>
        <div class="keyword-options">${list.map(([k, i]) => box(k, i)).join("")}</div></fieldset>` : "");
    const indexed = choices.map((k, i) => [k, i]);
    return `<div class="keyword-picker">${group("Weapon keywords", indexed.filter(([k]) => k.group === "weapon"))}${
      group("Gear keywords", indexed.filter(([k]) => k.group === "gear"))}</div>`;
  }

  window.NCD_GEAR_UI = { keywordChipsHTML, nameHTML, rowHTML, rulesHTML, keywordPickerHTML };
})();
