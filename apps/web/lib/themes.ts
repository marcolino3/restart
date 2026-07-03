/**
 * Restart theme registry (design handoff "SaaS-Shell mit Theme-System").
 *
 * Each theme corresponds to a `[data-theme="<id>"]` block in
 * `app/[locale]/globals.css`. `accent` / `surface` are only used to render
 * the two-tone swatches in the theme picker — components must always use
 * the mapped CSS variables, never these hex values.
 */
export const THEMES = [
  { id: "salbei", label: "Salbei", accent: "#3a7d44", surface: "#f7f5f0" },
  { id: "lagune", label: "Lagune", accent: "#2a9d8f", surface: "#faf7f2" },
  { id: "himmel", label: "Himmel", accent: "#2f7bd0", surface: "#f4f7fa" },
  { id: "indigo", label: "Indigo", accent: "#4f5dd8", surface: "#f4f5fa" },
  { id: "flieder", label: "Flieder", accent: "#7d55cc", surface: "#f7f5fa" },
  { id: "terracotta", label: "Terracotta", accent: "#bb5d3a", surface: "#faf6f1" },
  { id: "ozean", label: "Ozean", accent: "#20708d", surface: "#f3f7f8" },
  { id: "wald", label: "Wald", accent: "#2d6a4f", surface: "#f5f7f4" },
  { id: "beere", label: "Beere", accent: "#a34d74", surface: "#faf6f8" },
  { id: "honig", label: "Honig", accent: "#a97a24", surface: "#faf7f0" },
  { id: "schiefer", label: "Schiefer", accent: "#42566b", surface: "#f4f6f8" },
  { id: "graphit", label: "Graphit", accent: "#1c1c1a", surface: "#f7f7f6" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export const DEFAULT_THEME: ThemeId = "salbei";
export const THEME_STORAGE_KEY = "restart-theme";

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}
