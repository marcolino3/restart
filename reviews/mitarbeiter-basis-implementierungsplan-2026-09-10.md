# Implementierungsplan: Mitarbeiter-Basisinformationen

Planstand: 10.09.2026. Lokaler Abschluss am 16.09.2026: [Nachweise und Grenzen](./mitarbeiter-basis-abschluss-2026-09-16.md). Externe CI und produktiver Cutover stehen außerhalb dieses lokalen Abschlusses noch aus. Grundlage: [Review mit allen Fundstellen](./mitarbeiter-basis-review-2026-09-10.md).

Ziel: Alle **16 Befunde S1–S6 und F1–F10** beheben, falsche Testannahmen korrigieren, fehlende Unit-/Komponenten-/API-/DB-Tests ergänzen und die relevanten Browser-E2E tatsächlich lokal und in CI ausführen. Die folgende Planung ist als historische Grundlage erhalten; die Umsetzung liegt inzwischen im Arbeitsbaum.

Vertragsberechnung, Lohn, Absenzen und Zeiterfassung bleiben fachlich unverändert. Gemeinsame Wizard-, User-, Membership-, Rollen- und Datumsbausteine werden soweit nötig angepasst; ihre weiteren Aufrufer erhalten Regressionstests.

## Leitentscheidungen für die Umsetzung

1. **Mitarbeiter-Stammdaten gehören der Organisation.** Name, Anrede, Geburtstag, AHV, private Kontaktdaten, Adresse und Foto werden am organisationsbezogenen Mitarbeiterprofil gepflegt. Das globale `User`-Konto ist die Login-Identität. Mitarbeiterbearbeitung schreibt keine globalen Personendaten mehr.
2. **Ein Mitarbeiterdatensatz muss ohne verknüpftes Login existieren können.** Einladungen und Kontoverknüpfung sind separate, bestätigte Vorgänge. Die Eingabe einer bekannten E-Mail verleiht weder Zugriff auf das bestehende Konto noch eine aktive Mitgliedschaft.
3. **Rollenänderung ist ein eigener autorisierter Vorgang.** Reines Speichern der Basisinformationen übermittelt keine Rollen oder Vertragsdaten. Mehrere vorhandene Rollen bleiben erhalten.
4. **PATCH ist eindeutig:** ausgelassen = unverändert; `null` = optionalen Wert löschen; gültiger Wert = setzen. Pflichtwerte dürfen weder `null` noch leer sein. Ein reines Kalenderdatum wird als `YYYY-MM-DD` ohne Zeitanteil geführt.
5. **Erfolg bedeutet persistierter aktueller Stand.** Keine Erfolgsmeldung nach fehlgeschlagenem Save, keine Finalisierung einer überholten Version, keine still ignorierten Eingaben.
6. **Bestehende Konten werden beim Draft-Löschen erhalten.** Der konkrete Löschvorgang entfernt ausschließlich den zulässigen Draft und eindeutig zugehörige Entwurfsdaten. Globale Kontolöschung gehört nicht dazu.

Diese Entscheidungen bilden den vorgeschlagenen Zielzustand. Vor der Datenmigration wird die konkrete Entity-/API-Ausgestaltung als kurze Architekturentscheidung im Repository festgehalten. Das ist ein Arbeitsschritt, keine zusätzliche Freigabeschleife für jeden Fix.

## Reihenfolge und Arbeitspakete

### Paket 0 – Regressionen und isolierte Testumgebung vorbereiten

**Umfang**

