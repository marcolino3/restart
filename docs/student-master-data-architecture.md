# Schüler-Stammdaten & Förderprofil — Architektur-Plan

Branch: `feat/student-master-data`. Dieser Plan verzahnt drei Dinge: die Stammdaten-Erweiterung
(Scope 1), das schul-interne Förder-/Massnahmen-Log (Scope 2) und den späteren Andockpunkt für
ein Eltern-Portal (Scope 3). Feldliste: siehe [`student-master-data.md`](./student-master-data.md).

## Ausgangslage (verifiziert im Code)

**Datenmodell:** `Student` ist heute sehr schlank (Name, Geburtsdatum, Geschlecht, Ein-/Austritt,
Notizen, `admissionStage`). Klasse/Stufe hängt über `SchoolClassEnrollment` (Historie). Adresse +
Familie hängen an den Bezugspersonen. Es gibt bereits `StudentNote` (Notizen pro Kind mit
`category`-Enum + `isConfidential`) — ein direktes Vorbild für Scope 2.

**Permission-/Rollen-System:**
- RBAC: Permission-Code-Enum (`permissions/entities/permission-code.enum.ts`) → `Role` (DB) →
  `Membership`. Guard-Kette `@UseGuards(GqlBetterAuthGuard, GraphQLAccessGuard)`, Permission-Check
  in `auth/guard/graphql-permissions.guard.ts` (SuperAdmin-Bypass, sonst alle required-Perms AND).
- **Kein `STUDENT_*`-Permission-Code** — Student-Resolver läuft heute unter `SCHOOL_CLASS_*`.
  → Scope 1 führt eigene `STUDENT_READ/WRITE/DELETE` ein (sauberer Schnitt, überfällig).
- **Persona** (separat von Role, auf `Membership.persona`): ADMIN, HR, OFFICE, TEACHER, **PARENT**,
  STUDENT, EMPLOYEE. Nur Admin-Personas dürfen den Admin-Bereich; PARENT/STUDENT/… sind dort
  generisch geblockt (`auth/constants/admin-persona.const.ts`).
- **Eltern-Login existiert NICHT.** `Persona.PARENT` und `ContactPerson.userId` sind tote
  Platzhalter — keine Login-Bridge, keine PARENT-Membership wird je erzeugt, `userId` wird nirgends
  gelesen/geschrieben.
- **Kein feld-granulares Sichtbarkeits-Muster** im Code. `@HideField()` ist binär (ganz raus aus
  GraphQL, nicht rollenabhängig). `ContactPerson.socialSecurityNumber` ist heute NICHT extra
  geschützt (läuft unter grobem `CONTACT_PERSON_READ`). D.h. feld-Rechte müssen neu entworfen werden.
- Multi-Tenant: `@CurrentOrgId` aus `req.user.orgId`, jeder Service filtert explizit
  `WHERE organization_id = :orgId`. Kein Row-Level-Security — Disziplin im Service-Code.

**Konsequenz:** Scope 1 + 2 sind rein schul-gepflegt und brauchen die riskante Eltern-Feld-Rechte-
Architektur NICHT. Wir müssen sie nur so bauen, dass Scope 3 später andockt.

---

## Feld-Sichtbarkeits-Klassifikation (für Scope 3 vorbereitet)

Jedes Stammdaten-Feld bekommt schon jetzt eine gedankliche Sichtbarkeits-Klasse. Das ist noch
KEINE Durchsetzung im Code (Scope 1 ist komplett schul-gepflegt), sondern legt fest, wie Scope 3
später jedes Feld behandeln wird — und verhindert, dass wir sensible Felder versehentlich in einen
späteren Eltern-Read-Scope rutschen lassen.

| Klasse | Bedeutung | Felder |
|---|---|---|
| **SCHOOL_ONLY** | nie eltern-sichtbar | AHV-Nummer, externe Schüler-ID, Konfession |
| **PARENT_READ** | Eltern dürfen später lesen, nicht ändern | Geburtsort, Nationalität(en), Aufnahmestatus, Klasse/Stufe |
| **PARENT_EDIT** | Eltern dürfen später vorschlagen/ändern | Rufname, Erstsprache(n), Familiensprache(n), Foto |

