# Review Mitarbeiter – Basisinformationen

Stand: 10.09.2026. Gegenstand ist der aktuelle Arbeitsstand, kein PR-Diff. Keine Implementierung geändert.

**Ergebnis: Mehrere erhebliche Berechtigungslücken und reproduzierbare Speicherfehler. Die bestehenden Tests sind nicht vollständig und teilweise als Sicherheitsnachweis ungeeignet.**

Geprüft: Mitarbeiterliste, Detailansicht, aktueller Anlegen-/Bearbeiten-Wizard, Person/Kontakt/Adresse/Geburtsdatum/AHV/Foto, zugehörige Server Actions, GraphQL/CSV, User-/Membership-Persistenz, Guards/Feldschutz, Änderungshistorie und relevante Tests. Rollen und Memberships sind wegen ihrer unmittelbaren Auswirkungen auf Basisdaten und Zugriffsrechte einbezogen. Vertragslogik, Lohn, Absenzen, Zeiterfassung, HR-/Notfall-Unterbereiche und Einladungsabläufe sind keine eigenständigen Reviewgegenstände.

Die aktuellen Edit-Routen rendern `EmployeeOnboardingWizard`. `EmployeeEditView` und `updateEmployeeAction` sind daher kein ausreichender Maßstab für den produktiven Bearbeitungspfad.

P1 = vor Freigabe beheben; P2 = funktionaler Fehler bzw. relevantes Sicherheits-/Robustheitsproblem; P3 = geringere funktionale Auswirkung. Befunde sind aus Quellcode und gezielten isolierten Reproduktionen abgeleitet; es fand kein Angriff gegen eine laufende Installation statt.

## Sicherheitsbefunde

### S1 – P1: Rolleneskalation über Mitarbeiterbearbeitung

Fundstellen: `apps/backend/src/employee-management/employees/employees.resolver.ts:170`, `employees.service.ts:641`.

`upsertEmployeeOnboardingDraft` verlangt ausschließlich `EMPLOYEE_WRITE`. `applyOnboardingRoles` akzeptiert jede Rolle der aktuellen Organisation und ersetzt damit die Membership-Rollen. Der Aufrufer wird dem Service nicht übergeben; `ROLE_ASSIGN`, eigene Berechtigungen und Schutz privilegierter Rollen werden hier nicht geprüft.

Ein Benutzer mit Mitarbeiter-Schreibrecht und bekanntem Owner-Rollenbezeichner kann seinen eigenen Mitarbeiterdatensatz oder den eines kontrollierten Kontos auf die Owner-Rolle setzen. Der nächste Auth-Kontext liest diese Rollen aus `membership_roles`. Ein bloßer Mandantenvergleich der Rolle verhindert das nicht. Auch `roleIds: []` kann privilegierte Memberships entrollen.

**Korrektur:** Rollenänderungen separat autorisieren, Akteur weiterreichen, Rechteausweitung und Entfernen des letzten Owners verhindern. Bestehende Rollen unverändert lassen, wenn nur Personendaten bearbeitet werden. **Test:** Nicht-Superadmin mit `EMPLOYEE_WRITE`, ohne `ROLE_ASSIGN`, versucht Selbsteskalation und Fremdzuweisung; beide müssen ohne DB-Änderung scheitern. Separat Hierarchie und letzten Owner testen.

### S2 – P1: CSV-Import umgeht Mitarbeiter-Schreibberechtigung

Fundstelle: `apps/backend/src/employee-management/employees/employees.controller.ts:52`.

`POST /api/employees/upload` verwendet `BetterAuthGuard`, besitzt aber weder `@Permissions('EMPLOYEE_WRITE')` noch eine Rollenanforderung. Der Guard erlaubt authentifizierte Requests ausdrücklich, wenn keine solchen Metadaten vorhanden sind. Eine bestehende Organisationsmitgliedschaft reicht damit zum Anlegen von Mitarbeitern, selbst ohne Mitarbeiter-Lese- oder Schreibrecht. Der globale Guard ist nur der Throttler; die Frontend-Navigation verhindert direkte API-Aufrufe nicht.

