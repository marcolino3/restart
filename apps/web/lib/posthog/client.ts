/**
 * PostHog Browser-SDK Bootstrapping.
 *
 * Wird NUR aufgerufen, wenn der User dem Analytics-Cookie zugestimmt hat.
 * Lazy-Import damit das ~30 KB Bundle nicht für Nicht-Einwilliger lädt.
 */
import type { PostHog } from "posthog-js";

let cached: PostHog | null = null;

export async function initPostHog(): Promise<PostHog | null> {
  if (typeof window === "undefined") return null;
  if (cached) return cached;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  // Dynamic-Import: das gesamte posthog-js Bundle wird erst geladen, nachdem
  // der User zugestimmt hat (oder bei einem expliziten capture()-Aufruf).
  const { default: posthog } = await import("posthog-js");

  posthog.init(key, {
    // Reverse-Proxy via Next.js Rewrite, sonst blockieren AdBlocker oft
    // `*.posthog.com`. Server-Side Rewrite in next.config.ts.
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ??
      `${window.location.origin}/ingest`,
    ui_host:
      process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://eu.posthog.com",

    // EU-Region — DSGVO/revDSG-konform.
    // Wenn NEXT_PUBLIC_POSTHOG_HOST gesetzt ist, ist ui_host nur für Links
    // aus der App heraus relevant.

    // KRITISCH: keine anonymen Profile. Erst nach explizitem identify()
    // wird ein Person-Profil angelegt — sonst kommen wir DSGVO-rechtlich
    // in Erklärungsnot ("Welche personenbezogenen Daten verarbeitet ihr?").
    person_profiles: "identified_only",

    // Browser-DNT respektieren — User die DNT senden, werden NICHT getrackt.
    respect_dnt: true,

    // Auto-Pageviews via History-Listener (App-Router-kompatibel).
    // Wir nutzen ein zusätzliches manuelles Tracking im PostHogPageViewTracker
    // für saubere Locale-/Routing-Events.
    capture_pageview: "history_change",
    capture_pageleave: true,

    // Keine Form-Inputs aufzeichnen — schützt vor PII-Leaks bei z. B.
    // E-Mail- und Namensfeldern.
    autocapture: {
      element_attribute_ignorelist: ["data-pii"],
      dom_event_allowlist: ["click", "submit"],
    },
    mask_all_text: false,
    mask_all_element_attributes: false,

    // Session-Recording aus — bewusst keine Schul-/Kinderdaten aufnehmen.
    disable_session_recording: true,

    // Cross-Subdomain-Cookies aus (separater staging/prod-Auswertung).
    cross_subdomain_cookie: false,

    // Loadable-Decide-Funktion: lädt Feature-Flags asynchron. Default an.
    loaded: (instance) => {
      if (process.env.NODE_ENV !== "production") {
        instance.debug(false);
      }
    },
  });

  cached = posthog;
  return cached;
}

/**
 * Aktuelle PostHog-Instanz (null wenn nicht initialisiert).
 */
export function getPostHog(): PostHog | null {
  return cached;
}

export function teardownPostHog(): void {
  if (cached) {
    cached.opt_out_capturing();
    cached.reset();
    cached = null;
  }
}
