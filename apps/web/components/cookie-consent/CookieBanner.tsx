"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useConsent } from "./ConsentContext";

/**
 * DSGVO/revDSG-konformer Cookie-Banner.
 *
 * Verhalten:
 *  - Wird nur gerendert, wenn keine Entscheidung getroffen wurde.
 *  - "Notwendige" Cookies (better-auth Session) werden NICHT erwähnt als
 *    optional — sie sind technisch zwingend und brauchen kein Consent.
 *  - "Analytics" ist explizit opt-in (PostHog).
 *  - Keine "weiter surfen = zustimmen"-Logik. Schweizer Recht & DSGVO
 *    setzen aktive Einwilligung voraus.
 *  - "Ablehnen" ist gleich prominent wie "Akzeptieren" (Dark-Pattern-frei).
 */
export function CookieBanner() {
  const { consent, accept, reject } = useConsent();
  const t = useTranslations("CookieConsent");

  if (consent !== undefined) return null;

  return (
    <div
      // Lebenswichtig: vor allen anderen Layern, fokus-trap-fähig, aria-live
      // damit Screen-Reader es ankündigen.
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed inset-x-0 bottom-0 z-[100] border-t bg-background shadow-lg"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 p-4 md:flex-row md:items-center md:gap-6 md:p-6">
        <div className="flex-1 space-y-1">
          <p id="cookie-banner-title" className="text-sm font-semibold">
            {t("title")}
          </p>
          <p id="cookie-banner-desc" className="text-sm text-muted-foreground">
            {t("description")}{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t("privacyLink")}
            </Link>
            .
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={reject}
            data-testid="cookie-reject"
          >
            {t("reject")}
          </Button>
          <Button
            size="sm"
            onClick={accept}
            data-testid="cookie-accept"
          >
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