- Aktuellen Stand und vorhandene lokale Änderungen erfassen; Review-Befunde als Checkliste übernehmen.
- Pro Befund mindestens einen aussagekräftigen Regressionstest anlegen, der das gewünschte Verhalten vor dem Fix nicht erfüllt. Zusammengehörige Fälle dürfen dieselbe parametrisierte Suite nutzen.
- Bestehende Integrationseinrichtung in `apps/backend/test/test-utils.ts`, `docker-compose.test.yml` und CI wiederverwenden.
- Vor `dropSchema`/`TRUNCATE` eine explizite Testdatenbank-Prüfung einbauen. Nicht nur auf den Datenbanknamen vertrauen: ausschließlich dedizierte Testkonfiguration plus bewusst aktivierter Reset. Kein Zugriff auf Entwicklungs-, Staging- oder Produktivdaten.
- DB-Integration und Browser-E2E mit getrennten Datenbanken ausführen; E2E-Server auf separaten Ports starten und keinen beliebigen laufenden Dev-Server wiederverwenden.
- Fixtures für zwei Organisationen und folgende Identitäten: anonym, Mitglied ohne Mitarbeiterrechte, Read-only, Writer ohne Rollenrechte, eingeschränkter Rollenverwalter, Owner, ausschließlich `SCHOOL_CLASS_READ`, Superadmin.
- Auth-Fixtures müssen Better-Auth- und Domain-Konto konsistent anlegen; echte Sessions pro Identität und Browserkontext verwenden. Fixtures eindeutig pro Testlauf benennen.
- Lokalen Mail-Sink/Test-Mailadapter und isolierten Storage für Foto-/Verknüpfungstests bereitstellen. Keine externen Einladungen oder echten Benutzerkonten verwenden.

**Abnahme:** Testlauf startet mit leeren isolierten Datenbanken, erzeugt seine eigenen Fixtures und hinterlässt keine Daten außerhalb dieser Umgebung. Ein falsches DB-Ziel führt vor jeder Mutation zum Abbruch.

### Paket 1 – Unmittelbare Berechtigungslücken schließen

**Befunde:** S1, S2, S3, S5; vorläufige Absicherung von S4.

**Backend**

- CSV-Route mit `EMPLOYEE_WRITE` absichern.
- Membership-Lese-/Schreib-/Anlegepfade auf Caller-Organisation begrenzen. Auch alternative Pfade zur Kontoverknüpfung einbeziehen, damit die Sperre im Employee-Service nicht umgangen werden kann.
- Update-DTO ausdrücklich erlaubte Felder definieren; `organizationId`, `userId` und freie `userEmailId` nicht über allgemeinen Stammdaten-Patch ändern lassen. Alle bestehenden Aufrufer erfassen und gemeinsam migrieren.
- Akteur an Rollenänderungen weiterreichen. Gemeinsame Autorisierung für Wizard und dedizierte Rollen-APIs verwenden: `ROLE_ASSIGN`, zulässige Zielorganisation, keine Vergabe eigener nicht vorhandener Rechte einschließlich Feldrechten; Owner-Schutz beachten.
- Rollenänderungen und Schutz des letzten Owners transaktional gegen konkurrierende Requests sichern. Explizite privilegierte Ausnahmen zentral definieren, nicht aus UI-Rollennamen ableiten.
- `teachersByOrgId` auf einen schmalen GraphQL-Ausgabetyp mit benötigten IDs und Anzeigenamen umstellen. Schulklassen-Aufrufer und generierte Typen anpassen.
- Zugriff auf private `User`-Felder über andere GraphQL-Pfade prüfen und mit zentraler Feld-/Objektberechtigung absichern. Nicht nur die Web-Query verkleinern.
- Bis Paket 2 vollständig umgestellt ist: automatische Verknüpfung fremder bestehender Konten verhindern und organisationsübergreifende globale User-Änderungen blockieren. Als klarer fachlicher Fehler antworten, keine fremden Kontodetails zurückgeben.

**Tests**

- Echte GraphQL-/HTTP-Pipeline mit Guards, Pipes und Feld-Middleware; bei erfolgreicher Anfrage reale DB-Persistenz kontrollieren.
- Rollen-/Mandantenmatrix für Employee, Membership, CSV und TeacherOption.
- Eskalation eigener/fremder Membership, fremde Rolle, fehlendes `ROLE_ASSIGN`, letzte Owner-Rolle und konkurrierende Entrollung.
- Ohne aktive Organisation muss jeder organisationsbezogene Pfad scheitern; Superadmin-Ausnahmen ausdrücklich testen.
- GraphQL-Fehler und fehlende Nutzdaten prüfen, nicht pauschal HTTP 403 erwarten: GraphQL kann Fehler mit HTTP 200 transportieren.

