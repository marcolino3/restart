"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ConsentValue } from "@/lib/consent";
import { writeConsent, clearConsent } from "@/lib/consent";
import { initPostHog, teardownPostHog } from "@/lib/posthog/client";

type ConsentContextValue = {
  consent: ConsentValue | undefined;
  accept: () => void;
  reject: () => void;
  reset: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({
  initialConsent,
  children,
}: {
  initialConsent: ConsentValue | undefined;
  children: React.ReactNode;
}) {
  const [consent, setConsent] = useState<ConsentValue | undefined>(initialConsent);

  // Beim Mount: wenn Consent schon "accepted" war, PostHog initialisieren.
  useEffect(() => {
    if (consent === "accepted") {
      void initPostHog();
    }
    if (consent === "rejected") {
      teardownPostHog();
    }
  }, [consent]);

  const accept = useCallback(() => {
    writeConsent("accepted");
    setConsent("accepted");
    void initPostHog();
  }, []);

  const reject = useCallback(() => {
    writeConsent("rejected");
    setConsent("rejected");
    teardownPostHog();
  }, []);

  const reset = useCallback(() => {
    clearConsent();
    teardownPostHog();
    setConsent(undefined);
  }, []);

  const value = useMemo<ConsentContextValue>(
    () => ({ consent, accept, reject, reset }),
    [consent, accept, reject, reset],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent muss innerhalb von ConsentProvider verwendet werden");
  }
  return ctx;
}
