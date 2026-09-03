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

import type { ThemeMode } from "./profile";

const THEME_STORAGE_KEY = "reeda_theme_preference";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const val = localStorage.getItem(THEME_STORAGE_KEY);
    if (val === "light" || val === "dark" || val === "system") {
      return val;
    }
  } catch {
    // Ignore storage errors
  }
  return "system";
}

export function applyTheme(mode: ThemeMode): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Ignore storage errors
  }

  const root = document.documentElement;

  if (mode === "dark") {
    root.classList.add("dark");
  } else if (mode === "light") {
    root.classList.remove("dark");
  } else {
    // system
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (systemDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
}

/**
 * Initializes theme listener for system preference changes when in 'system' mode.
 * Returns an unmount/cleanup function.
 */
export function initThemeListener(getCurrentMode: () => ThemeMode): () => void {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = () => {
    if (getCurrentMode() === "system") {
      applyTheme("system");
    }
  };

  mediaQuery.addEventListener("change", handleChange);
  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
}