**Abnahme:** Kein bekannter alternativer API-Pfad umgeht die Berechtigungen. Abgelehnte Requests verändern weder Daten noch Rollen oder Audit-Historie.

### Paket 2 – Mitarbeiterprofil und Login-Konto sicher trennen

**Befunde:** S4, F2, F9; Grundlage für F1/F5.

**Datenmodell und Migration**

- Organisationszugehörigkeit des Employee direkt und unveränderlich abbilden; eine ausschließlich über Membership ableitbare Organisation genügt für einen noch nicht verknüpften Mitarbeiter nicht.
- Organisationsbezogene Basisinformationen in einer dedizierten 1:1-Profiltabelle oder expliziten Employee-Spalten ablegen. Konkrete Variante nach Relation-/Consumer-Inventar wählen und dokumentieren.
- Optionale Verbindung zwischen Mitarbeiter und bestätigter Login-Membership modellieren. Datenbank-Constraints müssen organisationstreue Verknüpfungen und eindeutige Zuordnungen absichern.
- Additive Migration: neue Felder/Relationen, Backfill bestehender Mitarbeiter aus der bisherigen Quelle, anschließend Konsistenzprüfung. Keine globalen User-Daten in derselben Migration löschen.
- Backfill kopiert den aktuell gespeicherten Bestand pro bestehendem Mitarbeiter. Bereits früher organisationsübergreifend überschriebene Werte sind daraus nicht rekonstruierbar; dies im Migrationsprotokoll ausdrücklich ausweisen.
- Bestehende Konto-Verknüpfungen nicht rückwirkend als nachweislich bestätigt markieren. Herkunft/Legacy-Zustand erfassen; neue unbestätigte Verknüpfungen sicher sperren. Auffällige Bestände separat ausweisen, ohne Konten automatisiert zu löschen.
- Lese-/Schreibpfade koordiniert umstellen: Liste, Detail, Wizard, CSV, TeacherOption, Fotos, Audit sowie angrenzende Verbraucher, die bisher `membership.user` als Mitarbeiterprofil erwarten. Mobile-/Shared-Type-Verbraucher mitprüfen.
- Nach Backfill niemals unbemerkt auf globale private User-Felder zurückfallen. Fehlende Profile müssen erkennbar und reparierbar sein.

**Kontoverknüpfung und E-Mail**

- Vor Bestätigung ausschließlich organisationsbezogene, vom berechtigten Bearbeiter eingegebene Daten zeigen. Keine Kontosuche mit Offenlegung bestehender Personendaten.
- Zweckgebundene, ablaufende, einmalig konsumierbare Verknüpfung mit konkreter Organisation/Employee/Adressbindung verwenden. Bestätigung erfolgt durch den berechtigten Kontoinhaber. Ein Passwort-Reset allein ist keine Zustimmung zu einer Organisation.
- Vor Bestätigung keine aktive Membership mit Rollen aus einer Einladung erzeugen. Token-/Einladungszustand und Membership-Anlage transaktional bzw. mit sicherer Idempotenz behandeln.
- E-Mail eines unbestätigten Drafts korrigierbar machen; alte Verknüpfungstokens dabei ungültig machen.
- Bei bereits verknüpftem Konto Login-E-Mail in Mitarbeiterbearbeitung schreibgeschützt anzeigen. Einen vorhandenen sicheren Konto-E-Mail-Wechsel verlinken; fehlt dieser, einen dedizierten verifizierten Kontoinhaber-Flow ergänzen. Organisationsadministratoren dürfen nicht die globale Login-Adresse eines anderen Kontos ersetzen.
- Organisationsbezogene Kontakt-/Einladungsadresse und globale Login-E-Mail klar unterscheiden. Anzeige nicht über die zufällig erste globale UserEmail bestimmen.

**Tests**

