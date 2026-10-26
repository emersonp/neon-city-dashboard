// The character sheet as a two-page landscape PDF, laid out like the official sheet (Character_and_Shell_Sheets.pdf).
// This file only decides what goes where: layout() returns each page as a list of drawing ops, in points from the top
// left. sheet-pdf-ui.js draws them with pdf-lib. No page code here, so it can be tested in Node.
//
// Overlay sheets (Quick Shell, Quick Avatar, named shells) are the right half of a landscape page, laid over the sheet
// with the edges lined up. So the skills block is drawn exactly where the official sheet has it, and nothing a player
// needs while wearing a shell goes right of x = 396. Coordinates were read from the official PDF (it's real text and
// lines), and the dice slots from the Quick Shell scan, where every row shows all four.
//
// Look: black-and-white print, technical and angular, like the official sheet. Chamfered panels, slanted title tabs
// with grey shadows whose rule runs on as the panel's top edge, a masthead with a barcode, and the official sheet's
// heavy grey background art, hatched edge strips and circuit traces. The skill rows are filled white over the art.
//
// Ops: text (x, y baseline, size, font, color, align, fitWidth), line, rect, path (points, closed, fill, stroke),
// circle, check (a box, checked or not), icon (name, x, y top, size). Fonts are roles: display, label, body, strong.
// Colors are roles: ink, muted, faint, wash, paper. sheet-pdf-ui.js maps both to real fonts and greys.
(function (root) {
  const C = root.NCD_CHARACTERS, G = root.NCD_GEAR, CO = root.NCD_CONDITIONS;
  const { ICON_TOKENS } = root.NCD_FORMAT;

  const WIDTH = 792, HEIGHT = 612;
  const HALF = WIDTH / 2;

  // ---- text the PDF can draw: Latin-1 plus a few punctuation marks ----
  const LATIN_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
  const drawable = (ch) => {
    const code = ch.codePointAt(0);
    return (code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || LATIN_EXTRA.has(ch);
  };
  // Accents that can't be drawn come off first ("Ō" is "O"); anything still not drawable is "?". Tabs and line breaks
  // are spaces.
  function winAnsi(text) {
    return [...String(text ?? "").replace(/[\t\r\n]/g, " ")].map((ch) => {
      if (drawable(ch)) return ch;
      const bare = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
      return bare && [...bare].every(drawable) ? bare : "?";
    }).join("");
  }

  // ---- paragraphs and wrapping ----
  // A paragraph is a list of words: { text, font } or { icon }. Its style picks the size, font and spacing:
  // "heading" (display, a little larger), "body", "bullet" (a • and a hanging indent), or "label" (small caps).
  const STYLE = {
    heading: { scale: 1.25, gap: 0.7, font: "display" },
    body: { scale: 1, gap: 0.35, font: "body" },
    bullet: { scale: 1, gap: 0.15, indent: 1.2, font: "body" },
    label: { scale: 0.85, gap: 0.7, font: "label", color: "muted" },
  };
  const LEADING = 1.2;
  const ICON_SCALE = 1.05;
  const plainWords = (text) => winAnsi(text).split(" ").filter(Boolean).map((t) => ({ text: t }));
  const para = (style, words) => ({ style, words });
  const heading = (text) => para("heading", plainWords(String(text).toUpperCase()));
  const label = (text) => para("label", plainWords(String(text).toUpperCase()));
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
      words.push({ ...(token && ICON_TOKENS[token[1]] ? { icon: ICON_TOKENS[token[1]] } : { text: winAnsi(piece) }), joinBefore: touching });
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

  // Lines of words that fit `width`. Each word keeps its index in the paragraph, so the rest of a paragraph that doesn't
  // fit can carry on somewhere else. A word too long for a line on its own gets a line to itself.
  function wrap(p, width, size, measure) {
    const st = STYLE[p.style], s = size * st.scale, indent = (st.indent ?? 0) * s;
    const space = measure(" ", s, st.font);
    const lines = [];
    let line = null;
    p.words.forEach((w, index) => {
      const ww = w.icon ? s * ICON_SCALE : measure(w.text, s, st.font);
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
        drawLine(ops, line, box.x, y + s, s, st, name);
        y += lh;
      }
    }
    return { ops, size, overflow: [] };
  }
  // One wrapped line: neighbouring words are joined into one text op, icons are their own ops.
  function drawLine(ops, line, x0, baseline, size, st, box) {
    const x = x0 + line.indent, base = { kind: "text", y: baseline, size, font: st.font, color: st.color ?? "ink", box };
    if (line.bullet) ops.push({ ...base, text: "•", x: x0 });
    let run = null;   // the text op being built, until an icon
    for (const w of line.words) {
      if (w.icon) {
        run = null;
        ops.push({ kind: "icon", name: w.icon, x: x + w.x, y: baseline - size * 0.85, size: size * ICON_SCALE * 0.95, box });
      } else if (run) {
        run.text += (w.joinBefore ? "" : " ") + w.text;
      } else {
        run = { ...base, text: w.text, x: x + w.x };
        ops.push(run);
      }
    }
  }

  // ---- the skills block (fixed: overlays line up with it) ----
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
    const points = mirrored
      ? [[r - BEVEL, t], [r, t + BEVEL], [r, b - BEVEL], [r - BEVEL, b], [l + BEVEL, b], [l, b - BEVEL], [l, t]]
      : [[l + BEVEL, t], [l, t + BEVEL], [l, b - BEVEL], [l + BEVEL, b], [r - BEVEL, b], [r, b - BEVEL], [r, t]];
    return { kind: "path", points, closed: true, stroke: 0.6, fill: "paper" };
  }
  const textInRow = (top) => top + 10.3;
  const SKILL_SIZE = 7;

  function skillsBlock(character, ops) {
    for (const row of skillRows()) {
      const st = C.skill(character, row.id), mental = row.type === "mental";
      ops.push(rowPath(row, !mental));
      const name = { kind: "text", text: row.name.toUpperCase(), y: textInRow(row.top), size: SKILL_SIZE, font: "label" };
      ops.push(mental ? { ...name, x: MENTAL.nameX } : { ...name, x: PHYSICAL.nameRight, align: "right" });
      if (st.value != null) {
        ops.push({ kind: "text", text: `${st.value}%`, x: mental ? MENTAL.percentX : PHYSICAL.percentX, y: textInRow(row.top), size: 8, font: "strong" });
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
    ops.push({ kind: "text", text: "ANYTHING ELSE", x: a.nameX, y: textInRow(a.top), size: SKILL_SIZE, font: "label" });
    ops.push({ kind: "text", text: `${C.UNTRAINED}%`, x: a.percentX, y: textInRow(a.top), size: 8, font: "strong" });
  }

  // ---- chrome: tabs, panels, the frame, ornaments ----
  const TAB_H = 14.5, CUT = 8;
  // A section's title tab, on the left or right edge, long enough for its title; its rule runs on to `to`, as the top
  // edge of the panel below. A grey shadow tab sits behind it.
  function titleTab(ops, ctx, title, y, side, to) {
    const length = Math.max(132, ctx.measure(title, 10, "display") + 30);
    const bottom = y + TAB_H;
    if (side === "left") {
      ops.push({ kind: "path", points: [[18, y - 4], [26 + length, y - 4], [34 + length, bottom - 4], [18, bottom - 4]], closed: true, fill: "faint" });
      ops.push({ kind: "path", points: [[18, y], [18 + length, y], [18 + length + TAB_H * 0.6, bottom], [18, bottom]], closed: true, fill: "ink" });
      ops.push({ kind: "text", text: title, x: 26, y: y + 10.8, size: 10, font: "display", color: "paper" });
      if (to) ops.push({ kind: "line", x1: 18 + length, y1: bottom, x2: to, y2: bottom, stroke: 1 });
    } else {
      ops.push({ kind: "path", points: [[774 - length - 8, y - 4], [774, y - 4], [774, bottom - 4], [774 - length - 16, bottom - 4]], closed: true, fill: "faint" });
      ops.push({ kind: "path", points: [[774 - length, y], [774, y], [774, bottom], [774 - length - TAB_H * 0.6, bottom]], closed: true, fill: "ink" });
      ops.push({ kind: "text", text: title, x: 766, y: y + 10.8, size: 10, font: "display", color: "paper", align: "right" });
      if (to) ops.push({ kind: "line", x1: to, y1: bottom, x2: 774 - length - TAB_H * 0.6, y2: bottom, stroke: 1 });
    }
  }
  // A panel below a tab: no top edge (the tab's rule is that), one corner cut on the side away from the tab. It isn't
  // filled, so the grey art shows through, as on the official sheet.
  function panel(ops, x, y, w, h, side = "left") {
    const r = x + w, b = y + h;
    ops.push({ kind: "path", closed: false, stroke: 0.6, points: side === "left"
      ? [[x, y], [x, b], [r - CUT, b], [r, b - CUT], [r, y]]
      : [[r, y], [r, b], [x + CUT, b], [x, b - CUT], [x, y]] });
  }
  // The page frame: corners cut top-left and bottom-right, and a gap in the bottom edge for the footer note.
  function frame(ops, ctx, note, right) {
    const l = 9, t = 9, r = 783, b = 603, c = 16;
    ops.push({ kind: "path", closed: false, stroke: 1.2, points: [[l + 220, b], [l, b], [l, t + c], [l + c, t], [r, t], [r, b - c], [r - c, b], [r - 210, b]] });
    ops.push({ kind: "text", text: note, x: l + 226, y: b + 2.2, size: 6, font: "label", color: "muted" });
    ops.push({ kind: "text", text: right, x: r - 216, y: b + 2.2, size: 6, font: "label", color: "muted", align: "right" });
    ops.push({ kind: "line", x1: l + 232 + ctx.measure(note, 6, "label"), y1: b, x2: r - 222 - ctx.measure(right, 6, "label"), y2: b, stroke: 1.2 });
  }
  const dots = (ops, x, y, n, gap = 6, color = "ink") => {
    for (let i = 0; i < n; i++) ops.push({ kind: "circle", x: x + i * gap, y, r: 0.9, fill: color });
  };
  // A square of diagonal hatching.
  function hatch(ops, x, y, w, h, step = 3, stroke = 0.9, color = "ink") {
    for (let d = step; d < w + h; d += step) {
      const x1 = x + Math.max(0, d - h), y1 = y + Math.min(h, d), x2 = x + Math.min(w, d), y2 = y + Math.max(0, d - w);
      ops.push({ kind: "line", x1, y1, x2, y2, stroke, color });
    }
  }
  // A barcode from the handle: the same handle always draws the same bars.
  function barcode(ops, text, x, y, w, h) {
    let seed = 7;
    for (const ch of String(text)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    let at = x;
    while (at < x + w) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      const bar = [0.5, 0.9, 1.6][seed % 3], gap = [0.7, 1.1][(seed >> 3) % 2];
      if (at + bar > x + w) break;
      ops.push({ kind: "rect", x: at, y, w: bar, h, fill: "ink" });
      at += bar + gap;
    }
  }
  // A circuit trace: a line through points, a node at each end.
  function trace(ops, points, color = "faint", stroke = 0.8) {
    ops.push({ kind: "path", closed: false, stroke, strokeColor: color, points });
    for (const [x, y] of [points[0], points[points.length - 1]]) ops.push({ kind: "circle", x, y, r: 1.6, fill: "paper", stroke: 0.8, strokeColor: color });
  }

  // The background: broad grey bands and outlined blocks like the official sheet's art, under everything else.
  // The skill rows are filled white, so none of it ever sits behind a skill.
  function backgroundArt(ops, page) {
    const band = (points) => ops.push({ kind: "path", closed: true, fill: "wash", points });
    const outline = (points, stroke = 5) => ops.push({ kind: "path", closed: true, stroke, strokeColor: "wash", points });
    if (page === 1) {
      band([[560, 64], [646, 64], [790, 208], [790, 330], [736, 330], [736, 232], [610, 106], [560, 106]]);
      band([[586, 336], [640, 336], [706, 402], [706, 612], [650, 612], [650, 424], [586, 360]]);
      band([[9, 186], [64, 186], [160, 282], [160, 430], [116, 474], [64, 474], [112, 426], [112, 302], [9, 199]]);
      outline([[600, 214], [776, 214], [776, 306], [752, 330], [600, 330]]);
      outline([[132, 476], [222, 476], [222, 600], [150, 600], [132, 582]], 4);
      band([[232, 64], [300, 64], [314, 78], [232, 78]]);
      hatch(ops, 11, 360, 7, 140, 4, 1.2, "faint");
      hatch(ops, 775, 440, 7, 140, 4, 1.2, "faint");
      trace(ops, [[534, 120], [548, 120], [567, 139], [567, 560]], "faint", 1.4);
    } else {
      band([[9, 40], [96, 40], [230, 174], [230, 300], [176, 300], [176, 196], [9, 70]]);
      band([[540, 56], [632, 56], [790, 214], [790, 392], [736, 392], [736, 238], [540, 98]]);
      band([[286, 404], [350, 404], [418, 472], [418, 612], [362, 612], [362, 494], [286, 432]]);
      outline([[420, 190], [600, 190], [600, 330], [576, 354], [420, 354]]);
      hatch(ops, 11, 180, 7, 150, 4, 1.2, "faint");
      hatch(ops, 775, 60, 7, 130, 4, 1.2, "faint");
      trace(ops, [[160, 400], [200, 400], [220, 380], [380, 380]], "faint", 1.4);
    }
  }

  const abilityParas = (list) => list.flatMap((a) => [heading(a.name), ...paragraphs(a.description)]);

  // ---- the layout ----
  // options: abilities (the catalog, NCD_ABILITIES); measure(text, size, font) -> width in points.
  function layout(character, { abilities = [], measure }) {
    const ctx = { measure };
    const page1 = [], page2 = [];
    const boxes = {};
    const continued = [];   // [title, paragraphs] that didn't fit on page 1, for Other Notes
    const flow = (ops, name, box, paras, opts) => {
      boxes[name] = box;
      const placed = fit(paras, box, measure, { ...opts, name });
      ops.push(...placed.ops);
      return placed.overflow;
    };
    const handle = winAnsi(String(character.handle ?? "").trim());
    const sheetMark = (n) => `NC-OUTLAWS // ${handle.toUpperCase() || "OPERATIVE"} // SHEET 0${n}`;

    backgroundArt(page1, 1);
    frame(page1, ctx, "PRINT AT 100% (ACTUAL SIZE) // OVERLAY SHEETS LINE UP WITH THE SKILLS", sheetMark(1));

    // Masthead and identity (left).
    page1.push({ kind: "text", text: "NEON CITY OUTLAWS", x: 18, y: 27, size: 13, font: "display" });
    page1.push({ kind: "text", text: "OPERATIVE DOSSIER", x: 18, y: 35, size: 6, font: "label", color: "muted" });
    const barX = 18 + measure("NEON CITY OUTLAWS", 13, "display") + 12;
    barcode(page1, handle || "operative", barX, 17, 218 - barX, 13);
    const luck = C.luck(character), influence = C.influence(character), xp = C.xp(character);
    const field = (labelText, value, x, w, lineY, size = 15, font = "display") => {
      page1.push({ kind: "line", x1: x, y1: lineY, x2: x + w, y2: lineY, stroke: 0.6 });
      if (value !== "") page1.push({ kind: "text", text: winAnsi(value), x: x + w / 2, y: lineY - 3.5, size, font, align: "center", fitWidth: w - 4 });
      page1.push({ kind: "text", text: labelText, x: x + w / 2, y: lineY + 7.5, size: 6, font: "label", color: "muted", align: "center", fitWidth: w });
    };
    field("NAME", String(character.name ?? "").trim(), 18, 200, 56, 12, "strong");
    field("HANDLE", handle, 18, 200.2, 85.5, 20);
    field("ARCHETYPE", character.archetype ?? "", 18, 97.2, 114.1);
    field("ORIGIN", character.origin ?? "", 121, 97.2, 114.1);
    field("INFLUENCE  CURRENT / STARTING", `${influence.current} / ${influence.starting}`, 18, 97.2, 144.0);
    field("XP", String(xp.available), 121, 97.2, 144.0);
    if (xp.spent) page1.push({ kind: "text", text: `${xp.spent} SPENT`, x: 218.2, y: 140.5, size: 5.5, font: "label", color: "muted", align: "right" });
    field("CURRENT LUCK", String(luck.current), 18, 97.2, 173.9);
    field("MAXIMUM LUCK", String(luck.max), 121, 97.2, 173.9);

    titleTab(page1, ctx, "THINGS YOU KNOW ABOUT", 199.2, "left", 222);
    panel(page1, 18, 213.7, 204, 137);
    // Two columns, 15 pt apart as on the sheet, closer if the list is ever longer than the room above Character Perks.
    const known = C.knows(character), perColumn = Math.ceil(C.KNOWLEDGE.length / 2);
    const step = Math.min(15, (338 - 222) / (perColumn - 1));
    C.KNOWLEDGE.forEach((k, i) => {
      const x = i < perColumn ? 30 : 124, y = 222 + (i % perColumn) * step;
      page1.push({ kind: "check", group: "knows", label: k, checked: known.includes(k), x, y: y + 0.6, size: 6.4 });
      page1.push({ kind: "text", text: k.toUpperCase(), x: x + 10, y: y + 6.5, size: 7, font: "label" });
    });

    titleTab(page1, ctx, "CHARACTER PERKS", 355.8, "left", 222);
    panel(page1, 18, 370.3, 204, 226);
    const all = C.abilities(character, abilities);
    const perks = all.filter((a) => a.type === "perk"), augmentations = all.filter((a) => a.type !== "perk");
    const perksLeft = flow(page1, "perks", { x: 26, y: 376, w: 188, h: 214 }, abilityParas(perks));
    if (perksLeft.length) continued.push(["CHARACTER PERKS (CONTINUED)", perksLeft]);

    // Initiative and skills (middle).
    page1.push({ kind: "path", closed: true, fill: "ink", points: [[229.8, 31.8], [548.8, 31.8], [548.8, 52], [540.2, 60.6], [229.8, 60.6]] });
    page1.push({ kind: "text", text: "INITIATIVE", x: 238, y: 42.8, size: 9, font: "display", color: "paper" });
    page1.push({ kind: "text", text: "IN THE WORLD", x: 238, y: 56.4, size: 9, font: "display", color: "paper" });
    page1.push({ kind: "text", text: "INITIATIVE", x: 541, y: 42.8, size: 9, font: "display", color: "paper", align: "right" });
    page1.push({ kind: "text", text: "IN THE NETWORK", x: 541, y: 56.4, size: 9, font: "display", color: "paper", align: "right" });
    for (const [id, x] of [["initiative-in-the-world", 345.4], ["initiative-in-the-network", 411.3]]) {
      page1.push({ kind: "rect", x, y: 47.6, w: 32.2, h: 11.5, fill: "paper" });
      const value = C.skill(character, id).value ?? C.UNTRAINED;
      page1.push({ kind: "text", text: `${value}%`, x: x + 29.5, y: 56.9, size: 9, font: "strong", align: "right" });
    }
    skillsBlock(character, page1);

    // Right column (an overlay covers it): appearance, body perks, weapons, wounds.
    dots(page1, 640, 21, 10);
    hatch(page1, 748, 13, 24, 24);

    titleTab(page1, ctx, "APPEARANCE", 47.3, "right", 576);
    panel(page1, 576, 61.8, 198, 104, "right");
    const look = C.appearance(character);
    const appearanceParas = [["PRONOUNS", look.pronouns], ["PHYSICAL APPEARANCE", look.physical], ["NETWORK DEFAULT", look.network]]
      .flatMap(([title, text]) => [label(title), ...(String(text).trim() ? paragraphs(text) : [])]);
    const lookLeft = flow(page1, "appearance", { x: 583, y: 66, w: 184, h: 96 }, appearanceParas, { sizes: [7.5, 7, 6.5, 6] });
    if (lookLeft.length) continued.push(["APPEARANCE (CONTINUED)", lookLeft]);

    titleTab(page1, ctx, "BODY PERKS", 169.6, "right", 576);
    panel(page1, 576, 184.1, 198, 141, "right");
    const bodyLeft = flow(page1, "body", { x: 583, y: 189, w: 184, h: 132 }, abilityParas(augmentations));
    if (bodyLeft.length) continued.push(["BODY PERKS (CONTINUED)", bodyLeft]);

    titleTab(page1, ctx, "WEAPONS", 329.4, "right", 576);
    panel(page1, 576, 343.9, 198, 140, "right");
    const gear = C.gear(character);
    const weapons = gear.filter((g) => g.kind === "weapon").slice(0, 2);
    const gearName = (g) => winAnsi(String(g.description ?? "").trim() || G.defaultName(g)) + (g.quantity > 1 ? ` ×${g.quantity}` : "");
    [0, 1].forEach((slot) => {
      const dy = slot * 62.1, w = weapons[slot];
      page1.push({ kind: "line", x1: 582.2, y1: 368.5 + dy, x2: 766, y2: 368.5 + dy, stroke: 0.6 });
      page1.push({ kind: "text", text: "WEAPON", x: 584, y: 375.6 + dy, size: 6, font: "label", color: "muted" });
      page1.push({ kind: "text", text: "DAMAGE", x: 766, y: 375.6 + dy, size: 6, font: "label", color: "muted", align: "right" });
      page1.push({ kind: "path", closed: true, fill: "ink", points: [[656, 378.4 + dy], [660.5, 380.8 + dy], [656, 383.2 + dy]] });
      page1.push({ kind: "text", text: "KEYWORDS", x: 663, y: 383.2 + dy, size: 6, font: "label", color: "muted" });
      page1.push({ kind: "path", closed: true, stroke: 0.6, points: [[582.2, 386 + dy], [766, 386 + dy], [766, 404 + dy], [759, 411 + dy], [582.2, 411 + dy]] });
      if (!w) return;
      page1.push({ kind: "text", text: gearName(w), x: 584, y: 365.3 + dy, size: 9, font: "strong", fitWidth: 150 });
      page1.push({ kind: "text", text: `+${G.stats(w).damage ?? 0}`, x: 766, y: 365.3 + dy, size: 10, font: "display", align: "right" });
      const kw = G.keywordsOf(w);
      if (kw.length) flow(page1, `weapon${slot + 1}`, { x: 586, y: 389, w: 172, h: 20 }, [body(kw.join(", "))], { sizes: [7.5, 7, 6.5, 6, 5.5] });
    });

    titleTab(page1, ctx, "WOUNDS", 488, "right", 576);
    panel(page1, 576, 502.5, 198, 62, "right");
    const wounds = C.wounds(character);
    for (let i = 0; i < 4; i++) {
      page1.push({ kind: "check", group: "wounds", checked: i < wounds, x: 590 + i * 27, y: 517, size: 19, corners: true });
    }
    page1.push({ kind: "check", group: "state", label: "Unconscious", checked: false, x: 706, y: 518.5, size: 6.4 });
    page1.push({ kind: "text", text: "UNCONSCIOUS", x: 716, y: 524.4, size: 7, font: "label" });
    page1.push({ kind: "check", group: "state", label: "Dead", checked: false, x: 706, y: 533.6, size: 6.4 });
    page1.push({ kind: "text", text: "DEAD", x: 716, y: 539.5, size: 7, font: "label" });

    // Page 2: liability, conditions, notes, gear.
    backgroundArt(page2, 2);
    frame(page2, ctx, "REPERCUSSIONS, GEAR AND EVERYTHING THAT DIDN'T FIT", sheetMark(2));
    dots(page2, 360, 17, 10);

    titleTab(page2, ctx, "LIABILITY", 24.9, "left", 385);
    panel(page2, 18, 39.4, 367, 136);
    flow(page2, "liability", { x: 26, y: 46, w: 351, h: 124 }, paragraphs(C.liability(character)), { sizes: [9, 8.5, 8, 7.5, 7, 6.5, 6] });

    titleTab(page2, ctx, "ADDITIONAL TRAITS", 179.9, "left", 385);
    panel(page2, 18, 194.4, 367, 201);
    const conditionLines = CO.conditions(character).map((x) =>
      body([x.name, CO.severityLabel(x.severity), x.intrinsic ? "(intrinsic)" : ""].filter(Boolean).join(" ")));
    const traitsLeft = flow(page2, "traits", { x: 26, y: 201, w: 351, h: 188 }, conditionLines, { sizes: [9, 8.5, 8, 7.5, 7, 6.5, 6] });
    if (traitsLeft.length) continued.push(["ADDITIONAL TRAITS (CONTINUED)", traitsLeft]);

    titleTab(page2, ctx, "GEAR", 400.7, "left", 774);
    panel(page2, 18, 415.2, 756, 181);
    const rest = gear.filter((g) => !weapons.includes(g));
    const GEAR_ROWS = 10;
    for (const [col, x, lineX1, lineX2] of [[0, 28, 42, 385.2], [1, 398, 412, 764]]) {
      page2.push({ kind: "text", text: "STARTING", x, y: 431, size: 6, font: "label", color: "muted" });
      for (let i = 0; i < GEAR_ROWS; i++) {
        const lineY = 451.1 + i * 15.18, item = rest[col * GEAR_ROWS + i];
        page2.push({ kind: "line", x1: lineX1, y1: lineY, x2: lineX2, y2: lineY, stroke: 0.5, color: "muted" });
        page2.push({ kind: "check", group: "gear", label: item ? gearName(item) : "", checked: Boolean(item?.starter), x, y: lineY - 8.6, size: 6.4 });
        if (!item) continue;
        const what = G.label(item);
        page2.push({ kind: "text", text: gearName(item), x: lineX1 + 4, y: lineY - 3, size: 8.5, font: "strong", fitWidth: (lineX2 - lineX1) * 0.6 });
        if (what && what !== "prop") page2.push({ kind: "text", text: winAnsi(what).toUpperCase(), x: lineX2 - 2, y: lineY - 3, size: 6, font: "label", color: "muted", align: "right", fitWidth: (lineX2 - lineX1) * 0.36 });
      }
    }
    const gearLeft = rest.slice(GEAR_ROWS * 2);
    if (gearLeft.length) continued.push(["GEAR (CONTINUED)", gearLeft.map((g) => body(`${gearName(g)}${g.starter ? " (starting)" : ""}`))]);

    titleTab(page2, ctx, "OTHER NOTES", 24.9, "right", 400);
    panel(page2, 400, 39.4, 374, 356, "right");
    const notes = [label("REPERCUSSIONS AND STORY REWARDS"), ...paragraphs(C.story(character))];
    for (const [title, paras] of continued) notes.push(label(title), ...paras);
    let notesLeft = flow(page2, "notes", { x: 408, y: 46, w: 358, h: 343 }, notes, { sizes: [8.5, 8, 7.5, 7, 6.5, 6] });

    // Anything that still doesn't fit goes on extra pages, so nothing is cut off.
    const pages = [page1, page2];
    while (notesLeft.length) {
      const page = [];
      frame(page, ctx, "CONTINUED", sheetMark(pages.length + 1));
      titleTab(page, ctx, "OTHER NOTES (CONTINUED)", 24.9, "left", 774);
      panel(page, 18, 39.4, 756, 556);
      const before = notesLeft;
      notesLeft = flow(page, `notes${pages.length + 1}`, { x: 26, y: 46, w: 740, h: 543 }, notesLeft, { sizes: [7.5] });
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
