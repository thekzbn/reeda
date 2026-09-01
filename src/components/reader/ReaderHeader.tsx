import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Search,
  Maximize2,
  Minimize2,
  BookOpen,
  ArrowLeft,
  PanelRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ZoomMode } from "./types";

interface ReaderHeaderProps {
  title: string;
  currentPage: number;
  totalPages: number;
  scale: number;
  zoomMode: ZoomMode;
  isFullscreen: boolean;
  hasOutline: boolean;
  isTocOpen: boolean;
  isSearchOpen: boolean;
  isNotesOpen: boolean;
  onToggleNotes: () => void;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomSelect: (scale: number) => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  onToggleToc: () => void;
  onToggleSearch: () => void;
  onToggleFullscreen: () => void;
}

export function ReaderHeader({
  title,
  currentPage,
  totalPages,
  scale,
  zoomMode,
  isFullscreen,
  hasOutline,
  isTocOpen,
  isSearchOpen,
  isNotesOpen,
  onToggleNotes,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onZoomSelect,
  onFitWidth,
  onFitPage,
  onToggleToc,
  onToggleSearch,
  onToggleFullscreen,
}: ReaderHeaderProps) {
  const [pageInput, setPageInput] = useState<string>(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handlePageSubmit = () => {
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
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

  const zoomPercent = Math.round(scale * 100);
  const zoomLabel =
    zoomMode === "fit-width"
      ? "Fit width"
      : zoomMode === "fit-page"
        ? "Fit page"
        : `${zoomPercent}%`;

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-border bg-background px-3 sm:px-6">
      {/* Left: Back to library & Table of Contents */}
      <div className="flex min-w-0 items-center gap-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          title="Back to library"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden text-[15px] font-semibold tracking-tight text-foreground sm:inline">
            Reeda
          </span>
        </Link>

        {hasOutline ? (
          <Button
            variant="ghost"
            size="icon"
            className={`squircle h-8 w-8 ${
              isTocOpen
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={onToggleToc}
            title={isTocOpen ? "Hide contents" : "Show contents"}
            aria-label="Table of contents"
          >
            <BookOpen className="h-4 w-4" />
          </Button>
        ) : null}

        <span className="hidden max-w-[180px] truncate text-sm font-medium text-foreground/80 md:inline lg:max-w-[280px]">
          {title}
        </span>
      </div>

      {/* Center: Page navigation */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="squircle h-8 w-8 text-muted-foreground hover:text-foreground"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <input
            type="text"
            inputMode="numeric"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onBlur={handlePageSubmit}
            onKeyDown={handlePageKeyDown}
            className="squircle h-7 w-11 border border-border bg-background text-center text-xs font-medium text-foreground focus:border-primary focus:outline-none"
            aria-label="Page number"
          />
          <span className="text-xs text-muted-foreground">/ {totalPages || 1}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="squircle h-8 w-8 text-muted-foreground hover:text-foreground"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Right: Zoom, Search, Fullscreen */}
      <div className="flex items-center gap-1">
        {/* Zoom controls */}
        <div className="hidden items-center sm:flex">
          <Button
            variant="ghost"
            size="icon"
            className="squircle h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onZoomOut}
            title="Zoom out"
            aria-label="Zoom out"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="squircle h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {zoomLabel}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-36">
              <DropdownMenuItem onSelect={onFitWidth}>Fit width</DropdownMenuItem>
              <DropdownMenuItem onSelect={onFitPage}>Fit page</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onZoomSelect(0.5)}>50%</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onZoomSelect(0.75)}>75%</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onZoomSelect(1.0)}>100%</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onZoomSelect(1.25)}>125%</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onZoomSelect(1.5)}>150%</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onZoomSelect(2.0)}>200%</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            className="squircle h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onZoomIn}
            title="Zoom in"
            aria-label="Zoom in"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* In-document text search */}
        <Button
          variant="ghost"
          size="icon"
          className={`squircle h-8 w-8 ${
            isSearchOpen
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={onToggleSearch}
          title="Find in document (Ctrl+F)"
          aria-label="Find in document"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Notes workspace */}
        <Button
          variant="ghost"
          size="icon"
          className={`squircle h-8 w-8 ${
            isNotesOpen
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={onToggleNotes}
          title={isNotesOpen ? "Hide notes" : "Show notes"}
          aria-label="Notes"
        >
          <PanelRight className="h-4 w-4" />
        </Button>

        {/* Fullscreen */}
        <Button
          variant="ghost"
          size="icon"
          className="squircle h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onToggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
