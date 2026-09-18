# Mitarbeiter-Basisinformationen: Implementierung und Nachweise

Stand: 16.09.2026. **Die 16 ursprünglichen Befunde sind implementiert und lokal geprüft; externe CI und produktiver Cutover sind nicht ausgeführt.** Umfang: Basisinformationen, zugehörige Konten-/Membership-Grenzen, Rollenautorisierung, Import, Foto, Wizard und Draft-Lebenszyklus. Keine fachliche Änderung an Vertragsberechnung, Lohn oder Absenzen. Gemeinsame Verbraucher verwenden jetzt das organisationsbezogene Profil, soweit sie Mitarbeiterdaten darstellen.

## Zuordnung der 16 ursprünglichen Befunde

| Befund | Umsetzung | Nachweis |
|---|---|---|
| S1 Rolleneskalation | Gemeinsame Rollenautorisierung mit Akteur, Organisationslock, Permission-/Feldrechteprüfung und letztem aktivem Owner | `membership-role-assignment.spec.ts`, `roles.service.spec.ts`, PostgreSQL-Konkurrenztests, echte API-Sessions |
| S2 CSV-Berechtigung | `EMPLOYEE_WRITE` am Multipart-Endpunkt | Controller-Unit- und Browser/API-Tests mit anonymem, Read-only- und Writer-Zugriff |
| S3 Membership-Mandantentrennung | Alle Pfade organisationsbezogen; kein freies User-/Org-/E-Mail-Rebinding | Membership-Suiten und Zwei-Organisations-E2E |
| S4 Globale Kontoverknüpfung | Organisationsprofil, inaktive unverknüpfte Membership, ausdrücklich bestätigte Einladung | Echte Migration auf leerem/Altbestand, Kontoverknüpfung über lokale Mail und Session, Replay-/Paralleltest |
| S5 Lehrer-Datenleck | Schmale TeacherOption; private User-/Profilfelder geschützt; direkte Login-E-Mail-Abfragen nur selbst/Superadmin | Feldmiddleware, Teacher-Directory, UserEmailsResolver, tatsächliche GraphQL-Abfragen |
| S6 Upload-Ressourcen | CSV 5 MiB/1.000 Zeilen; Foto 5 MiB; Strukturprüfung vor Verarbeitung | Parser-Grenzfälle, echte Multipart-Requests, Foto-Dateinachweis |
| F1 Optionale Felder leeren | Ausgelassen/unverändert und null/löschen getrennt | Basis-Patch-Parameterfälle, Audit/DB und Browser-Roundtrip |
| F2 Login-E-Mail ignoriert | Kontakt-/Einladungsadresse vom Login getrennt; eigener kontoinhaberbezogener Wechsel mit zwei Mailbox-Bestätigungen | Account-Email-Controller und Browserablauf mit alter/neuer Adresse |
| F3 Datumsverschiebung | Kalenderdatum als YYYY-MM-DD; DatePicker/Anzeige ohne UTC-Verschiebung | Datumstests in Chromium, Firefox und WebKit |
| F4 Rollenverlust | Reine Basis-Patches senden keine unveränderten Rollen | Transporttests, Mehrfachrollen nach UI-Speicherung durch Writer ohne ROLE_ASSIGN |
| F5 Audit fehlt | Profiländerung und Audit im selben Commit mit Session-Akteur | PostgreSQL: Patch, No-op und Audit-Rollback |
| F6 Speichern hängt | Strukturierte Fehler, finally-Zustände und koordinierte Saves | Action-/Komponententests, ungültige Felder, gezielt abgebrochener Transport und Wiederholung |
| F7 Abschluss nach Save-Fehler | Latest-Version-Prüfung, Save vor Finalize, kein Finalize nach Fehlschlag | Komponenten, reale Versionskonkurrenz, injizierter letzter Save-Fehler mit DB-/Invite-Prüfung |
| F8 Validierung fehlt | Gemeinsame Schemas/DTOs, echte Kalenderdaten, Grenzen; robuster CSV-Parser | Schema/DTO/CSV-Tests, vollständige und teilweise Importfehler über HTTP |
| F9 Draft-Löschen gefährlich | Zustandsprüfung unter Lock; globale Konten bleiben; dauerhafter Foto-Cleanup-Auftrag | Service-/DB-Tests, aktive/verknüpfte Mitarbeiter geschützt, Storage-Retry und Upload-Lock |
| F10 Menü funktionslos | Bestätigungsdialog für zulässige Drafts, Backend-Mutation und Listeninvalidierung | Browser: Abbruch, Bestätigung, Reload und DB-Nachweis |

Zusätzlich geschlossen: Mitarbeiterrechte erlauben keine globalen User-Mutationen; direkte Login-E-Mail-Abfragen sind auf den Eigentümer begrenzt. E-Mail-Identitätssuche verwendet einen parametrisierten, nicht musterabhängigen Vergleich: Unterstrich und Prozentzeichen sind wörtliche Zeichen. Mehrdeutige Altbestände werden nicht automatisch zugeordnet.

## Ausgeführte Prüfungen

