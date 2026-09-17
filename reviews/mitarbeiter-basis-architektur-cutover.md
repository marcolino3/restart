# Mitarbeiterprofile und Konten: Architektur und Übernahme

Stand 14.09.2026. Umsetzungsentscheidung für den freigegebenen Mitarbeiter-Basisplan. Kein Deployment erfolgt; Abschlussprüfungen stehen noch aus, siehe Umsetzungsstand.

## Datenverantwortung

`Employee.organizationId` bestimmt die Organisation. `Employee.profile` enthält deren Personaldaten einschließlich Kontakt-/Einladungsadresse. Mitarbeiter-Patches ändern ausschließlich dieses Profil und ausdrücklich übermittelte Mitarbeiterfelder. Sie dürfen weder globale Benutzer verändern noch anhand einer bekannten Adresse automatisch ein Konto zuordnen.

`User` und `UserEmail` bilden die globale Identität; better-auth speichert die dazugehörige Anmeldeidentität separat. Eine Organisationsmitgliedschaft kann zunächst ohne `userId` existieren und bleibt bis zur Bestätigung inaktiv. `UNLINKED` kennzeichnet neue unverbundene Profile, `LEGACY` übernommene bestehende Zuordnungen, `CONFIRMED` ausdrücklich bestätigte Verknüpfungen. `LEGACY` ist kein Nachweis einer nachträglich erteilten Zustimmung.

Die Einladungsannahme verlangt eine angemeldete passende Identität und ein gültiges einmaliges Token. Bestehende Konten und Mitgliedschaften werden erhalten; der Vorgang darf keine zweite globale Identität erzeugen. Org-/Mitarbeiter-/Tokenlocks sowie ein gemeinsamer E-Mail-Advisory-Lock serialisieren konkurrierende Änderungen. Die Einladung speichert nur den Tokenhash.

Login-E-Mail-Änderungen laufen separat unter der Sitzung des Kontoinhabers. Beide Postfächer müssen bestätigen. Die zweite Bestätigung aktualisiert `user_emails` und better-auth in derselben Transaktion, erhält die UserEmail-ID und widerruft vorhandene Sessions. Sie verändert keine Organisationsprofile. Globale administrative User-Mutationen sind Superadmins vorbehalten; `EMPLOYEE_WRITE` reicht dafür nicht.

## Migrationswirkung

- `1789040000000-EmployeeOrganizationProfiles`: additive Profilspalten, Kopie aus dem bisher gemeinsam verwendeten User und der explizit ausgewählten Membership-UserEmail, Kennzeichnung als LEGACY, Org-/Zuordnungsconstraints, nullable Membership.userId und Einladungs-Tabelle.
- `1789380000000-EmployeeStorageCleanup`: dauerhafte Bereinigungsaufträge und höchstens ein aktueller Einladungsdatensatz je Mitarbeiter.
- `1789390000000-AccountEmailChanges`: kurzlebige Bestätigungsdatensätze für eigene Login-E-Mail-Änderungen.

Globale Userdaten werden beim Backfill nicht gelöscht. Bestehende Profilwerte werden nur dort befüllt, wo die Organisationszuordnung noch fehlt. Mehrere Organisationen erhalten jeweils eine unabhängige Kopie. Das löst historische fachliche Widersprüche nicht automatisch; solche Daten müssen verantwortlich geprüft werden.

## Vorprüfung auf einer wiederhergestellten Datenbankkopie

Vor produktiver Ausführung zunächst ein konsistentes Backup einschließlich Auth-Tabellen erstellen und dessen Wiederherstellung testen. Die folgenden Abfragen liefern ausschließlich Fehlerzahlen und geben keine Personendaten aus. Sie setzen das Schema vor der Profilmigration voraus.

```sql
-- Fehlende oder mehrdeutige Zuordnung eines Mitarbeiters.
SELECT count(*) AS ambiguous_employee_memberships
FROM (
  SELECT e.id FROM employees e
  LEFT JOIN memberships m ON m.employee_id = e.id
  GROUP BY e.id HAVING count(m.id) <> 1
) problems;

-- Fehlender globaler User oder fehlende explizit ausgewählte Loginadresse.
SELECT count(*) AS incomplete_legacy_sources
FROM memberships m
LEFT JOIN users u ON u.id = m.user_id
LEFT JOIN user_emails ue ON ue.id = m.user_email_id
WHERE m.employee_id IS NOT NULL
  AND (u.id IS NULL OR ue.id IS NULL OR ue.user_id <> m.user_id);

-- Mehrfachmitgliedschaft desselben Users in derselben Organisation.
SELECT count(*) AS duplicate_org_users
FROM (
  SELECT organization_id, user_id FROM memberships
  WHERE user_id IS NOT NULL
  GROUP BY organization_id, user_id HAVING count(*) > 1
) problems;

-- Kollision der künftigen Profiladressen innerhalb einer Organisation.
SELECT count(*) AS duplicate_org_employee_emails
FROM (
  SELECT m.organization_id, lower(trim(ue.email))
  FROM memberships m JOIN user_emails ue ON ue.id = m.user_email_id
  WHERE m.employee_id IS NOT NULL
  GROUP BY m.organization_id, lower(trim(ue.email)) HAVING count(*) > 1
) problems;

-- Uneindeutige globale Adressen bei case-insensitivem Identitätsabgleich.
SELECT count(*) AS ambiguous_global_emails
FROM (
  SELECT lower(trim(email)) FROM user_emails
  GROUP BY lower(trim(email)) HAVING count(*) > 1
) problems;
```

