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

import { Link } from "@tanstack/react-router";
import {
  Search,
  Maximize2,
  Minimize2,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkspaceMode } from "./types";
import { cn } from "@/lib/utils";

interface ReaderHeaderProps {
  title: string;
  isFullscreen: boolean;
  hasOutline: boolean;
  isTocOpen: boolean;
  isSearchOpen: boolean;
  workspaceMode: WorkspaceMode;
  isDesktop: boolean;
  onModeChange: (mode: WorkspaceMode) => void;
  onToggleToc: () => void;
  onToggleSearch: () => void;
  onToggleFullscreen: () => void;
}

export function ReaderHeader({
  title,
  isFullscreen,
  hasOutline,
  isTocOpen,
  isSearchOpen,
  workspaceMode,
  isDesktop,
  onModeChange,
  onToggleToc,
  onToggleSearch,
  onToggleFullscreen,
}: ReaderHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-background px-3 sm:px-5">
      {/* Left: Back to library, Table of Contents, Document title */}
      <div className="flex min-w-0 items-center gap-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          title="Back to library"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="hidden text-[15px] font-semibold tracking-tight text-foreground sm:inline">
            Reeda
          </span>
        </Link>

        {hasOutline ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "squircle h-8 w-8",
              isTocOpen
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={onToggleToc}
            title={isTocOpen ? "Hide contents" : "Show contents"}
            aria-label="Table of contents"
          >
            <BookOpen className="h-4 w-4" />
          </Button>
        ) : null}

        <span className="hidden max-w-[180px] truncate text-sm font-medium text-foreground/85 md:inline lg:max-w-[320px]">
          {title}
        </span>
      </div>

      {/* Right: Workspace mode switcher, Zoom, Search, Fullscreen */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Workspace mode segmented control */}
        <div
          className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-xs font-medium"
          role="group"
          aria-label="Workspace view"
        >
          <button
            type="button"
            onClick={() => onModeChange("pdf")}
            className={cn(
              "rounded px-2.5 py-1 transition-colors",
              workspaceMode === "pdf"
                ? "bg-background text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="PDF reading view"
            aria-pressed={workspaceMode === "pdf"}
          >
            PDF
          </button>
          {isDesktop ? (
            <button
              type="button"
              onClick={() => onModeChange("split")}
              className={cn(
                "rounded px-2.5 py-1 transition-colors",
                workspaceMode === "split"
                  ? "bg-background text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Side-by-side workspace"
              aria-pressed={workspaceMode === "split"}
            >
              Split
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onModeChange("notes")}
            className={cn(
              "rounded px-2.5 py-1 transition-colors",
              workspaceMode === "notes"
                ? "bg-background text-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Notes writing view"
            aria-pressed={workspaceMode === "notes"}
          >
            Notes
          </button>
        </div>

        {/* In-document text search */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "squircle h-8 w-8",
            isSearchOpen
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={onToggleSearch}
          title="Find in document (Ctrl+F)"
          aria-label="Find in document"
        >
          <Search className="h-4 w-4" />
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
