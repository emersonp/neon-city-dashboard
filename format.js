// Ability descriptions: a small text format turned into HTML. No page code here, so it can be tested in Node.
// Blank lines separate paragraphs, lines starting with "- " are a bullet list, **bold**, *italic*, and
// [token] puts in a game icon (ICON_TOKENS maps tokens to icons.js names). Everything else is escaped.
(function (root) {
  const { escapeHTML } = root.NCD_UTIL;
  const ICON_TOKENS = { advantage: "advantage-die", challenge: "challenge-die", boon: "boon", drawback: "drawback", heat: "heat", influence: "influence" };

  // One paragraph or list item: escape first, then icons, bold, and italic (none of their markers are escaped).
  const inline = (s, icon) => escapeHTML(s)
    .replace(/\[(\w+)\]/g, (token, name) => (ICON_TOKENS[name] ? icon(ICON_TOKENS[name]) : token))
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

  function formatDescription(text, icon = (name) => root.NCD_ICONS.svg(name)) {
    let html = "";
    for (const block of String(text ?? "").split(/\n\s*\n/)) {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      // Runs of list lines become one <ul>; runs of other lines become one <p>.
      for (let i = 0; i < lines.length;) {
        const isItem = lines[i].startsWith("- ");
        const run = [];
        while (i < lines.length && lines[i].startsWith("- ") === isItem) run.push(lines[i++]);
        html += isItem
          ? `<ul>${run.map((l) => `<li>${inline(l.slice(2), icon)}</li>`).join("")}</ul>`
          : `<p>${inline(run.join(" "), icon)}</p>`;
      }
    }
    return html;
  }

  root.NCD_FORMAT = { ICON_TOKENS, formatDescription };
})(globalThis);
