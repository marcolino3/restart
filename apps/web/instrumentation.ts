/**
 * Next.js Instrumentation-Hook — wird einmalig pro Runtime beim Boot ausgeführt.
 * Lädt die passende Sentry-Config je nach Runtime.
 * https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Re-export: Next.js ruft das auf, wenn ein Request einen unbehandelten
// Fehler wirft (z. B. in einer Server Action oder Route Handler).
export const onRequestError = Sentry.captureRequestError;
