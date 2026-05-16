"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useConsent } from "./ConsentContext";
import { getPostHog } from "@/lib/posthog/client";

/**
 * App-Router-Pageview-Tracking. PostHog's eingebautes `capture_pageview:
 * history_change` deckt Client-Navigationen ab, aber nicht die initiale
 * Seite mit Server-Component-Rendering. Dieser Helper triggert manuell
 * einen `$pageview` bei jeder Pfad-/Query-Änderung.
 *
 * Wird nur gerendert wenn Consent vorliegt — dadurch lädt es PostHog erst
 * gar nicht in den Browser, wenn der User ablehnt.
 */
export function PostHogPageView() {
  const { consent } = useConsent();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (consent !== "accepted") return;
    const ph = getPostHog();
    if (!ph) return;

    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    ph.capture("$pageview", { $current_url: url });
  }, [consent, pathname, searchParams]);

  return null;
}