- Backend gesamt: `pnpm --filter @restart/backend exec jest --runInBand` — **147 Suiten, 1.517 Tests erfolgreich**.
- PostgreSQL-Sicherheit: `NODE_ENV=test ALLOW_TEST_DATABASE_RESET=true DB_HOST=127.0.0.1 DB_PORT=5435 DB_USERNAME=test DB_PASSWORD=test DB_NAME=restart_test pnpm --filter @restart/backend exec jest --config test/jest-e2e.json --runInBand --runTestsByPath test/employee-security.integration-spec.ts` — **13 erfolgreich**, einschließlich echter Migration und präziser FK-Fehlerprüfung.
- Bestehende PostgreSQL-Verbraucher: gleiche Umgebung mit `employee-absences`, `employee-vacations`, `school-classes`, `students-teacher-scoping` Integration — **51 erfolgreich**.
- Browser gesamt: `pnpm --filter @restart/e2e exec playwright test --config playwright.employee.config.ts` — **47 erfolgreich** über Chromium, Firefox und WebKit. Enthält verschärften bisherigen Onboarding-Abschluss.
- Web-Gesamtlauf: `pnpm --filter @restart/web test` — **94 Suiten, 634 Tests erfolgreich**; danach zwei zusätzliche Unmount-Regressionen ergänzt und im separaten Coverage-Lauf erfolgreich geprüft.
- Stabilität: `pnpm --filter @restart/e2e exec playwright test --config playwright.employee.config.ts --grep 'two organizations|parallel confirmation|writer saves|injected slow|stale browser|final save failure' --repeat-each 3 --retries 0` — **42 erfolgreich**, einschließlich direkter fremder Login-E-Mail-Abfragen.
- Web-Coverage: `pnpm --filter @restart/web test:employee:coverage` — **54 Tests erfolgreich**; vier handgeschriebene Action-/Wizard-/Mapping-Dateien: **99,53 % Zeilen, 90,49 % Zweige**, jede Datei mindestens 90 %/85 %.
- Backend-Coverage: `pnpm --filter @restart/backend test:employee:coverage`; **188 Tests in 13 Suiten erfolgreich**; die acht abgegrenzten Basis-/Sicherheitsmodule haben ein separates Gate von 90 % Zeilen/85 % Zweigen. Der gemeinsame Employee-Service und der globale E-Mail-Resolver bleiben zusätzlich im Bericht sichtbar, ohne vollständige Abdeckung zu behaupten: Employee-Service **81,81 % Zeilen/65,75 % Zweige**, E-Mail-Resolver **65,71 % Zeilen/100 % Zweige** (GraphQL-Decorator-/Admin-Delegationspfade nicht vollständig als Unit-Funktionen ausgeführt). Gesamtbericht inklusive dieser Dateien: **89,82 % Zeilen/78,04 % Zweige**. Die Basis-Patch-Logik erreicht **100 %/100 %**.
- Backend/Web-Typechecks: jeweils `pnpm --filter @restart/<backend|web> exec tsc --noEmit` erfolgreich. Mobile-Typecheck ebenfalls erfolgreich; keine Mobile-Produktänderung.
- GraphQL: zweimal `CODEGEN_GRAPHQL_URL=http://localhost:4101/graphql pnpm --filter @restart/web codegen`; SHA-Prüfung von `graphql.ts` und `gql.ts` unverändert im zweiten Lauf.
- Lint der geänderten Backend- und Web-Dateien erfolgreich: 75 beziehungsweise 40 Dateien, keine Fehler. Acht TypeScript-Unsafe-Warnungen in der Feldmiddleware und eine React-Hook-Form/Compiler-Warnung bleiben sichtbar. `git diff --check` erfolgreich. Backend-Produktionsbuild (`pnpm --filter @restart/backend build`) erfolgreich.
- Nach der abschließenden Unmount-Korrektur: erneuter Chromium-Lauf `--grep 'writer saves|final save failure'` — **2 erfolgreich**, beide zusätzlichen Unmount-Komponententests im Coverage-Lauf erfolgreich; erneuter Webpack-Build und gezieltes Lint erfolgreich.
- Web-Produktionsbuild mit Webpack und lokalem Font-Testadapter erfolgreich. Turbopack-Build durch lokale Port-/Sandboxbeschränkung (EPERM) blockiert, auch nach erhöhter Ausführung; kein erfolgreicher Turbopack-Nachweis.

## Grenzen und Betrieb

Coverage ist kein Beweis vollständiger Sicherheit. Die verbleibenden Zweige und der gemischte Employee-Service sind in den Berichten sichtbar. Prozentwerte beziehen sich ausdrücklich auf die genannten Module, nicht auf das gesamte Projekt. Testdatenbank und Mail-/Dateispeicher sind isoliert; keine echten Einladungen wurden versendet.

CI-Konfiguration führt Coverage-Gates, echte Browser/API-Tests und dreifache kritische Race-Szenarien aus und archiviert Ergebnisse. Ein externer CI-Lauf wurde in dieser Sitzung nicht ausgelöst. Lokale Test-/Build-Nachweise ersetzen diesen nicht.

Migration und Cutover: siehe [Architektur und Cutover](./mitarbeiter-basis-architektur-cutover.md). Vor produktiver Einführung sind Backup, Konfliktprüfung am tatsächlichen Bestand und kontrollierter Versionswechsel erforderlich. Bereits früher überschriebene Daten lassen sich ohne historische Quelle nicht rekonstruieren. Kein Deployment oder Commit wurde ausgeführt.