Umsetzung dieser Klasse in Scope 3 (nicht jetzt): am saubersten als **Metadaten-Konstante**
(`STUDENT_FIELD_VISIBILITY`) + ein Field-Middleware/Resolver-Filter, der bei Persona=PARENT nur
PARENT_READ/PARENT_EDIT durchlässt. Persistenz-seitig bleiben alle Felder auf `Student` (kein
Split in separate Tabelle) — die Trennung ist Zugriffslogik, nicht Schema. Begründung: der Split
in `StudentParentEditable` würde jede Query verdoppeln und die Stammdaten künstlich zerreissen,
ohne echten Sicherheitsgewinn gegenüber einer gut getesteten Field-Middleware. Eltern-*Vorschläge*
(statt Direkt-Edit) lösen wir später über eine kleine `StudentFieldChangeRequest`-Entity (Vorschlag
→ Schule bestätigt), nicht über Direktschreibrechte auf `Student`.

> **Sicherheits-Regel für Scope 3:** Fremd-Org- UND Fremd-Kind-Zugriff (ein Elternteil darf nur
> die eigenen Kinder sehen — Weg über `StudentContactPerson` mit `hasCustody`/Verknüpfung) muss
> testbar fehlschlagen. Das ist die eigentliche Härtungsarbeit von Scope 3.

---

## Scope 1 — Stammdaten (schul-gepflegt)

### Schema-Änderungen an `Student`
Neue Spalten (alle nullable, additive Migration — forward-only, keine Enum-`ADD VALUE`):
- `preferred_name` text
- `place_of_birth` text
- `religion` text  *(SCHOOL_ONLY — sensibel, Art. 9)*
- `first_languages` text[]
- `family_languages` text[]
- `social_security_number` text  *(SCHOOL_ONLY — hochsensibel)*
- `external_student_id` text

**Kein `photo_file_id`-FK.** Es gibt im Projekt keine `File`-Entity. Fotos laufen über den
bestehenden `sharp`-Bild-Upload (`upload/upload.controller.ts`) konventionsbasiert als
`uploads/students/<studentId>.webp` — genau wie Employee-Fotos/Org-Logos, ohne DB-Spalte
(Existenz per HEAD-Probe). Für das Student-Foto daher NUR:
- `students` in `ALLOWED_ENTITIES` (`upload.controller.ts`) aufnehmen + Ownership-Regel in
  `assertTargetInOrg()` (analog `employees`: Student gehört zur aktiven Org). Spec-Test
  `upload.controller.spec.ts` (nutzt `'students'` heute als abgelehntes Beispiel) anpassen.
- Frontend: `UploadFormField` mit `entity="students"` id={studentId} wiederverwenden;
  `StudentAvatar.tsx` src → `/api/uploads/students/${studentId}.webp` mit DiceBear→Initialen-Fallback.

Nationalitäten als **ISO-Ländercode-Array** (`nationalities text[]`) auf `students`,
gleiche Quelle wie das Org-Land (`CountryComboboxFormField`, ISO-Codes wie `CH`/`DE`).
Bewusst KEIN M:N-Join auf die `country`-Tabelle: die ist projektweit ungeseedet
(kein Seeder, 0 Zeilen in lokal/Staging/Prod) — ein Join wäre funktional leer.

### Sensible Felder
- `social_security_number` + `religion`: `@HideField()` erwägen bzw. nur über `STUDENT_READ`
  ausliefern; **nie** in einen Eltern-Scope aufnehmen (siehe Klassifikation). AHV-Nr. im Frontend
  über die bestehende `SocialSecurityNumberFormField`-Maske (liest Mask aus Country-Template-DB).
- Migration setzt KEINE Verschlüsselung auf DB-Ebene (Projekt hat dafür heute kein Muster) — wird
  über Permission-Gating geschützt; falls später Feld-Verschlüsselung eingeführt wird, greift sie
  hier und bei `ContactPerson.socialSecurityNumber` gemeinsam.

