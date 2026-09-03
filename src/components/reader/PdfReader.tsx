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
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Highlighter,
  Underline as UnderlineIcon,
  Strikethrough as StrikeIcon,
  BookOpen,
  Copy,
  Check,
  X,
  Search,
  ZoomIn,
  ZoomOut,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { createDocumentAnnotations, deleteDocumentAnnotation, getDocumentAnnotations } from "@/lib/annotations";
import type {
  AnnotationGeometry,
  AnnotationRect,
  AnnotationType,
  DocumentAnnotation,
} from "./types";
import { toast } from "sonner";

interface SelectionDraft {
  pageNumber: number;
  geometry: AnnotationGeometry;
}

interface PdfSelection {
  text: string;
  x: number;
  y: number;
  placeBelow?: boolean;
  drafts: SelectionDraft[];
}

function rectIntersection(rect: DOMRect, page: DOMRect): DOMRect | null {
  const left = Math.max(rect.left, page.left);
  const top = Math.max(rect.top, page.top);
  const right = Math.min(rect.right, page.right);
  const bottom = Math.min(rect.bottom, page.bottom);
  return right > left && bottom > top ? new DOMRect(left, top, right - left, bottom - top) : null;
}

function mergeLineRects(rects: AnnotationRect[]): AnnotationRect[] {
  const sorted = [...rects].sort((a, b) => a.y - b.y || a.x - b.x);
  return sorted.reduce<AnnotationRect[]>((merged, rect) => {
    const previous = merged.at(-1);
    if (
      previous &&
      Math.abs(previous.y - rect.y) < 0.004 &&
      Math.abs(previous.height - rect.height) < 0.004 &&
      rect.x <= previous.x + previous.width + 0.004
    ) {
      previous.width = Math.max(previous.width, rect.x + rect.width - previous.x);
    } else {
      merged.push({ ...rect });
    }
    return merged;
  }, []);
}

function getNodeElement(node: Node | null): Element | null {
  if (!node) return null;
  let current: Node | null = node;
  while (current && !(current instanceof Element)) {
    current = current.parentNode;
  }
  return current instanceof Element ? current : null;
}

function annotationAtPoint(
  root: HTMLElement,
  annotations: DocumentAnnotation[],
  clientX: number,
  clientY: number,
): DocumentAnnotation | null {
  for (const pageElement of root.querySelectorAll<HTMLElement>(
    ".pdf-page-container[data-page-number]",
  )) {
    const pageRect = pageElement.getBoundingClientRect();
    if (
      clientX < pageRect.left ||
      clientX > pageRect.right ||
      clientY < pageRect.top ||
      clientY > pageRect.bottom
    ) {
      continue;
    }
    const pageNumber = Number(pageElement.dataset["pageNumber"]);
    if (!Number.isInteger(pageNumber) || pageRect.width <= 0 || pageRect.height <= 0) continue;
    const nx = (clientX - pageRect.left) / pageRect.width;
    const ny = (clientY - pageRect.top) / pageRect.height;
    const hits = annotations.filter(
      (annotation) =>
        annotation.pageNumber === pageNumber &&
        annotation.geometry.rects.some(
          (rect) =>
            nx >= rect.x &&
            nx <= rect.x + rect.width &&
            ny >= rect.y &&
            ny <= rect.y + rect.height,
        ),
    );
    if (hits.length > 0) return hits.at(-1) ?? null;
  }
  return null;
}

function isPointInSelection(
  root: HTMLElement,
  selection: PdfSelection,
  clientX: number,
  clientY: number,
): boolean {
  for (const draft of selection.drafts) {
    const pageElement = root.querySelector<HTMLElement>(
      `.pdf-page-container[data-page-number="${draft.pageNumber}"]`,
    );
    if (!pageElement) continue;
    const pageRect = pageElement.getBoundingClientRect();
    if (
      clientX < pageRect.left ||
      clientX > pageRect.right ||
      clientY < pageRect.top ||
      clientY > pageRect.bottom
    ) {
      continue;
    }
    const nx = (clientX - pageRect.left) / pageRect.width;
    const ny = (clientY - pageRect.top) / pageRect.height;
    const hit = draft.geometry.rects.some(
      (rect) =>
        nx >= rect.x - 0.02 &&
        nx <= rect.x + rect.width + 0.02 &&
        ny >= rect.y - 0.015 &&
        ny <= rect.y + rect.height + 0.015,
    );
    if (hit) return true;
  }
  return false;
}

