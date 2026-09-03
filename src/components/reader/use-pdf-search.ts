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

import { useEffect, useRef, useState, useCallback } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { SearchMatch } from "./types";

interface UsePdfSearchResult {
  matches: SearchMatch[];
  currentMatchIndex: number;
  totalMatches: number;
  isSearching: boolean;
  activeMatch: SearchMatch | null;
  nextMatch: () => void;
  prevMatch: () => void;
  setMatchIndex: (index: number) => void;
  pageTextCache: Map<number, string>;
}

export function usePdfSearch(
  pdfDoc: PDFDocumentProxy | null,
  query: string,
  onNavigateToPage?: (pageNumber: number) => void,
): UsePdfSearchResult {
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const textCacheRef = useRef<Map<number, string>>(new Map());

  // Search when query or pdfDoc changes
  useEffect(() => {
    const trimmedQuery = query.trim().toLowerCase();

    if (!pdfDoc || !trimmedQuery) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      setIsSearching(false);
      return;
    }

    let isCancelled = false;
    setIsSearching(true);

    const performSearch = async () => {
      const foundMatches: SearchMatch[] = [];
      let runningTotal = 0;

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        if (isCancelled) return;

        let pageText = textCacheRef.current.get(i);
        if (pageText === undefined) {
          try {
            const page = await pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            pageText = textContent.items.map((item) => ("str" in item ? item.str : "")).join(" ");
            textCacheRef.current.set(i, pageText);
          } catch {
            pageText = "";
          }
        }

        const lowerPageText = pageText.toLowerCase();
        let pos = 0;
        let matchInPage = 0;

        while ((pos = lowerPageText.indexOf(trimmedQuery, pos)) !== -1) {
          foundMatches.push({
            pageIndex: i - 1, // 0-based
            matchIndexInPage: matchInPage,
            totalIndex: runningTotal,
            text: pageText.slice(pos, pos + trimmedQuery.length),
          });
          matchInPage++;
          runningTotal++;
          pos += trimmedQuery.length;
        }
      }

      if (!isCancelled) {
        setMatches(foundMatches);
        setIsSearching(false);
        if (foundMatches.length > 0) {
          setCurrentMatchIndex(0);
          const firstMatch = foundMatches[0];
          if (firstMatch) {
            onNavigateToPage?.(firstMatch.pageIndex + 1);
          }
        } else {
          setCurrentMatchIndex(-1);
        }
      }
    };

    void performSearch();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, query, onNavigateToPage]);

  const activeMatch =
    currentMatchIndex >= 0 && currentMatchIndex < matches.length
      ? (matches[currentMatchIndex] ?? null)
      : null;

  const nextMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => {
      const next = (prev + 1) % matches.length;
      const target = matches[next];
      if (target) onNavigateToPage?.(target.pageIndex + 1);
      return next;
    });
  }, [matches, onNavigateToPage]);

  const prevMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => {
      const next = (prev - 1 + matches.length) % matches.length;
      const target = matches[next];
      if (target) onNavigateToPage?.(target.pageIndex + 1);
      return next;
    });
  }, [matches, onNavigateToPage]);

  const setMatchIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < matches.length) {
        setCurrentMatchIndex(index);
        const target = matches[index];
        if (target) onNavigateToPage?.(target.pageIndex + 1);
      }
    },
    [matches, onNavigateToPage],
  );

  return {
    matches,
    currentMatchIndex,
    totalMatches: matches.length,
    isSearching,
    activeMatch,
    nextMatch,
    prevMatch,
    setMatchIndex,
    pageTextCache: textCacheRef.current,
  };
}
