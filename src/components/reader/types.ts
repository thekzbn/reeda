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

export type ZoomMode = "fit-width" | "fit-page" | "custom";
export type WorkspaceMode = "split" | "pdf" | "notes";

export interface OutlineItem {
  title: string;
  bold?: boolean | undefined;
  italic?: boolean | undefined;
  color?: Uint8ClampedArray | undefined;
  dest?: string | unknown[] | null | undefined;
  url?: string | null | undefined;
  items: OutlineItem[];
  pageIndex?: number | undefined;
}

export interface SearchMatch {
  pageIndex: number; // 0-based
  matchIndexInPage: number;
  totalIndex: number; // 0-based across all matches
  text: string;
}

export interface PageDimension {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface ReaderState {
  currentPage: number; // 1-based
  totalPages: number;
  scale: number;
  zoomMode: ZoomMode;
  isFullscreen: boolean;
  isSearchOpen: boolean;
  isTocOpen: boolean;
}

export type AnnotationType = "highlight" | "underline" | "strikethrough";

/** Page-relative fractions, independent of the rendered viewport and device pixels. */
export interface AnnotationRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnnotationGeometry {
  version: 1;
  rects: AnnotationRect[];
}

export interface DocumentAnnotation {
  id: string;
  documentId: string;
  pageNumber: number;
  type: AnnotationType;
  selectedText: string;
  geometry: AnnotationGeometry;
  createdAt: string;
}
