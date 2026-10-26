// Draws sheet-pdf.js's layout with pdf-lib and saves it as "<handle>.pdf". pdf-lib and its font add-on are only
// fetched the first time a PDF is made; the fonts are ours (fonts/, SIL Open Font License) and only the letters a
// sheet uses are embedded. build() returns the PDF's bytes, so they can be posted somewhere as well as downloaded.
// Settings' "Character sheet is PUNK" (store key sheetPunk) adds the heavy background art.
(function (root) {
  const P = root.NCD_SHEET_PDF;
  const SCRIPTS = {
    PDFLib: { src: "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
      integrity: "sha512-z8IYLHO8bTgFqj+yrPyIJnzBDf7DDhWwiEsk4sY+Oe6J2M+WQequeGS7qioI5vT6rXgVRb4K1UVQC5ER7MKzKQ==" },
    fontkit: { src: "https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js",
      integrity: "sha512-nN5LMjOUxjpCutlx3vCE453XaDaDYhjwM+0uYxHMo7wVW9SLhLi6kspqdcuWGrLYHkENUwtkiNeSlVflBQAQGQ==" },
  };
  // The layout's font roles: Chakra Petch for headings, labels and skill names; Barlow Semi Condensed to read.
  const FONT_FILES = { display: "fonts/ChakraPetch-Bold.ttf", label: "fonts/ChakraPetch-SemiBold.ttf",
    body: "fonts/BarlowSemiCondensed-Regular.ttf", strong: "fonts/BarlowSemiCondensed-SemiBold.ttf" };
  // The layout's colour roles, as greys: it all prints in black and white.
  const GREYS = { ink: 0.11, muted: 0.42, faint: 0.7, wash: 0.9, paper: 1 };

  const loading = {};
  function loadScript(name) {
    if (root[name]) return Promise.resolve(root[name]);
    loading[name] ??= new Promise((resolve, reject) => {
      const script = Object.assign(document.createElement("script"), { ...SCRIPTS[name], crossOrigin: "anonymous" });
      script.onload = () => resolve(root[name]);
      script.onerror = () => { delete loading[name]; script.remove(); reject(new Error("Couldn't load the PDF library.")); };
      document.head.append(script);
    });
    return loading[name];
  }
  let fontBytes = null;
  async function loadFonts() {
    fontBytes ??= Promise.all(Object.entries(FONT_FILES).map(async ([role, file]) => {
      const res = await fetch(file);
      if (!res.ok) throw new Error(`Couldn't load ${file}.`);
      return [role, await res.arrayBuffer()];
    })).then(Object.fromEntries).catch((err) => { fontBytes = null; throw err; });
    return fontBytes;
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
    const color = (role = "ink") => L.grayscale(GREYS[role] ?? GREYS.ink);
    // An SVG path whose (0, 0) is at the top-left point (x, y), scaled; even-odd paths get the even-odd fill.
    const svg = (page, d, { x = 0, y = 0, scale = 1, fill, stroke, strokeWidth, evenOdd }) => {
      const ops = L.drawSvgPath(d, { x, y: height - y, scale, color: fill, borderColor: stroke, borderWidth: strokeWidth });
      page.pushOperators(...(evenOdd ? ops.map((o) => (o.toString() === "f" ? L.PDFOperator.of(L.PDFOperatorNames.FillEvenOdd) : o)) : ops));
    };
    const polyline = (points, closed) => `M${points.map(([x, y]) => `${x},${y}`).join(" L")}${closed ? " Z" : ""}`;

    for (const ops of pages) {
      const page = doc.addPage([width, height]);
      for (const o of ops) {
        switch (o.kind) {
          case "text": {
            const font = fonts[o.font] ?? fonts.body;
            let size = o.size;
            while (o.fitWidth && size > 4.5 && font.widthOfTextAtSize(o.text, size) > o.fitWidth) size -= 0.25;
            const w = font.widthOfTextAtSize(o.text, size);
            const x = o.align === "right" ? o.x - w : o.align === "center" ? o.x - w / 2 : o.x;
            page.drawText(o.text, { x, y: height - o.y, size, font, color: color(o.color) });
            break;
          }
          case "line":
            page.drawLine({ start: { x: o.x1, y: height - o.y1 }, end: { x: o.x2, y: height - o.y2 }, thickness: o.stroke, color: color(o.color) });
            break;
          case "rect":
            page.drawRectangle({ x: o.x, y: height - o.y - o.h, width: o.w, height: o.h,
              ...(o.fill ? { color: color(o.fill) } : {}), ...(o.stroke ? { borderColor: color(o.strokeColor), borderWidth: o.stroke } : {}) });
            break;
          case "circle":
            page.drawCircle({ x: o.x, y: height - o.y, size: o.r, ...(o.fill ? { color: color(o.fill) } : {}),
              ...(o.stroke ? { borderColor: color(o.strokeColor), borderWidth: o.stroke } : {}) });
            break;
          case "path":
            svg(page, polyline(o.points, o.closed), { ...(o.fill ? { fill: color(o.fill) } : {}),
              ...(o.stroke ? { stroke: color(o.strokeColor), strokeWidth: o.stroke } : {}) });
            break;
          case "check": {
            const { x, y, size: s } = o;
            if (o.corners) {
              // a wound box: just its corners
              const c = s * 0.3;
              for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + s, y, -1, 1], [x, y + s, 1, -1], [x + s, y + s, -1, -1]]) {
                svg(page, `M${cx + dx * c},${cy} L${cx},${cy} L${cx},${cy + dy * c}`, { stroke: color(), strokeWidth: 1 });
              }
            } else {
              page.drawRectangle({ x, y: height - y - s, width: s, height: s, color: color("paper"), borderColor: color(), borderWidth: 0.7 });
            }
            if (o.checked) {
              const m = s * 0.2;
              svg(page, `M${x + m},${y + m} L${x + s - m},${y + s - m} M${x + s - m},${y + m} L${x + m},${y + s - m}`,
                { stroke: color(), strokeWidth: o.corners ? 2 : 1 });
            }
            break;
          }
          case "icon": {
            const icon = pathsOf(o.name), scale = o.size / icon.h;
            const x = o.x - icon.x * scale, y = o.y - icon.y * scale;
            for (const p of icon.paths) {
              if (p.role === "paper-stroke") svg(page, p.d, { x, y, scale, stroke: color("paper"), strokeWidth: p.width * scale });
              else svg(page, p.d, { x, y, scale, fill: color(p.role === "paper" ? "paper" : "ink"), evenOdd: p.evenOdd });
            }
            break;
          }
        }
      }
    }
  }

  // The character's sheet as PDF bytes (a Uint8Array). Node tooling can pass pdf-lib, fontkit and the font files in.
  async function build(character, { L, fontkit, files, punk = root.NCD_STORE?.get("sheetPunk") === "1" } = {}) {
    [L, fontkit, files] = await Promise.all([L ?? loadScript("PDFLib"), fontkit ?? loadScript("fontkit"), files ?? loadFonts()]);
    const doc = await L.PDFDocument.create();
    doc.registerFontkit(fontkit);
    const fonts = {};
    for (const [role, bytes] of Object.entries(files)) fonts[role] = await doc.embedFont(bytes, { subset: true });
    const measure = (text, size, role) => (fonts[role] ?? fonts.body).widthOfTextAtSize(text, size);
    draw(L, doc, fonts, P.layout(character, { abilities: root.NCD_ABILITIES ?? [], measure, punk }));
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

  root.NCD_SHEET_PDF_UI = { FONT_FILES, build, download };
})(globalThis);
