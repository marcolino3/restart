/**
 * Sentry-Client-Initialisierung — läuft im Browser sobald die App startet.
 * Bei Next 15+ ersetzt das die alte `sentry.client.config.ts`.
 *
 * DSN wird als NEXT_PUBLIC_SENTRY_DSN gebaut (build-time inlined), damit das
 * Browser-Bundle die Sentry-Endpoint kennt. Das ist OK — DSNs sind keine
 * Geheimnisse, nur Rate-Limit-Schutz nötig (im Sentry-Projekt einstellen).
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
      process.env.NODE_ENV ??
      "development",
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

    tracesSampleRate: parseFloat(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
        (process.env.NODE_ENV === "production" ? "0.1" : "1.0"),
    ),

    // Session Replay — bewusst aus für die erste Phase (Datenschutz Schul-SaaS).
    // Bei Bedarf später aktivieren mit maskAllText: true + blockAllMedia: true.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    sendDefaultPii: false,

    beforeSend(event) {
      // Auth-Routen: weder URL-Pfad-Args noch Headers leaken
      if (event.request?.url?.includes("/api/auth/")) {
        if (event.request) {
          delete event.request.cookies;
          delete event.request.data;
        }
      }
      return event;
    },

    ignoreErrors: [
      // Browser-Rauschen
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured",
      // Next.js
      "NEXT_REDIRECT",
      "NEXT_NOT_FOUND",
    ],
  });
}

// Pflicht für Sentry Next.js v9+: Navigationen tracen.
// Auf v8.x ist captureRouterTransitionStart noch nicht vorhanden — dann no-op.
// Dynamic key-access um Turbopack-Statische-Analyse zu umgehen.
const sentryDyn = Sentry as unknown as Record<string, (...args: unknown[]) => void>;
export const onRouterTransitionStart =
  sentryDyn["captureRouterTransitionStart"] ?? (() => {});
