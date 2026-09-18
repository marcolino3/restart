# Mitarbeiter-Basisinformationen – Umsetzungsprotokoll

**Lokale Umsetzung abgeschlossen; kein Deployment ausgeführt.** Neuester Nachweis: [Abschlussbericht vom 16.09.2026](./mitarbeiter-basis-abschluss-2026-09-16.md). Die nachfolgenden laufenden Notizen sind historisch und werden durch den Abschlussbericht ersetzt. Auftrag: alle 16 Review-Befunde, Abdeckungslücken und E2E gemäß Implementierungsplan umsetzen. Nutzer bestätigte Start und ausdrücklich „WEITERMACHEN“.

## Fortschreibung 16. September 2026 (neuester Stand)

- Backend-Gesamtlauf143 Suiten:141 erfolgreich, zwei veraltete Profil-Fixtures fehlgeschlagen. Beide Fixture-Suiten korrigiert und separat10/10 erfolgreich. Keine fachliche Vertragsänderung vorgenommen.
- Web22 Suiten/161 Tests erfolgreich. Backend/Web/Mobile-Typechecks erfolgreich. Vier bestehende DB-Integrationssuiten51/51 erfolgreich. Mitarbeiter-Sicherheit13/13 erfolgreich; FK-Migrationstest danach auf exakt23503/fk_membership_employee_org verschärft, erneuter Lauf läuft.
- Gemeinsame Mitarbeiter-Browsersuite25/25 erfolgreich. Dreifachlauf Konto-Konkurrenz und Writer-Speichern6/6 ohne Retries erfolgreich.
- Bisheriges `employee-onboarding.spec.ts` in die isolierte Suite verschoben (Hauptsuite ignoriert Datei, eigener CI-Job führt sie aus). EndstatusACTIVE, SENT, konkrete Personendaten, Rollen und noch inaktive/unverknüpfte Membership werden geprüft. Alle vier Fälle in getrennten Läufen erfolgreich; letzte Korrektur betrifft eindeutige Auswahl der Systemrolle über exakten Labeltext, nicht Beschreibung.
- Neue `employee-basics-saving.spec.ts`: fünf Fälle erfolgreich (ungültige private E-Mail und Korrektur, injizierter Netzwerkfehler/Retry, mehrere Rollen erhalten, zwei Browserstände mit Versionskonflikt, während verzögertem Save geänderte Werte). Sechster Fall Finalize nach fehlgeschlagenem letzten Save wurde ergänzt; letzter gezielter Lauf noch offen. Bewusste Interceptions sind im Testnamen gekennzeichnet.
- Neue Account-Controller-Unit20/20 erfolgreich; Einladungsservice8/8 erfolgreich. Employee-Service um Directory-/Legacy-Endpunktfälle ergänzt,41/41 erfolgreich. Lehreroptionen filtern nun ausdrücklich ACTIVE, nicht nur isActive.
- Letzte Coverageauswertung der acht ausgewählten Backendmodule90,44% Zeilen/76,97% Branches; dieser Lauf enthielt einen mittlerweile korrigierten Test-Fixture-Fehler und muss wiederholt werden. Neue Einladungs-/Account-/CSV-/Cleanup-/Rollen-/Feldschutzmodule jeweils über90% Zeilen und85% Branches. Großer Employee-Service einschließlich Vertragslogik81,75% Zeilen/67,03% Branches; diese Restlücke nicht verbergen. Weitere zweckmäßige Aufteilung/gezielte Tests und verbindlicher CI-Coverage-Nachweis noch offen.
- Backend-Build erfolgreich. Web-Build mit Webpack und lokalen Testfonts erfolgreich. Turbopack-Build scheiterte auch bei genehmigter erweiterter Ausführung an lokalem Port-EPERM; kein fachlicher Buildfehler nachgewiesen. `.next-employee-build` gitignored; Codegen schließt beide isolierten Buildverzeichnisse aus.
- Backend-Lint für68 geänderte Dateien ohne Fehler (acht Typwarnungen in vorhandener Feldmiddleware); Web-Lint39 geänderte Dateien ohne Fehler (React-Hook-Form-Warnung, überflüssige Suppression anschließend entfernt). Seitdem neue Tests/kleine Änderungen ergänzend linten. Fremde Theme-/Turbo-Dateien dabei ausgeschlossen.
- Codegen gegen4101 erfolgreich; nach letzter Query-/Codegen-Konfigurationsänderung Drift durch zweiten Lauf/Hashvergleich noch nachweisen. Durch Builds ergänzte Web-tsconfig-Includes gehören zu isolierten Buildtypen.

