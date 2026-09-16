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

import { marked } from "marked";

export interface NotesExportOptions {
  markdown: string;
  sourceTitle?: string | undefined;
  author?: string | undefined;
  totalPages?: number | undefined;
  readingDate?: string | undefined;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9_\-\.\s]/gi, "_").trim() || "Notes";
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export notes as a self-contained, cleanly formatted HTML file with metadata header.
 */
export function exportNotesToHtml(options: NotesExportOptions): void {
  const { markdown, sourceTitle, author, totalPages, readingDate } = options;
  const title = sourceTitle || "Document Notes";
  const date = readingDate || new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const authorStr = author ? author : "Unknown Author";
  const pagesStr = totalPages ? `${totalPages} pages` : "";

  const htmlBody = marked.parse(markdown || "*No notes content recorded yet.*");

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Notes</title>
  <style>
    :root {
      --bg: #ffffff;
      --fg: #18181b;
      --muted: #71717a;
      --border: #e4e4e7;
      --accent: #f4f4f5;
      --code-bg: #fafafa;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #09090b;
        --fg: #f4f4f5;
        --muted: #a1a1aa;
        --border: #27272a;
        --accent: #18181b;
        --code-bg: #121215;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg);
      color: var(--fg);
      max-width: 760px;
      margin: 0 auto;
      padding: 40px 24px;
      line-height: 1.6;
    }
    .header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
      margin-bottom: 32px;
    }
    .header h1 {
      font-size: 1.75rem;
      font-weight: 600;
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    .meta {
      font-size: 0.85rem;
      color: var(--muted);
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
    .content {
      font-size: 0.95rem;
    }
    .content h1 { font-size: 1.5rem; margin-top: 2rem; }
    .content h2 { font-size: 1.25rem; margin-top: 1.75rem; border-bottom: 1px solid var(--border); padding-bottom: 4px; }
    .content h3 { font-size: 1.1rem; margin-top: 1.5rem; }
    .content blockquote {
      border-left: 3px solid var(--border);
      margin: 1.25rem 0;
      padding-left: 1rem;
      color: var(--muted);
      font-style: italic;
    }
    .content pre {
      background-color: var(--code-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      overflow-x: auto;
      font-size: 0.875rem;
    }
    .content code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875em;
    }
    .content ul, .content ol { padding-left: 1.5rem; }
    .content li { margin-bottom: 0.35rem; }
    @media print {
      body { max-width: 100%; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="meta">
      <span><strong>Author:</strong> ${authorStr}</span>
      <span><strong>Date:</strong> ${date}</span>
      ${pagesStr ? `<span><strong>Length:</strong> ${pagesStr}</span>` : ""}
    </div>
  </div>
  <div class="content">
    ${htmlBody}
  </div>
</body>
</html>`;

  const fileName = `${sanitizeFileName(title)}_Notes.html`;
  downloadFile(fullHtml, fileName, "text/html;charset=utf-8");
}

/**
 * Export notes as a plain Markdown (.md) file with clean YAML frontmatter.
 */
export function exportNotesToMarkdown(options: NotesExportOptions): void {
  const { markdown, sourceTitle, author, totalPages, readingDate } = options;
  const title = sourceTitle || "Document Notes";
  const date = readingDate || new Date().toISOString().split("T")[0];
  const authorStr = author ? author : "Unknown Author";

  const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
author: "${authorStr.replace(/"/g, '\\"')}"
date: ${date}
${totalPages ? `page_count: ${totalPages}\n` : ""}---

`;

  const fullContent = frontmatter + (markdown || "");
  const fileName = `${sanitizeFileName(title)}_Notes.md`;
  downloadFile(fullContent, fileName, "text/markdown;charset=utf-8");
}
