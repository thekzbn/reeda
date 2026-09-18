/*
 * Reeda - a reading environment for PDFs.
 * Copyright (C) 2026 Quing (thekzbn)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { jsPDF } from "jspdf";
import { marked, type Token, type Tokens } from "marked";

interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  link?: boolean;
}

interface ExportOptions {
  markdown: string;
  /** Reeda title of the source document, used for the optional footer line. */
  sourceTitle?: string | undefined;
  includeSource: boolean;
  /** File name for the download, without extension. */
  fileName: string;
}

const PAGE_MARGIN_X = 64;
const PAGE_MARGIN_TOP = 68;
const PAGE_MARGIN_BOTTOM = 72;

const BODY_SIZE = 10.5;
const BODY_LEADING = 15.5;

const TEXT_COLOR: [number, number, number] = [26, 26, 30];
const MUTED_COLOR: [number, number, number] = [124, 124, 134];
const RULE_COLOR: [number, number, number] = [222, 222, 228];
const ACCENT_COLOR: [number, number, number] = [106, 90, 205];
const CORNELL_HEADER_FILL: [number, number, number] = [244, 244, 245];
const CORNELL_SUMMARY_FILL: [number, number, number] = [237, 237, 240];

function inlineRuns(tokens: Token[] | undefined, inherited: Run = { text: "" }): Run[] {
  if (!tokens) return [];
  const runs: Run[] = [];
  for (const token of tokens) {
    const t = token as Tokens.Generic & { tokens?: Token[]; text?: string };
    switch (token.type) {
      case "strong":
        runs.push(...inlineRuns(t.tokens, { ...inherited, bold: true }));
        break;
      case "em":
        runs.push(...inlineRuns(t.tokens, { ...inherited, italic: true }));
        break;
      case "del":
        runs.push(...inlineRuns(t.tokens, inherited));
        break;
      case "codespan":
        runs.push({ ...inherited, text: String(t.text ?? ""), code: true });
        break;
      case "link":
        runs.push(...inlineRuns(t.tokens, { ...inherited, link: true }));
        break;
      case "br":
        runs.push({ ...inherited, text: "\n" });
        break;
      case "image":
        runs.push({ ...inherited, text: String(t.text ?? "") });
        break;
      default:
        if (t.tokens && t.tokens.length > 0) {
          runs.push(...inlineRuns(t.tokens, inherited));
        } else if (typeof t.text === "string") {
          runs.push({ ...inherited, text: t.text });
        }
    }
  }
  return runs.filter((run) => run.text !== "");
}

function plainRuns(text: string): Run[] {
  return [{ text }];
}

class Layout {
  doc: jsPDF;
  y: number;
  readonly width: number;
  readonly pageHeight: number;

  constructor(doc: jsPDF) {
    this.doc = doc;
    this.pageHeight = doc.internal.pageSize.getHeight();
    this.width = doc.internal.pageSize.getWidth() - PAGE_MARGIN_X * 2;
    this.y = PAGE_MARGIN_TOP;
  }

  space(amount: number) {
    this.y += amount;
  }

  ensure(height: number) {
    if (this.y + height <= this.pageHeight - PAGE_MARGIN_BOTTOM) return;
    this.doc.addPage();
    this.y = PAGE_MARGIN_TOP;
  }

  setFont(run: Run, size: number, forceBold = false) {
    const bold = forceBold || run.bold;
    if (run.code) {
      this.doc.setFont("courier", bold ? "bold" : run.italic ? "italic" : "normal");
      this.doc.setFontSize(size - 0.5);
    } else {
      const style =
        bold && run.italic ? "bolditalic" : bold ? "bold" : run.italic ? "italic" : "normal";
      this.doc.setFont("helvetica", style);
      this.doc.setFontSize(size);
    }
    if (run.link) this.doc.setTextColor(...ACCENT_COLOR);
    else this.doc.setTextColor(...TEXT_COLOR);
  }