### Permissions
Neue Codes: `STUDENT_READ`, `STUDENT_WRITE`, `STUDENT_DELETE`. Student-Resolver von `SCHOOL_CLASS_*`
auf diese umstellen. Rollen-Backfill nötig (bestehende Admin-Rollen bekommen `STUDENT_*`).

### GraphQL / DTOs
- `Student`-Type um die Felder erweitern (Codegen-Drift-Gate beachten → nach Backend-Boot
  `pnpm --filter @restart/web codegen` + committen).
- `create-student.input.ts` / `update-student.input.ts` erweitern (class-validator).
- Nationalitäten als `nationalities: string[]` (ISO-Codes) im Input — plain text[]-Spalte, kein Join-Mapping.

### Frontend
- Schüler-Detail/Bearbeiten-Form um die Felder (Blöcke Identität / Sprache / Register).
- Foto-Upload: bestehende `image-upload/`-Komponente wiederverwenden; `StudentAvatar` so anpassen,
  dass ein echtes Foto den DiceBear-Fallback ersetzt.
- Nationalität: `CountryComboboxFormField` mit `multiple` (ISO-Codes). Sprachen: `TagsInputFormField` (Text-Chips).
- i18n DE+EN, ss statt ß.

### Tests
- Unit: Input-Validierung.
- **Integration (echte DB, Port 5435):** Nationalitäten-`text[]`-Writes (create/replace/omit),
  Multi-Tenant (Fremd-Org-Student nicht lesbar/änderbar).
- E2E: Stammdaten bearbeiten + speichern (Happy) + Fremd-Org-Zugriff (Negativ).

---

## Scope 2 — Förderprofil / Log (schul-intern, hochsensibel)

Kein starres „Massnahmen"-Schema. Stattdessen ein **Log/Notizen-System mit org-verwaltbaren
Kategorien + Dokumenten** — Muster wie Admission-Aktivitäten + Eingangskanäle kombiniert.

### `StudentRecordCategory` (org-verwaltbar, wie AdmissionSource)
Von der Schule selbst pflegbare Kategorien (z.B. Logopädie, IF/Integrative Förderung, DaZ,
Psychomotorik, Abklärung Schulpsychologie, Hochbegabung, …).
- `name` text, `color` text?, `sortOrder` int, `isActive` bool, `organizationId`
- Verwaltungs-UI analog `ManageSourcesDialog` (Eingangskanäle) / Rejection-Reasons.

### `StudentRecordEntry` (Log-Eintrag pro Kind)
- `studentId` FK → Student (CASCADE)
- `categoryId` FK → StudentRecordCategory (SET NULL, damit Kategorie löschbar bleibt)
- `title` varchar(200), `content` text
- `occurredAt` / `date` date  *(wann fand es statt / Eintragsdatum)*
- `status` (optional, org-verwaltbar ODER schlankes Enum: OPEN/ONGOING/CLOSED — bewusst minimal
  halten; wenn org-verwaltbar → eigene kleine Status-Liste, sonst weglassen bis gebraucht)
- `isConfidential` bool default true  *(Förderdaten sind per Default vertraulich)*
- `authorMembershipId` FK → Membership (SET NULL)
- `organizationId`
- Dokumente: **wiederverwendbarer `DocumentManager`** + Endpoint `student-record-documents`
  (analog `admission-documents`), scoped per `entryId` bzw. `studentId`.

> Bewusst offen gelassen: „Background" (statischer Herkunfts-/Kontext-Text) wird KEIN eigenes
> Feld — es passt als Eintrag mit einer org-Kategorie „Background" ins selbe Log. Hält das Modell
> klein. Falls sich zeigt, dass ein persistenter Background-Block gebraucht wird, kommt ein
> `background` text-Feld auf `Student` (Scope-1-artig) nach.

