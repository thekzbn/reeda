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
      const style = bold && run.italic ? "bolditalic" : bold ? "bold" : run.italic ? "italic" : "normal";
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

function renderTokens(layout: Layout, tokens: Token[], indent = 0) {
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
        break;
      }
      case "paragraph": {
        const paragraph = token as Tokens.Paragraph;
        layout.writeRuns(inlineRuns(paragraph.tokens), { indent });
        layout.space(7);
        break;
      }
      case "blockquote": {
        const quote = token as Tokens.Blockquote;
        const startY = layout.y;
        const startPage = layout.doc.getCurrentPageInfo().pageNumber;
        renderTokens(layout, quote.tokens, indent + 18);
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
            firstLinePrefix: prefix || undefined,
          });
          const nested = item.tokens.filter((t) => t.type === "list");
          if (nested.length > 0) renderTokens(layout, nested, itemIndent);
          layout.space(2);
          counter += 1;
        }
        layout.space(6);
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
        break;
      }
      case "hr":
        layout.rule();
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
        break;
      }
      case "html":
        break;
      default: {
        const generic = token as Tokens.Generic & { text?: string; tokens?: Token[] };
        if (generic.tokens) renderTokens(layout, generic.tokens, indent);
        else if (typeof generic.text === "string" && generic.text.trim() !== "") {
          layout.writeRuns(plainRuns(generic.text), { indent });
          layout.space(6);
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
  renderTokens(layout, tokens);

  if (includeSource && sourceTitle) {
    layout.space(10);
    layout.ensure(30);
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
