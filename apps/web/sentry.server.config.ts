/**
 * Sentry-Konfiguration für Server-Code (Server Components, Route Handlers,
 * Server Actions). Wird von instrumentation.ts in der nodejs-Runtime geladen.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
    release: process.env.SENTRY_RELEASE,

    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE ??
        (process.env.NODE_ENV === "production" ? "0.1" : "1.0"),
    ),

    // Kein PII (Schul-SaaS, DSGVO/revDSG).
    sendDefaultPii: false,

    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers["cookie"];
        delete event.request.headers["authorization"];
      }
      if (event.request?.url?.includes("/api/auth/")) {
        delete event.request.data;
        delete event.request.cookies;
      }
      return event;
    },

    ignoreErrors: [
      "NEXT_REDIRECT",
      "NEXT_NOT_FOUND",
    ],
  });
}
