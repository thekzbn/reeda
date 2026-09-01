import { useEffect, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { pdfjsLib } from "./pdf-worker";
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

    const loadingTask = pdfjsLib.getDocument({
      url,
      withCredentials: false,
      cMapUrl: "https://unpkg.com/pdfjs-dist@4.10.38/cmaps/",
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
