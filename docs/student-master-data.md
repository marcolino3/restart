# Schüler-Stammdaten — Erweiterung (Planung)

Branch: `feat/student-master-data`. Ziel: den heute sehr schlanken `Student`-Stammdatensatz
um register-taugliche und pädagogisch-auswertbare Felder erweitern. Gesundheitsdaten,
Notfallkontakte und Adresse sind BEWUSST ausgeklammert (eigenes, Eltern-gepflegtes Feature
bzw. bereits bei den Bezugspersonen).

## Kontext / Rahmenentscheidungen

- **Zweck:** intern (Pädagogik/Alltag) **und** Behörden/Register-tauglich.
- **Pflege:** teilweise Eltern-gepflegt → braucht eine Feld-für-Feld-Rechte-/Sichtbarkeits-Trennung
  (Architektur wird separat entschieden, siehe unten).
- Schweizer Kontext (AHV-Nr. statt SSN; ss statt ß).

## Heute vorhanden (bleibt unverändert)

`Student` (`apps/backend/src/school-management/students/entities/student.entity.ts`):
Vorname, Nachname, Geburtsdatum, Geschlecht (`Gender`: MALE/FEMALE/OTHER),
Eintrittsdatum (`enrollmentDate`), Austrittsdatum (`exitDate`), Notizen,
Aufnahmestatus (via `admissionStage`-Relation), `isActive`/`isArchived` (AbstractEntity).

Klasse/Stufe hängt NICHT am Student, sondern über `SchoolClassEnrollment` (Historie,
aktuell = `leftAt IS NULL`) → `SchoolClass.gradeLevels`.

## Finaler neuer Feldsatz

### Block A — Identität
| Feld | Typ | Pflicht | Anmerkung |
|---|---|---|---|
| Rufname (`preferredName`) | Text | optional | bevorzugter Name im Alltag |
| Geburtsort (`placeOfBirth`) | Text | optional | Register/Zeugnis |
| Nationalität(en) | **Referenz auf `Country`** (M:N) | optional | Join-Tabelle `student_nationalities`, analog `school_class_grade_levels` |
| Foto (`photoFileId`) | Bild-Upload (FK → File) | optional | Datenschutz-Gate; ersetzt DiceBear-Fallback |

### Block B — Sprache & Bildung
| Feld | Typ | Pflicht | Anmerkung |
|---|---|---|---|
| Erstsprache(n) (`firstLanguages`) | Text[] | optional | DaZ-Auswertung |
| Familiensprache(n) (`familyLanguages`) | Text[] | optional | zu Hause gesprochen |
| Konfession (`religion`) | Text | optional | Art. 9 sensibel → Permission-/Sichtbarkeits-Gate |

### Block C — Behörden/Register
| Feld | Typ | Pflicht | Anmerkung |
|---|---|---|---|
| AHV-Nummer (`socialSecurityNumber`) | Text, maskiert/verschlüsselt | optional | wie `ContactPerson.socialSecurityNumber`; `@HideField()` + Gate |
| Externe Schüler-ID / Matrikelnr. (`externalStudentId`) | Text | optional | kantonales System |

### Bewusst NICHT in den Stammdaten
- **Adresse** → hängt an der Bezugsperson (`ContactPerson.address` / `Family.primaryAddress`).
- **Gesundheit / Allergien / Medikamente / Notfallkontakte** → eigenes Eltern-gepflegtes Feature.
- **Kohorte / Schuljahr** → später als eigene `SchoolYear`/Kohorte-Entity (mit Start/Ende);
  vorerst über `enrollmentDate` ableitbar.

## Architektur & Scopes

Das Gesamtfeature ist in drei Scopes geschnitten. Der vollständige Architektur-Plan
(Entities, Permissions, Feld-Sichtbarkeits-Klassifikation, Log/Kategorie-Modell,
Eltern-Portal-Andockpunkt, Migrations- & Umsetzungsreihenfolge) liegt in
**[`student-master-data-architecture.md`](./student-master-data-architecture.md)**.

Kurzfassung:
- **Scope 1 — Stammdaten** (diese Felder), schul-gepflegt.
- **Scope 2 — Förderprofil/Log** (`StudentRecordEntry` + org-verwaltbare Kategorien + Dokumente),
  schul-intern, hochsensibel.
- **Scope 3 — Eltern-Portal** (Login-Bridge + PARENT-Persona + feld-granulare Rechte) — eigenes
  grosses Feature, später. Scope 1+2 werden so gebaut, dass Scope 3 sauber andockt.

## Datenschutz-Hinweise (revDSG / DSGVO Art. 9)

- **AHV-Nummer, Konfession, Nationalität** sind besonders schützenswert.
- AHV-Nr. wie bestehende `ContactPerson.socialSecurityNumber` behandeln: `@HideField()` aus
  GraphQL wo nicht nötig, Zugriff hinter `@Permissions()`, ggf. Verschlüsselung.
- Eltern-Sichtbarkeit muss Feld-granular und testbar sein (Fremd-Org-/Fremd-Kind-Zugriff muss
  fehlschlagen).
