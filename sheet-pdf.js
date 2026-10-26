// The character sheet as a two-page landscape PDF, laid out like the official sheet (Character_and_Shell_Sheets.pdf).
// This file only decides what goes where: layout() returns each page as a list of drawing ops, in points from the top
// left. sheet-pdf-ui.js draws them with pdf-lib. No page code here, so it can be tested in Node.
//
// Overlay sheets (Quick Shell, Quick Avatar, named shells) are the right half of a landscape page, laid over the sheet
// with the edges lined up. So the skills block is drawn exactly where the official sheet has it, and nothing a player
// needs while wearing a shell goes right of x = 396. Coordinates were read from the official PDF (it's real text and
// lines), and the dice slots from the Quick Shell scan, where every row shows all four.
(function (root) {
  const C = root.NCD_CHARACTERS, G = root.NCD_GEAR, CO = root.NCD_CONDITIONS;
  const { ICON_TOKENS } = root.NCD_FORMAT;

  const WIDTH = 792, HEIGHT = 612;
  const HALF = WIDTH / 2;

  // ---- text the standard PDF fonts can draw (WinAnsi: Latin-1 plus a few punctuation marks) ----
  const WIN_ANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
  const drawable = (ch) => {
    const code = ch.codePointAt(0);
    return (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || WIN_ANSI_EXTRA.has(ch);
  };
  // Accents the fonts lack come off first ("Ō" is "O"); anything still not drawable is "?". Tabs and line breaks are spaces.
  function winAnsi(text) {
    return [...String(text ?? "").replace(/[\t\r\n]/g, " ")].map((ch) => {
      if (drawable(ch)) return ch;
      const bare = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
      return bare && [...bare].every(drawable) ? bare : "?";
    }).join("");
  }

  // ---- paragraphs and wrapping ----
  // A paragraph is a list of words: { text, bold } or { icon }. Its style picks the size and spacing:
  // "heading" (bold, a little larger), "body", "bullet" (a • and a hanging indent), or "label" (small, bold, caps).
  const word = (text, bold = false) => ({ text: winAnsi(text), bold });
  const plainWords = (text, bold = false) => winAnsi(text).split(" ").filter(Boolean).map((t) => ({ text: t, bold }));
  const para = (style, words) => ({ style, words });
  const heading = (text) => para("heading", plainWords(String(text).toUpperCase(), true));
  const label = (text) => para("label", plainWords(String(text).toUpperCase(), true));
  const body = (text) => para("body", plainWords(text));

  // The ability-description format (format.js): blank lines between paragraphs, "- " list lines, **bold** and *italic*
  // (their markers dropped), and [token] icons. A piece written right against the one before it, like the icon in
  // "([advantage])", is marked joinBefore: no space goes between them.
  function inlineWords(line) {
    const words = [];
    let touching = false;
    for (const piece of line.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").split(/(\[\w+\]|\s+)/)) {
      if (!piece) continue;
      if (/^\s+$/.test(piece)) { touching = false; continue; }
      const token = /^\[(\w+)\]$/.exec(piece);
      words.push({ ...(token && ICON_TOKENS[token[1]] ? { icon: ICON_TOKENS[token[1]] } : word(piece)), joinBefore: touching });
      touching = true;
    }
    return words;
  }
  function paragraphs(text) {
    const out = [];
    for (const block of String(text ?? "").split(/\n\s*\n/)) {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      for (let i = 0; i < lines.length;) {
        if (lines[i].startsWith("- ")) { out.push(para("bullet", inlineWords(lines[i++].slice(2)))); continue; }
        const run = [];
        while (i < lines.length && !lines[i].startsWith("- ")) run.push(lines[i++]);
        out.push(para("body", inlineWords(run.join(" "))));
      }
    }
    return out;
  }

  const STYLE = {
    heading: { scale: 1.3, gap: 0.6 },
    body: { scale: 1, gap: 0.35 },
    bullet: { scale: 1, gap: 0.15, indent: 1.2 },
    label: { scale: 0.85, gap: 0.6 },
  };
  const LEADING = 1.2;
  const ICON_SCALE = 1.05;

  const wordWidth = (w, size, measure) => (w.icon ? size * ICON_SCALE : measure(w.text, size, w.bold));
  // Lines of words that fit `width`. Each word keeps its index in the paragraph, so the rest of a paragraph that doesn't
  // fit can carry on somewhere else. A word too long for a line on its own gets a line to itself.
  function wrap(p, width, size, measure) {
    const s = size * STYLE[p.style].scale, indent = (STYLE[p.style].indent ?? 0) * s;
    const space = measure(" ", s, false);
    const lines = [];
    let line = null;
    p.words.forEach((w, index) => {
      const ww = wordWidth(w, s, measure);
      const gap = line?.words.length && !w.joinBefore ? space : 0;
      if (line && line.words.length && line.width + gap + ww > width - indent) {
        lines.push(line);
        line = null;
      }
      if (!line) line = { words: [], width: 0, first: index, indent };
      const g = line.words.length && !w.joinBefore ? space : 0;
      line.words.push({ ...w, x: line.width + g, w: ww, index });
      line.width += g + ww;
    });
    if (line) lines.push(line);
    return lines.map((l, i) => ({ ...l, bullet: p.style === "bullet" && i === 0 }));
  }

  // Lays paragraphs into a box at the largest size that fits, from `sizes`. At the smallest, the paragraphs (or the end
  // of one) that don't fit come back as `overflow`; a heading never stays behind on its own at the bottom.
  function fit(paras, box, measure, { sizes = [7, 6.5, 6], name } = {}) {
    let placed;
    for (const size of sizes) {
      placed = place(paras, box, size, measure, name);
      if (!placed.overflow.length) break;
    }
    return placed;
  }
  function place(paras, box, size, measure, name) {
    const ops = [];
    let y = box.y;
    for (let i = 0; i < paras.length; i++) {
      const p = paras[i], st = STYLE[p.style], s = size * st.scale, lh = s * LEADING;
      if (i > 0) y += size * st.gap;
      const lines = wrap(p, box.w, size, measure);
      // keep a heading or label with the first line of what follows it
      const needed = ["heading", "label"].includes(p.style) && paras[i + 1] ? lh * lines.length + size * LEADING : lh;
      if (y + needed > box.y + box.h + 0.01) return { ops, size, overflow: paras.slice(i) };
      for (const [k, line] of lines.entries()) {
        if (y + lh > box.y + box.h + 0.01) {
          return { ops, size, overflow: [{ ...p, words: p.words.slice(line.first), style: p.style === "bullet" && k > 0 ? "body" : p.style }, ...paras.slice(i + 1)] };
        }
        drawLine(ops, line, box.x, y + s, s, measure, name);
        y += lh;
      }
    }
    return { ops, size, overflow: [] };
  }
  // One wrapped line: text runs of the same weight are joined into one op, icons are their own ops.
  function drawLine(ops, line, x0, baseline, size, measure, box) {
    const x = x0 + line.indent;
    if (line.bullet) ops.push({ kind: "text", text: "•", x: x0, y: baseline, size, bold: false, box });
    let run = null;   // the text op being built, until an icon or a change of weight
    for (const w of line.words) {
      if (w.icon) {
        run = null;
        ops.push({ kind: "icon", name: w.icon, x: x + w.x, y: baseline - size * 0.85, size: size * ICON_SCALE * 0.95, box });
      } else if (run && run.bold === w.bold) {
        run.text += (w.joinBefore ? "" : " ") + w.text;
      } else {
        run = { kind: "text", text: w.text, x: x + w.x, y: baseline, size, bold: w.bold, box };
        ops.push(run);
      }
    }
  }

  // ---- the skills block ----
  const PITCH = 15.13, ROW_H = 15.1, BEVEL = 4.5;
  const MENTAL = { top: 85.2, left: 228.7, short: 484.1, long: 527.5, nameX: 238.4, percentX: 376.5,
    dice: { short: [429.7, 439.3, 448.4, 458.0], long: [472.9, 482.3, 491.4, 501.0] } };
  const PHYSICAL = { top: 387.4, right: 558.5, short: 303.0, long: 260.1, nameRight: 550.9, percentX: 403.2,
    dice: { short: [329.0, 338.6, 347.7, 357.3], long: [286.0, 295.6, 304.7, 314.3] } };
  const ANYTHING_ELSE = { top: 568.6, left: 228.7, right: 502.9, nameX: 249.4, percentX: 376.4 };
  const DIE = 8.6;
  // Rows alternate short and long, starting short, in both blocks.
  function skillRows() {
    const rows = [];
    for (const type of ["mental", "physical"]) {
      const g = type === "mental" ? MENTAL : PHYSICAL;
      C.SKILLS.filter((s) => s.type === type).forEach((s, i) => {
        const kind = i % 2 ? "long" : "short", top = g.top + i * PITCH;
        rows.push(type === "mental"
          ? { ...s, top, kind, left: g.left, right: g[kind] }
          : { ...s, top, kind, left: g[kind], right: g.right });
      });
    }
    return rows;
  }
  // A row's outline: bevelled on the outer end, and on the inner end's bottom corner (as on the sheet).
  function rowPath({ left: l, right: r, top: t }, mirrored) {
    const b = t + ROW_H;
    const pts = mirrored
      ? [[r - BEVEL, t], [r, t + BEVEL], [r, b - BEVEL], [r - BEVEL, b], [l + BEVEL, b], [l, b - BEVEL], [l, t]]
      : [[l + BEVEL, t], [l, t + BEVEL], [l, b - BEVEL], [l + BEVEL, b], [r - BEVEL, b], [r, b - BEVEL], [r, t]];
    return { kind: "path", points: pts, closed: true, stroke: 0.5 };
  }
  const textInRow = (top) => top + 10.4;
  const SKILL_SIZE = 7;

  function skillsBlock(character, ops) {
    for (const row of skillRows()) {
      const st = C.skill(character, row.id), mental = row.type === "mental";
      ops.push(rowPath(row, !mental));
      const name = row.name.toUpperCase();
      ops.push(mental
        ? { kind: "text", text: name, x: MENTAL.nameX, y: textInRow(row.top), size: SKILL_SIZE }
        : { kind: "text", text: name, x: PHYSICAL.nameRight, y: textInRow(row.top), size: SKILL_SIZE, align: "right" });
      if (st.value != null) {
        ops.push({ kind: "text", text: `${st.value}%`, x: mental ? MENTAL.percentX : PHYSICAL.percentX, y: textInRow(row.top), size: SKILL_SIZE });
      }
      const slots = (mental ? MENTAL : PHYSICAL).dice[row.kind];
      const marked = [...Array(st.adv).fill(["advantage-die", 0]), ...Array(st.chal).fill(["challenge-die", 2])];
      let adv = 0, chal = 0;
      for (const [icon, first] of marked) {
        const slot = first + (icon === "advantage-die" ? adv++ : chal++);
        ops.push({ kind: "icon", name: icon, x: slots[slot], y: row.top + 1.8, size: DIE });
      }
    }
    const a = ANYTHING_ELSE;
    ops.push(rowPath({ left: a.left, right: a.right, top: a.top }, false));
    ops.push({ kind: "text", text: "ANYTHING ELSE", x: a.nameX, y: textInRow(a.top), size: SKILL_SIZE });
    ops.push({ kind: "text", text: `${C.UNTRAINED}%`, x: a.percentX, y: textInRow(a.top), size: SKILL_SIZE });
  }

  // ---- shared pieces ----
  const INK = "ink", PAPER = "paper";
  // A section's dark title bar, on the left or right edge of the page, long enough for its title.
  function titleBar(ops, title, y, side, measure) {
    const length = Math.max(140, measure(title, 10, true) + 24);
    if (side === "left") {
      ops.push({ kind: "path", points: [[18, y], [18 + length, y], [24 + length, y + 14.5], [18, y + 14.5]], closed: true, fill: INK });
      ops.push({ kind: "text", text: title, x: 26.5, y: y + 11, size: 10, bold: true, color: PAPER });
    } else {
      ops.push({ kind: "path", points: [[780 - length, y], [774, y], [774, y + 14.5], [774 - length, y + 14.5]], closed: true, fill: INK });
      ops.push({ kind: "text", text: title, x: 765, y: y + 11, size: 10, bold: true, color: PAPER, align: "right" });
    }
  }
  const frame = (ops, x, y, w, h) => ops.push({ kind: "rect", x, y, w, h, stroke: 0.5 });
  // A value over a line, with its label under the line (the identity block).
  function lineField(ops, labelText, value, x, w, lineY, size = 14) {
    ops.push({ kind: "line", x1: x, y1: lineY, x2: x + w, y2: lineY, stroke: 0.5 });
    if (value !== "") ops.push({ kind: "text", text: winAnsi(value), x: x + w / 2, y: lineY - 3.5, size, align: "center", fitWidth: w });
    ops.push({ kind: "text", text: labelText, x: x + w / 2, y: lineY + 8, size: 6.5, bold: true, align: "center", fitWidth: w });
  }

  const abilityParas = (list) => list.flatMap((a) => [heading(a.name), ...paragraphs(a.description)]);

  // ---- the layout ----
  // options: abilities (the catalog, NCD_ABILITIES), measure(text, size, bold) -> width in points.
  function layout(character, { abilities = [], measure }) {
    const page1 = [], page2 = [];
    const boxes = {};
    const continued = [];   // [title, paragraphs] that didn't fit on page 1, for Other Notes
    const flow = (ops, name, box, paras, opts) => {
      boxes[name] = box;
      const placed = fit(paras, box, measure, { ...opts, name });
      ops.push(...placed.ops);
      return placed.overflow;
    };

    // Page 1, left half: who they are, what they know, their perks.
    const luck = C.luck(character), influence = C.influence(character), xp = C.xp(character);
    lineField(page1, "NAME", String(character.name ?? "").trim(), 18, 200, 52, 12);
    lineField(page1, "HANDLE", String(character.handle ?? "").trim(), 18, 200.2, 85.5, 16);
    lineField(page1, "ARCHETYPE", character.archetype ?? "", 18, 97.2, 114.1);
    lineField(page1, "ORIGIN", character.origin ?? "", 121, 97.2, 114.1);
    lineField(page1, "INFLUENCE (CURRENT / STARTING)", `${influence.current} / ${influence.starting}`, 18, 97.2, 144.0);
    lineField(page1, "XP", String(xp.available), 121, 97.2, 144.0);
    if (xp.spent) page1.push({ kind: "text", text: `${xp.spent} spent`, x: 218.2, y: 140.5, size: 6, align: "right" });
    lineField(page1, "CURRENT LUCK", String(luck.current), 18, 97.2, 173.9);
    lineField(page1, "MAXIMUM LUCK", String(luck.max), 121, 97.2, 173.9);

    titleBar(page1, "THINGS YOU KNOW ABOUT", 199.2, "left", measure);
    // Two columns, 15 pt apart as on the sheet, closer if the list is ever longer than the room above Character Perks.
    const known = C.knows(character), perColumn = Math.ceil(C.KNOWLEDGE.length / 2);
    const step = Math.min(15, (342 - 225.2) / (perColumn - 1));
    C.KNOWLEDGE.forEach((k, i) => {
      const x = i < perColumn ? 41.7 : 131.1, y = 225.2 + (i % perColumn) * step;
      page1.push({ kind: "check", group: "knows", label: k, checked: known.includes(k), x, y: y + 0.6, size: 6.4 });
      page1.push({ kind: "text", text: k.toUpperCase(), x: x + 9.5, y: y + 6.6, size: 7 });
    });

    titleBar(page1, "CHARACTER PERKS", 355.8, "left", measure);
    frame(page1, 18, 370.3, 204, 225.7);
    const all = C.abilities(character, abilities);
    const perks = all.filter((a) => a.type === "perk"), augmentations = all.filter((a) => a.type !== "perk");
    const perksLeft = flow(page1, "perks", { x: 26, y: 375, w: 188, h: 216 }, abilityParas(perks));
    if (perksLeft.length) continued.push(["CHARACTER PERKS (CONTINUED)", perksLeft]);

    // Page 1, middle: initiative and skills.
    page1.push({ kind: "path", points: [[229.8, 31.8], [548.8, 31.8], [548.8, 60.6], [229.8, 60.6]], closed: true, fill: INK });
    page1.push({ kind: "text", text: "INITIATIVE", x: 238, y: 42.5, size: 9, bold: true, color: PAPER });
    page1.push({ kind: "text", text: "IN THE WORLD", x: 238, y: 56.5, size: 9, bold: true, color: PAPER });
    page1.push({ kind: "text", text: "INITIATIVE", x: 541, y: 42.5, size: 9, bold: true, color: PAPER, align: "right" });
    page1.push({ kind: "text", text: "IN THE NETWORK", x: 541, y: 56.5, size: 9, bold: true, color: PAPER, align: "right" });
    for (const [id, x] of [["initiative-in-the-world", 345.4], ["initiative-in-the-network", 411.3]]) {
      page1.push({ kind: "rect", x, y: 47.6, w: 32.2, h: 11.5, fill: PAPER });
      const value = C.skill(character, id).value ?? C.UNTRAINED;
      page1.push({ kind: "text", text: `${value}%`, x: x + 29, y: 56.6, size: 8.5, align: "right" });
    }
    skillsBlock(character, page1);

    // Page 1, right half (an overlay covers it): appearance, body perks, weapons, wounds.
    titleBar(page1, "APPEARANCE", 47.3, "right", measure);
    frame(page1, 576, 61.8, 198, 104);
    const look = C.appearance(character);
    const appearanceParas = [["PRONOUNS", look.pronouns], ["PHYSICAL APPEARANCE", look.physical], ["NETWORK DEFAULT", look.network]]
      .flatMap(([title, text]) => [label(title), ...(String(text).trim() ? paragraphs(text) : [body("")])]);
    const lookLeft = flow(page1, "appearance", { x: 583, y: 65, w: 184, h: 97 }, appearanceParas, { sizes: [7, 6.5, 6] });
    if (lookLeft.length) continued.push(["APPEARANCE (CONTINUED)", lookLeft]);

    titleBar(page1, "BODY PERKS", 169.6, "right", measure);
    const bodyLeft = flow(page1, "body", { x: 583, y: 188, w: 184, h: 136 }, abilityParas(augmentations));
    if (bodyLeft.length) continued.push(["BODY PERKS (CONTINUED)", bodyLeft]);

    titleBar(page1, "WEAPONS", 329.4, "right", measure);
    const gear = C.gear(character);
    const weapons = gear.filter((g) => g.kind === "weapon").slice(0, 2);
    const gearName = (g) => winAnsi(String(g.description ?? "").trim() || G.defaultName(g)) + (g.quantity > 1 ? ` ×${g.quantity}` : "");
    [0, 1].forEach((slot) => {
      const dy = slot * 62.1, w = weapons[slot];
      page1.push({ kind: "line", x1: 582.2, y1: 368.5 + dy, x2: 760, y2: 368.5 + dy, stroke: 0.5 });
      page1.push({ kind: "text", text: "WEAPON", x: 590.6, y: 376.4 + dy, size: 6.5, bold: true });
      page1.push({ kind: "text", text: "DAMAGE", x: 742.2, y: 376.4 + dy, size: 6.5, bold: true, align: "right" });
      page1.push({ kind: "path", points: [[655.5, 378.6 + dy], [660, 381 + dy], [655.5, 383.4 + dy]], closed: true, fill: INK });
      page1.push({ kind: "text", text: "KEYWORDS", x: 663, y: 383.4 + dy, size: 6.5, bold: true });
      page1.push({ kind: "rect", x: 582.2, y: 386 + dy, w: 177.8, h: 25, stroke: 0.5 });
      if (!w) return;
      page1.push({ kind: "text", text: gearName(w), x: 583.4, y: 365.5 + dy, size: 8, fitWidth: 150 });
      page1.push({ kind: "text", text: `+${G.stats(w).damage ?? 0}`, x: 760, y: 365.5 + dy, size: 8, align: "right" });
      const kw = G.keywordsOf(w);
      if (kw.length) flow(page1, `weapon${slot + 1}`, { x: 586, y: 388.5 + dy, w: 170, h: 21 }, [body(kw.join(", "))], { sizes: [7, 6.5, 6, 5.5] });
    });

    titleBar(page1, "WOUNDS", 488, "right", measure);
    const wounds = C.wounds(character);
    for (let i = 0; i < 4; i++) {
      page1.push({ kind: "check", group: "wounds", checked: i < wounds, x: 592 + i * 28, y: 519, size: 18, corners: true });
    }
    page1.push({ kind: "check", group: "state", label: "Unconscious", checked: false, x: 706, y: 517.6, size: 6.4 });
    page1.push({ kind: "text", text: "UNCONSCIOUS", x: 715, y: 523.6, size: 7 });
    page1.push({ kind: "check", group: "state", label: "Dead", checked: false, x: 706, y: 532.7, size: 6.4 });
    page1.push({ kind: "text", text: "DEAD", x: 715, y: 538.7, size: 7 });

    page1.push({ kind: "text", text: "Print at 100% (actual size) so overlay sheets line up.", x: 18, y: 604, size: 6 });

    // Page 2: liability, conditions, notes, gear.
    titleBar(page2, "LIABILITY", 24.9, "left", measure);
    frame(page2, 18, 39.4, 367, 136);
    flow(page2, "liability", { x: 26, y: 45, w: 351, h: 126 }, paragraphs(C.liability(character)), { sizes: [8, 7.5, 7, 6.5, 6] });

    titleBar(page2, "ADDITIONAL TRAITS", 179.9, "left", measure);
    frame(page2, 18, 194.4, 367, 201);
    const conditionLines = CO.conditions(character).map((x) =>
      body([x.name, CO.severityLabel(x.severity), x.intrinsic ? "(intrinsic)" : ""].filter(Boolean).join(" ")));
    const traitsLeft = flow(page2, "traits", { x: 26, y: 200, w: 351, h: 190 }, conditionLines, { sizes: [8, 7.5, 7, 6.5, 6] });
    if (traitsLeft.length) continued.push(["ADDITIONAL TRAITS (CONTINUED)", traitsLeft]);

    titleBar(page2, "GEAR", 400.7, "left", measure);
    frame(page2, 18, 415.2, 756, 180);
    const rest = gear.filter((g) => !weapons.includes(g));
    const GEAR_ROWS = 10;
    for (const [col, x, lineX1, lineX2] of [[0, 31.7, 46.6, 385.2], [1, 397.7, 412.6, 751.2]]) {
      page2.push({ kind: "text", text: "STARTING", x, y: 433, size: 7, bold: true });
      for (let i = 0; i < GEAR_ROWS; i++) {
        const lineY = 451.1 + i * 15.18, item = rest[col * GEAR_ROWS + i];
        page2.push({ kind: "line", x1: lineX1, y1: lineY, x2: lineX2, y2: lineY, stroke: i === GEAR_ROWS - 1 ? 1 : 0.5 });
        page2.push({ kind: "check", group: "gear", label: item ? gearName(item) : "", checked: Boolean(item?.starter), x, y: lineY - 8.6, size: 6.4 });
        if (!item) continue;
        const what = G.label(item);
        page2.push({ kind: "text", text: gearName(item) + (what && what !== "prop" ? `  (${winAnsi(what)})` : ""), x: lineX1 + 4, y: lineY - 3, size: 7.5, fitWidth: lineX2 - lineX1 - 8 });
      }
    }
    const gearLeft = rest.slice(GEAR_ROWS * 2);
    if (gearLeft.length) continued.push(["GEAR (CONTINUED)", gearLeft.map((g) => body(`${gearName(g)}${g.starter ? " (starting)" : ""}`))]);

    titleBar(page2, "OTHER NOTES", 24.9, "right", measure);
    frame(page2, 400, 39.4, 374, 356);
    const notes = [label("REPERCUSSIONS AND STORY REWARDS"), ...paragraphs(C.story(character))];
    for (const [title, paras] of continued) notes.push(label(title), ...paras);
    let notesLeft = flow(page2, "notes", { x: 408, y: 45, w: 358, h: 345 }, notes, { sizes: [8, 7.5, 7, 6.5, 6] });

    // Anything that still doesn't fit goes on extra pages, so nothing is cut off.
    const pages = [page1, page2];
    while (notesLeft.length) {
      const page = [];
      titleBar(page, "OTHER NOTES (CONTINUED)", 24.9, "left", measure);
      frame(page, 18, 39.4, 756, 556);
      const before = notesLeft;
      notesLeft = flow(page, `notes${pages.length + 1}`, { x: 26, y: 45, w: 740, h: 545 }, notesLeft, { sizes: [7] });
      pages.push(page);
      if (notesLeft[0] === before[0] && notesLeft.length === before.length) break;   // no progress: never loop forever
    }
    return { width: WIDTH, height: HEIGHT, half: HALF, pages, boxes };
  }

  // "<handle>.pdf", without characters file names can't have.
  function fileName(character) {
    const handle = String(character?.handle ?? "").trim().replace(/[\\/:*?"<>|]+/g, "-").replace(/^-+|-+$/g, "");
    return `${handle || "Character"}.pdf`;
  }

  root.NCD_SHEET_PDF = { WIDTH, HEIGHT, ANYTHING_ELSE, skillRows, winAnsi, paragraphs, wrap, fit, layout, fileName };
})(globalThis);