- Frische Datenbank und Migration eines repräsentativen Altbestands: Mehrfachmitgliedschaft, mehrere UserEmails, Draft, aktiver Mitarbeiter, vorhandene Membership ohne Employee.
- Bekannte fremde E-Mail führt weder zu Dateneinsicht noch zu fremden Schreibrechten; legitime Mehrfachbeschäftigung hält Profile unabhängig.
- Verknüpfung erfolgreich, falsches Konto, falsche Organisation, abgelaufen, widerrufen, wiederverwendet, parallele Bestätigung.
- E-Mail-Korrektur vor Bestätigung; nach Verknüpfung geschützter Konto-Flow; Ablehnung einer manipulierten Mitarbeiter-Mutation.
- Photo- und TeacherOption-Zugriff mit/ohne Login-Verknüpfung.

**Abnahme:** Mitarbeiter können ohne Login gepflegt werden. Änderung in Organisation A verändert kein Profil in B und keine globale Identität. Migration und Bestätigung funktionieren mit echten Constraints und Auth-Tabellen.

### Paket 3 – Einheitlichen Basisdaten-Patch implementieren

**Befunde:** F1, F3, F4, F5, F8.

- Gemeinsame Basisdaten-Validierung/Normalisierung für Create, Patch und CSV definieren; unterschiedliche Pflichtfelder für Create/Patch bewusst abbilden.
- Namen trimmen, Leerwerte ablehnen, Feldlängen an DB-Spalten ausrichten, E-Mail-Adressen und echte Kalenderdaten prüfen. Bestehende Länder-/Telefon-/AHV-Regeln wiederverwenden; keine unbelegten neuen Formatregeln erfinden.
- `undefined`/`null`/Wert in Shared-Schemas, GraphQL-DTOs, Actions, Formular und ORM einheitlich behandeln. Verdeckte oder nicht editierbare Felder nicht als leere Werte zurückschreiben.
- Eigenen Datum-ohne-Zeit-Modus für Geburtsdatum einführen. Geteilten DatePicker nicht pauschal ändern; Verbraucher mit echter Uhrzeit oder Vertragsdaten gegen Regressionen absichern.
- Einen zentralen Service für autorisierten Basisdaten-Patch, Änderungsvergleich und Audit bereitstellen. Aktueller Wizard und noch erreichbare ältere Actions verwenden denselben Pfad; ungenutzte Altpfade erst nach Referenzprüfung entfernen.
- Rollen und andere Wizard-Abschnitte nur bei expliziter Änderung über die passenden autorisierten Vorgänge senden. Alle vorhandenen Rollen erhalten; keine Reduktion auf `roles[0]`.
- Audit mit Session-Akteur und normalisiertem Vorher/Nachher in derselben Transaktion schreiben. Geschützte Werte im Audit dürfen keine zusätzliche Leselücke schaffen. Kein Log für unveränderte Werte.
- Schreibkonflikte mit einer serverseitig überprüften Version lösen; reine Client-Reihenfolge schützt nicht vor zwei Browserfenstern. Konflikt als fachlichen Fehler zurückgeben.

**Tests**

- Parametrisierter Roundtrip aller Basisfelder: setzen → ändern → löschen → neu lesen; Pflicht-/Optionalfelder und unberührte Felder getrennt.
- Direkte GraphQL-Mutation und CSV erreichen identische Validierung; explizites `null`, Überlänge, Leerzeichen, ungültige Daten.
- Geburtsdatum in Zürich Sommer/Winter nahe Mitternacht und einer negativen UTC-Zone; ursprünglicher lokaler Kalendertag bleibt erhalten.
- Zwei Rollen plus reine Kontaktänderung → beide Rollen bleiben bestehen.
- DB-Test: Audit-Schreibfehler rollt Datenänderung zurück; No-op erzeugt keinen Eintrag; konkurrierender Patch wird kontrolliert abgelehnt.

**Abnahme:** Alle Basisdaten funktionieren nach erneutem Laden, einschließlich Löschen optionaler Werte. Der aktuelle UI-Pfad hinterlässt korrekte Historie und verändert keine unberührten Bereiche.

