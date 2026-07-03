"use client";

import * as React from "react";

import { useTheme } from "@/components/providers/theme-provider";
import { isThemeId } from "@/lib/themes";

/**
 * Applies the theme persisted on the user's membership (server-side source
 * of truth, per active org) after hydration. localStorage + the no-FOUC
 * inline script stay the fast path for the first paint; this component
 * corrects it when the profile says otherwise (new device, org switch,
 * theme picked elsewhere).
 *
 * Each server value is applied at most once so a locally picked theme is
 * not reverted by a stale prop before the server re-renders.
 */
export function ProfileThemeSync({ theme }: { theme?: string | null }) {
  const { setTheme } = useTheme();
  const applied = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!isThemeId(theme) || applied.current === theme) return;
    applied.current = theme;
    setTheme(theme);
  }, [theme, setTheme]);

  return null;
}
