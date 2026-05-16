"use client";

import { Suspense } from "react";
import { ConsentProvider } from "./ConsentContext";
import { CookieBanner } from "./CookieBanner";
import { PostHogPageView } from "./PostHogPageView";
import type { ConsentValue } from "@/lib/consent";

/**
 * Eine Komponente, drei Aufgaben:
 *  1. Stellt den ConsentContext bereit (Children können useConsent() nutzen,
 *     z. B. für einen "Cookie-Einstellungen ändern"-Link im Footer).
 *  2. Rendert den Banner solange keine Entscheidung getroffen wurde.
 *  3. Sendet $pageview-Events an PostHog — nur wenn Consent vorliegt.
 *
 * `initialConsent` kommt aus dem Server-Component-Layout, das den
 * cc-analytics Cookie via next/headers liest.
 */
export function CookieConsent({
  initialConsent,
  children,
}: {
  initialConsent: ConsentValue | undefined;
  children: React.ReactNode;
}) {
  return (
    <ConsentProvider initialConsent={initialConsent}>
      {children}
      <CookieBanner />
      {/*
       * useSearchParams() rendert clientseitig und muss in einem Suspense-
       * Boundary leben, sonst meckert Next.js bei statischen Routes.
       */}
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
    </ConsentProvider>
  );
}
