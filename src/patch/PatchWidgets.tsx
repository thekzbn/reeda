/*
 * Reeda Built-in Plugin Widgets (powered by patch.md)
 * Clean, typographic, distraction-free widgets designed to follow Reeda's essentialist philosophy.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PluginExecutionContext } from './types';

/**
 * 1. Reading Time Estimator Widget
 * Slot: slot_reader_toolbar_actions
 * Shows a quiet, non-distracting reading pace calculation in the reader header.
 */
export interface CitationMetadata {
  title: string;
  author: string;
  year?: string;
  publisher?: string;
}

export function parseOceanOfPdfTitle(rawTitle: string): CitationMetadata {
  let clean = rawTitle.replace(/\.pdf$/i, '').trim();

  // Strip leading OceanofPDF prefixes
  const oceanRegex = /^(?:https?:\/\/)?(?:www\.)?oceanofpdf(?:\.com)?_?/i;
  clean = clean.replace(oceanRegex, '');

  let title = clean;
  let author = '';

  if (clean.includes('_-_')) {
    const parts = clean.split('_-_');
    title = parts[0] || clean;
    author = parts[1] || '';
  } else if (clean.includes(' - ')) {
    const parts = clean.split(' - ');
    title = parts[0] || clean;
    author = parts[1] || '';
  }

  // Replace underscores with spaces
  title = title.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  author = author.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

  // Title Case capitalization
  const capitalizeWords = (str: string) =>
    str
      .toLowerCase()
      .split(' ')
      .map((word, idx) => {
        const lower = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'from', 'by', 'of', 'in', 'with'];
        if (idx > 0 && lower.includes(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');

  return {
    title: capitalizeWords(title) || 'Untitled Document',
    author: author ? capitalizeWords(author) : 'Author, A.',
  };
}

/**
 * 1. Reading Time Estimator Widget
 * Slot: slot_reader_toolbar_actions
 * Shows a quiet, non-distracting reading pace calculation in the reader header (hidden when Notes mode active).
 */
export function ReadingTimeCalculatorWidget({ context }: { context?: PluginExecutionContext }) {
  const isPdfVisible = context?.isPdfVisible ?? true;
  const totalPages = context?.totalPages ?? 1;
  const currentPage = context?.currentPage ?? 1;
  const remainingPages = Math.max(0, totalPages - currentPage);
  const remainingWords = context?.remainingWords;
  const pageWordCounts = context?.pageWordCounts;

  // Hide when PDF is not visible (Notes only mode) or single-page PDF
  if (!isPdfVisible || totalPages <= 1) return null;

  let totalMinutesRemaining: number;
  if (typeof remainingWords === 'number' && remainingWords >= 0) {
    totalMinutesRemaining = remainingWords === 0 ? 0 : Math.max(1, Math.ceil(remainingWords / 250));
  } else if (pageWordCounts && pageWordCounts.length > 0) {
    const wordsLeft = pageWordCounts.slice(currentPage - 1).reduce((a, b) => a + b, 0);
    totalMinutesRemaining = wordsLeft === 0 ? 0 : Math.max(1, Math.ceil(wordsLeft / 250));
  } else {
    // Fallback: standard 250 words/min based on 300 words per page
    const wordsPerPage = 300;
    totalMinutesRemaining = remainingPages === 0 ? 0 : Math.max(1, Math.ceil((remainingPages * wordsPerPage) / 250));
  }

  return (
    <span
      className="hidden text-xs text-muted-foreground/80 lg:inline select-none"
      title={`Estimated reading time based on word density (${remainingPages} pages remaining)`}
    >
      {remainingPages === 0 || totalMinutesRemaining === 0 ? 'Completed' : `~${totalMinutesRemaining} min left`}
    </span>
  );
}

/**
 * 2. Academic Citation Formatter Widget
 * Slot: slot_notes_pane_header_actions
 * Formats standardized citations (APA, BibTeX, Chicago, MLA) with ISBN API lookup and OceanofPDF title/author parsing backup.
 */
export function CitationFormatterWidget({ context }: { context?: PluginExecutionContext }) {
  const rawTitle = context?.documentTitle?.trim() || 'Untitled Document';
  const page = context?.currentPage || 1;
  const currentYear = new Date().getFullYear();

  // 1. API Metadata from scanned ISBN (if available)
  const apiMeta = context?.extractedMetadata;
  // 2. OceanofPDF Sanitized Title & Author fallback
  const oceanMeta = parseOceanOfPdfTitle(rawTitle);

  const finalTitle = apiMeta?.title?.trim() || oceanMeta.title;
  const finalAuthor = apiMeta?.author?.trim() || oceanMeta.author;
  const finalYear = apiMeta?.year?.trim() || context?.copyrightYear || String(currentYear);
  const finalPublisher = apiMeta?.publisher?.trim() || '';

  const handleInsert = (format: 'apa' | 'bibtex' | 'chicago' | 'mla') => {
    let citationText = '';
    const pubSuffix = finalPublisher ? ` ${finalPublisher}.` : '';
    const pubBib = finalPublisher ? `\n  publisher = {${finalPublisher}},` : '';

    switch (format) {
      case 'apa':
        citationText = `\n\n> **Citation (APA):** ${finalAuthor} (${finalYear}). *${finalTitle}* (p. ${page}).${pubSuffix}\n`;
        break;
      case 'bibtex':
        const citeKey = finalTitle.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) + finalYear;
        citationText = `\n\n\`\`\`bibtex\n@misc{${citeKey},\n  title = {${finalTitle}},\n  author = {${finalAuthor}},\n  year = {${finalYear}},${pubBib}\n  note = {Page ${page}}\n}\n\`\`\`\n`;
        break;
      case 'chicago':
        citationText = `\n\n> **Citation (Chicago):** ${finalAuthor}, *${finalTitle}* (${finalYear}), p. ${page}.\n`;
        break;
      case 'mla':
        citationText = `\n\n> **Citation (MLA):** ${finalAuthor}. *${finalTitle}*, ${finalYear}, p. ${page}.\n`;
        break;
    }

    if (context?.onInsertNote) {
      context.onInsertNote(citationText);
      const isIsbnSource = !!apiMeta?.title;
      const sourceLabel = isIsbnSource ? 'ISBN lookup' : 'OceanofPDF title parser';
      context.onToast?.(`Inserted ${format.toUpperCase()} citation into notes (${sourceLabel})`, 'success');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="squircle h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          title="Insert Citation"
        >
          <span>Cite</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={() => handleInsert('apa')} className="cursor-pointer text-xs">
          APA Format
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleInsert('bibtex')} className="cursor-pointer text-xs">
          BibTeX Block
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleInsert('chicago')} className="cursor-pointer text-xs">
          Chicago Style
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleInsert('mla')} className="cursor-pointer text-xs">
          MLA Format
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * 3. Library Reading Priority Filter Widget
 * Slot: slot_library_header_actions
 * Clean typographic filter pills matching Reeda's minimalist design.
 */
export function LibraryTagsWidget({ context }: { context?: PluginExecutionContext }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(context?.activeTagFilter ?? null);
  const tags = ['All', 'To Read', 'In Progress', 'Synthesized'];

  const handleSelect = (tag: string) => {
    const next = tag === 'All' ? null : tag;
    setSelectedTag(next);
    if (context?.onSelectTagFilter) {
      context.onSelectTagFilter(next);
    }
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1 text-xs">
      {tags.map(tag => {
        const isActive = (tag === 'All' && selectedTag === null) || selectedTag === tag;
        return (
          <button
            key={tag}
            type="button"
            onClick={() => handleSelect(tag)}
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
              isActive
                ? 'bg-secondary font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 4. Publish & Report Widget (Note Templates & Exporter)
 * Slot: slot_notes_pane_header_actions
 * Inserts structured templates (Cornell, Executive Summary, Lit Review, Q&A) and exports notes to HTML, Markdown, or PDF.
 */
export function PublishAndReportWidget({ context }: { context?: PluginExecutionContext }) {
  const docTitle = context?.documentTitle?.trim() || 'Untitled Document';
  const author = context?.extractedMetadata?.author || 'Author';
  const totalPages = context?.totalPages;
  const todayStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

  const handleInsertTemplate = (type: 'cornell' | 'exec' | 'lit' | 'qa') => {
    let templateText = '';
    switch (type) {
      case 'cornell':
        templateText = `\n\n# CORNELL NOTES
**Source:** ${docTitle}  
**Date:** ${todayStr}

---

### 📌 Cues & Questions
*Key concepts, core questions, and prompt vocabulary:*
- **Key Question 1:** What is the primary thesis of this document?
- **Core Concept / Term:** 
- **Key Question 2:** What evidence supports the central claim?

---

### 📝 Main Notes & Outlines
*Detailed notes, supporting evidence, and structural breakdown:*
- **Main Point 1:**
  - Supporting detail / quote from text
  - Analysis and explanation
- **Main Point 2:**
  - Supporting detail / data reference
  - Key takeaways

---

### 💡 Summary & Synthesis
> **Synthesis:**  
> Write a 2–3 sentence summary connecting the cues on the left/above with the main notes into a cohesive conclusion.

`;
        break;
      case 'exec':
        templateText = `\n\n# Executive Summary\n**Document:** ${docTitle}  \n**Date:** ${todayStr}  \n\n## Core Thesis\nInsert the primary argument or goal of this reading.\n\n## Key Findings\n1. First major insight...\n2. Second major insight...\n3. Third major insight...\n\n## Action Items\n- [ ] Follow up on reference...\n- [ ] Synthesize findings into report...\n\n`;
        break;
      case 'lit':
        templateText = `\n\n# Literature Review\n**Title:** ${docTitle}  \n**Author:** ${author}  \n**Review Date:** ${todayStr}  \n\n## 1. Research Question & Purpose\n\n## 2. Methodology & Evidence\n\n## 3. Key Arguments & Findings\n\n## 4. Critical Assessment & Gaps\n- Strengths:\n- Limitations:\n\n## 5. Relevance & Connections\n\n`;
        break;
      case 'qa':
        templateText = `\n\n# Q&A Log: ${docTitle}\n*Reading Date: ${todayStr}*\n\n### Q1: What is the main thesis of this section?\n**A:** \n\n### Q2: What evidence supports this claim?\n**A:** \n\n### Q3: How does this apply to our study?\n**A:** \n\n`;
        break;
    }

    if (context?.onInsertNote) {
      context.onInsertNote(templateText);
      context.onToast?.(`Inserted ${type === 'exec' ? 'Executive Summary' : type === 'lit' ? 'Literature Review' : type === 'qa' ? 'Q&A Log' : 'Cornell Notes'} template`, 'success');
    }
  };

  const handleExportFormat = async (format: 'html' | 'markdown' | 'pdf') => {
    const markdown = context?.getNotesMarkdown ? context.getNotesMarkdown() : context?.notesContent || '';
    if (format === 'html') {
      const { exportNotesToHtml } = await import('@/lib/notes-exporter');
      exportNotesToHtml({
        markdown,
        sourceTitle: docTitle,
        author,
        totalPages,
        readingDate: todayStr,
      });
      context?.onToast?.('Notes exported as formatted HTML', 'success');
    } else if (format === 'markdown') {
      const { exportNotesToMarkdown } = await import('@/lib/notes-exporter');
      exportNotesToMarkdown({
        markdown,
        sourceTitle: docTitle,
        author,
        totalPages,
        readingDate: todayStr,
      });
      context?.onToast?.('Notes exported as Markdown file', 'success');
    } else if (format === 'pdf') {
      const { exportNotesToPdf } = await import('@/lib/notes-pdf');
      exportNotesToPdf({
        markdown,
        sourceTitle: docTitle,
        includeSource: true,
        fileName: `${docTitle} Notes`,
      });
      context?.onToast?.('Notes exported as PDF', 'success');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="squircle h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
          title="Insert Note Template"
        >
          <span>Templates</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleInsertTemplate('cornell')} className="cursor-pointer text-xs">
          Cornell Note-taking
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleInsertTemplate('exec')} className="cursor-pointer text-xs">
          Executive Summary
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleInsertTemplate('lit')} className="cursor-pointer text-xs">
          Literature Review
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleInsertTemplate('qa')} className="cursor-pointer text-xs">
          Q&A Log
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const PLUGIN_WIDGET_REGISTRY: Record<
  string,
  React.ComponentType<{ context?: PluginExecutionContext }>
> = {
  ReadingTimeCalculatorWidget,
  CitationFormatterWidget,
  LibraryTagsWidget,
  PublishAndReportWidget,
};

export const PATCH_WIDGET_REGISTRY = PLUGIN_WIDGET_REGISTRY;
