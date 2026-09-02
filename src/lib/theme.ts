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
