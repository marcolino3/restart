"use client";

/**
 * Global-Error-Boundary für die Next.js App-Router-App.
 * Fängt Render-Fehler in den Root-Layouts, die kein anderer error.tsx erwischt.
 * Muss `<html>` + `<body>` selber rendern, weil das Root-Layout dann nicht
 * mehr läuft.
 */
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
