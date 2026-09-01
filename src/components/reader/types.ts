export type ZoomMode = "fit-width" | "fit-page" | "custom";

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
