## Was & Warum

<!-- Kurze Beschreibung der Änderung und der Motivation. Verlinke ggf. Issue. -->

## Art der Änderung

- [ ] Feature
- [ ] Bugfix
- [ ] Refactor
- [ ] Docs
- [ ] Chore / Dependency-Update
- [ ] Breaking Change

## Checkliste

### Allgemein
- [ ] Code folgt den Konventionen aus `CLAUDE.md` / `SPEC.md`
- [ ] Tests hinzugefügt oder angepasst (Unit / E2E)
- [ ] Lint und Build laufen lokal grün

### Sicherheit (bei Backend-Änderungen)
- [ ] Mutations sind durch `@Permissions()` oder `@SuperAdminOnly()` geschützt
- [ ] Org-scoped Queries filtern gegen `req.user.orgId` (Multi-Tenant-Isolation)
- [ ] Sensible Entity-Felder sind mit `@HideField()` markiert
- [ ] Keine Secrets / API-Keys / Passwörter im Code
- [ ] Input wird validiert (class-validator Backend / Zod Frontend)

### Datenbank
- [ ] Schema-Änderungen haben eine TypeORM-Migration (`apps/backend/migrations/`)
- [ ] Migration ist rückwärtskompatibel oder Breaking Change ist dokumentiert
- [ ] Lokal gegen Postgres getestet

### Frontend (bei UI-Änderungen)
- [ ] Komponenten zuerst in Periparto gesucht und übernommen (statt neu zu bauen)
- [ ] i18n-Strings in `messages/de.json` UND `messages/en.json`
- [ ] Schweizer Schreibweise (ä/ö/ü ja, ß → ss)
- [ ] Date-Inputs nutzen shadcn Datepicker

### Deploy
- [ ] Neue Env-Variablen sind in `k8s/base/.../configmap.yaml` oder als Secret dokumentiert
- [ ] Breaking Change benötigt Migration-Strategie

## Test-Plan

<!-- Wie wurde getestet? Welche Szenarien wurden abgedeckt? -->

## Screenshots / Screenrecords (bei UI)

<!-- Bilder oder kurze Videos bei sichtbaren Änderungen. -->

## Deployment-Hinweise

<!-- Migrations? Env-Var-Änderungen? Reihenfolge? Sonst leer lassen. -->