/*
 * Built-in Sandboxed Patch Widgets for Reeda
 * These components simulate the execution of pre-compiled Wasm modules
 * running within host-allocated abstract slots.
 */

import React, { useState, useEffect } from 'react';
import { Clock, BookMarked, Tag, Sparkles, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PatchExecutionContext } from './types';

/**
 * Reading Time Calculator Widget
 * Slot: slot_reader_toolbar_actions
 */
export function ReadingTimeCalculatorWidget({ context }: { context?: PatchExecutionContext }) {
  const [wpm] = useState(250);
  const totalPages = context?.totalPages ?? 1;
  const currentPage = context?.currentPage ?? 1;
  const remainingPages = Math.max(0, totalPages - currentPage);
  // Assume ~350 words per page
  const wordsPerPage = 350;
  const totalMinutesRemaining = Math.ceil((remainingPages * wordsPerPage) / wpm);

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted">
      <Clock className="h-3.5 w-3.5 text-primary" />
      <span>
        {totalMinutesRemaining === 0
          ? 'Finished'
          : `${totalMinutesRemaining} min left (p. ${currentPage}/${totalPages})`}
      </span>
    </div>
  );
}

/**
 * Citation Formatter Widget
 * Slot: slot_notes_pane_header_actions
 */
export function CitationFormatterWidget({ context }: { context?: PatchExecutionContext }) {
  const [copied, setCopied] = useState(false);
  const title = context?.documentTitle || 'Untitled Document';
  const page = context?.currentPage || 1;
  const year = new Date().getFullYear();

  const handleInsertCitation = () => {
    const apa = `\n\n> **Citation (APA):** Author, A. (${year}). *${title}* (p. ${page}). Reeda Digital Edition.\n`;
    if (context?.onInsertNote) {
      context.onInsertNote(apa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      context.onToast?.('Citation appended to your notes', 'success');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
      onClick={handleInsertCitation}
      title="Insert APA Citation for this page into notes"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <BookMarked className="h-3 w-3 text-primary" />}
      <span>Cite</span>
    </Button>
  );
}

/**
 * Library Document Tags Widget
 * Slot: slot_library_header_actions
 */
export function LibraryTagsWidget({ context }: { context?: PatchExecutionContext }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const tags = ['All', 'To Read', 'In Progress', 'Synthesized'];

  return (
    <div className="flex items-center gap-1.5 py-1">
      {tags.map(tag => {
        const isSelected = selectedTag === tag || (tag === 'All' && selectedTag === null);
        return (
          <Badge
            key={tag}
            variant={isSelected ? 'default' : 'outline'}
            className="cursor-pointer text-xs font-normal"
            onClick={() => setSelectedTag(tag === 'All' ? null : tag)}
          >
            <Tag className="mr-1 h-2.5 w-2.5 opacity-70" />
            {tag}
          </Badge>
        );
      })}
    </div>
  );
}

export const PATCH_WIDGET_REGISTRY: Record<
  string,
  React.ComponentType<{ context?: PatchExecutionContext }>
> = {
  ReadingTimeCalculatorWidget,
  CitationFormatterWidget,
  LibraryTagsWidget,
};