Aktuelle nächste Arbeiten: laufende gezielte Fälle abholen; verbleibende Browser-Finalize-Lücke schließen; Gesamt-/Stabilitätsläufe um neue Fälle erweitern; gezielten Coveragebericht/Gate und fehlende Servicepfade fertigstellen; neue Dateien formatieren/linten; abschließende Typechecks/Traceability/CI-Artefakte und Abschlussbericht. Keine pauschale Aussage „alles fertig“.

## Fortschreibung 14. September 2026 (ersetzt überholte Zwischenstände unten)

### Weitere Ergebnisse desselben Arbeitstags

- Gemeinsamer Lauf aller damaligen **22 Browserfälle erfolgreich**. Danach neue Foto-E2E, explizite Zweitorganisations-Fixture und Draft-Löschdialog jeweils separat erfolgreich. Suite umfasst nun25 Fälle; neuer gemeinsamer Lauf folgt.
- Draft-E2E deckt Suche nach Vorname, Abbruch, Bestätigung, Entfernung von Employee/Platzhalter-Membership und API-/UI-Schutz aktiver Mitarbeiter ab. Dabei tatsächliche UI-Fehler korrigiert: Schreibrechte statt fester Adminrolle bestimmen Verwaltungsansicht; Personensuche berücksichtigt Vorname und E-Mail zusätzlich zum Nachnamen.
- Foto-E2E prüft Writer/Reader/fremde Organisation, ungültige Bilder, Größenlimit, WebP im isolierten Speicher und autorisiertes Löschen. Org-/Employee-Locks halten Upload und Draft-Löschung auseinander; zweiter Check unter Lock verhindert verspätetes Wiederanlegen eines Fotos. Upload-Unit21 erfolgreich.
- `setupSecondOrgUser` verwendet erwartete Version und explizite Account-Fixture statt impliziter Produktverknüpfung. Neuer SQL-Helfer akzeptiert ausschließlich ausdrücklich konfigurierte lokale E2E-Datenbanken und eng begrenzte Fixture-Adressen. Echtes Anmelden im Regressionstest erfolgreich.
- UserEmailsService benutzte `ILIKE` für Identitätslookup und Duplikatprüfung: `_`/`%` wurden als Platzhalter ausgewertet. Jetzt exakter case-insensitiver Vergleich; mehrdeutige Identitäten werden abgewiesen. Einladung und eigener E-Mail-Wechsel behandeln Großschreibung ebenfalls exakt. PostgreSQL-Suite jetzt **13/13 erfolgreich**, einschließlich Wildcard-/Großschreibungs-/Mehrdeutigkeitsfall.
- AccountEmailController jetzt17 Unitfälle; gemessen **98,63% Zeilen /92,3% Branches**, ausschließlich für diesen Controller. Vollständige Bereichscoverage weiterhin offen. Neuer Link-/Email-Browserlauf nach genauer Adresssuche erfolgreich.
- Rollen-Erstellung/Kopie/Feldrechteersetzung jetzt ebenfalls unter Orglock in einer Transaktion; Kopie prüft Akteursfeldrechte, Resolver reicht Akteur weiter. Rollen-/User-/Email-Lauf76 erfolgreich vor drei weiteren Emailfällen. Gezieltes Lint ohne Fehler nach Korrekturen; zwei Map-Typwarnungen anschließend ebenfalls korrigiert.
- Architektur-, Vorprüfungs-, Cutover- und Forward-Recovery-Dokument: `reviews/mitarbeiter-basis-architektur-cutover.md`. Keine Produktion angefasst.
- Absenzübersicht und Saldennamen auf Organisationsprofil/Employee-Directory umgestellt; Mitarbeitername in Notifications nutzt Profil bei bestehender Employee-Zuordnung. Datum im EmployeeViewPage für reine Kalenderdaten lokal statt UTC geparst. Dazu passende Absenz-Fixtures gerade ergänzt; umfassender Backendlauf läuft noch.
- Aktive Prüfungen beim Schreiben: komplette Backend-Units nach `/private/tmp/restart-backend-review-tests.log`; dreifache Chromium-Race-/Writer-E2E ohne Retries. Ergebnisse noch abholen, nicht vorwegnehmen.

