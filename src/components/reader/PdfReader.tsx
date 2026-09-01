import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePdfDocument } from "./use-pdf-document";
import { usePdfSearch } from "./use-pdf-search";
import { PdfPage } from "./PdfPage";
import { ReaderHeader } from "./ReaderHeader";
import { TableOfContents } from "./TableOfContents";
import { SearchBar } from "./SearchBar";
import { NotesPane } from "./NotesPane";
import type { NotesEditorHandle } from "./NotesEditor";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import type { WorkspaceMode, ZoomMode } from "./types";
import "./pdf-text-layer.css";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface PdfReaderProps {
  documentUrl: string;
  title: string;
  documentId: string;
}

export function PdfReader({ documentUrl, title, documentId }: PdfReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<NotesEditorHandle>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [zoomMode, setZoomMode] = useState<ZoomMode>("fit-width");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState<boolean>(true);
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("split");
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [isDraggingDivider, setIsDraggingDivider] = useState<boolean>(false);

  const { pdfDoc, totalPages, outline, firstPageDimension, isLoading, error } =
    usePdfDocument(documentUrl);

  const handleNavigateToPage = useCallback(
    (pageNumber: number) => {
      const clamped = Math.max(1, Math.min(pageNumber, totalPages || 1));
      setCurrentPage(clamped);

      const targetEl = scrollContainerRef.current?.querySelector(`[data-page-number="${clamped}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [totalPages],
  );

  const {
    matches,
    currentMatchIndex,
    totalMatches,
    isSearching,
    activeMatch,
    nextMatch,
    prevMatch,
  } = usePdfSearch(pdfDoc, searchQuery, handleNavigateToPage);

  // Compute fit scale
  const computeFitScale = useCallback(
    (mode: ZoomMode): number => {
      if (!scrollContainerRef.current || !firstPageDimension) return 1.0;
      const containerWidth = scrollContainerRef.current.clientWidth - 48; // padding
      const containerHeight = scrollContainerRef.current.clientHeight - 48;

      if (containerWidth <= 0 || firstPageDimension.width <= 0) return 1.0;

      if (mode === "fit-width") {
        const calculated = containerWidth / firstPageDimension.width;
        return Math.min(Math.max(calculated, 0.4), 2.5);
      }

      if (mode === "fit-page") {
        const scaleW = containerWidth / firstPageDimension.width;
        const scaleH = containerHeight / firstPageDimension.height;
        const calculated = Math.min(scaleW, scaleH);
        return Math.min(Math.max(calculated, 0.4), 2.5);
      }

      return scale;
    },
    [firstPageDimension, scale],
  );

  // Initial fit-width calculation once firstPageDimension is loaded
  useEffect(() => {
    if (firstPageDimension && zoomMode === "fit-width") {
      const newScale = computeFitScale("fit-width");
      setScale(newScale);
    }
  }, [firstPageDimension, computeFitScale, zoomMode]);

  // Recalculate zoom on container resize if in fit mode
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      if (zoomMode === "fit-width" || zoomMode === "fit-page") {
        setScale(computeFitScale(zoomMode));
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [zoomMode, computeFitScale]);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Track viewport size so small screens switch panes instead of splitting
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const apply = () => {
      const matches = query.matches;
      setIsDesktop(matches);
      if (!matches && workspaceMode === "split") {
        setWorkspaceMode("pdf");
      }
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [workspaceMode]);

  // Track selected PDF text so it can be sent to the notes editor
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }
      const text = sel.toString().replace(/\s+/g, " ").trim();
      if (!text) {
        setSelection(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      setSelection({ text, x: rect.left + rect.width / 2, y: rect.top });
    };

    const handleScroll = () => {
      setSelection(null);
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
      el.removeEventListener("scroll", handleScroll);
    };
  }, [pdfDoc]);

  // Keyboard navigation & search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or the notes editor
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === "Escape") {
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery("");
        } else if (isTocOpen) {
          setIsTocOpen(false);
        }
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        handleNavigateToPage(currentPage - 1);
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        handleNavigateToPage(currentPage + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, isTocOpen, currentPage, handleNavigateToPage]);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomMode("custom");
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setZoomMode("custom");
    setScale((prev) => Math.max(prev - 0.25, 0.4));
  };

  const handleZoomSelect = (newScale: number) => {
    setZoomMode("custom");
    setScale(newScale);
  };

  const handleFitWidth = () => {
    setZoomMode("fit-width");
    setScale(computeFitScale("fit-width"));
  };

  const handleFitPage = () => {
    setZoomMode("fit-page");
    setScale(computeFitScale("fit-page"));
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      void containerRef.current.requestFullscreen();
    } else {
      void document.exitFullscreen();
    }
  };

  const pagesArray = useMemo(() => {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages]);

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background px-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-4 text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">Loading document</p>
      </div>
    );
  }

  if (error || !pdfDoc) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background px-6 text-center">
        <h1 className="text-xl font-semibold">We could not open this document</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error || "The file could not be read."}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="squircle inline-flex h-9 items-center justify-center bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to library
          </Link>
        </div>
      </div>
    );
  }

  const isPdfVisible = workspaceMode === "pdf" || (isDesktop && workspaceMode === "split");
  const isNotesVisible = workspaceMode === "notes" || (isDesktop && workspaceMode === "split");

  const sendSelectionToNotes = () => {
    if (!selection) return;
    if (!isDesktop) {
      setWorkspaceMode("notes");
    } else if (workspaceMode === "pdf") {
      setWorkspaceMode("split");
    }
    const text = selection.text;
    setSelection(null);
    window.getSelection()?.removeAllRanges();
    window.setTimeout(() => notesRef.current?.insertText(text), 50);
  };

  const pdfPane = (
    <main
      ref={scrollContainerRef}
      className={cn(
        "relative h-full overflow-y-auto overflow-x-auto bg-muted/40 p-4 sm:p-6",
        !isPdfVisible && "hidden",
      )}
    >
      <div className="mx-auto flex flex-col items-center">
        {pagesArray.map((pageNum) => (
          <PdfPage
            key={pageNum}
            pageNumber={pageNum}
            pdfDoc={pdfDoc}
            scale={scale}
            searchQuery={searchQuery}
            activeMatch={activeMatch}
            onPageVisible={(visiblePage) => {
              setCurrentPage(visiblePage);
            }}
          />
        ))}
      </div>
    </main>
  );

  const notesPane = (
    <div className={cn("h-full min-h-0", !isNotesVisible && "hidden")}>
      <NotesPane ref={notesRef} documentId={documentId} />
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-screen w-full flex-col overflow-hidden bg-muted/40 font-sans",
        isDraggingDivider && "select-none",
      )}
    >
      <ReaderHeader
        title={title}
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        zoomMode={zoomMode}
        isFullscreen={isFullscreen}
        hasOutline={outline !== null && outline.length > 0}
        isTocOpen={isTocOpen}
        isSearchOpen={isSearchOpen}
        workspaceMode={workspaceMode}
        isDesktop={isDesktop}
        onModeChange={(mode) => setWorkspaceMode(mode)}
        onPageChange={handleNavigateToPage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomSelect={handleZoomSelect}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
        onToggleToc={() => setIsTocOpen((prev) => !prev)}
        onToggleSearch={() => {
          setIsSearchOpen((prev) => {
            if (prev) setSearchQuery("");
            return !prev;
          });
        }}
        onToggleFullscreen={handleToggleFullscreen}
      />

      <TableOfContents
        outline={outline}
        isOpen={isTocOpen}
        onClose={() => setIsTocOpen(false)}
        onNavigateToPage={handleNavigateToPage}
      />

      <SearchBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        isOpen={isSearchOpen}
        onClose={() => {
          setIsSearchOpen(false);
          setSearchQuery("");
        }}
        currentMatchIndex={currentMatchIndex}
        totalMatches={totalMatches}
        isSearching={isSearching}
        onNextMatch={nextMatch}
        onPrevMatch={prevMatch}
      />

      <div className="relative min-h-0 flex-1">
        {isDesktop && workspaceMode === "split" ? (
          <ResizablePanelGroup
            orientation="horizontal"
            id="reeda-reader-split"
            className="h-full"
            onLayoutChanged={() => setIsDraggingDivider(false)}
          >
            <ResizablePanel id="pdf-panel" defaultSize="58%" minSize="30%" maxSize="75%">
              {pdfPane}
            </ResizablePanel>
            <ResizableHandle
              id="split-handle"
              onMouseDown={() => setIsDraggingDivider(true)}
              onTouchStart={() => setIsDraggingDivider(true)}
            />
            <ResizablePanel id="notes-panel" defaultSize="42%" minSize="25%" maxSize="70%">
              {notesPane}
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="h-full w-full">
            {pdfPane}
            {notesPane}
          </div>
        )}
      </div>

      {selection && isPdfVisible ? (
        <div
          className="fixed z-40 -translate-x-1/2 -translate-y-full pb-2"
          style={{ left: selection.x, top: selection.y }}
        >
          <Button
            size="sm"
            className="squircle h-8 px-3 text-xs"
            onMouseDown={(e) => e.preventDefault()}
            onClick={sendSelectionToNotes}
          >
            Add to notes
          </Button>
        </div>
      ) : null}
    </div>
  );
}