### Paket 4 – Wizard-Speicherung und Fehlermeldungen korrigieren

**Befunde:** F6, F7; UI-Anteile F1–F5.

- Actions auf strukturierte Ergebnisse umstellen: Erfolg, Feldfehler, fehlende Rechte, Konflikt, temporärer Fehler. `safeParse` und Fehlerbehandlung umfassen auch Client-Erzeugung/Transportfehler.
- Relevante Felder des aktuellen Schritts vollständig validieren; keine Vertragsvollständigkeit zum Speichern eines unvollständigen Personen-Drafts verlangen.
- Speichervorgänge koordinieren: maximal ein aktiver Save je Datensatz, neueste Änderungen nachführen, Doppelklick vor Erstanlage verhindern, veraltete Antworten nicht als aktuellen Erfolg anzeigen.
- Zustand in `finally` zuverlässig zurücksetzen. „Gespeichert“ nur für die zuletzt bestätigte Formularversion anzeigen; erneute Bearbeitung setzt den Indikator zurück.
- Vor Navigation/Finalisieren ausstehende Änderungen gezielt speichern. Scheitert ein Save, bleibt die Seite bedienbar und Finalisieren unterbleibt. Server prüft beim Finalisieren die erwartete gespeicherte Version.
- Abbrechen/Verlassen mit ungespeicherten Änderungen eindeutig behandeln. Autosave nach Unmount darf keine ungültigen UI-Updates oder zweite Anlage verursachen.
- Rechteabhängige UI-Anzeige an Backend-Berechtigungen ausrichten; insbesondere Writer ohne Rollenrecht kann Basisdaten bearbeiten. Vorhandene `requireAdminRole`-Sperren gegen diese Matrix prüfen.

**Tests**

- Komponenten mit Fake Timern und steuerbaren Promises: ungültige private E-Mail, Action wirft, Netzfehler, Doppelklick, schnelles Weiterklicken, ältere/spätere Antwort, Navigation während Save.
- „Letzter Save fehlgeschlagen“ → null Finalize-Aufrufe, kein Erfolgstoast, Buttons wieder benutzbar.
- Erfolgreicher Basisdaten-Patch funktioniert ohne Vertrags-/Rollenänderung und ohne entsprechende Zusatzrechte.

**Abnahme:** Keine verlorenen oder still ignorierten Änderungen, keine endlosen Ladezustände, kein Abschluss eines überholten Datensatzes.

### Paket 5 – CSV-Import fachlich und technisch härten

**Befunde:** S6, F8; konsistente Anwendung S2/S4/F1.

- Vorschlag für Anfangsgrenzen: **5 MiB Datei, 1.000 Datenzeilen**, zentral konfiguriert; Feldgrenzen aus Paket 3. Diese Produktgrenzen als Konstanten dokumentieren und mit Grenzfällen testen.
- CSV-Parser mit Quotes, Semikolon, BOM und Zeilenumbrüchen in gequoteten Feldern einsetzen; etablierte vorhandene Parser bevorzugen. Pflicht-/doppelte/unbekannte Header eindeutig behandeln.
- Datei und Struktur vor DB-Schreibvorgängen prüfen. Zu groß/zu viele Zeilen/ungültige Gesamtstruktur → gesamte Datei ohne Änderungen ablehnen.
- Fachlich ungültige Zeilen als Zeilenfehler ausgeben; gültige Zeilen entsprechend bestehender Teilimport-Semantik transaktional anlegen. Duplikate innerhalb der Datei und gegen DB kontrolliert melden.
- Nicht per importierter E-Mail fremde Konten aktiv verknüpfen. Nach Paket 2 organisationsbezogene Profile anlegen.
- Ergebnis mit Zeilennummer und stabiler Fehlermeldung; keine SQL-/Constraint-/Stacktrace-Details im UI. Vorlage, Pflichtfeldhinweise und Übersetzungen angleichen.