Verbleibende Liste unten ist entsprechend zu lesen: Rollenpfade, Fixture, Foto-/Draft-E2E und Architekturdoc sind inzwischen implementiert; ihre abschließende Gesamtvalidierung, weitere Verbraucher, CI/Mobile/Codegen/Build/Lint und vollständige Traceability bleiben offen.

- Browserumgebung funktioniert: explizite interne GraphQL-URL4101, lokale Testfont-Antworten, isolierter Mail- und Dateispeicher; Chromium, Firefox und WebKit installiert. Keine produktiven Mails oder Datenbanken verwendet.
- Voller Browserlauf: 18/22 erfolgreich; vier WebKit-Fehler zeigten verlorene Eingaben vor React-Hydration. Wizard-Felder bleiben nun bis zur Hydration deaktiviert. Anschließender WebKit-Lauf **5/5 erfolgreich**, einschließlich drei Datum-/Zeitzonenfällen. Vollständiger gemeinsamer Abschlusslauf steht noch aus.
- Vier Account-Link-E2E erfolgreich: bestehendes Konto/Membership erhalten, falsches Konto, ersetzte/abgelaufene/verwendete Tokens, parallele Bestätigung sowie eigene Login-E-Mail mit Bestätigung beider Postfächer und Sessionwiderruf. Neue AccountEmailController-/Entity-/Migration-/UI-/Mailer-Implementierung vorhanden. Employee.profile.email bleibt beim Loginwechsel unverändert.
- Zusätzlich alten globalen `updateUser`-/`changeUserEmail`-Zugriff von EMPLOYEE_WRITE auf SuperAdminOnly eingeschränkt. Resolver-Suite **20 Tests erfolgreich**; echter Zwei-Organisationen-E2E einschließlich Verweigerung beider Mutationen für eigenen und fremden Organisationsmitarbeiter **erfolgreich**. Kontoinhaber verwenden den neuen Bestätigungsablauf. Letzte Folgeänderung: case-insensitiver exakter E-Mail-Abgleich im neuen Controller; mehrdeutige Altbestände werden abgewiesen. Noch gezielt erneut testen.
- PostgreSQL-Sicherheitssuite **12 Tests erfolgreich**, einschließlich echter Profilmigration auf leerem und altem Mehrorganisationsbestand, Konkurrenz/Versionen, Auditrollback, Draft-Löschung, aktiven Ownern und konkurrierender Rollenentfernung.
- Weitere erfolgreiche gezielte Läufe: Backend135 Tests/9 Suiten (früherer Stand), Employee/Onboarding48, Upload/Rollen/Storage51, Feldmiddleware19; Web117 Tests/16 Suiten. Diese Zahlen überlappen und dürfen nicht addiert werden. Backend/Web-Typechecks zuletzt erfolgreich, nach Folgeänderungen erneut nötig.
- Draft-Löschung schützt verknüpfte, aktive und eingeladene Mitarbeiter. Ungebundene Platzhalter werden entfernt; dauerhafte Cleanup-Tabelle plus Cron-Worker entfernt abgeleitete Mitarbeiterfotos nach Commit mit Wiederholung bei Speicherfehlern. Neue Migration1789380000000. Upload verlangt für Mitarbeiter EMPLOYEE_WRITE und Organisationszugehörigkeit.
- Rollenänderungen/-löschungen sperren Organisation; nur tatsächlich aktiv zugewiesene Ownerrollen zählen als verbleibender Owner. Einladungen/Annahme verwenden konsistente Locks; bestehende Membership wird zusammengeführt. CSV meldet stabile logische Zeilennummern.
- Basis-Patches validieren unveränderte Vertragsdaten nicht erneut. Fehlerausgaben bereinigt, Rollenfeld ohne Zuweisungsrecht gesperrt, Datumsanzeige verarbeitet reine Kalenderstrings. Rollen werden beim Laden mitgeladen.
- Isolierter CI-Job für Mitarbeiter-E2E inklusive drei Browsern und dreifacher Race-Wiederholung vorhanden, noch nicht in externem CI ausgeführt. Codegen gegen4101 erfolgreich; ursprüngliche E2E-Suite ignoriert neue isolierte Dateien, die im eigenen Job laufen.

