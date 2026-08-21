/**
 * Runtime theming for the mobile app.
 *
 * `tailwind.config.js` resolves every colour through a CSS variable, and this
 * provider supplies those variables via NativeWind's `vars()`. Switching a
 * theme therefore recolours the whole tree without any per-component work.
 *
 * The server is the source of truth: the web app persists the theme on the
 * caller's membership in the active org (`updateMyTheme`), so a theme picked
 * here follows the user to the browser and back. AsyncStorage only caches it
 * for the first paint, before the session query has returned — a preference,
 * not a credential, so it does not belong in SecureStore.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { View, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { gql } from "graphql-request";
import { vars } from "nativewind";

import { gqlClient } from "./gql-client";
import { THEMES, THEME_NAMES, type ThemeName } from "./themes";

const STORAGE_KEY = "restart.theme";

/**
 * Keeps the browser chrome on the palette. `app/+html.tsx` sets both values
 * from the cached theme before the first paint; this carries a later change
 * over, which that script cannot see. A no-op off the web.
 */
function syncBrowserChrome(name: ThemeName) {
  if (Platform.OS !== "web" || typeof document === "undefined") return;
  const palette = THEMES[name];
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", palette["--primary"]);
  document.body.style.backgroundColor = palette["--background"];
}
const DEFAULT_THEME: ThemeName = "salbei";

const AuthContextThemeDocument = gql`
  query AuthContextTheme {
    authContext {
      theme
    }
  }
`;

const UpdateMyThemeDocument = gql`
  mutation UpdateMyTheme($input: UpdateMyThemeInput!) {
    updateMyTheme(input: $input)
  }
`;

const isThemeName = (value: string | null): value is ThemeName =>
  value != null && (THEME_NAMES as readonly string[]).includes(value);

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

/**
 * The active palette as plain colour values, for the props that take a colour
 * rather than a class name — icon strokes above all. Tailwind classes resolve
 * through `vars()` on their own and should keep doing so; this is only for
 * what cannot be expressed as a class.
 */
/**
 * A palette colour at partial opacity, as an rgba() string.
 *
 * Tailwind's `/opacity` modifier cannot be used on these colours: the config
 * resolves every one of them through `var(--token, …)`, and the modifier needs
 * a bare channel triplet to splice an alpha into. Given a full `#rrggbb` it
 * produces an invalid colour, which renders as opaque black — so anything
 * translucent has to come through here and be passed as a style.
 */
export function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useColors() {
  const { theme } = useTheme();
  const palette = THEMES[theme];

  return useMemo(
    () => ({
      background: palette["--background"],
      card: palette["--card"],
      border: palette["--border"],
      foreground: palette["--foreground"],
      mutedForeground: palette["--muted-foreground"],
      field: palette["--field"],
      primary: palette["--primary"],
      primaryForeground: palette["--primary-foreground"],
      accent: palette["--accent"],
      accentForeground: palette["--accent-foreground"],
      timer: palette["--timer"],
      timerForeground: palette["--timer-foreground"],
      gold: palette["--gold"],
      goldForeground: palette["--gold-foreground"],
      destructive: palette["--status-rose-fg"],
      amberBg: palette["--status-amber-bg"],
      amberFg: palette["--status-amber-fg"],
    }),
    [palette],
  );
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    let cancelled = false;

    // The cache first, so the app does not paint the default and then jump.
    void AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!cancelled && isThemeName(stored)) setThemeState(stored);
      })
      // A missing or unreadable cache just leaves the default in place.
      .catch(() => {});

    // Then the server, which wins: the theme is stored per membership, so it
    // may have been changed in the browser or on another device.
    void gqlClient
      .request<{ authContext?: { theme?: string | null } | null }>(
        AuthContextThemeDocument,
      )
      .then(({ authContext }) => {
        const remote = authContext?.theme ?? null;
        if (cancelled || !isThemeName(remote)) return;
        setThemeState(remote);
        void AsyncStorage.setItem(STORAGE_KEY, remote).catch(() => {});
      })
      // Signed out, offline, or no membership: the cached choice stands.
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Covers every way the theme can change — the cache, the server, a pick —
  // rather than each of them having to remember the browser chrome.
  useEffect(() => {
    syncBrowserChrome(theme);
  }, [theme]);

  const setTheme = useCallback((name: ThemeName) => {
    // Applied immediately; persisting is a background concern, and a failed
    // write must not undo what the user just picked.
    setThemeState(name);
    void AsyncStorage.setItem(STORAGE_KEY, name).catch(() => {});
    void gqlClient
      .request(UpdateMyThemeDocument, { input: { theme: name } })
      // Best-effort, as on the web: a failure only means the choice does not
      // follow the user to other devices until the next successful save.
      .catch(() => {});
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={[{ flex: 1 }, vars(THEMES[theme])]}>{children}</View>
    </ThemeContext.Provider>
  );
}