**Tests:** echte Multipart-Requests mit beiden Berechtigungsfällen, Byte-/Zeilengrenzen, Headern/BOM/Quotes, fehlerhaften Daten, Duplikaten, Teilimport und DB-Fehler je Zeile. Wiederholter Upload darf keine unkontrollierten Doppelanlagen erzeugen.

**Abnahme:** Grenzverletzungen werden vor Verarbeitung abgefangen; Ergebnisse entsprechen dem tatsächlichen DB-Stand.

### Paket 6 – Draft-Löschen und Menü vollständig verbinden

**Befunde:** F9, F10.

- Im Backend zulässigen Draft-Zustand unter Transaktion/Lock erneut prüfen. Bereits aktivierte oder eingeladene/verknüpfte Datensätze nicht über Draft-Löschen beseitigen.
- Nur Draft und zugehörige Entwurfsdaten entfernen; bestehende Membership/User erhalten. Neue Einladungen widerrufen und zugehörige Storage-Bereinigung nach erfolgreichem Commit mit Wiederholbarkeit behandeln.
- Bestätigungsdialog für zulässige Drafts an die Mutation anbinden. Für aktive Mitarbeiter den funktionslosen „Löschen“-Eintrag entfernen; kein neuer Offboarding-/Archivierungsprozess innerhalb dieses Basisinfos-Fixes.
- Nach Erfolg Liste/Detail invalidieren, bei Fehler Datensatz sichtbar lassen und verständliche Meldung zeigen.

**Tests:** neuer Draft, wiederverwendetes Konto, mehrere Organisationen, bestehende Membership, aktiver/eingeladener Datensatz, fremde Organisation, Konkurrenz mit Finalisierung, Storage-Fehler und FK-Rollback. UI-Klick, Abbrechen, Bestätigen und erneutes Laden.

**Abnahme:** Der Menüpunkt funktioniert für erlaubte Drafts; kein bestehendes Konto oder fremder Datensatz wird mitgelöscht.

### Paket 7 – E2E-Matrix vollständig ausführen und CI verbindlich machen

Tests entstehen bereits in den Paketen 1–6. Dieses Paket integriert den gesamten Ablauf und liefert den Abschlussnachweis.

**Neue/geänderte Tests – vorgeschlagene Aufteilung**

| Suite | Wesentliche Szenarien |
|---|---|
| `employee-basics.spec.ts` | Anlegen, Draft fortsetzen, aktive Person bearbeiten, alle Basisfelder nach Reload korrekt, optionale Felder löschen, Login-/Kontaktadresse unterscheiden |
| `employee-basics-access.spec.ts` | Anonym/Read-only/Writer/Owner; direkte URL und API; zwei Organisationen; Membership-Umweg; TeacherOption ohne private Daten |
| `employee-roles-access.spec.ts` | Writer darf keine Rollen vergeben; keine Eskalation; mehrere Rollen bleiben bei Basisdatenänderung erhalten |
| `employee-basics-saving.spec.ts` | Ungültige private E-Mail, fehlgeschlagener Save, schnelles Weiterklicken, Doppelklick, Versionskonflikt und kein Finalize nach Fehler |
| `employee-csv-import.spec.ts` | Vorlage, gültiger Import, Teilfehler, Duplikate, Größen-/Zeilengrenze und unberechtigter Upload |
| `employee-draft-lifecycle.spec.ts` | Löschen/Abbrechen, aktiver Mitarbeiter geschützt, bestehendes Konto bleibt erhalten |
| `employee-account-link.spec.ts` | Fremde bekannte E-Mail ohne Datenleck, bestätigte Verknüpfung über Test-Mail, Token-/Adresswechsel und Kontoinhaberprüfung |
| `employee-basics-date.spec.ts` | Geburtstag bei kontrollierter Uhrzeit und unterschiedlichen Browser-Zeitzonen korrekt gespeichert |

**Verbindliche Regeln**