### Tatsächlich verbleibend

1. Neue Account-/Einladungscontroller: zusätzliche Branchtests, E-Mail-Konflikte/Großschreibung/Ablauf/Resend und Coverage messen; keine vollständige Abdeckung behaupten.
2. E2E für Foto-Upload/-Isolation, Draft-Löschdialog und Schutz aktiver/verknüpfter Mitarbeiter, Browserfehler-/Parallel-Saves und mehrere Rollen ergänzen; Upload-vs-Cleanup-Konkurrenz prüfen.
3. Alternative Rollenpfade `updateRoleFieldPermissions`, `createRole`, `duplicateRole`: Transaktion/Orglock/Feldrechteeskalation vollständig prüfen.
4. Alte E2E-Fixture `setupSecondOrgUser` setzt weiterhin implizite Kontoverknüpfung voraus und benötigt Migration; bestehende Integrationstests und Haupt-E2E-Onboarding an neue Version/Statusregeln anpassen und ausführen.
5. Weitere Mitarbeiterverbraucher (Absenzen/Reports/Mobile und globale Membership.user-Daten) inventarisieren und auf passende Profil-/Directory-Projektion umstellen.
6. Architekturentscheidung, Cutover, Datenkonfliktprüfung und Forward-Recovery dokumentieren; Migration-FK-Test eindeutiger auf FK-Verletzung prüfen.
7. Vollständige Traceability aller16 Befunde, Format/Lint/Build/Typechecks/Codegen/Mobile, Coverage und dreifache Race-Stabilität abschließen; anschließend Status und Plan aktualisieren.

Nachfolgende Abschnitte dokumentieren den älteren Arbeitsstand und sind bei Widersprüchen durch diese Fortschreibung ersetzt.

## Bereits implementiert (teilweise vor weiterem Modellumbau geprüft)

- CSV EMPLOYEE_WRITE, 5 MiB/1000 Zeilen, vollständig vorab strukturgeprüfter Semikolonparser (BOM/Quotes/Newlines), DTO-Validierung, stabile Fehler ohne SQL-Details.
- Membership auf Session-Organisation begrenzt; allgemeiner Update erlaubt nur Kontakttelefon; kein freies Rebinding von User/Org/UserEmail. Neue Kontoverknüpfung nicht per fremdem UserId möglich.
- Rollenänderungen benötigen Akteur mit ROLE_ASSIGN, keine Permission-/Feldrechteeskalation, Organisationslock und Schutz letztem Owner; Wizard und Rollen-Service verwenden gemeinsamen Helper.
- Lehreroption eigener schmaler GraphQL-Typ. Zusätzlicher User-Privatfeldschutz und org-/EMPLOYEE_READ-Prüfung auf Employee.profile.
- Optionalfelder übertragen explizites null; DatePicker hat dateOnly-Modus. Wizard sendet geänderte Felder, erhält unveränderte Rollen/Verträge, koordiniert Saves und finalisiert nicht nach Fehlern.
- Draft-Löschung unter Lock, bestehende Konten/Membership werden erhalten. Menü mit Bestätigungsdialog angebunden.
- Laufender großer Modellumbau: Employee.organizationId, eingebettetes EmployeeProfile (profile_* Spalten), accountLinkStatus UNLINKED/LEGACY/CONFIRMED. Membership.userId nullable für ungebundene Mitarbeiter; keine globale Kontosuche/-mutation beim Anlegen/Bearbeiten. Profil-PATCH und Audit im selben Commit.
- expectedVersion beim Bearbeiten/Finalisieren; Web übernimmt neue Version nach Save.
- Neue Einladung mit SHA-256-Tokenhash, 48 Stunden Ablauf, explizite angemeldete Bestätigung mit passender Adresse. Preview zeigt Organisationsnamen. Mailadapter schreibt ausschließlich bei NODE_ENV=test optional in E2E_MAIL_DIR, sonst normaler Mailversand. Keine echten Einladungen durch Agent ausgeführt.
- Additive Migration 1789040000000-EmployeeOrganizationProfiles.ts vorhanden, **noch nicht ausreichend geprüft**. Kopiert Altbestand, kennzeichnet Legacy, löscht keine globalen Userdaten. Down absichtlich gesperrt (Forward-Korrektur).

