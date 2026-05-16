import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung — Restart",
  description: "Datenschutzerklärung der Restart Schul-Software",
};

/**
 * STUB — muss vor Go-Live durch eine juristisch geprüfte
 * Datenschutzerklärung ersetzt werden (Schweizer revDSG + EU-DSGVO).
 *
 * Pflichtangaben (Auswahl):
 *  - Verantwortliche Stelle (Anschrift, Kontakt)
 *  - Zwecke der Verarbeitung
 *  - Rechtsgrundlage (DSGVO Art. 6, revDSG)
 *  - Empfänger (Infomaniak, Google für OAuth/Maps)
 *  - Speicherdauer
 *  - Betroffenenrechte (Auskunft, Berichtigung, Löschung, Datenportabilität)
 *  - Cookies + Tracking (Liste, Zweck, Speicherdauer pro Cookie)
 *  - Datentransfers ausserhalb CH/EU
 *  - Beschwerderecht bei Aufsichtsbehörde
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-bold">Datenschutzerklärung</h1>

      <section className="space-y-2">
        <p className="text-muted-foreground">
          ⚠ Diese Seite ist ein Platzhalter. Vor der produktiven Inbetriebnahme
          muss eine vollständige Datenschutzerklärung gemäss Schweizer revDSG
          und EU-DSGVO eingestellt werden — idealerweise juristisch geprüft.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Cookies und Tracking</h2>
        <p>
          Wir verwenden ausschliesslich technisch notwendige Cookies für den
          Login (better-auth Session-Cookie). Es werden keine Analytics- oder
          Tracking-Cookies gesetzt.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Eingesetzte Drittdienste</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Infomaniak (Hosting, Cloud-Infrastruktur, Schweiz)</li>
          <li>Google (OAuth-Login, Google Maps API)</li>
        </ul>
      </section>
    </main>
  );
}
