import fs from "node:fs";
import path from "node:path";

const fixturePages = [
  {
    title: "Reeda Reading Experience - System Design",
    paragraphs: [
      "Welcome to the Reeda reading environment. This document is a test fixture designed to verify page rendering, typography, text selection, and in-document search.",
      "Reeda focuses on deep work with text documents and research papers. It provides an uncluttered interface without visual noise, floating cards, or excessive decorative elements.",
      "The reading surface supports continuous scrolling, high-DPI canvas rendering, and selectable text layers for copying citations directly into your notes workspace.",
    ],
  },
  {
    title: "In-Document Text Search and Match Navigation",
    paragraphs: [
      "The search subsystem scans every page in the loaded document and highlights exact word matches on the active text layer.",
      "Use Ctrl+F (or Cmd+F on macOS) to open the search bar. You can navigate between occurrences with the next and previous match buttons or with Enter and Shift+Enter.",
      "Try searching for terms such as 'workspace', 'typography', 'rendering', or 'notes' to test live text layer highlighting across multiple pages.",
    ],
  },
  {
    title: "Side-by-Side Notes Workspace and Divider",
    paragraphs: [
      "The notes workspace allows readers to write, synthesize ideas, and format findings while keeping the source PDF immediately in view.",
      "The horizontal divider between the PDF and the notes panes can be grabbed and dragged continuously to adjust pane proportions to your reading or writing preference.",
      "You can also select any sentence from the PDF and click the floating Add to notes button to insert the excerpt directly into your notes editor.",
    ],
  },
];

function createPdf(pages) {
  let objCount = 0;
  const objects = [];

  function addObject(content) {
    objCount++;
    objects.push({ id: objCount, content });
    return objCount;
  }

  // Font object (Helvetica)
  const fontObj = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
  const fontBoldObj = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);
  const pagesObj = addObject("");

  const pageObjIds = [];

  // Create content streams and page objects for each page
  pages.forEach((p, idx) => {
    let stream = "";
    stream += "BT\n";
    // Title
    stream += `/F2 18 Tf\n`;
    stream += `50 750 Td\n`;
    stream += `(${escapePdf(p.title)}) Tj\n`;
    stream += `ET\n`;

    // Subtitle / Page marker
    stream += `BT\n`;
    stream += `/F1 10 Tf\n`;
    stream += `50 725 Td\n`;
    stream += `(Page ${idx + 1} of ${pages.length} - Reeda Test Fixture) Tj\n`;
    stream += `ET\n`;

    // Paragraphs
    let yPos = 680;
    p.paragraphs.forEach((para) => {
      stream += `BT\n`;
      stream += `/F1 12 Tf\n`;
      stream += `50 ${yPos} Td\n`;
      stream += `16 TL\n`; // leading
      // Wrap words into lines approx 75 chars
      const lines = wrapText(para, 70);
      lines.forEach((line, lineIdx) => {
        if (lineIdx === 0) {
          stream += `(${escapePdf(line)}) Tj\n`;
        } else {
          stream += `T*\n(${escapePdf(line)}) Tj\n`;
        }
      });
      stream += `ET\n`;
      yPos -= lines.length * 16 + 24;
    });

    const streamLen = Buffer.byteLength(stream, "utf8");
    const streamObj = addObject(`<< /Length ${streamLen} >>\nstream\n${stream}\nendstream`);

    const pageObj = addObject(`<<
  /Type /Page
  /Parent 3 0 R
  /MediaBox [0 0 595.28 841.89]
  /Contents ${streamObj} 0 R
  /Resources <<
    /Font <<
      /F1 ${fontObj} 0 R
      /F2 ${fontBoldObj} 0 R
    >>
  >>
>>`);
    pageObjIds.push(pageObj);
  });

  // Pages was reserved before page objects so every /Parent reference is stable.
  const pagesObjContent = `<<
  /Type /Pages
  /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}]
  /Count ${pages.length}
>>`;
  objects[pagesObj - 1].content = pagesObjContent;

  // Catalog object
  const catalogObj = addObject(`<<
  /Type /Catalog
  /Pages 3 0 R
>>`);

  // Build the PDF string and xref
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [];

  objects.forEach((obj) => {
    offsets[obj.id] = Buffer.byteLength(pdf, "utf8");
    pdf += `${obj.id} 0 obj\n${obj.content}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    const offset = String(offsets[i]).padStart(10, "0");
    pdf += `${offset} 00000 n \n`;
  }

  pdf += `trailer\n<<\n  /Size ${objects.length + 1}\n  /Root ${catalogObj} 0 R\n>>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "utf8");
}

function escapePdf(str) {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length <= maxChars) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const samplePath = path.resolve("public/sample-document.pdf");
const sampleBuffer = createPdf(fixturePages);
fs.writeFileSync(samplePath, sampleBuffer);

const longPages = Array.from({ length: 24 }, (_, index) => ({
  title: `Long-form selection fixture — section ${index + 1}`,
  paragraphs: [
    "This dense, multi-page fixture is intentionally ordinary prose. It exercises selections across several visual lines, varying widths, page boundaries, and repeated text fragments without relying on a single bounding box.",
    "Readers may zoom, resize the reading pane, move between pages, and return later. An annotation must therefore keep page-relative geometry rather than coordinates from one particular browser viewport.",
    "The quick brown fox jumps over the lazy dog while a longer research sentence continues through a line wrap to make underlines, highlights, and strikethrough annotations easy to inspect.",
  ],
}));
const longPath = path.resolve("public/long-selection-fixture.pdf");
const longBuffer = createPdf(longPages);
fs.writeFileSync(longPath, longBuffer);
console.log(`Generated ${samplePath} and ${longPath}`);