**Korrektur:** Dieselbe Schreibberechtigung wie bei `createEmployee` erzwingen. **Test:** HTTP-Multipart-Request als Mitglied ohne Schreibrecht → 403 und kein Serviceaufruf; berechtigter Import → Erfolg. Guard und Controller gemeinsam testen.

### S3 – P1: Membership-API ermöglicht Zugriff auf fremde Mitarbeiterdaten

Fundstellen: `apps/backend/src/memberships/memberships.resolver.ts:28`, `memberships.service.ts:27`, `memberships.service.ts:findByOrgId`.

Die ergänzende API ist ein alternativer Zugriffspfad auf dieselben Mitarbeiter-Basisdaten: `membershipsByOrgId` übernimmt die Organisation aus dem Clientargument und lädt User, E-Mail und Rollen ohne Abgleich mit der aktiven Organisation. `updateMembership` aktualisiert ausschließlich nach ID. Die geerbte Update-Eingabe erlaubt zusätzlich `organizationId`, `userId` und `userEmailId`.

Mit `EMPLOYEE_READ` in Organisation A und bekannter ID von B lassen sich Memberships und Personendaten von B abfragen. Mit `EMPLOYEE_WRITE` können fremde Memberships geändert werden. Selbst wenn `employeeById` korrekt isoliert ist, bleibt dieser Umweg offen.

**Korrektur:** Organisation aus der Session ableiten, Updates nach ID **und** Organisation filtern, Identitäts-/Mandantenwechsel aus dem allgemeinen Update-DTO entfernen bzw. separat autorisieren. Zugehörigkeit referenzierter UserEmail prüfen. **Test:** Zwei Organisationen, echte GraphQL-Requests mit fremder Organisations-/Membership-ID; keine Daten und keine Mutation.

### S4 – P1: Bestehende globale Benutzerkonten lassen sich ohne Zustimmung verknüpfen

Fundstellen: `apps/backend/src/employee-management/employees/employees.service.ts:95`, `employees.service.ts:upsertEmployeeOnboardingDraft`, `employees.service.ts:484`.

Beim Anlegen wird eine E-Mail global in `UserEmail` gesucht. Existiert sie, wird derselbe `User` unmittelbar mit einer neuen Membership verbunden. Eine Bestätigung des Kontoinhabers oder eine vorhandene Beziehung zur eigenen Organisation wird nicht verlangt. Die Rückgabe lädt den vorhandenen User einschließlich privater Basisdaten. Spätere Mitarbeiterbearbeitung schreibt direkt auf diesen gemeinsamen User.

Wer Mitarbeiter anlegen darf und die E-Mail eines fremden bestehenden Kontos kennt, kann es in die eigene Organisation aufnehmen, dessen gespeicherte Basisdaten lesen und z. B. Name, Adresse oder AHV ändern. Auch bei legitim mehrfach beschäftigten Personen wirken Änderungen in Organisation A unmittelbar in B. Die korrekte Employee-Organisationsprüfung löst dieses Problem nicht, weil der Employee in A tatsächlich dem Angreifer zugänglich ist.

**Korrektur:** Neue organisationsbezogene Mitarbeiterdaten unabhängig speichern; Kontoverknüpfung erst über einen bestätigten Einladungs-/Zustimmungsprozess. Globale Identitätsdaten nur über einen entsprechend autorisierten Prozess ändern. **Test:** Bereits existierender User aus B; Anlegen in A darf keine fremden Details offenlegen oder deren Änderung ermöglichen.

### S5 – P1: Lehrer-Auswahlliste gibt private Basisdaten ohne Mitarbeiter-Leserecht frei

Fundstellen: `apps/backend/src/employee-management/employees/employees.resolver.ts:215`, `employees.service.ts:findTeachersByOrgId`, `apps/backend/src/users/entities/user.entity.ts:dateOfBirth`, `packages/shared-schemas/src/rbac/field-catalog.ts`.

`teachersByOrgId` ist mit `SCHOOL_CLASS_READ` erreichbar und gibt vollständige `Employee`-Objekte mit geladenem `membership.user` zurück. Ein Client kann deshalb zusätzlich zu ID/Name auch `socialSecurityNumber`, `dateOfBirth`, `privateEmail` und Adresse abfragen. Diese `User`-Felder fehlen im geschützten Feldkatalog; die globale Feld-Middleware reicht sie unverändert durch. Die schmale Query der Web-Auswahlliste begrenzt die API nicht.