function getRangeClientRects(range: Range, root: HTMLElement): DOMRect[] {
  const list = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
  if (list.length > 0) return list;

  const bound = range.getBoundingClientRect();
  if (bound.width > 0 && bound.height > 0) return [bound];

  const startEl = getNodeElement(range.startContainer);
  const endEl = getNodeElement(range.endContainer);
  const spans: Element[] = [];

  if (startEl && startEl === endEl && startEl.tagName === "SPAN") {
    spans.push(startEl);
  } else if (startEl) {
    const pageContainer = startEl.closest(".pdf-page-container") || root;
    const allSpans = Array.from(pageContainer.querySelectorAll(".textLayer span"));
    for (const span of allSpans) {
      if (range.intersectsNode(span)) {
        spans.push(span);
      }
    }
  }

  return spans.map((s) => s.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
}

function selectionFromRange(root: HTMLElement, range: Range): PdfSelection | null {
  const text = (range.toString() || window.getSelection()?.toString() || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;

  const startEl = getNodeElement(range.startContainer);
  const endEl = getNodeElement(range.endContainer);

  const pageElements = Array.from(
    root.querySelectorAll<HTMLElement>(".pdf-page-container[data-page-number]"),
  );
  if (pageElements.length === 0) return null;

  const byPage = new Map<number, AnnotationRect[]>();
  const selectionRects = getRangeClientRects(range, root);

  for (const pageElement of pageElements) {
    const pageNumber = Number(pageElement.dataset["pageNumber"]);
    const pageRect = pageElement.getBoundingClientRect();
    if (!Number.isInteger(pageNumber) || pageRect.width <= 0 || pageRect.height <= 0) continue;

    for (const rect of selectionRects) {
      const clipped = rectIntersection(rect, pageRect);
      if (!clipped) continue;
      const normalized = {
        x: Math.max(0, Math.min(1, (clipped.left - pageRect.left) / pageRect.width)),
        y: Math.max(0, Math.min(1, (clipped.top - pageRect.top) / pageRect.height)),
        width: Math.max(0, Math.min(1, clipped.width / pageRect.width)),
        height: Math.max(0, Math.min(1, clipped.height / pageRect.height)),
      };
      if (normalized.width > 0 && normalized.height > 0) {
        if (normalized.width > 0.96 && normalized.height > 0.4) continue;
        byPage.set(pageNumber, [...(byPage.get(pageNumber) ?? []), normalized]);
      }
    }
  }

  // Fallback: if no page rect was mapped, map from the start element container
  if (byPage.size === 0 && startEl) {
    const pageEl = startEl.closest<HTMLElement>(".pdf-page-container[data-page-number]") ||
      endEl?.closest<HTMLElement>(".pdf-page-container[data-page-number]");
    if (pageEl) {
      const pageNumber = Number(pageEl.dataset["pageNumber"]);
      const pageRect = pageEl.getBoundingClientRect();
      const startRect = startEl.getBoundingClientRect();
      if (startRect.width > 0 && startRect.height > 0 && pageRect.width > 0 && pageRect.height > 0) {
        byPage.set(pageNumber, [
          {
            x: Math.max(0, Math.min(1, (startRect.left - pageRect.left) / pageRect.width)),
            y: Math.max(0, Math.min(1, (startRect.top - pageRect.top) / pageRect.height)),
            width: Math.max(0, Math.min(1, startRect.width / pageRect.width)),
            height: Math.max(0, Math.min(1, startRect.height / pageRect.height)),
          },
        ]);
      }
    }
  }

  const drafts = [...byPage.entries()]
    .map(([pageNumber, rects]) => ({
      pageNumber,
      geometry: { version: 1 as const, rects: mergeLineRects(rects) },
    }))
    .filter((draft) => draft.geometry.rects.length > 0);

  if (drafts.length === 0) return null;

  const rangeBounds = range.getBoundingClientRect();
  let topY = rangeBounds.top > 0 ? rangeBounds.top : (selectionRects[0]?.top ?? 120);
  let bottomY = rangeBounds.bottom > 0 ? rangeBounds.bottom : (selectionRects[selectionRects.length - 1]?.bottom ?? topY + 24);
  let centerX = rangeBounds.left + rangeBounds.width / 2;
  if (!Number.isFinite(centerX) || centerX <= 0) {
    centerX = selectionRects[0]?.left ? selectionRects[0].left + selectionRects[0].width / 2 : 400;
  }

  const placeBelow = topY < 80;
  const targetY = placeBelow ? bottomY : topY;

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 800;
  const minX = 180;
  const maxX = Math.max(minX, viewportWidth - 180);
  const clampedX = Math.max(minX, Math.min(maxX, centerX));

  return {
    text,
    x: clampedX,
    y: targetY,
    placeBelow,
    drafts,
  };
}

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
  const [selection, setSelection] = useState<PdfSelection | null>(null);
  const [menuSnapshot, setMenuSnapshot] = useState<PdfSelection | null>(null);
  const [menuAnnotation, setMenuAnnotation] = useState<DocumentAnnotation | null>(null);
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [isSavingAnnotation, setIsSavingAnnotation] = useState(false);
  const [isDraggingDivider, setIsDraggingDivider] = useState<boolean>(false);
  const selectionLockRef = useRef(false);
  const selectionRef = useRef<PdfSelection | null>(null);
  selectionRef.current = selection;
  const annotationsRef = useRef(annotations);
  annotationsRef.current = annotations;
  const [pageInput, setPageInput] = useState<string>(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handlePageSubmit = () => {
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= (totalPages || 1)) {
      handleNavigateToPage(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handlePageSubmit();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Escape") {
      setPageInput(String(currentPage));
      (e.target as HTMLInputElement).blur();
    }
  };

  const { pdfDoc, totalPages, outline, firstPageDimension, isLoading, error } =
    usePdfDocument(documentUrl);

  useEffect(() => {
    let cancelled = false;
    void getDocumentAnnotations(documentId)
      .then((loaded) => {
        if (!cancelled) setAnnotations(loaded);
      })
      .catch(() => {
        if (!cancelled) toast.error("We could not load annotations right now.");
      });
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: getMyProfile,
  });
  const resumeReading = profileQuery.data?.resume_reading ?? true;

  const restoredDocRef = useRef<string | null>(null);
  const savePositionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveReadingPosition = useCallback(
    (page: number) => {
      if (!resumeReading) return;
      if (savePositionTimeoutRef.current) {
        clearTimeout(savePositionTimeoutRef.current);
      }
      savePositionTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(
            `reeda_pos_${documentId}`,
            JSON.stringify({ page, updatedAt: Date.now() }),
          );
        } catch {
          // Ignore storage errors
        }
      }, 500);
    },
    [resumeReading, documentId],
  );

  useEffect(() => {
    return () => {
      if (savePositionTimeoutRef.current) {
        clearTimeout(savePositionTimeoutRef.current);
      }
    };
  }, []);

  // Restore reading position when document loads
  useEffect(() => {
    if (!totalPages || totalPages <= 1 || !pdfDoc || !resumeReading) return undefined;
    if (restoredDocRef.current === documentId) return undefined;

    try {
      const stored = localStorage.getItem(`reeda_pos_${documentId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const targetPage = Number(parsed?.page);
        if (targetPage > 1 && targetPage <= totalPages) {
          restoredDocRef.current = documentId;
          const timer = setTimeout(() => {
            const targetEl = scrollContainerRef.current?.querySelector(
              `[data-page-number="${targetPage}"]`,
            );
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: "auto", block: "start" });
              setCurrentPage(targetPage);
            }
          }, 150);
          return () => clearTimeout(timer);
        }
      }
    } catch {
      // Ignore storage errors
    }
    restoredDocRef.current = documentId;
    return undefined;
  }, [documentId, totalPages, pdfDoc, resumeReading]);

  const handleNavigateToPage = useCallback(
    (pageNumber: number) => {
      const clamped = Math.max(1, Math.min(pageNumber, totalPages || 1));
      setCurrentPage(clamped);
      saveReadingPosition(clamped);

      const targetEl = scrollContainerRef.current?.querySelector(`[data-page-number="${clamped}"]`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [totalPages, saveReadingPosition],
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
    if (!isLoading && firstPageDimension && zoomMode === "fit-width") {
      const newScale = computeFitScale("fit-width");
      setScale(newScale);
    }
  }, [isLoading, firstPageDimension, computeFitScale, zoomMode]);

  // Recalculate zoom on container resize if in fit mode
  useEffect(() => {
    if (isLoading) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      if (zoomMode === "fit-width" || zoomMode === "fit-page") {
        setScale(computeFitScale(zoomMode));
      }
    });

    observer.observe(el);
    if (zoomMode === "fit-width" || zoomMode === "fit-page") {
      setScale(computeFitScale(zoomMode));
    }
    return () => observer.disconnect();
  }, [isLoading, zoomMode, computeFitScale]);

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

  const [copied, setCopied] = useState<boolean>(false);

  // Convert the browser's transient range to per-page document-relative rects.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleSelection = () => {
      if (selectionLockRef.current) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const next = selectionFromRange(el, range);
      if (!next || !next.text) {
        setSelection(null);
        return;
      }
      setSelection(next);
    };

    const handlePointerDownCapture = (event: MouseEvent) => {
      if (event.button === 2) {
        // Right click: lock selection from being prematurely destroyed
        selectionLockRef.current = true;
      } else if (event.button === 0) {
        if (selectionLockRef.current) {
          selectionLockRef.current = false;
        }
      }
    };

    const handleContextMenuCapture = (event: MouseEvent) => {
      selectionLockRef.current = true;

      const sel = window.getSelection();
      let extracted: PdfSelection | null = null;
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        extracted = selectionFromRange(el, range);
      }

      const active = extracted || selectionRef.current || selection;
      if (active && active.text) {
        setSelection(active);
        setMenuSnapshot(active);
        setMenuAnnotation(null);
        return;
      }

      // Check if clicked directly on an existing annotation
      const hit = annotationAtPoint(el, annotationsRef.current, event.clientX, event.clientY);
      if (hit) {
        setMenuSnapshot(null);
        setMenuAnnotation(hit);
        return;
      }

      setMenuSnapshot(null);
      setMenuAnnotation(null);
    };

    const handlePointerUp = () => {
      window.requestAnimationFrame(handleSelection);
    };

    const handleScroll = () => {
      if (selectionLockRef.current) return;
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const next = selectionFromRange(el, range);
        if (next) {
          setSelection(next);
          return;
        }
      }
      setSelection(null);
    };

    document.addEventListener("selectionchange", handleSelection);
    document.addEventListener("pointerdown", handlePointerDownCapture, true);
    document.addEventListener("pointerup", handlePointerUp);
    el.addEventListener("contextmenu", handleContextMenuCapture, true);
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleSelection);
    return () => {
      document.removeEventListener("selectionchange", handleSelection);
      document.removeEventListener("pointerdown", handlePointerDownCapture, true);
      document.removeEventListener("pointerup", handlePointerUp);
      el.removeEventListener("contextmenu", handleContextMenuCapture, true);
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleSelection);
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
        } else if (selection) {
          setSelection(null);
          window.getSelection()?.removeAllRanges();
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
  }, [isSearchOpen, isTocOpen, currentPage, handleNavigateToPage, selection]);

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
  const activeSelection = selection ?? menuSnapshot;

  const copySelection = async (source: PdfSelection | null = activeSelection) => {
    if (!source) return;
    try {
      await navigator.clipboard.writeText(source.text);
      setCopied(true);
      toast.success("Text copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const clearSelection = () => {
    selectionLockRef.current = false;
    setSelection(null);
    setMenuSnapshot(null);
    window.getSelection()?.removeAllRanges();
  };

  const sendSelectionToNotes = (source: PdfSelection | null = activeSelection) => {
    if (!source) return;
    if (!isDesktop) {
      setWorkspaceMode("notes");
    } else if (workspaceMode === "pdf") {
      setWorkspaceMode("split");
    }
    const text = source.text;
    clearSelection();
    window.setTimeout(() => {
      notesRef.current?.insertText(text);
      toast.success("Added to notes");
    }, 50);
  };

  const createAnnotation = async (
    type: AnnotationType,
    source: PdfSelection | null = activeSelection,
  ) => {
    if (!source || isSavingAnnotation) return;
    setIsSavingAnnotation(true);
    try {
      const created = await createDocumentAnnotations(
        documentId,
        source.drafts.map((draft) => ({
          pageNumber: draft.pageNumber,
          type,
          selectedText: source.text,
          geometry: draft.geometry,
        })),
      );
      setAnnotations((current) => [...current, ...created]);
      clearSelection();

      const label =
        type === "highlight"
          ? "Text highlighted"
          : type === "underline"
            ? "Text underlined"
            : "Text struck through";
      toast.success(label);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not save that annotation.");
    } finally {
      setIsSavingAnnotation(false);
    }
  };

  const removeAnnotation = async (annotation: DocumentAnnotation) => {
    try {
      await deleteDocumentAnnotation(documentId, annotation.id);
      setAnnotations((current) => current.filter((item) => item.id !== annotation.id));
      setMenuAnnotation(null);
      toast.success("Annotation removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not remove that annotation.");
    }
  };

  const sendAnnotationToNotes = (annotation: DocumentAnnotation) => {
    if (!annotation.selectedText) return;
    if (!isDesktop) {
      setWorkspaceMode("notes");
    } else if (workspaceMode === "pdf") {
      setWorkspaceMode("split");
    }
    const text = annotation.selectedText;
    window.setTimeout(() => {
      notesRef.current?.insertText(text);
      toast.success("Added to notes");
    }, 50);
  };

  const activeMenuSelection = menuSnapshot || selection || selectionRef.current;

  const pdfPane = (
    <div className={cn("relative h-full w-full overflow-hidden", !isPdfVisible && "hidden")}>
      <ContextMenu
        onOpenChange={(open) => {
          if (open) {
            selectionLockRef.current = true;
            return;
          }
          window.setTimeout(() => {
            selectionLockRef.current = false;
            setMenuSnapshot(null);
            setMenuAnnotation(null);
          }, 120);
        }}
      >
        <ContextMenuTrigger asChild>
          <main
            ref={scrollContainerRef}
            className="relative h-full overflow-y-auto overflow-x-auto bg-muted/40 p-4 sm:p-6"
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
                  annotations={annotations.filter((annotation) => annotation.pageNumber === pageNum)}
                  onPageVisible={(visiblePage) => {
                    setCurrentPage(visiblePage);
                    saveReadingPosition(visiblePage);
                  }}
                />
              ))}
            </div>
          </main>
        </ContextMenuTrigger>
        <ContextMenuContent
          className="w-56"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          {activeMenuSelection ? (
            <>
              <ContextMenuItem
                onClick={() => void createAnnotation("highlight", activeMenuSelection)}
                disabled={isSavingAnnotation}
                className="gap-2 cursor-pointer"
              >
                <Highlighter className="h-4 w-4 text-amber-500" />
                <span>Highlight text</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => void createAnnotation("underline", activeMenuSelection)}
                disabled={isSavingAnnotation}
                className="gap-2 cursor-pointer"
              >
                <UnderlineIcon className="h-4 w-4 text-blue-500" />
                <span>Underline text</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => void createAnnotation("strikethrough", activeMenuSelection)}
                disabled={isSavingAnnotation}
                className="gap-2 cursor-pointer"
              >
                <StrikeIcon className="h-4 w-4 text-rose-500" />
                <span>Strikethrough text</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => sendSelectionToNotes(activeMenuSelection)}
                className="gap-2 cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Add to notes</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => void copySelection(activeMenuSelection)}
                className="gap-2 cursor-pointer"
              >
                <Copy className="h-4 w-4" />
                <span>Copy text</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={clearSelection}
                className="gap-2 text-muted-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span>Clear selection</span>
              </ContextMenuItem>
            </>
          ) : menuAnnotation ? (
            <>
              <ContextMenuItem
                onClick={() => sendAnnotationToNotes(menuAnnotation)}
                className="gap-2 cursor-pointer"
              >
                <BookOpen className="h-4 w-4 text-primary" />
                <span>Add to notes</span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() =>
                  void copySelection({
                    text: menuAnnotation.selectedText,
                    x: 0,
                    y: 0,
                    drafts: [],
                  })
                }
                className="gap-2 cursor-pointer"
              >
                <Copy className="h-4 w-4" />
                <span>Copy text</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => void removeAnnotation(menuAnnotation)}
                className="gap-2 text-destructive cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Remove annotation</span>
              </ContextMenuItem>
            </>
          ) : (
            <>
              <ContextMenuItem onClick={handleZoomIn} className="gap-2 cursor-pointer">
                <ZoomIn className="h-4 w-4" />
                <span>Zoom in</span>
                <ContextMenuShortcut>Ctrl++</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onClick={handleZoomOut} className="gap-2 cursor-pointer">
                <ZoomOut className="h-4 w-4" />
                <span>Zoom out</span>
                <ContextMenuShortcut>Ctrl+-</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onClick={handleFitWidth} className="gap-2 cursor-pointer">
                <span>Fit to width</span>
              </ContextMenuItem>
              <ContextMenuItem onClick={handleFitPage} className="gap-2 cursor-pointer">
                <span>Fit to page</span>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => setIsSearchOpen(true)} className="gap-2 cursor-pointer">
                <Search className="h-4 w-4" />
                <span>Find in document</span>
                <ContextMenuShortcut>Ctrl+F</ContextMenuShortcut>
              </ContextMenuItem>
              {outline && outline.length > 0 ? (
                <ContextMenuItem
                  onClick={() => setIsTocOpen((prev) => !prev)}
                  className="gap-2 cursor-pointer"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Table of contents</span>
                </ContextMenuItem>
              ) : null}
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Floating Bottom-Center Page Navigation */}
      {totalPages > 0 && isPdfVisible ? (
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 -translate-x-1/2 transition-all duration-150 animate-in fade-in zoom-in-95">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/80 bg-background/95 p-1 shadow-lg backdrop-blur-md">
            <Button
              variant="ghost"
              size="icon"
              className="squircle h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              disabled={currentPage <= 1}
              onClick={() => handleNavigateToPage(currentPage - 1)}
              title="Previous page"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 px-1.5 text-xs text-muted-foreground">
              <input
                type="text"
                inputMode="numeric"
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onBlur={handlePageSubmit}
                onKeyDown={handlePageKeyDown}
                className="squircle h-6 w-9 border border-border bg-background text-center text-xs font-medium text-foreground focus:border-primary focus:outline-none"
                aria-label="Page number"
              />
              <span className="text-xs text-muted-foreground">/ {totalPages || 1}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="squircle h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
              disabled={currentPage >= totalPages}
              onClick={() => handleNavigateToPage(currentPage + 1)}
              title="Next page"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* PDF zoom and fit controls, anchored to the PDF pane */}
      {isPdfVisible ? (
        <div className="absolute bottom-5 left-4 z-20 flex items-center gap-0.5 rounded-md border border-border bg-background/95 px-0.5 py-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="squircle h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleZoomOut}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="squircle h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={handleFitWidth}
            title="Fit width"
            aria-pressed={zoomMode === "fit-width"}
          >
            {zoomMode === "fit-width" ? "Fit width" : `${Math.round(scale * 100)}%`}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="squircle h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleZoomIn}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}
    </div>
  );

  const notesPane = (
    <div className={cn("h-full min-h-0", !isNotesVisible && "hidden")}>
      <NotesPane ref={notesRef} documentId={documentId} documentTitle={title} />
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
        scale={scale}
        zoomMode={zoomMode}
        isFullscreen={isFullscreen}
        hasOutline={outline !== null && outline.length > 0}
        isTocOpen={isTocOpen}
        isSearchOpen={isSearchOpen}
        workspaceMode={workspaceMode}
        isDesktop={isDesktop}
        onModeChange={(mode) => setWorkspaceMode(mode)}
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
          className="fixed z-50 pointer-events-auto transition-all duration-150 animate-in fade-in zoom-in-95"
          style={{
            left: selection.x,
            top: selection.y,
            transform: `translate(-50%, ${selection.placeBelow ? "8px" : "-100%"})`,
            marginTop: selection.placeBelow ? "0" : "-8px",
          }}
        >
          <div className="flex items-center gap-0.5 rounded-full border border-border/80 bg-background/95 p-1 shadow-xl backdrop-blur-md">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 rounded-full px-2.5 text-xs font-medium hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400"
              title="Highlight text"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void createAnnotation("highlight")}
              disabled={isSavingAnnotation}
            >
              <Highlighter className="h-3.5 w-3.5 text-amber-500" />
              <span>Highlight</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 rounded-full px-2.5 text-xs font-medium hover:bg-blue-500/15 hover:text-blue-600 dark:hover:text-blue-400"
              title="Underline text"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void createAnnotation("underline")}
              disabled={isSavingAnnotation}
            >
              <UnderlineIcon className="h-3.5 w-3.5 text-blue-500" />
              <span>Underline</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 rounded-full px-2.5 text-xs font-medium hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400"
              title="Strikethrough text"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void createAnnotation("strikethrough")}
              disabled={isSavingAnnotation}
            >
              <StrikeIcon className="h-3.5 w-3.5 text-rose-500" />
              <span>Strike</span>
            </Button>

            <div className="mx-1 h-3.5 w-px bg-border/80" />

            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1.5 rounded-full px-2.5 text-xs font-medium text-foreground/80 hover:bg-accent hover:text-foreground"
              title="Copy text"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void copySelection()}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </Button>

            <Button
              size="sm"
              className="squircle h-7 gap-1.5 rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
              title="Add selected text to notes"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => sendSelectionToNotes()}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Add to notes</span>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