## Testnachweise bisher (nicht als Abschlusslauf verstehen)

- Früher Sicherheitsstand: 44 Tests/5 Backend-Suiten grün; zusätzlich 97 Tests/6 Backend-Suiten grün.
- Nach Profilumbau: EmployeesService + Onboarding-Orchestrator 45 Tests grün; Wizard + Mapper 7 Tests grün.
- Action/Transport/Date/Mapper vorher 25 Tests grün; Wizard Fehlerszenarien 3 Tests grün.
- PostgreSQL: Owner-Konkurrenz + Membership-PATCH 3 Tests grün.
- Erweiterter PostgreSQL-Lauf (6 Fälle) zeigte echten Fehler: TypeORM create(Employee,{profile:{}}) lässt leeres Embedded-Objekt weg. Danach explizit `employee.profile = new EmployeeProfile()` ergänzt. **Diese Korrektur noch erneut gegen DB ausführen.**
- Web/Backend Typechecks waren vor großen Folgeänderungen grün; erneut erforderlich. Früher vorhandener supertest-Namespace-Import in backend/test/app.e2e-spec.ts auf Defaultimport korrigiert.
- Erster Browser-E2E-Lauf ausgeführt: Sandbox blockierte zunächst die lokale DB-Verbindung; anschließend mit genehmigter erhöhter Ausführung liefen Testserver und Global Setup an. Beide Tests scheiterten vor dem Login: Next/Turbopack konnte Google-Geist-Fonts nicht laden (`@vercel/turbopack-next/internal/font/google/font`, Google-Fonts-Timeout). **Kein erfolgreicher Nachweis der getesteten Mitarbeiterabläufe.** Als Nächstes reproduzierbaren Testserver ohne externen Fontdownload herstellen und erneut ausführen; keine Tests überspringen.

## Testumgebung / sichere Ausführung

- Docker-Testprojekt `restart-employee-tests`, Service `test-db`, Container `restart-employee-tests-test-db-1`, PostgreSQL17 Port5435, User/Pass test/test.
- Integration `restart_test`; Browser/Migration `restart_employee_e2e` (bereits separat angelegt).
- Bestehenden Entwickler-Container `restart-postgres-1` auf5433 NICHT verändern.
- Sandbox verbietet lokale DB-/Docker-Verbindung; dafür genehmigte erhöhte Toolausführung verwenden. Keine Umgehung.
- Integration: `NODE_ENV=test ALLOW_TEST_DATABASE_RESET=true DB_HOST=127.0.0.1 DB_PORT=5435 DB_USERNAME=test DB_PASSWORD=test DB_NAME=restart_test pnpm --filter @restart/backend exec jest --config test/jest-e2e.json --runInBand --runTestsByPath test/employee-security.integration-spec.ts`
- Test-Reset-Helfer erlaubt nur localhost + restart_test/restart_integration + NODE_ENV=test + explizites ALLOW_TEST_DATABASE_RESET=true. CI-Integration-Job angepasst.
- `e2e/playwright.employee.config.ts`: fest isolierte DB, Ports4100/4101, kein Serverreuse, eigener Next-distDir `.next-employee-e2e`, Test-Superadmin `employee-superadmin@example.test`, Dummy-Passwort im Config. Preview/Confirmation-Seite unter /[locale]/onboarding/accept-employee.
- Start via `pnpm --filter @restart/e2e exec playwright test --config playwright.employee.config.ts` (Sandbox-Eskalation nötig für Ports/DB). Backend ts-node, echte Migrationen, kein synchronize. Der erste Lauf wird voraussichtlich weitere Integrationsprobleme aufdecken.
- Entwickler-Backend/Codegen-Watcher läuft offenbar bereits; shared-types wurden automatisch passend zu Schemaänderungen aktualisiert. Diese generierten Änderungen prüfen, nicht als fremde Änderungen verwerfen.