- Kritische Happy Paths über echte UI, Backend und Datenbank. Interception ausschließlich für gezielte Fehler-/Race-Szenarien; diese separat kennzeichnen.
- Normaler Writer/Read-only sind Hauptakteure; Superadmin dient nicht als Ersatz für Berechtigungstests.
- Assertions prüfen nach Reload konkrete Werte, Status, Rollen und soweit nötig DB-/Audit-Zustand. Die Existenz eines Namens allein genügt nicht.
- „Draft saved“-Indikator und beliebige `waitForTimeout`-Wartezeiten nicht als Persistenznachweis verwenden. Auf konkrete Request-/UI-Zustände warten, Timing kontrolliert steuern.
- Bestehenden `employee-onboarding.spec.ts` verschärfen: korrekter Endstatus statt „draft or active“, tatsächlich gespeicherte Personendaten und separater Schnellklick-Test. Vertragsdaten nur als nötige Fixtures verwenden.
- DB-Service-Tests und HTTP-Tests trennen: Repository-Mocks bleiben für kleine Unit-Tests erlaubt, ersetzen aber weder FK-/Rollback- noch Guard-Tests.
- Den falschen Membership-Delegationstest und bedingungslosen User-Löschtest durch Erwartungen zum sicheren Verhalten ersetzen. Audit-Tests ausdrücklich gegen den aktuellen Wizard-Pfad ergänzen.

**CI und Abdeckung**

- Bestehende CI-Schritte für Integration und Playwright erweitern; sie laufen bereits außerhalb des normalen Turbo-Unit-Jobs.
- Gemeinsame Schemas bauen, Auth-Schema vorbereiten, Migrationen ausführen, dann DB-/API-Integration und E2E auf getrennten Datenbanken.
- Einen Migrationstest über echte Migrationen mit `synchronize: false` sicherstellen. Die vorhandenen `synchronize: true`-Service-Tests können die Backfill-Migration nicht nachweisen.
- E2E zunächst vollständig in Chromium; kritische Datum-/Formular-/Save-Flows zusätzlich in Firefox/WebKit konfigurieren. Geräte-/Browserausweitung nicht mit Varianten jedes reinen API-Tests verwechseln.
- Coverage ausschließlich für handgeschriebene Basisdaten-, Autorisierungs-, Import- und Save-Logik gesondert ausweisen. **Vorgeschlagenes Gate: mindestens 90 % Zeilen und 85 % Branches** in diesen Modulen; jeder aufgeführte Sicherheits-/Datenverlustfall bleibt unabhängig vom Prozentwert verpflichtend.
- Falls Code noch im großen Employee-Service mit Vertragslogik liegt, relevante Logik sinnvoll ausgliedern oder Funktionsabdeckung gesondert nachweisen; keine Coverage-Ausnahmen zum Schönrechnen.
- Standard-TypeScript-Kompilierung/Typecheck, Lint, relevante Unit-/Integrationstests, GraphQL-Codegen-Drift und Web-/Backend-Build bestehen lassen. Shared-Type-Verbraucher einschließlich Mobile prüfen.
- Traces, Screenshots, Testergebnisse und Coverage als CI-Artefakte sichern, ohne Zugangstokens oder private Fixture-Inhalte unnötig zu loggen.
- Kritische Save-/Race-Szenarien abschließend drei Mal mit ausgeschalteten Retries ausführen; dieser gezielte Stabilitätsnachweis kommt zusätzlich zum einmaligen Gesamtlauf.

**Abnahme:** Sämtliche geplanten Regressionen sind implementiert und wurden ausgeführt. Keine neuen `skip`/`fixme` für diese Befunde; bekannte bestehende fremde Testprobleme separat dokumentieren, nicht als Mitarbeiter-Fix ausgeben.

## Zuordnung aller Befunde