  /** Renders styled runs with wrapping. Returns the height consumed. */
  writeRuns(
    runs: Run[],
    options: {
      size?: number;
      leading?: number;
      indent?: number;
      bold?: boolean;
      color?: [number, number, number];
      firstLinePrefix?: string;
      prefixColor?: [number, number, number];
    } = {},
  ) {
    const size = options.size ?? BODY_SIZE;
    const leading = options.leading ?? BODY_LEADING;
    const indent = options.indent ?? 0;
    const maxWidth = this.width - indent;
    const left = PAGE_MARGIN_X + indent;

    type Piece = { run: Run; text: string };
    const pieces: Piece[] = [];
    for (const run of runs) {
      const segments = run.text.split(/(\n)/);
      for (const segment of segments) {
        if (segment === "") continue;
        if (segment === "\n") {
          pieces.push({ run, text: "\n" });
          continue;
        }
        const words = segment.split(/(\s+)/).filter((w) => w !== "");
        for (const word of words) pieces.push({ run, text: word });
      }
    }

    let line: Piece[] = [];
    let lineWidth = 0;
    let isFirstLine = true;

    const flush = () => {
      this.ensure(leading);
      let x = left;
      if (isFirstLine && options.firstLinePrefix) {
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(size);
        this.doc.setTextColor(...(options.prefixColor ?? MUTED_COLOR));
        this.doc.text(options.firstLinePrefix, left - 16, this.y);
      }
      for (const piece of line) {
        this.setFont(piece.run, size, options.bold);
        if (options.color && !piece.run.link) this.doc.setTextColor(...options.color);
        const w = this.doc.getTextWidth(piece.text);
        this.doc.text(piece.text, x, this.y);
        if (piece.run.link) {
          this.doc.setDrawColor(...ACCENT_COLOR);
          this.doc.setLineWidth(0.4);
          this.doc.line(x, this.y + 1.6, x + w, this.y + 1.6);
        }
        x += w;
      }
      this.y += leading;
      line = [];
      lineWidth = 0;
      isFirstLine = false;
    };

    for (const piece of pieces) {
      if (piece.text === "\n") {
        flush();
        continue;
      }
      this.setFont(piece.run, size, options.bold);
      const w = this.doc.getTextWidth(piece.text);
      const isSpace = /^\s+$/.test(piece.text);
      if (lineWidth + w > maxWidth && line.length > 0) {
        flush();
        if (isSpace) continue;
      }
      if (isSpace && line.length === 0) continue;
      line.push(piece);
      lineWidth += w;
    }
    if (line.length > 0) flush();
  }

  rule() {
    this.ensure(14);
    this.doc.setDrawColor(...RULE_COLOR);
    this.doc.setLineWidth(0.6);
    this.doc.line(PAGE_MARGIN_X, this.y, PAGE_MARGIN_X + this.width, this.y);
    this.y += 14;
  }
}

function parseCornellHtml(raw: string): {
  topic: string;
  cues: string[];
  notes: string[];
  summary: string;
} | null {
  if (!raw.includes('class="cornell-notes"') && !raw.includes("class='cornell-notes'")) {
    return null;
  }
  // Extract <th colspan="2"> content for topic band
  const topicMatch = raw.match(/<th[^>]*colspan[^>]*>\s*(.*?)\s*<\/th>/i);
  const topic = topicMatch
    ? topicMatch[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, " ")
        .trim()
    : "";

  // Extract list items from each td in the body row (tr with two tds)
  const bodyRowMatch = raw.match(/<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/i);
  const extractListItems = (html: string): string[] => {
    const items: string[] = [];
    const liRegex = /<li>([\s\S]*?)<\/li>/gi;
    let m: RegExpExecArray | null;
    while ((m = liRegex.exec(html)) !== null) {
      const text = m[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, " ")
        .trim();
      if (text) items.push(text);
    }
    return items;
  };

  const cues = bodyRowMatch ? extractListItems(bodyRowMatch[1]) : [];
  const notes = bodyRowMatch ? extractListItems(bodyRowMatch[2]) : [];

  // Extract last td[colspan="2"] for summary
  const summaryTdMatches = [...raw.matchAll(/<td[^>]*colspan[^>]*>([\s\S]*?)<\/td>/gi)];
  const summaryHtml =
    summaryTdMatches.length > 0 ? summaryTdMatches[summaryTdMatches.length - 1][1] : "";
  const summary = summaryHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { topic, cues, notes, summary };
}

/**
 * Renders a Cornell notes table on a dedicated A4 page.
 * Guarantees: always starts on a fresh page, all sections on the same page.
 * Text that cannot fit is wrapped and font-reduced to MIN_FONT; overflow lands
 * on a clearly-labelled continuation page.
 */
