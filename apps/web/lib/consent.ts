/**
 * Cookie-Consent State.
 *
 * Wir lagern die Entscheidung in einem First-Party-Cookie ab, damit
 *  (a) der Server beim SSR weiss, ob der Banner gerendert werden muss,
 *      und so der Flicker beim Hydration ausbleibt;
 *  (b) die Entscheidung 12 Monate erhalten bleibt (DSGVO-Empfehlung);
 *  (c) wir KEIN Tracking-Tool laden müssen, nur um den Consent-Status zu lesen.
 *
 * Werte:
 *  - "accepted"  → User hat Analytics aktiv erlaubt (opt-in)
 *  - "rejected"  → User hat ausdrücklich abgelehnt → Banner nicht mehr zeigen
 *  - undefined   → Entscheidung steht aus → Banner zeigen
 */

export const CONSENT_COOKIE = "cc-analytics";
export const CONSENT_VERSION = "1"; // bei Banner-Text-Änderung erhöhen → Re-Prompt
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 1 Jahr

export type ConsentValue = "accepted" | "rejected";

/**
 * Liest den Consent aus einem rohen Cookie-Header (SSR) oder document.cookie (CSR).
 * Bei Version-Mismatch (Banner-Update) wird der alte Eintrag ignoriert.
 */
export function readConsent(cookieHeader: string | undefined | null): ConsentValue | undefined {
  if (!cookieHeader) return undefined;
  const cookies = parseCookies(cookieHeader);
  const raw = cookies[CONSENT_COOKIE];
  if (!raw) return undefined;
  const [version, value] = raw.split(":");
  if (version !== CONSENT_VERSION) return undefined;
  if (value === "accepted" || value === "rejected") return value;
  return undefined;
}

export function writeConsent(value: ConsentValue): void {
  if (typeof document === "undefined") return;
  const v = `${CONSENT_VERSION}:${value}`;
  // SameSite=Lax: für First-Party-Use-Case ausreichend, Secure in prod.
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${CONSENT_COOKIE}=${encodeURIComponent(v)}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
}

export function clearConsent(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    if (key) out[key] = val;
  }
  return out;
}