**Korrektur:** Eigenen TeacherOption-GraphQL-Typ mit ID/Anzeigename verwenden; private User-Felder passend schützen. **Test:** Caller mit ausschließlich `SCHOOL_CLASS_READ` darf keine AHV-/Kontakt-/Adressdaten erhalten.

### S6 – P2: CSV-Upload ohne Größen- und Zeilenlimit

Fundstelle: `apps/backend/src/employee-management/employees/employees.controller.ts:54`.

`FileInterceptor('file')` hat kein `fileSize`-Limit. Anschließend werden Datei, kompletter Text und alle Zeilen im Speicher gehalten und pro Zeile eine Transaktion mit gegebenenfalls Passwort-Hashing ausgeführt. Ein authentifizierter Nutzer kann mit wenigen großen Requests Speicher und Verarbeitung belasten. Ein Request-Throttler begrenzt weder Dateigröße noch Datensätze pro Request. Ob die konkrete Deployment-Infrastruktur zusätzlich begrenzt, wurde nicht geprüft.

**Korrektur:** Dateigröße, Zeilenanzahl und Feldlängen begrenzen; große Importe gegebenenfalls als Job verarbeiten. **Test:** Überschreitung vor Verarbeitung ablehnen, keine teilweise angelegten Datensätze bei ungültiger Gesamtstruktur.