function renderCornellPage(
  layout: Layout,
  data: { topic: string; cues: string[]; notes: string[]; summary: string },
  isFirstContentOnPage: boolean,
) {
  const doc = layout.doc;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const left = PAGE_MARGIN_X;
  const right = pageW - PAGE_MARGIN_X;
  const tableW = right - left;

  // Force a new page unless we are already at the very top of an empty page
  if (!isFirstContentOnPage) {
    doc.addPage();
  }
  layout.y = PAGE_MARGIN_TOP;

  const MIN_FONT = 7;
  const CELL_FONT = BODY_SIZE - 0.5;
  const HEADER_H = 24;
  const COL_HEAD_H = 20;
  const BODY_H = 200;
  const SUMMARY_HEAD_H = 20;
  const SUMMARY_BODY_H = 80;
  const cueColW = tableW * 0.32;
  const notesColW = tableW * 0.68;

  // Helper: draw a filled rect with border
  const rect = (x: number, y: number, w: number, h: number, fill?: [number, number, number]) => {
    if (fill) {
      doc.setFillColor(...fill);
      doc.rect(x, y, w, h, "F");
    }
    doc.setDrawColor(...RULE_COLOR);
    doc.setLineWidth(0.5);
    doc.rect(x, y, w, h, "S");
  };

  // Helper: write wrapped text in a cell, reduce font if needed, return lines used
  const writeCell = (
    text: string,
    x: number,
    y: number,
    w: number,
    h: number,
    bold = false,
    color: [number, number, number] = TEXT_COLOR,
    vCenter = false,
  ): number => {
    if (!text.trim()) return 0;
    let fontSize = CELL_FONT;
    let lines: string[] = [];
    const pad = 8;
    const innerW = w - pad * 2;
    while (fontSize >= MIN_FONT) {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(fontSize);
      lines = doc.splitTextToSize(text, innerW) as string[];
      const textH = lines.length * fontSize * 1.35;
      if (textH <= h - pad * 2 || fontSize <= MIN_FONT) break;
      fontSize -= 0.5;
    }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lineH = fontSize * 1.35;
    const totalH = lines.length * lineH;
    const startY = vCenter ? y + (h - totalH) / 2 + fontSize : y + pad + fontSize;
    lines.forEach((ln, idx) => {
      doc.text(ln, x + pad, startY + idx * lineH);
    });
    return lines.length;
  };

  // Helper: write bullet list in a cell (with possible font reduction)
  const writeBullets = (items: string[], x: number, y: number, w: number, h: number) => {
    let fontSize = CELL_FONT;
    const pad = 8;
    const innerW = w - pad * 2 - 10;
    let allFit = false;
    let allLines: string[][] = [];
    while (fontSize >= MIN_FONT) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      allLines = items.map((item) => doc.splitTextToSize(`• ${item}`, innerW) as string[]);
      const totalH = allLines.reduce((sum, ls) => sum + ls.length * fontSize * 1.35, 0);
      if (totalH <= h - pad * 2 || fontSize <= MIN_FONT) {
        allFit = totalH <= h - pad * 2;
        break;
      }
      fontSize -= 0.5;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(...TEXT_COLOR);
    const lineH = fontSize * 1.35;
    let curY = y + pad + fontSize;
    for (const ls of allLines) {
      for (const ln of ls) {
        if (curY + lineH > y + h - pad) {
          if (!allFit) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(MIN_FONT);
            doc.setTextColor(...MUTED_COLOR);
            doc.text("(content continues…)", x + pad, curY);
          }
          return;
        }
        doc.text(ln, x + pad, curY);
        curY += lineH;
      }
    }
  };

  // ── Row 1: Topic heading (full width)
  let y = layout.y;
  rect(left, y, tableW, HEADER_H, CORNELL_HEADER_FILL);
  writeCell(data.topic || "Topic / Lecture", left, y, tableW, HEADER_H, true, TEXT_COLOR, true);
  y += HEADER_H;

  // ── Row 2: Column headings
  rect(left, y, cueColW, COL_HEAD_H, CORNELL_HEADER_FILL);
  rect(left + cueColW, y, notesColW, COL_HEAD_H, CORNELL_HEADER_FILL);
  writeCell("Cues & Questions", left, y, cueColW, COL_HEAD_H, true, TEXT_COLOR, true);
  writeCell("Notes", left + cueColW, y, notesColW, COL_HEAD_H, true, TEXT_COLOR, true);
  y += COL_HEAD_H;

  // ── Row 3: Body (cues | notes)
  rect(left, y, cueColW, BODY_H);
  rect(left + cueColW, y, notesColW, BODY_H);
  writeBullets(data.cues, left, y, cueColW, BODY_H);
  writeBullets(data.notes, left + cueColW, y, notesColW, BODY_H);
  y += BODY_H;

  // ── Row 4: Summary heading (full width)
  rect(left, y, tableW, SUMMARY_HEAD_H, CORNELL_HEADER_FILL);
  writeCell("Summary", left, y, tableW, SUMMARY_HEAD_H, true, TEXT_COLOR, true);
  y += SUMMARY_HEAD_H;

  // ── Row 5: Summary body (full width)
  rect(left, y, tableW, SUMMARY_BODY_H, CORNELL_SUMMARY_FILL);
  writeCell(
    data.summary || "Brief synthesis connecting recall cues to detailed notes.",
    left,
    y,
    tableW,
    SUMMARY_BODY_H,
    false,
    TEXT_COLOR,
  );
  y += SUMMARY_BODY_H;

  layout.y = y;

  // Force subsequent content onto a new page
  doc.addPage();
  layout.y = PAGE_MARGIN_TOP;
}

