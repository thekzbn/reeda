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

import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { pdfjsLib, PDFJS_VERSION, WORKER_SRC } from "./pdf-worker";
import type { OutlineItem, PageDimension } from "./types";

interface UsePdfDocumentResult {
  pdfDoc: PDFDocumentProxy | null;
  totalPages: number;
  outline: OutlineItem[] | null;
  firstPageDimension: PageDimension | null;
  isLoading: boolean;
  error: string | null;
}

export function usePdfDocument(url: string | null): UsePdfDocumentResult {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [outline, setOutline] = useState<OutlineItem[] | null>(null);
  const [firstPageDimension, setFirstPageDimension] = useState<PageDimension | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;
    }

    const loadingTask = pdfjsLib.getDocument({
      url,
      withCredentials: false,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/cmaps/`,
      cMapPacked: true,
    });

    loadingTask.promise
      .then(async (doc) => {
        if (isCancelled) {
          void loadingTask.destroy();
          return;
        }

        setPdfDoc(doc);
        setTotalPages(doc.numPages);

        // Fetch initial page dimension from page 1
        try {
          const firstPage = await doc.getPage(1);
          const viewport = firstPage.getViewport({ scale: 1.0 });
          if (!isCancelled) {
            setFirstPageDimension({
              width: viewport.width,
              height: viewport.height,
              aspectRatio: viewport.width / viewport.height,
            });
          }
        } catch {
          // Fallback standard A4 ratio if page fetch fails
          if (!isCancelled) {
            setFirstPageDimension({
              width: 595,
              height: 842,
              aspectRatio: 595 / 842,
            });
          }
        }

        // Fetch document outline / TOC
        try {
          const rawOutline = await doc.getOutline();
          if (rawOutline && rawOutline.length > 0 && !isCancelled) {
            const resolved = await resolveOutlineDestinations(
              doc,
              rawOutline as unknown as RawOutlineItem[],
            );
            if (!isCancelled) {
              setOutline(resolved.length > 0 ? resolved : null);
            }
          } else if (!isCancelled) {
            setOutline(null);
          }
        } catch {
          if (!isCancelled) setOutline(null);
        }

        if (!isCancelled) {
          setIsLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!isCancelled) {
          setError(err.message || "We could not open this document.");
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      void loadingTask.destroy();
    };
  }, [url]);

  return {
    pdfDoc,
    totalPages,
    outline,
    firstPageDimension,
    isLoading,
    error,
  };
}

interface RawOutlineItem {
  title: string;
  bold?: boolean;
  italic?: boolean;
  color?: Uint8ClampedArray;
  dest?: string | unknown[] | null;
  url?: string | null;
  items?: RawOutlineItem[];
}

async function resolveOutlineDestinations(
  doc: PDFDocumentProxy,
  rawItems: RawOutlineItem[],
): Promise<OutlineItem[]> {
  const result: OutlineItem[] = [];

  for (const item of rawItems) {
    let pageIndex: number | undefined;

    if (item.dest) {
      try {
        let explicitDest: unknown[] | null = null;
        if (typeof item.dest === "string") {
          explicitDest = (await doc.getDestination(item.dest)) as unknown[] | null;
        } else if (Array.isArray(item.dest)) {
          explicitDest = item.dest;
        }

        if (explicitDest && explicitDest[0] !== undefined) {
          const ref = explicitDest[0];
          if (typeof ref === "object" && ref !== null) {
            pageIndex = await doc.getPageIndex(ref as { num: number; gen: number });
          } else if (typeof ref === "number") {
            pageIndex = ref;
          }
        }
      } catch {
        // Destination resolution failed gracefully
      }
    }

    const subItems =
      item.items && item.items.length > 0 ? await resolveOutlineDestinations(doc, item.items) : [];

    result.push({
      title: item.title,
      bold: item.bold,
      italic: item.italic,
      color: item.color,
      dest: item.dest,
      url: item.url,
      items: subItems,
      pageIndex,
    });
  }

  return result;
}
