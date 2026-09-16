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
export function ReadingTimeCalculatorWidget({ context }: { context?: PluginExecutionContext }) {
  const totalPages = context?.totalPages ?? 1;
  const currentPage = context?.currentPage ?? 1;
  const remainingPages = Math.max(0, totalPages - currentPage);
  const remainingWords = context?.remainingWords;
  const pageWordCounts = context?.pageWordCounts;

  if (totalPages <= 1) return null;

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
 * Formats standardized citations (APA, BibTeX, Chicago, MLA) and appends to notes.
 */
export function CitationFormatterWidget({ context }: { context?: PluginExecutionContext }) {
  const title = context?.documentTitle?.trim() || 'Untitled Document';
  const page = context?.currentPage || 1;
  const year = new Date().getFullYear();

  const handleInsert = (format: 'apa' | 'bibtex' | 'chicago' | 'mla') => {
    let citationText = '';

    switch (format) {
      case 'apa':
        citationText = `\n\n> **Citation (APA):** Author, A. (${year}). *${title}* (p. ${page}). Reeda Digital Edition.\n`;
        break;
      case 'bibtex':
        const citeKey = title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) + year;
        citationText = `\n\n\`\`\`bibtex\n@misc{${citeKey},\n  title = {${title}},\n  year = {${year}},\n  note = {Page ${page}}\n}\n\`\`\`\n`;
        break;
      case 'chicago':
        citationText = `\n\n> **Citation (Chicago):** Author, *${title}* (${year}), ${page}.\n`;
        break;
      case 'mla':
        citationText = `\n\n> **Citation (MLA):** Author. *${title}*, ${year}, p. ${page}.\n`;
        break;
    }

    if (context?.onInsertNote) {
      context.onInsertNote(citationText);
      context.onToast?.(`Inserted ${format.toUpperCase()} citation into notes`, 'success');
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

export const PLUGIN_WIDGET_REGISTRY: Record<
  string,
  React.ComponentType<{ context?: PluginExecutionContext }>
> = {
  ReadingTimeCalculatorWidget,
  CitationFormatterWidget,
  LibraryTagsWidget,
};

export const PATCH_WIDGET_REGISTRY = PLUGIN_WIDGET_REGISTRY;