| Befund | Umsetzung | Erforderlicher Nachweis |
|---|---|---|
| S1 Rolleneskalation | 1, 3 | API-Rechtematrix, letzte Owner-Rolle, E2E Rollen |
| S2 CSV-Berechtigung | 1, 5 | Multipart mit echten Guards, E2E Rechte |
| S3 Membership-Mandantentrennung | 1, 2 | Zwei Organisationen, alle Lese-/Schreibumwege |
| S4 Globale Kontoverknüpfung | 1 vorläufig, 2 vollständig | Migration, getrennte Profile, echte bestätigte Verknüpfung |
| S5 Lehrer-Datenleck | 1, 2 | GraphQL-Ausgabetyp/Feldschutz, eingeschränkte Identität |
| S6 Upload-Ressourcen | 5 | Größen-/Zeilengrenze vor Schreibvorgängen |
| F1 Leeren optionaler Felder | 3, 4 | Action-/DB-/Browser-Roundtrip |
| F2 Login-E-Mail ignoriert | 2, 4 | Draft-Korrektur, geschützter verifizierter Konto-Flow |
| F3 Datumsverschiebung | 3, 7 | Uhrzeit-/Zeitzonenmatrix durch Picker bis DB |
| F4 Rollenverlust | 1, 3 | Mehrfachrollen nach reiner Basisänderung |
| F5 Fehlendes Audit | 3 | Aktueller Wizard-Pfad, Akteur, No-op, Rollback |
| F6 Hängendes Speichern | 4 | Feldfehler und geworfene/abgelehnte Action |
| F7 Finalisieren trotz Save-Fehler | 3, 4 | Kein Finalize, Versionsprüfung und Race-Tests |
| F8 Fehlende Validierung | 3, 5 | Gleiche Regeln für GraphQL und CSV |
| F9 Gefährliches Draft-Löschen | 2, 6 | Reale Constraints, bestehende Konten bleiben erhalten |
| F10 Funktionsloses Menü | 6 | Dialog/Mutation/Abbruch/Reload |

## Lieferung und Freigabekriterien

Empfohlene Lieferreihenfolge: **0 → 1 → 2 → 3 → 4 → 5 → 6 → 7**. Kleine unmittelbare Sicherheitskorrekturen aus Paket 1 sind separat lieferbar; Paket 2 ist der größte zusammenhängende Umbau. Tests werden mit dem jeweiligen Fix geliefert, nicht auf Paket 7 verschoben.

Für Paket 2 additive Migration und Cutover getrennt planen. Während des Cutovers dürfen alte App-Versionen keine globalen User-Schreibpfade weiterverwenden. Vor Deployment Migration am repräsentativen Testbestand prüfen, Schreibpause oder kontrollierten Versionswechsel festlegen und Recovery-Schritte dokumentieren. Ein Rollback auf die verwundbare Altversion ist kein akzeptabler Sicherheits-Rollback; additive Daten behalten und Fehler durch korrigierten Rollout beheben.

Abgeschlossen ist die Umsetzung erst, wenn:

- [x] Alle 16 Befunde anhand der Zuordnung mit Code und Regressionstest erledigt sind.
- [x] Keine Mitarbeiter-Basisänderung fremde Organisationen, globale Login-Identitäten, unberührte Rollen oder Vertragsdaten verändert.
- [x] Migration auf leerer DB und Altbestand erfolgreich ist; Fremdschlüssel und Uniqueness geprüft sind.
- [x] API-Sicherheit mit echten Sessions/Guards und zwei Organisationen nachgewiesen ist.
- [x] Unit-, Komponenten-, DB-/API-Integration und Browser-E2E tatsächlich grün gelaufen sind.
- [x] Abdeckungsbericht, unverdeckte Restlücken und Stabilitätsläufe vorliegen.
- [x] Typecheck, Lint, Backend-/Web-Webpack-Build und GraphQL-Codegen geprüft sind; blockierter Turbopack-Build und Warnungen im Abschlussbericht ausdrücklich dokumentiert.
- [x] Der Abschlussbericht konkrete Testbefehle, Ergebnisse, Migration und verbleibende Risiken enthält.

Ein externer Deployment-Schritt ist nicht Teil der bloßen Planerstellung. Dieser Plan enthält keine Zusage, dass frühere Datenveränderungen ohne historische Quelle rückwirkend repariert werden können.
