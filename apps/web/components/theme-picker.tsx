"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useTheme } from "@/components/providers/theme-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updateMyThemeAction } from "@/features/users/actions/update-my-theme.action";
import { THEMES, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

function ThemeSwatch({
  accent,
  surface,
  className,
}: {
  accent: string;
  surface: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn("relative block overflow-hidden rounded-full", className)}
    >
      <span className="absolute inset-0" style={{ background: accent }} />
      <span
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: surface }}
      />
    </span>
  );
}

/**
 * Theme switcher for the app color theme (design handoff: sidebar theme
 * picker). The trigger shows only the active theme; the full swatch list
 * lives in a popover so the sidebar stays calm. Reusable anywhere inside the
 * ThemeProvider — colors come from the theme registry. The selection is
 * applied locally (ThemeProvider → data-theme + localStorage) and persisted on
 * the caller's membership so it follows the user across devices (per active
 * org).
 */
export function ThemePicker({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("ThemePicker");
  const [open, setOpen] = useState(false);

  const activeTheme = THEMES.find((entry) => entry.id === theme);
  const activeLabel = activeTheme?.label ?? theme;

  const selectTheme = (id: ThemeId) => {
    setTheme(id);
    setOpen(false);
    // Fire-and-forget: local application already happened; the action logs
    // failures and the theme is re-saved on the next pick.
    void updateMyThemeAction(id);
  };

  return (
    <div className={cn("px-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
          aria-label={t("theme")}
        >
          {activeTheme ? (
            <ThemeSwatch
              accent={activeTheme.accent}
              surface={activeTheme.surface}
              className="size-[22px] shrink-0"
            />
          ) : null}
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-(--sidebar-soft)">
            {t("theme")}
          </span>
          <b className="ml-auto truncate text-[10.5px] font-semibold">
            {activeLabel}
          </b>
        </PopoverTrigger>
        <PopoverContent align="start" side="top" className="w-auto p-3">
          <div
            role="radiogroup"
            aria-label={t("theme")}
            className="grid grid-cols-5 gap-2"
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
                  "size-[30px] rounded-full border-2 border-transparent transition-colors",
                  theme === entry.id &&
                    "border-foreground shadow-[inset_0_0_0_2px_var(--popover)]"
                )}
              >
                <ThemeSwatch
                  accent={entry.accent}
                  surface={entry.surface}
                  className="size-full"
                />
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
