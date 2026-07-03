"use client";

import { useTranslations } from "next-intl";

import { useTheme } from "@/components/providers/theme-provider";
import { updateMyThemeAction } from "@/features/users/actions/update-my-theme.action";
import { THEMES, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

/**
 * Two-tone swatch row to switch the app color theme (design handoff:
 * sidebar theme picker). Reusable anywhere inside the ThemeProvider —
 * colors come from the theme registry. The selection is applied locally
 * (ThemeProvider → data-theme + localStorage) and persisted on the caller's
 * membership so it follows the user across devices (per active org).
 */
export function ThemePicker({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("ThemePicker");

  const activeLabel =
    THEMES.find((entry) => entry.id === theme)?.label ?? theme;

  const selectTheme = (id: ThemeId) => {
    setTheme(id);
    // Fire-and-forget: local application already happened; the action logs
    // failures and the theme is re-saved on the next pick.
    void updateMyThemeAction(id);
  };

  return (
    <div className={cn("px-2", className)}>
      <div className="mb-2 flex items-center text-[10.5px] font-semibold uppercase tracking-[0.08em] text-(--sidebar-soft)">
        {t("theme")}
        <b className="ml-auto font-semibold normal-case tracking-normal">
          {activeLabel}
        </b>
      </div>
      <div
        role="radiogroup"
        aria-label={t("theme")}
        className="flex flex-wrap gap-2"
      >
        {THEMES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="radio"
            aria-checked={theme === entry.id}
            title={entry.label}
            aria-label={entry.label}
            onClick={() => selectTheme(entry.id)}
            className={cn(
              "relative size-[30px] overflow-hidden rounded-full border-2 border-transparent transition-colors",
              theme === entry.id &&
                "border-sidebar-foreground shadow-[inset_0_0_0_2px_var(--sidebar)]"
            )}
          >
            <span
              aria-hidden
              className="absolute inset-0"
              style={{ background: entry.accent }}
            />
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1/2"
              style={{ background: entry.surface }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