Die fehlende Funktionsautorisierung in S1/S2 entspricht [OWASP API5: Broken Function Level Authorization](https://owasp.org/API-Security/editions/2023/en/0xa5-broken-function-level-authorization/). Diese Quelle dient der Einordnung; die projektspezifischen Nachweise stammen aus dem Code.

## Funktionale Befunde und Codequalität

### F1 – P2: Optionale Basisdaten lassen sich nicht löschen

Fundstellen: `apps/web/features/employees/actions/employee-onboarding.actions.ts:20`, `:48`; `apps/backend/src/employee-management/employees/employees.service.ts:504`.

Leere Werte werden zu `undefined` und verschwinden aus dem GraphQL-Request. Der Backend-Patch interpretiert fehlende Werte als „unverändert“. Adresse, private E-Mail, AHV, Telefon, Titel, Geburtsdatum und Avatar-Verweis bleiben deshalb erhalten, obwohl die Oberfläche erfolgreiches Speichern meldet. Zusätzlich verwandelt das Backend explizit geleerte Telefonnummern wieder in `undefined`; TypeORM überspringt diese bei `save`.

**Korrektur:** PATCH-Semantik durchgängig festlegen: ausgelassen = unverändert, `null` = löschen. Nullable DB-Spalten mit `null` schreiben. **Test:** Wert setzen → UI leeren → speichern → neu laden → DB und Anzeige leer. Für beide Telefonnummern einen echten Persistenztest ergänzen.

### F2 – P2: Änderbare Login-E-Mail wird beim Bearbeiten ignoriert

Fundstellen: `apps/web/features/employees/components/wizard/steps/StepPerson.tsx:email`, `apps/backend/src/employee-management/employees/employees.service.ts:467`.

Die Login-E-Mail ist auch bei bestehendem Draft/aktivem Mitarbeiter editierbar und wird gesendet. Der Update-Zweig verarbeitet `input.email` jedoch überhaupt nicht. Der Wizard bestätigt trotzdem Erfolg; Konto und Kontaktadresse bleiben unverändert. Schon die Korrektur eines Tippfehlers nach dem ersten Draft-Speichern scheitert dadurch unbemerkt.

**Korrektur:** Entweder Feld nach Anlage sperren und dedizierten E-Mail-Wechsel anbieten oder einen autorisierten, verifizierten Wechsel implementieren, der Domain- und Auth-Konto konsistent behandelt. **Test:** Draft und aktiver Mitarbeiter, neue Adresse, erneutes Laden; keine falsche Erfolgsmeldung.

### F3 – P2: Geburtsdatum kann um einen Tag verschoben gespeichert werden

Fundstellen: `apps/web/components/form/form-fields/DatePickerFormField.tsx:handleDateChange`, `apps/web/features/employees/actions/employee-onboarding.actions.ts:17`.

Der Picker versieht den gewählten Kalendertag mit der aktuellen lokalen Uhrzeit. Die Action nimmt anschließend das UTC-Datum aus `toISOString()`. Reproduziert: 15.06.1990, 00:30 Uhr Europe/Zurich → übermitteltes Datum `1990-06-14`. Der Fehler hängt von Uhrzeit und Zeitzone ab.

**Korrektur:** Geburtsdaten als Datum ohne Zeitzone führen und den ausgewählten lokalen Kalendertag serialisieren. **Test:** Picker→Action→DB mit eingefrorener Uhrzeit, Zürich kurz nach Mitternacht, Sommer/Winter und negativer UTC-Zone.

### F4 – P2: Basisdatenänderung entfernt weitere Rollen

Fundstellen: `apps/web/features/employees/lib/map-employee-to-onboarding-form.ts:97`, `apps/web/features/employees/actions/employee-onboarding.actions.ts:67`, `apps/backend/src/employee-management/employees/employees.service.ts:652`.

Eine Membership kann mehrere Rollen besitzen. Der Mapper übernimmt nur `roles[0]`; jeder Wizard-Speichervorgang sendet anschließend genau diese eine Rolle. Das Backend ersetzt das komplette Rollenarray. Bereits eine reine Adressänderung entfernt dadurch alle anderen Rollen; welche erhalten bleibt, hängt von der Reihenfolge der geladenen Relation ab.

**Korrektur:** Alle Rollen erhalten bzw. Rollen nur bei expliziter Rollenänderung senden. **Test:** Mitarbeiter mit zwei Rollen, nur Telefonnummer ändern; beide Rollen bleiben bestehen.

### F5 – P2: Aktueller Bearbeitungspfad umgeht Änderungshistorie

Fundstellen: `apps/backend/src/employee-management/employees/employees.service.ts:454`, `apps/backend/src/employee-management/employees/employees.resolver.ts:172`.

`updateEmployeeMinimal` protokolliert Änderungen inklusive Akteur. Der tatsächlich verwendete Wizard schreibt über `upsertEmployeeOnboardingDraft` ohne `logChanges` und ohne Akteurparameter. Änderungen an Name, Adresse, AHV, Telefonnummern und Rollen sind dadurch nicht nachvollziehbar. Ein vorhandener grüner Audit-Test für den älteren Update-Pfad schützt die aktuelle Oberfläche nicht.

**Korrektur:** Basisdaten-Patch und Audit-Log zentral wiederverwenden; Akteur aus Session übergeben; Log in derselben Transaktion schreiben. **Test:** Aktive Mitarbeiter über Wizard-Mutation ändern; genau ein korrekter Vorher/Nachher-Eintrag, kein Eintrag bei unveränderten Daten, gemeinsamer Rollback bei Fehler.

### F6 – P2: Ungültige optionale Eingaben lassen Speichern hängen

Fundstellen: `apps/web/features/employees/actions/employee-onboarding.actions.ts:95`, `apps/web/features/employees/components/wizard/EmployeeOnboardingWizard.tsx:123`.

Die Action ruft `Schema.parse` außerhalb des `try` auf. „Weiter“ bzw. „Speichern und schließen“ validieren nur Vorname/Nachname/Login-E-Mail. Eine ungültige private E-Mail passiert diese Teilprüfung, lässt die Action aber werfen. `saveDraft` hat kein `catch/finally`: Der Zustand bleibt „saving“, beim finalen Speichern ggf. zusätzlich `submitting`. Autosave ruft dieselbe Action ohne Fehlerbehandlung auf.

**Korrektur:** `safeParse` mit strukturierten Feldfehlern; vollständige relevante Validierung; Zustände in `finally` zurücksetzen. **Test:** Ungültige private E-Mail sowie abgelehnte/unterbrochene Server Action müssen sichtbare Fehler und erneut bedienbare Buttons ergeben.

### F7 – P2: Finalisieren trotz fehlgeschlagenem Speichern

Fundstelle: `apps/web/features/employees/components/wizard/EmployeeOnboardingWizard.tsx:206`.

Vor `finalizeEmployeeOnboardingAction` wird `saveDraft()` zwar abgewartet, dessen Ergebnis aber ignoriert. Bei einem bestehenden, bereits vollständigen Draft kann das letzte Speichern fehlschlagen und anschließend trotzdem der ältere Stand aktiviert werden. Auch laufende debouncte Speicherungen werden nicht serialisiert oder vor dem Finalisieren zuverlässig abgeschlossen.

**Korrektur:** Bei fehlgeschlagenem Save abbrechen; Speichervorgänge serialisieren, ausstehende Autosaves vor Abschluss koordinieren und veraltete Antworten ignorieren. **Test:** Letztes Save schlägt fehl → kein Finalize; verzögerte Antworten dürfen neue Basisdaten nicht überschreiben.

### F8 – P2: API-Validierung akzeptiert ungültige Basisdaten

Fundstellen: `apps/backend/src/employee-management/employees/dto/create-employee.input.ts:CreateEmployeeInput`, `dto/employee-onboarding.input.ts:239`, `employees.controller.ts:87`.

Namen, Login-/private E-Mail und Geburtsdatum werden überwiegend nur mit `IsString` geprüft; Nicht-Leer-, E-Mail-, Datum- und Längenprüfungen fehlen. Der CSV-Controller ruft den Service außerdem mit einem Plain Object direkt auf; DTO-Pipes werden auf einzelne CSV-Zeilen nicht angewandt. Ungültige E-Mails können gespeichert werden, ungültige Datumswerte/Längen laufen bis zum DB-Fehler. Auch das Frontend akzeptiert Namen ausschließlich aus Leerzeichen, die anschließend getrimmt werden.

**Korrektur:** Gemeinsame fachliche Normalisierung/Validierung für GraphQL und Import; Namen trimmen und auf Nicht-Leer prüfen, passende E-Mail-/Datum-/Längenregeln; stabile fachliche Importfehler statt roher DB-Meldungen. **Test:** Direkte API und CSV mit Leerzeichenname, falscher E-Mail, ungültigem Datum, Maximal- und Überlänge.

### F9 – P2: Draft-Löschen entfernt vorhandene Kontostrukturen oder scheitert an Fremdschlüsseln

Fundstelle: `apps/backend/src/employee-management/employees/employees.service.ts:437`.

Beim Anlegen dürfen bestehende User und bestehende Memberships wiederverwendet werden. Das Löschen eines Drafts entfernt dagegen bedingungslos Membership, Employee und User. Bei weiteren Memberships verhindert `onDelete: RESTRICT` die User-Löschung und die Transaktion schlägt fehl. Bei einer zuvor vorhandenen einzigen Membership kann das Löschen eines neu angehängten Mitarbeiter-Drafts bereits existierende Kontodaten und Zugriffsbeziehungen beseitigen. Auch „nie eingeladen“ wird trotz Kommentar nicht geprüft.

**Korrektur:** Eigentümerschaft/Lebenszyklus unterscheiden, bestehende Membership erhalten und nur Employee-Verknüpfung lösen; globalen User nur über einen eigenständigen sicheren Löschprozess entfernen. Status und Abhängigkeiten innerhalb der Transaktion prüfen. **Test:** Neuer User, wiederverwendeter User mit mehreren Organisationen, vorhandene Membership ohne Employee, bereits eingeladener Draft; reale FK-Constraints.

### F10 – P3: Löschen-Menüpunkt ohne Funktion

Fundstelle: `apps/web/features/employees/components/EmployeeActionsCell.tsx`, letzter `DropdownMenuItem`.

Der sichtbare Löschen-Eintrag hat weder Handler noch Link. **Korrektur:** Autorisierten Lösch-/Archivierungsablauf verbinden oder Eintrag bis dahin entfernen. **Test:** Klick führt zum vorgesehenen Dialog/Ablauf; aktiver Mitarbeiter und Draft getrennt behandeln.

## Bewertung der Tests

### Ausgeführte Prüfungen

- Web: vier Dateien, **13 Tests bestanden** (`EmployeeAvatar`, `role-options`, `map-employee-to-onboarding-form`, `onboarding-form-date`).
- Backend-Standardkonfiguration: drei Mitarbeiter-Testdateien, **47 Tests bestanden** inklusive regulärer ts-jest-Kompilierung (186,8 Sekunden). Kein projektweiter Typecheck ausgeführt.
- Backend: fünf Dateien, **72 Tests bestanden** (`employees.service`, `employees.resolver`, `employees.onboarding.service`, `upload.controller`, `better-auth.guard`), mit isolierter TypeScript-Transpilierung. Das bestätigt Laufzeit-Assertions, keine vollständige Typprüfung.
- Zusätzliche isolierte Reproduktionen gegen transpilierten Originalcode bestätigten F1, F2, F3, F5 sowie die gemeinsame User-Mutation und die fehlende Akteurprüfung bei Rollen. Externe Dienste, Schema-Parsing und DB waren dabei gemockt; dies ist ausdrücklich kein HTTP-/DB-Integrationstest.
- Browser-E2E wurde statisch geprüft, nicht ausgeführt. Die vorhandene globale Einrichtung legt ein Auth-Konto an; ein isolierter Testdatenbank-/Browserlauf wurde in diesem Review nicht eingerichtet. Daher kein Nachweis tatsächlicher Browser-, Mail- oder DB-End-to-End-Funktion.

Die 47 Tests des Standardlaufs sind in den 72 Tests enthalten; insgesamt wurden damit **85 unterschiedliche Tests** erfolgreich ausgeführt.

Coverage des Standard-Backend-Laufs für `employee-management/employees/*.ts`: insgesamt **64,06 % Zeilen / 44,68 % Branches**; Service **72,96 % Zeilen / 47,68 % Branches**; CSV-Controller **0 %**. Die Gesamtauswertung enthält auch nicht separat bewertete Einladungs- und Vertragsanteile; sie ist keine isolierte Basisinfos-Abdeckungsquote. Insbesondere der Neuanlagepfad des Services und erfolgreiche Rollenzuweisung bleiben in diesem Lauf weitgehend unberührt. Der isoliert transpilierte Zusatzlauf ergibt wegen anderer Instrumentierung leicht abweichende Branch-Zahlen.

Reproduzierbare Befehle ab Repository-Root:

```sh
pnpm --filter @restart/backend exec jest --runInBand --runTestsByPath src/employee-management/employees/employees.service.spec.ts src/employee-management/employees/employees.resolver.spec.ts src/employee-management/employees/employees.onboarding.service.spec.ts --coverage --collectCoverageFrom='employee-management/employees/*.ts' --coverageDirectory=/private/tmp/restart-employee-review-coverage
pnpm --filter @restart/web exec vitest run features/employees/lib/onboarding-form-date.test.ts features/employees/lib/role-options.test.ts features/employees/lib/map-employee-to-onboarding-form.test.ts features/employees/components/EmployeeAvatar.test.tsx
node /private/tmp/restart-employee-review-probes.cjs
```

Das zusätzliche Reproduktionsskript und die Coverage-Artefakte liegen temporär unter `/private/tmp`; die Projekttests wurden nicht verändert.

### Aussagekraft und fehlerhafte Erwartungen

1. **Resolver-Unit-Tests umgehen Authentifizierung/Autorisierung.** Beide Guards werden ersetzt, Resolver direkt aufgerufen. Weitergabe von `org-1` und Weiterreichen eines gemockten `NotFoundException` sind sinnvolle Delegationstests, aber kein Nachweis echter Mandantentrennung.
2. **Membership-Test bestätigt die falsche Sicherheitsannahme.** `apps/backend/src/memberships/memberships.resolver.spec.ts:74` erwartet unveränderte Weitergabe der vom Client gelieferten Organisations-ID. Genau diese Erwartung konserviert S3. Die maßgebliche Organisation muss aus dem Caller-Kontext stammen.
3. **Draft-Löschtest konserviert gefährliches Verhalten.** `employees.service.spec.ts` erwartet explizit das Entfernen von User und Membership. Der Mock kennt weder bestehende Kontobeziehungen noch FK-Restriktionen und lässt F9 grün werden.
4. **Audit-Test prüft den alten Pfad.** Er testet `updateEmployeeMinimal`; das aktuelle UI nutzt `upsertEmployeeOnboardingDraft`. F5 bleibt vollständig unentdeckt.
5. **Mapper-Tests konzentrieren sich auf Verträge.** Keine Roundtrips für alle Personendaten, keine mehrfachen Rollen, keine abweichende organisationsbezogene Kontakt-E-Mail. Der Geburtsdatum-Picker→Action-Pfad wird nicht getestet.
6. **E2E verwendet Superadmin.** Das testet weder `EMPLOYEE_READ/WRITE` noch Rollen-/Feldrechte normaler Mitarbeiter. Der Happy Path prüft am Ende einen sichtbaren Namen, ausdrücklich „draft or active“, statt finalen Status und gespeicherte Basisdaten nach erneutem Laden.
7. **E2E umgeht Timing-Probleme.** Ein Kommentar beschreibt die Autosave-Race; der Test wartet auf „Draft saved“, statt rasches Weiterklicken/Finalisieren gezielt abzusichern. Der Indikator kann zudem noch von einer früheren Speicherung stammen.
8. **Keine spezifischen Mitarbeiterbasis-DB-/HTTP-Integrationstests gefunden.** Es existieren Integrationstests anderer Mitarbeiter-Unterbereiche und des Auth-Kontexts. Diese ersetzen keine realen Constraints, Rollbacks, Berechtigungen und verknüpften User/Membership-Schreibvorgänge des geprüften Pfads.

### Fehlende Regressionstests – Priorität

| Priorität | Testgruppe | Erforderlicher Nachweis |
|---|---|---|
| P1 | HTTP-/GraphQL-Berechtigungen | Anonym, Mitglied ohne Rechte, Read-only, Writer, Rollenverwalter, Owner; echte Guards; CSV eingeschlossen |
| P1 | Zwei Organisationen | Alle alternativen Lese-/Schreibpfade inklusive Membership und bestehender globaler User |
| P1 | Rollen | Selbsteskalation, fremde/privilegierte Rolle, mehrere Rollen erhalten, letzter Owner |
| P1 | Datenminimierung | TeacherOption-Abfrage kann keine privaten Mitarbeiterdaten anfordern |
| P2 | Basisdaten-Roundtrip | Alle Felder setzen, ändern, explizit löschen; Seite neu laden und DB prüfen |
| P2 | Datenvalidierung | GraphQL und CSV identisch; Leerzeichen, falsche E-Mail/Datum, Längen, Nullwerte |
| P2 | Datum | Kalendertag unabhängig von Uhrzeit, Sommerzeit und Client-Zeitzone |
| P2 | Speichern | Invalides optionales Feld, abgelehnte Action, langsame/überholte Antwort, Doppelklick, fehlgeschlagenes Save vor Finalize |
| P2 | Transaktion und Historie | User/Membership/Employee/Audit konsistent; Fehler rollt alles zurück; kein Audit bei No-op |
| P2 | Lebenszyklus | Draft mit neuem/wiederverwendetem Konto; FK-Verhalten; keine unbeabsichtigte Kontolöschung |
| P2 | CSV | Größen-/Zeilenlimits, Header, BOM, Quotes/Delimiter, partielle Fehler und Duplikate |

Positiv: Der primäre Employee-Einzelzugriff und sein Update prüfen die Organisationszugehörigkeit; der Listenquery filtert nach Organisation; User-Passwort-/Tokenfelder sind aus GraphQL verborgen; der allgemeine Foto-Upload besitzt Rollenprüfung, Zielprüfung, UUID-/MIME-Prüfung und ein 5-MB-Limit. Diese Schutzmaßnahmen beseitigen die oben beschriebenen alternativen Zugriffspfade nicht.

Die vorhandenen lokalen Änderungen an Theme/CSS/Turbo wurden nicht bearbeitet. Dieser Bericht ist eine Review, keine Sicherheitsfreigabe oder implementierte Korrektur.
