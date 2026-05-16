/**
 * Sentry-Konfiguration für die Edge-Runtime (Middleware, Edge-Routes).
 * Wird von instrumentation.ts in der edge-Runtime geladen.
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
    sendDefaultPii: false,
  });
}
