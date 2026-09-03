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

import { useEffect, useRef } from "react";
import { Search, ChevronUp, ChevronDown, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  isOpen: boolean;
  onClose: () => void;
  currentMatchIndex: number;
  totalMatches: number;
  isSearching: boolean;
  onNextMatch: () => void;
  onPrevMatch: () => void;
}

export function SearchBar({
  query,
  onQueryChange,
  isOpen,
  onClose,
  currentMatchIndex,
  totalMatches,
  isSearching,
  onNextMatch,
  onPrevMatch,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter") {
      if (e.shiftKey) {
        onPrevMatch();
      } else {
        onNextMatch();
      }
    }
  };

  const hasQuery = query.trim().length > 0;

  return (
    <div
      role="search"
      className="absolute top-16 right-6 z-30 flex items-center gap-1.5 rounded-lg border border-border bg-background p-1.5 sm:right-8"
    >
      <Search className="ml-2 h-4 w-4 text-muted-foreground shrink-0" />
      <Input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in document"
        className="h-8 w-44 border-0 bg-transparent px-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0 sm:w-56"
      />

      {isSearching ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : hasQuery ? (
        <span className="px-1 text-xs text-muted-foreground whitespace-nowrap">
          {totalMatches > 0 ? `${currentMatchIndex + 1} of ${totalMatches}` : "No matches"}
        </span>
      ) : null}

      <div className="flex items-center gap-0.5 border-l border-border pl-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          disabled={totalMatches === 0}
          onClick={onPrevMatch}
          title="Previous match (Shift+Enter)"
          aria-label="Previous match"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          disabled={totalMatches === 0}
          onClick={onNextMatch}
          title="Next match (Enter)"
          aria-label="Next match"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          title="Close search (Esc)"
          aria-label="Close search"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