### Permissions
- `STUDENT_RECORD_READ`, `STUDENT_RECORD_WRITE`, `STUDENT_RECORD_DELETE` — **getrennt** von
  `STUDENT_*`, weil Förderdaten sensibler sind als Stammdaten (nicht jede Rolle mit Stammdaten-
  Zugriff darf Förderprofile sehen). `isConfidential`-Einträge ggf. zusätzlich gaten.
- Kategorien-Verwaltung: eigener Code `STUDENT_RECORD_CATEGORY_WRITE` oder unter Org-Settings.

### Eltern-Sichtbarkeit
Scope 2 ist **komplett SCHOOL_ONLY**. Förder-/Abklärungsdaten sind nichts, was Eltern im Portal
pflegen — und meist auch nicht ungefiltert lesen sollen. Scope 3 fasst Scope 2 nicht an (ausser
evtl. später ein bewusst freigegebener „für Eltern sichtbar"-Flag pro Eintrag — nicht jetzt).

### Frontend
- Neuer Schüler-Tab „Förderung" (Kind-Detailseite): Kategorie-gefilterte Timeline/Liste von
  Einträgen (wie Aktivitäten-Timeline), Eintrag-Composer (Kategorie-Select + Titel + Text + Datum
  + Dokument-Upload), `isConfidential`-Toggle. Kategorien-Verwaltung als Settings-Dialog.

### Tests
- Unit: Kategorie-Mapping, Confidential-Gating-Logik.
- Integration: Entry-Writes, Kategorie SET NULL bei Löschung, Multi-Tenant, Dokument-Scoping.
- E2E: Eintrag anlegen mit Kategorie + Dokument (Happy) + Fremd-Org (Negativ).

---

## Scope 3 — Eltern-Portal (eigenes grosses Feature, SPÄTER)

Nicht Teil dieser Umsetzung. Skizze nur als Andock-Referenz:
1. **Login-Bridge:** ContactPerson ↔ better-auth-User (Einladungs-Flow befüllt `userId`).
   → vorher `[[better-auth-docs]]` konsultieren (Muster für „external actor / restricted account").
2. **PARENT-Membership** mit eigener Guard-Logik (nicht nur der generische Admin-Block).
3. **Feld-granulare Rechte** über `STUDENT_FIELD_VISIBILITY`-Metadaten + Field-Middleware
   (Persona=PARENT → nur PARENT_READ/PARENT_EDIT). Eltern-*Edits* als
   `StudentFieldChangeRequest` (Vorschlag → Schule bestätigt), nicht Direktschreibung.
4. **Härtung:** Fremd-Kind-Isolation über `StudentContactPerson`-Verknüpfung + Custody; testbar.

---

## Umsetzungsreihenfolge (wenn Bau startet)

1. **Scope 1 Backend** — Migration (Student-Spalten inkl. `nationalities text[]`), `STUDENT_*`-Perms
   + Rollen-Backfill, Entity/DTO/Resolver, Codegen. Tests (Unit + Integration).
2. **Scope 1 Frontend** — Form-Blöcke, Foto-Upload, Nationalitäten-Multiselect (ISO-Codes), i18n. Tests (Unit + E2E).
3. **Scope 2 Backend** — `StudentRecordCategory` + `StudentRecordEntry` + Doku-Endpoint,
   `STUDENT_RECORD_*`-Perms. Tests.
4. **Scope 2 Frontend** — „Förderung"-Tab + Kategorie-Verwaltung. Tests.
5. Ship pro Scope als eigener PR (nicht ein Riesen-PR). Staging-Verifikation je Scope.

## Offene Detail-Entscheidungen vor Bau-Start

- **Scope 2 Status-Feld:** ganz weglassen, schlankes Enum (OPEN/ONGOING/CLOSED), oder org-verwaltbar?
  (Empfehlung: erst weglassen, nachrüsten wenn gebraucht.)
- **`STUDENT_*`-Permission-Split:** bestehende Rollen automatisch backfillen (welche Rollen bekommen
  Stammdaten- vs. Förder-Zugriff?).
- **Foto-Storage:** nutzt Scope 1 dasselbe File-/Objektstorage wie Admission-Dokumente? (vermutlich ja).
