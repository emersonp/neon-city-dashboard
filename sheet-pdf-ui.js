// Draws sheet-pdf.js's layout with pdf-lib and saves it as "<handle>.pdf". pdf-lib is only fetched the first time a
// PDF is made. build() returns the PDF's bytes, so they can be posted somewhere as well as downloaded.
(function (root) {
  const P = root.NCD_SHEET_PDF;
  const PDF_LIB = { src: "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
    integrity: "sha512-z8IYLHO8bTgFqj+yrPyIJnzBDf7DDhWwiEsk4sY+Oe6J2M+WQequeGS7qioI5vT6rXgVRb4K1UVQC5ER7MKzKQ==" };

  let loading = null;
  function loadPdfLib() {
    if (root.PDFLib) return Promise.resolve(root.PDFLib);
    loading ??= new Promise((resolve, reject) => {
      const script = Object.assign(document.createElement("script"), { src: PDF_LIB.src, integrity: PDF_LIB.integrity, crossOrigin: "anonymous" });
      script.onload = () => resolve(root.PDFLib);
      script.onerror = () => { loading = null; script.remove(); reject(new Error("Couldn't load the PDF library.")); };
      document.head.append(script);
    });
    return loading;
  }

  // icons.js's markup as paths: { d, role: "ink" | "paper" | "paper-stroke", evenOdd, width }.
  const iconPaths = {};
  function pathsOf(name) {
    if (iconPaths[name]) return iconPaths[name];
    const icon = root.NCD_ICONS.icons[name];
    const attr = (tag, a) => new RegExp(`\\s${a}="([^"]*)"`).exec(tag)?.[1];
    const paths = (icon.body.match(/<path\b[^>]*>/g) ?? []).map((tag) => ({
      d: attr(tag, "d"), role: attr(tag, "class") ?? "ink", evenOdd: attr(tag, "fill-rule") === "evenodd", width: Number(attr(tag, "stroke-width") ?? 1),
    }));
    const [x, y, w, h] = icon.viewBox.split(/\s+/).map(Number);
    return (iconPaths[name] = { paths, x, y, w, h });
  }

  // The layout is in points from the top left; PDF pages count up from the bottom left.
  function draw(L, doc, fonts, { width, height, pages }) {
    const INK = L.rgb(0.13, 0.12, 0.12), PAPER = L.rgb(1, 1, 1);
    const color = (c) => (c === "paper" ? PAPER : INK);
    const fontOf = (bold) => (bold ? fonts.bold : fonts.regular);
    // An SVG path whose (0, 0) is at the top-left point (x, y), scaled; even-odd paths get the even-odd fill.
    const svg = (page, d, { x, y, scale = 1, fill, stroke, strokeWidth, evenOdd }) => {
      const ops = L.drawSvgPath(d, { x, y: height - y, scale, color: fill, borderColor: stroke, borderWidth: strokeWidth });
      page.pushOperators(...(evenOdd ? ops.map((o) => (o.toString() === "f" ? L.PDFOperator.of(L.PDFOperatorNames.FillEvenOdd) : o)) : ops));
    };
    const polygon = (points) => `M${points.map(([x, y]) => `${x},${y}`).join(" L")} Z`;

    for (const ops of pages) {
      const page = doc.addPage([width, height]);
      for (const o of ops) {
        switch (o.kind) {
          case "text": {
            const font = fontOf(o.bold);
            let size = o.size;
            while (o.fitWidth && size > 5 && font.widthOfTextAtSize(o.text, size) > o.fitWidth) size -= 0.25;
            const w = font.widthOfTextAtSize(o.text, size);
            const x = o.align === "right" ? o.x - w : o.align === "center" ? o.x - w / 2 : o.x;
            page.drawText(o.text, { x, y: height - o.y, size, font, color: color(o.color) });
            break;
          }
          case "line":
            page.drawLine({ start: { x: o.x1, y: height - o.y1 }, end: { x: o.x2, y: height - o.y2 }, thickness: o.stroke, color: INK });
            break;
          case "rect":
            page.drawRectangle({ x: o.x, y: height - o.y - o.h, width: o.w, height: o.h,
              ...(o.fill ? { color: color(o.fill) } : {}), ...(o.stroke ? { borderColor: INK, borderWidth: o.stroke } : {}) });
            break;
          case "path":
            svg(page, polygon(o.points), { x: 0, y: 0, ...(o.fill ? { fill: color(o.fill) } : {}),
              ...(o.stroke ? { stroke: INK, strokeWidth: o.stroke } : {}) });
            break;
          case "check": {
            const { x, y, size: s } = o;
            if (o.corners) {
              // a wound box: just its corners, as on the sheet
              const c = s * 0.28;
              for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + s, y, -1, 1], [x, y + s, 1, -1], [x + s, y + s, -1, -1]]) {
                svg(page, `M${cx + dx * c},${cy} L${cx},${cy} L${cx},${cy + dy * c}`, { x: 0, y: 0, stroke: INK, strokeWidth: 0.6 });
              }
            } else {
              page.drawRectangle({ x, y: height - y - s, width: s, height: s, borderColor: INK, borderWidth: 0.6 });
            }
            if (o.checked) {
              const m = s * 0.18;
              svg(page, `M${x + m},${y + m} L${x + s - m},${y + s - m} M${x + s - m},${y + m} L${x + m},${y + s - m}`,
                { x: 0, y: 0, stroke: INK, strokeWidth: o.corners ? 1.6 : 0.9 });
            }
            break;
          }
          case "icon": {
            const icon = pathsOf(o.name), scale = o.size / icon.h;
            const x = o.x - icon.x * scale, y = o.y - icon.y * scale;
            for (const p of icon.paths) {
              if (p.role === "paper-stroke") svg(page, p.d, { x, y, scale, stroke: PAPER, strokeWidth: p.width * scale });
              else svg(page, p.d, { x, y, scale, fill: p.role === "paper" ? PAPER : INK, evenOdd: p.evenOdd });
            }
            break;
          }
        }
      }
    }
  }

  // The character's sheet as PDF bytes (a Uint8Array).
  async function build(character, L) {
    L ??= await loadPdfLib();
    const doc = await L.PDFDocument.create();
    const fonts = { regular: await doc.embedFont(L.StandardFonts.Helvetica), bold: await doc.embedFont(L.StandardFonts.HelveticaBold) };
    const measure = (text, size, bold) => (bold ? fonts.bold : fonts.regular).widthOfTextAtSize(text, size);
    draw(L, doc, fonts, P.layout(character, { abilities: root.NCD_ABILITIES ?? [], measure }));
    doc.setTitle(`${P.winAnsi(String(character?.handle ?? "").trim() || "Character")}: character sheet`);
    doc.setCreator("Neon City Dashboard");
    return doc.save();
  }

  async function download(character) {
    const bytes = await build(character);
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const link = Object.assign(document.createElement("a"), { href: url, download: P.fileName(character) });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  root.NCD_SHEET_PDF_UI = { build, download };
})(globalThis);
