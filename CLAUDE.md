# Restart — Projekt-Kontext

Mandantenfähige SaaS-Plattform für Schulverwaltung (Privat-/Montessorischulen) und Arbeitszeiterfassung. `colibri-app.ch` ist nur die Domain, kein Produktname. Detail-Spezifikation: `SPEC.md`.

**Fokus Sicherheit:** Multi-Tenant-Isolation, RBAC, JWT httpOnly Cookies, OAuth2, verschlüsselte Org-Settings.

**Pädagogisches Ziel:** Lehrkräften zeigen, *wo* sie als Nächstes ansetzen (Hattie „Know thy impact") — via sichtbare Muster in Einführungs-Rhythmus, Engagement, Konzentration, Persistenz, Selbstvertrauen.

**Referenz-Architektur: Periparto** (`~/Desktop/Projekte/periparto/periparto-frontend/`). Vor jeder neuen Frontend-Komponente zuerst dort in `src/components/` und `src/hooks/` suchen und 1:1 übernehmen. Periparto-Patterns (Schemas, Actions, Form-Aufbau) sind verbindliche Vorlage.

## Naming

- `[name].{entity,service,resolver,guard,strategy}.ts` · `create-/update-[name].input.ts` · `[name].spec.ts`
- Frontend: `[verb]-[name].action.ts` · `[name]-form.schema.ts`
- Klassen PascalCase · Methoden camelCase · Konstanten UPPER_SNAKE_CASE · DB-Spalten snake_case · GraphQL camelCase (Code-First)

## Lokaler Start

```bash
docker compose up postgres -d          # nur DB
pnpm --filter @restart/backend dev     # :4001
pnpm --filter @restart/web dev         # :4000 + Codegen Watch
```

Lokal :4000/:4001 · Staging `staging.colibri-app.ch` (auto auf main) · Prod `restart.colibri-app.ch` (manuell via Actions).

## Grosse Dateien — nie vollständig lesen

| Datei | Umfang | Regel |
|---|---|---|
| `packages/shared-types/src/graphql.ts` | ≈174k Token | **generiert** — nie lesen/editieren (füllt 87 % eines 200k-Fensters) |
| `packages/shared-types/src/gql.ts` | 1'875 Z. | generiert |
| `packages/shared-i18n/messages/{de,en}.json` | je ≈36k Token | pro Namespace mit `Grep` |
| `pnpm-lock.yaml` | 28k Z. | nie lesen → `pnpm why <pkg>` |

Generierte Artefakte ändern sich nur an der Quelle (Entity/Resolver/`.graphql`). Grosse Feature-Komponenten (`AdmissionsKanban`, `CurriculumLevelTree`, `TeamsBoard`, je ~1'000 Z.) mit `offset`/`limit` lesen. Breite Repo-Suche (1'915 Dateien) an Subagenten delegieren. Lokale Gates sind billig (~1–5k Token) und dürfen direkt laufen; nur Fehlerläufe umleiten und `tail`/`grep`.

## Sicherheit

- Session-Tokens NUR httpOnly/secure/sameSite Cookies — NIE localStorage.
- Alle Mutations hinter `@Permissions()` / `@SuperAdminOnly()`.
- Validierung: class-validator (BE) + Zod (FE) · TypeORM parameterisiert, keine Raw-Queries · kein `dangerouslySetInnerHTML` · explizite CORS-Origins · Secrets nur als K8s-Secrets · sensitive Felder `@HideField()`.
- Keine US-Vendors für Daten/Infra (DSGVO/Cloud-Act).

### Multi-Tenant-Isolation (KRITISCH)

Jede authentifizierte Query/Mutation MUSS gegen die aktive Organization-ID gefiltert werden. Ohne Org-Bezug nur via `@SuperAdminOnly()`.

- Active-Org im `Active-Org` httpOnly-Cookie; better-auth `customSession` (`apps/backend/src/lib/auth.ts`) surfaced `session.activeOrganizationId`.
- `GqlBetterAuthGuard` (`apps/backend/src/auth/guard/`) validiert Membership → `req.user.orgId`.
- Resolver: `WHERE organizationId = req.user.orgId` auf allen org-scoped Entities.
- Frontend ohne aktive Org → `/select-org` (nur SuperAdmin darf ohne).
- Org-Wechsel: `POST /api/org/switch` — NICHT unter `/api/auth/*` (gehört better-auth).

## Qualitäts- & Release-Standards (VERBINDLICH)

Production-Ready-Projekt, kein Prototyp — gilt auch bei kleinen Änderungen.

**Branch/PR:** Kein direkter Push auf `main` (protected). Feature-Branch → Commit → PR → CI grün → Squash-Merge. PR-Template ausfüllen. Präfixe `feat/ fix/ chore/ refactor/ ci/`. CODEOWNERS-Review bei security-/infra-kritischen Pfaden.

**Tests (kein Feature ohne):** Business-Logik → Unit (Jest BE / Vitest FE). Neue oder role-geschützte Resolver & Guards → Permission- **und** Multi-Tenant-Isolationstest (Fremd-Org muss fehlschlagen). Kritische Flows → Playwright `e2e/` (Happy-Path + Negativ-/Auth-Fall), erzeugte Testeinträge nach Lauf wieder löschen (Teardown), DB nicht mit Testdaten vermüllen: `e2e/tests/helpers/global-teardown.ts` löscht am Ende jedes Laufs alle Orgs mit dem Präfix aus `fixture-naming.ts` (`E2E Fixture`) samt Abhängigkeiten sowie die Fixture-User (`e2e.*@example.com`) und alle Absenzen mit Note `E2E%` (hart, weil die App Absenzen nur soft-deleted). Jede Fixture, die eine Organisation anlegt, MUSS `e2eOrgName()` als Namen verwenden — sonst überlebt sie den Teardown. `E2E_SKIP_TEARDOWN=true` behält die Daten zum Debuggen; danach die lokale DB mit `pnpm db:reset` (Drop → Migrationen inkl. Seeds → better-auth-Schema → Superadmin-Bootstrap beim nächsten Backend-Start) wieder auf einen sauberen Stand bringen. Bugfix → erst Regressions-Test. Lokal grün vor PR: `pnpm turbo run lint test build`, E2E `pnpm --filter @restart/e2e test:e2e`.

**CI-Gates (8 Required Checks auf `main`, strict):**
- `CI`: lint (check-only) · typecheck (BE/Web via `build`, Mobile via `typecheck`-Task) · unit · build · Playwright E2E · Codegen-Drift-Check
- `CodeQL` (security-extended + quality)
- `Security`: gitleaks · Trivy · pnpm-audit · Dependency Review (blockt Vulns ≥ high) — **blockierend**
- CI-Postgres auf **16-alpine** gepinnt — nicht heben ohne Deployment-DB (PG16 Enum-Regel 55P04 muss reproduzierbar sein).
- Gate rot → kein Build, kein Deploy.

**Dependencies:** Dependabot wöchentlich (Mo), gruppiert. Auto-Merge nur safe (Patch/Dev-Minor/Actions/Docker non-major). Majors manuell mit Testlauf. Bewusste Pins respektieren (`MEMORY.md` „Bekannte Issues").

**Deploy:** Staging automatisch bei Merge auf `main` nach CI-Gate (Build → Trivy → Migrate → Deploy → Smoke → `:staging-current`). Prod manuell via `workflow_dispatch` mit Approval-Gate; promotet den **exakt auf Staging getesteten SHA**, kein Rebuild (resolve → validate → Migrate → Deploy → Smoke → Rollback-on-fail → Audit-Log).

**DB-Schema** nur via TypeORM-Migrationen (`apps/backend/src/migrations/`), nie `synchronize` in Staging/Prod. Forward-only / expand-contract. Überall `migrationsTransactionMode: 'each'` — Default `'all'` bricht auf frischer PG16-DB mit 55P04, wenn eine Migration einen zuvor per `ALTER TYPE … ADD VALUE` ergänzten Wert nutzt. Bei `ADD VALUE`: Wert-Nutzung in SEPARATE Migration.

**Definition of Done:** Tests grün · lint/build/E2E grün · Security-Gates grün · i18n DE+EN · Migration (bei Schema-Änderung) · PR-Checkliste · auf Staging verifiziert.

## Sprache

Code/Commits **Englisch** · Entwickler-Kommunikation **Deutsch** · UI-Texte i18n DE+EN in `messages/*.json` (Schweizer Schreibweise: ss statt ß).
