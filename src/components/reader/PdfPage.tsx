import { useEffect, useRef, useState, memo } from "react";
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from "pdfjs-dist";
import { pdfjsLib } from "./pdf-worker";
import type { SearchMatch } from "./types";

interface PdfPageProps {
  pageNumber: number; // 1-based
  pdfDoc: PDFDocumentProxy;
  scale: number;
  searchQuery: string;
  activeMatch: SearchMatch | null;
  onPageVisible?: (pageNumber: number) => void;
}

export const PdfPage = memo(function PdfPage({
  pageNumber,
  pdfDoc,
  scale,
  searchQuery,
  activeMatch,
  onPageVisible,
}: PdfPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);
  const [isRendered, setIsRendered] = useState<boolean>(false);

  // Measure initial page size at scale 1 once to prevent layout shifts
  useEffect(() => {
    let isCancelled = false;
    pdfDoc
      .getPage(pageNumber)
      .then((page) => {
        if (!isCancelled) {
          const vp = page.getViewport({ scale: 1.0 });
          setPageSize({ width: vp.width, height: vp.height });
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setPageSize({ width: 595, height: 842 });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, pageNumber]);

  // Observe intersection to lazily render only nearby pages
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            onPageVisible?.(pageNumber);
          } else {
            // Keep rendered in memory if close, or un-render if scrolled far away
            // For smoother scrolling, we unmount canvas rendering only when outside the rootMargin
            setIsVisible(false);
          }
        }
      },
      {
        root: null,
        rootMargin: "600px 0px 600px 0px", // Preload 600px ahead
        threshold: [0, 0.5],
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, onPageVisible]);

  // Render canvas & text layer when visible
  useEffect(() => {
    if (!isVisible) return;

    let isCancelled = false;
    let renderTask: RenderTask | null = null;
    let textLayerInstance: { cancel: () => void } | null = null;

    const renderPage = async () => {
      try {
        const page: PDFPageProxy = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const textLayerDiv = textLayerRef.current;

        if (!canvas || !textLayerDiv) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        // Support HiDPI / Retina displays
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;

        // Render Canvas
        renderTask = page.render({
          canvasContext: ctx,
          viewport,
          transform: transform ?? undefined,
          canvas,
        });

        await renderTask.promise;
        if (isCancelled) return;

        // Render Text Layer
        textLayerDiv.innerHTML = "";
        textLayerDiv.style.width = `${Math.floor(viewport.width)}px`;
        textLayerDiv.style.height = `${Math.floor(viewport.height)}px`;

        const textContent = await page.getTextContent();
        if (isCancelled) return;

        const textLayer = new pdfjsLib.TextLayer({
          textContentSource: textContent,
          container: textLayerDiv,
          viewport,
        });
        textLayerInstance = textLayer;

        await textLayer.render();
        if (isCancelled) return;

        setIsRendered(true);
      } catch (err: unknown) {
        if (
          err &&
          typeof err === "object" &&
          "name" in err &&
          err.name === "RenderingCancelledException"
        ) {
          return;
        }
      }
    };

    void renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) renderTask.cancel();
      if (textLayerInstance) textLayerInstance.cancel();
    };
  }, [isVisible, pdfDoc, pageNumber, scale]);

  // Apply search highlights on text layer spans
  useEffect(() => {
    const textLayerDiv = textLayerRef.current;
    if (!textLayerDiv || !isRendered) return;

    const trimmedQuery = searchQuery.trim().toLowerCase();
    const spans = textLayerDiv.querySelectorAll("span");

    // Remove existing highlights
    spans.forEach((span) => {
      if (span.dataset["originalText"]) {
        span.textContent = span.dataset["originalText"];
        delete span.dataset["originalText"];
      }
    });

    if (!trimmedQuery) return;

    let pageMatchCount = 0;
    const isThisPageActive = activeMatch?.pageIndex === pageNumber - 1;
    const activeMatchInPage = isThisPageActive ? activeMatch.matchIndexInPage : -1;

    spans.forEach((span) => {
      const text = span.textContent || "";
      const lower = text.toLowerCase();
      const matchIndex = lower.indexOf(trimmedQuery);

      if (matchIndex !== -1) {
        if (!span.dataset["originalText"]) {
          span.dataset["originalText"] = text;
        }

        const isCurrentActive = pageMatchCount === activeMatchInPage;
        const highlightClass = isCurrentActive ? "search-highlight-active" : "search-highlight";

        const before = text.slice(0, matchIndex);
        const match = text.slice(matchIndex, matchIndex + trimmedQuery.length);
        const after = text.slice(matchIndex + trimmedQuery.length);

        span.innerHTML = "";
        if (before) span.appendChild(document.createTextNode(before));
        const mark = document.createElement("mark");
        mark.className = `${highlightClass} text-transparent rounded-[1px]`;
        mark.textContent = match;
        span.appendChild(mark);
        if (after) span.appendChild(document.createTextNode(after));

        pageMatchCount++;
      }
    });
  }, [searchQuery, isRendered, activeMatch, pageNumber]);

  const currentWidth = pageSize ? Math.floor(pageSize.width * scale) : 595 * scale;
  const currentHeight = pageSize ? Math.floor(pageSize.height * scale) : 842 * scale;

  return (
    <div
      ref={containerRef}
      data-page-number={pageNumber}
      className="pdf-page-container mx-auto my-4 transition-transform duration-75"
      style={{
        width: `${currentWidth}px`,
        height: `${currentHeight}px`,
      }}
    >
      {isVisible ? (
        <>
          <canvas ref={canvasRef} className="block" />
          <div ref={textLayerRef} className="textLayer" />
        </>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-white text-xs text-muted-foreground/30"
          style={{ width: `${currentWidth}px`, height: `${currentHeight}px` }}
        >
          {pageNumber}
        </div>
      )}
    </div>
  );
});