## Wesentliche nächste Arbeiten / offene Risiken

1. Aktuelle Prozesse/Typecheck-Ergebnisse abholen, DB-Profiltests erneut starten; E2E-Server zum ersten Mal starten, Migrationsfehler korrigieren.
2. Migrationstest Altbestand, leere DB, Fremdschlüssel/Unique/Legacy/Mehrfachbeschäftigung; Backfill nicht mit synchronize gleichsetzen. Architekturentscheidung und Cutover/Recovery dokumentieren.
3. Einladungsbestätigung testen: echter Sessionflow, falscher User, Ablauf/Widerruf/Wiederverwendung/Konkurrenz, bestehende Membership zusammenführen ohne fremde Datenänderung. Mail-Ausgabe nur lokal.
4. Noch fehlender verifizierter Kontoinhaber-Flow für Änderung einer bereits verknüpften Login-E-Mail; aktuell Mitarbeiter-Patch sperrt diese Änderung. Einladungsadresse unlinked editierbar und Tokens widerrufen.
5. Backend-Autorisierung privater Daten weiter prüfen (Employee.firstName/lastName sind öffentliche Directory-Projektion); restliche Verbraucher von membership.user für Mitarbeiterdaten umstellen. Teams teilweise umgestellt, Absenzen/Reports teilweise. Mobile/weitere GraphQL-Queries inventarisieren.
6. Bestehende Test-Fixtures/Integrationstests brauchen Employee.organizationId/profile. Vier bestehende Integrationssuites teilweise angepasst. E2E helpers/auth.ts nutzt noch alten Teacher-Query und implizite Kontoverknüpfung in setupSecondOrgUser; umstellen.
7. Role/Contract UI Rechteanzeige, vollständige Personenschrittvalidierung, Autosave-Navigation/Unmount, getrennte Vertragsvalidierung bei Basis-Saves prüfen. Einzelne Fixes sind noch unvollständig (alle 16 Traceability durchgehen).
8. Draft-Löschen: Unlinked-Platzhalter bereinigen; aktiv/eingeladen/verknüpft geschützt; Foto-Storage-Bereinigung nach Commit fehlt.
9. API-Tests echte Guards/Sessions, fehlende Org, Writer/Readonly/Teacher/Superadmin, zwei Org, Uploadgrößen, Feldmiddleware ergänzen. E2E derzeit zwei Tests (Writer UI Basisdaten, Rolle/CSV-Rechte), Matrix erweitern.
10. Alle relevanten Unit-/Komponenten-/DB-/E2E-Suiten, 3x Race-Stabilität, Coverage90/85 vorgeschlagen, Lint/Build/Typechecks/Codegen/Mobile. Nichts mit skip/fixme kaschieren.

## Arbeitsregeln

Keine Subagents (nicht vom Nutzer angefordert). Kein Deployment/Commit erfolgt. Relevante Next.js-Dokumentation vor Webänderungen gelesen (use-server, server-actions, distDir). Nutzer möchte autonomes Weiterarbeiten; Zwischenfragen sind kein Grund zum Stoppen.

Fremde ursprüngliche Änderungen unverändert erhalten: apps/mobile/lib/theme.tsx, apps/web/app/[locale]/globals.css, apps/web/lib/themes.ts, turbo.json. Weitere Änderungen stammen überwiegend aus dieser Aufgabe. Vorherige Review-/Plan-Dateien in reviews/ erhalten.