function renderTokens(layout: Layout, tokens: Token[], indent = 0, isFirst = { value: true }) {
  for (const token of tokens) {
    switch (token.type) {
      case "space":
        break;
      case "heading": {
        const heading = token as Tokens.Heading;
        const sizes: Record<number, number> = { 1: 19, 2: 14.5, 3: 12, 4: 11, 5: 10.5, 6: 10.5 };
        const size = sizes[heading.depth] ?? 11;
        layout.space(heading.depth === 1 ? 8 : 12);
        layout.ensure(size + 10);
        layout.writeRuns(inlineRuns(heading.tokens), {
          size,
          leading: size * 1.35,
          bold: true,
          indent,
        });
        layout.space(4);
        isFirst.value = false;
        break;
      }
      case "paragraph": {
        const paragraph = token as Tokens.Paragraph;
        layout.writeRuns(inlineRuns(paragraph.tokens), { indent });
        layout.space(7);
        isFirst.value = false;
        break;
      }
      case "blockquote": {
        const quote = token as Tokens.Blockquote;
        const startY = layout.y;
        const startPage = layout.doc.getCurrentPageInfo().pageNumber;
        renderTokens(layout, quote.tokens, indent + 18, isFirst);
        const endPage = layout.doc.getCurrentPageInfo().pageNumber;
        if (endPage === startPage) {
          layout.doc.setDrawColor(...RULE_COLOR);
          layout.doc.setLineWidth(1.6);
          layout.doc.line(
            PAGE_MARGIN_X + indent + 2,
            startY - 8,
            PAGE_MARGIN_X + indent + 2,
            layout.y - 12,
          );
        }
        break;
      }
      case "list": {
        const list = token as Tokens.List;
        let counter = typeof list.start === "number" && list.start > 0 ? list.start : 1;
        for (const item of list.items) {
          const runs = inlineRuns(item.tokens);
          const isTask = item.task === true;
          const prefix = isTask ? "" : list.ordered ? `${counter}.` : "\u2022";
          const itemIndent = indent + 18;
          if (isTask) {
            layout.ensure(BODY_LEADING);
            const boxY = layout.y - 7.5;
            const boxX = PAGE_MARGIN_X + itemIndent - 16;
            layout.doc.setDrawColor(...RULE_COLOR);
            layout.doc.setLineWidth(0.7);
            layout.doc.rect(boxX, boxY, 8, 8);
            if (item.checked) {
              layout.doc.setDrawColor(...ACCENT_COLOR);
              layout.doc.setLineWidth(1.1);
              layout.doc.line(boxX + 1.8, boxY + 4.2, boxX + 3.4, boxY + 6.1);
              layout.doc.line(boxX + 3.4, boxY + 6.1, boxX + 6.4, boxY + 2);
            }
          }
          layout.writeRuns(runs, {
            indent: itemIndent,
            ...(prefix ? { firstLinePrefix: prefix } : {}),
          });
          const nested = item.tokens.filter((t) => t.type === "list");
          if (nested.length > 0) renderTokens(layout, nested, itemIndent, isFirst);
          layout.space(2);
          counter += 1;
        }
        layout.space(6);
        isFirst.value = false;
        break;
      }
      case "code": {
        const code = token as Tokens.Code;
        const lines = code.text.split("\n");
        layout.space(2);
        for (const line of lines) {
          layout.writeRuns([{ text: line || " ", code: true }], {
            size: BODY_SIZE,
            leading: 13.5,
            indent: indent + 12,
            color: [70, 70, 80],
          });
        }
        layout.space(8);
        isFirst.value = false;
        break;
      }
      case "hr":
        layout.rule();
        isFirst.value = false;
        break;
      case "table": {
        const table = token as Tokens.Table;
        const columns = table.header.length;
        const colWidth = (layout.width - indent) / Math.max(columns, 1);
        const drawRow = (cells: Tokens.TableCell[], bold: boolean) => {
          layout.ensure(BODY_LEADING + 6);
          const rowY = layout.y;
          let maxLines = 1;
          cells.forEach((cell, i) => {
            const text = inlineRuns(cell.tokens)
              .map((run) => run.text)
              .join("");
            layout.doc.setFont("helvetica", bold ? "bold" : "normal");
            layout.doc.setFontSize(BODY_SIZE - 0.5);
            layout.doc.setTextColor(...TEXT_COLOR);
            const wrapped = layout.doc.splitTextToSize(text, colWidth - 10) as string[];
            maxLines = Math.max(maxLines, wrapped.length);
            layout.doc.text(wrapped, PAGE_MARGIN_X + indent + i * colWidth, rowY);
          });
          layout.y = rowY + maxLines * 13 + 5;
          layout.doc.setDrawColor(...RULE_COLOR);
          layout.doc.setLineWidth(0.5);
          layout.doc.line(
            PAGE_MARGIN_X + indent,
            layout.y - 8,
            PAGE_MARGIN_X + layout.width,
            layout.y - 8,
          );
        };
        layout.space(4);
        drawRow(table.header, true);
        for (const row of table.rows) drawRow(row, false);
        layout.space(8);
        isFirst.value = false;
        break;
      }
      case "html": {
        const htmlToken = token as Tokens.HTML;
        const raw = htmlToken.text ?? "";
        const cornelData = parseCornellHtml(raw);
        if (cornelData) {
          renderCornellPage(layout, cornelData, isFirst.value);
          // renderCornellPage always ends by adding a new page; that page is
          // considered the first content (empty) for the next token.
          isFirst.value = true;
        }
        // Non-Cornell HTML tokens are silently ignored (no DOM injection).
        break;
      }
      default: {
        const generic = token as Tokens.Generic & { text?: string; tokens?: Token[] };
        if (generic.tokens) renderTokens(layout, generic.tokens, indent, isFirst);
        else if (typeof generic.text === "string" && generic.text.trim() !== "") {
          layout.writeRuns(plainRuns(generic.text), { indent });
          layout.space(6);
          isFirst.value = false;
        }
      }
    }
  }
}