Zusätzlich Quellwerte gegen die Zielspaltenlängen der Migration prüfen und alle Migrationen auf der wiederhergestellten Kopie ausführen. Nicht automatisch abschneiden, löschen oder widersprüchliche Konten zusammenführen. Bei Konflikten müssen Verantwortliche die korrekte Zuordnung anhand der Originaldatensätze klären; jede Korrektur dokumentieren und die Probe wiederholen. Ein fehlgeschlagener Constraint ist ein Abbruchsignal und darf nicht durch Abschalten der Constraints umgangen werden.

## Umstellung

1. Erfolgreiche fachliche, Security-, Migrations- und Browsertests für genau den vorgesehenen Stand sichern. Offene Aufgaben im Umsetzungsstand schließen.
2. Während der Umstellung Mitarbeiter-/Membership-Schreibzugriffe und alte Anwendungsinstanzen anhalten. Alte Writer dürfen nach dem Backfill nicht weiter globale Personendaten schreiben.
3. Verifiziertes Backup erstellen, Vorprüfungen wiederholen und Migrationen über den regulären Migrationsrunner mit Transaktionen ausführen. `synchronize` bleibt deaktiviert.
4. Backend und passende Web-/Mobile-Verbraucher gemeinsam umstellen. Die additive Datenbankänderung allein garantiert keine Kompatibilität alter Clients.
5. Mitarbeiteranzahl und Zuordnungen vergleichen; zwei Organisationen mit demselben bisherigen User prüfen, ebenso unveränderte Loginfähigkeit, Rollen, Profiländerung, Einladung und Dual-Mail-Bestätigung. Keine echten Einladungen als unbeabsichtigten Test versenden.
6. Erst nach den Kontrollen Schreibzugriffe freigeben. Fehlgeschlagene Mails, Authfehler und ausstehende Foto-Bereinigungen beobachten, ohne Tokens oder personenbezogene Inhalte zu protokollieren.

## Fehlerbehebung und Wiederanlauf

Die Profilmigration ist absichtlich nicht per `down` rückbaubar: Nach ersten unabhängigen Profiländerungen lässt sich ein gemeinsamer User nicht verlustfrei rekonstruieren. Nach einem vollständig zurückgerollten Migrationsfehler Ursachen auf der Kopie beheben und erneut prüfen. Bei bereits committed Änderungen eine versionierte Forward-Korrektur erstellen; keine Migration manuell als erledigt markieren.

Ein Restore ist nur als bewusste Wiederherstellung des gesamten konsistenten Backups vor Wiederaufnahme von Schreibzugriffen geeignet. Nach Wiederaufnahme würde er zwischenzeitliche Änderungen verlieren; dann ist die Forward-Korrektur erforderlich. Auth- und Domain-Tabellen dürfen nicht aus unterschiedlichen Zeitständen wiederhergestellt werden.

Foto-Löschaufträge werden zusammen mit der Draft-Löschung committed und bleiben bei Storagefehlern zur Wiederholung erhalten. Der Worker löscht ausschließlich den aus der Mitarbeiter-ID abgeleiteten Objektpfad. Ein Crash nach dem Löschen und vor dem Entfernen des Auftrags führt zu einer idempotenten Wiederholung. Gleichzeitige Mitarbeiter-Uploads halten denselben Organisations-/Mitarbeiterlock wie die Draft-Löschung und prüfen das Ziel unter Lock erneut. Der Regressionstest weist nach, dass ein nach Löschung fortgesetzter Upload kein neues verwaistes Objekt schreibt.

## Vorliegende Nachweise und Grenzen

Die PostgreSQL-Sicherheitssuite prüft die echte Profilmigration auf leerem und repräsentativem Altbestand einschließlich zweier Organisationen mit gemeinsamem User. Browser-E2E starten mit echten Migrationen, echten Sessions und isolierten Mail-/Dateispeichern. Diese Tests ersetzen keine Probe auf einer aktuellen Produktionskopie. Die lokalen Test-, Build- und Coverage-Nachweise einschließlich verbleibender Lücken stehen im [Abschlussbericht](./mitarbeiter-basis-abschluss-2026-09-16.md). Ein produktiver Cutover und externer CI-Lauf wurden nicht ausgeführt.

## Release-Nachprüfung PR #404 (17.09.2026)

Die Probe auf einer wiederhergestellten Staging-Kopie fand eine ältere, noch
nicht ausgeführte Kategorien-Migration: Sie importierte den aktuellen
Anwendungs-Seeder und griff dadurch vorzeitig auf spätere Enumwerte und
Spalten zu. Die drei betroffenen Seed-Migrationen verwenden nun eingefrorene
Migrationsdaten und nur die damals vorhandenen Spalten. Bereits angepasste
Kategorien und Übersetzungen bleiben erhalten. Ein neuer PostgreSQL-Test
führt die Kette mit einer vorab angelegten Organisation aus und prüft auch
idempotente Wiederholung sowie den Erhalt individueller Werte. Eine neue
Vorwärtsmigration allein könnte diesen Fehler nicht beheben, weil die Kette
bereits vorher abbricht.

Die allgemeine Browser-CI enthielt außerdem Fixtures, die noch automatische
Kontoverknüpfung anhand gleicher E-Mail-Adressen voraussetzten. Diese werden
explizit und ausschließlich in einer lokalen E2E-Datenbank provisioniert;
die produktive Zustimmungspflicht bleibt bestehen. Die Klassenansichten
lesen Lehrpersonennamen aus dem Organisationsprofil. Die in CI sichtbaren
SQL-Spaltenfehler der Absenzempfänger werden gegen das migrierte Schema
regressionsgeprüft.

Der vollständige erneute CI-Lauf und die abschließende Staging-Migrationsprobe
sind vor Merge/Deployment noch erforderlich.
