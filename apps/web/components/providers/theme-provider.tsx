"use client";

import * as React from "react";

import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isThemeId,
  type ThemeId,
} from "@/lib/themes";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start with the default on server AND first client render (hydration-safe),
  // then adopt the persisted theme that the no-FOUC inline script in the root
  // layout has already applied to <html>.
  const [theme, setThemeState] = React.useState<ThemeId>(DEFAULT_THEME);

  React.useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (isThemeId(current)) setThemeState(current);
  }, []);

  const setTheme = React.useCallback((next: ThemeId) => {
    if (!isThemeId(next)) return;
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage unavailable (private mode) — theme still applies for the session.
    }
  }, []);

  const value = React.useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }
  return context;
}