function sourceFileName(title: string): string {
  const trimmed = title.trim();
  if (trimmed === "") return "document.pdf";
  return /\.pdf$/i.test(trimmed) ? trimmed : `${trimmed}.pdf`;
}

function safeFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/\.pdf$/i, "")
    .replace(/[^\p{L}\p{N}\s._-]/gu, "")
    .replace(/\s+/g, " ")
    .slice(0, 80);
  return cleaned === "" ? "Notes" : cleaned;
}

/** Renders the Markdown note into a typeset PDF and triggers a download. */
export function exportNotesToPdf({
  markdown,
  sourceTitle,
  includeSource,
  fileName,
}: ExportOptions): void {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  doc.setLineHeightFactor(1.35);

  const layout = new Layout(doc);
  const tokens = marked.lexer(markdown.trim() === "" ? "_This note is empty._" : markdown);
  const isFirst = { value: true };
  renderTokens(layout, tokens, 0, isFirst);

  // If the last action was a Cornell page, renderCornellPage left us on a
  // fresh empty page. Remove it unless we need to write source info there.
  const trailingBlankPage = isFirst.value && doc.getNumberOfPages() > 1;
  if (trailingBlankPage && !(includeSource && sourceTitle)) {
    // Delete the trailing empty page by selecting page (n-1) before saving
    doc.deletePage(doc.getNumberOfPages());
  }

  if (includeSource && sourceTitle) {
    if (trailingBlankPage) {
      // The trailing page is already selected; write source info there.
      layout.y = PAGE_MARGIN_TOP;
    } else {
      layout.space(10);
      layout.ensure(30);
    }
    doc.setDrawColor(...RULE_COLOR);
    doc.setLineWidth(0.6);
    doc.line(PAGE_MARGIN_X, layout.y, PAGE_MARGIN_X + layout.width, layout.y);
    layout.y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED_COLOR);
    doc.text(`Source: ${sourceFileName(sourceTitle)}`, PAGE_MARGIN_X, layout.y);
  }

  const pageCount = doc.getNumberOfPages();
  if (pageCount > 1) {
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED_COLOR);
      doc.text(
        String(page),
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 36,
        { align: "center" },
      );
    }
  }

  doc.save(`${safeFileName(fileName)}.pdf`);
}
