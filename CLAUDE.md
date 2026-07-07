# Restart - Projekt-Kontext

## Produkt-Vision

**Restart** (Markenname: **Colibri**) ist eine mandantenfähige SaaS-Plattform für Schulverwaltung (Privatschulen / Montessorischulen) und Arbeitszeiterfassung / Mitarbeiterverwaltung.

**Fokus: Sicherheit** - Multi-Tenant-Isolation, RBAC mit feingranularen Permissions, JWT httpOnly Cookies, OAuth2, verschlüsselte Org-Settings.

**Pädagogisches Ziel:** Lehrkräften die bestmöglichen Inputs liefern, um den Lernfortschritt jedes Kindes individuell zu begleiten und den grössten Impact auf das Lernen zu erzielen (Hattie: "Know thy impact"). Die Plattform soll nicht nur dokumentieren, sondern aktiv aufzeigen, *wo* die Lehrkraft als Nächstes ansetzen sollte — über sichtbar gemachte Muster in Einführungs-Rhythmus, Engagement, Konzentration, Persistenz und Selbstvertrauen.

**Referenz-Architektur:** Orientiert sich am Projekt **Periparto** (`/Users/marcomarranchelli/Desktop/Projekte/periparto/periparto-frontend/`). Bei Unsicherheiten als Vorlage heranziehen.

**Komponenten-Wiederverwendung:** Bevor neue Frontend-Komponenten (Form-Fields, UI-Bausteine, Hooks) gebaut werden, **immer zuerst in Periparto** unter `src/components/` und `src/hooks/` nach existierenden Implementierungen suchen und diese 1:1 übernehmen oder als Basis verwenden. Nur wenn Periparto nichts Passendes hat, eigene Komponenten erstellen. Periparto-Patterns (Schemas, Actions, Form-Aufbau) gelten als verbindliche Vorlage.

**Detaillierte Spezifikation:** Siehe `SPEC.md` für Architektur-Patterns, Auth-System, Domain-Module und Komponenten-Architektur.

---

## Tech-Stack

### Backend (`apps/backend/`)
- **NestJS 11** + TypeScript 5.9 + **GraphQL Code-First** (Apollo 5) + **TypeORM** + PostgreSQL 16
- **Passport** (JWT, Local, Google OAuth, Apple OAuth)
- **class-validator + class-transformer**, Luxon, bcrypt, nodemailer, sharp
- Path-Alias: `@/*` -> `src/*`

### Frontend (`apps/web/`)
- **Next.js 16** App Router + **React 19** Server Components + Server Actions
- **graphql-request + @graphql-codegen** (Client Preset)
- **React Hook Form + Zod** + **shadcn/ui** (New York) + Tailwind CSS 4
- **next-intl** (DE, EN) + Vitest + Sonner
- Path-Alias: `@/*` -> `./*`

### Infra
- **Docker Compose** lokal (Postgres 5433, Backend 4001, Frontend 4000)
- **Kubernetes** (Kustomize) auf Infomaniak Managed K8s (Schweiz)
- **Terraform** + **GitHub Actions** CI/CD (auto Staging auf main, manuell Production)
- **Playwright** E2E Tests

---

## Naming Conventions

### Dateien
- Entities: `[name].entity.ts` | Services: `[name].service.ts` | Resolver: `[name].resolver.ts`
- DTOs: `create-[name].input.ts`, `update-[name].input.ts` | Tests: `[name].spec.ts`
- Guards: `[name].guard.ts` | Strategies: `[name].strategy.ts`
- Frontend Actions: `[verb]-[name].action.ts` | Schemas: `[name]-form.schema.ts`

### Code
- Klassen: PascalCase | Methoden/Properties: camelCase | Konstanten: UPPER_SNAKE_CASE
- DB-Spalten: snake_case | GraphQL: camelCase (automatisch via Code-First)

---

## Entwicklung

### Lokaler Start
```bash
docker compose up postgres -d          # Nur Datenbank
cd apps/backend && npm run start:dev   # Backend (Port 4001)
cd apps/web && npm run dev             # Frontend (Port 4000) + Codegen Watch
```

### Wichtige Commands
```bash
# Backend: npm run start:dev | build | test | test:e2e | lint
# Frontend: npm run dev | build | codegen | test | lint
# E2E: cd e2e && npx playwright test
```

### Umgebungen
| Env | URL | Deploy |
|---|---|---|
| Lokal | localhost:4000 / :4001 | docker compose |
| Staging | staging.colibri-app.ch | Auto auf main push |
| Production | app.colibri-app.ch | Manuell via GitHub Actions |

---

## Sicherheits-Richtlinien

- Session-Tokens NUR als httpOnly, secure, sameSite Cookies - NIEMALS im localStorage
- Alle Mutations hinter `@Permissions()` oder `@SuperAdminOnly()` Guards
- Input-Validierung: class-validator (Backend) + Zod (Frontend)
- SQL-Injection: TypeORM Parameterized Queries, keine Raw-Queries
- XSS: React Auto-Escaping, kein dangerouslySetInnerHTML
- CORS: Explizite Allowed Origins
- Secrets: Kubernetes Secrets, nie im Code
- Sensitive Entity-Fields mit `@HideField()` aus GraphQL ausschliessen

### Multi-Tenant-Isolation (KRITISCH)

**Regel:** Jede authentifizierte Query/Mutation MUSS gegen die aktive
Organization-ID aus der Session gefiltert werden. Daten ohne Org-Bezug sind
NICHT erlaubt — Ausnahme: explizit globale Operationen über
`@SuperAdminOnly()`.

**Architektur:**
- Active-Org wird im `Active-Org` httpOnly-Cookie gehalten.
- Das better-auth `customSession`-Plugin (`apps/backend/src/lib/auth.ts`) liest
  das Cookie und surfaced `session.activeOrganizationId`.
- `GqlBetterAuthGuard` (`apps/backend/src/auth/guard/gql-better-auth.guard.ts`)
  validiert Membership und populiert `req.user.orgId`.
- Resolver: `WHERE organizationId = req.user.orgId` für jede Query auf
  org-scoped Entities (Membership, Employee, Student, etc.).
- Frontend redirected User ohne aktive Org auf `/select-org` (nur SuperAdmin
  darf ohne Org navigieren).
- Org-Wechsel: `POST /api/org/switch` (siehe `org-switch.controller.ts`)
  validiert Membership + setzt Cookie. KEINE Route unter `/api/auth/*` — die
  gehört better-auth.

---

## Qualitäts- & Release-Standards (VERBINDLICH)

**Grundsatz:** Restart/Colibri ist ein **Production-Ready Real-World-Projekt**, kein
Prototyp. Jede Änderung wird so gebaut, als ginge sie morgen in Produktion. Der
folgende Flow gilt **immer** — auch bei vermeintlich kleinen Änderungen.

### Branch- & PR-Workflow
- **Kein direkter Push auf `main`.** `main` ist branch-protected.
- Ablauf: Feature-Branch → Commit(s) → **Pull Request** → CI grün + Review → Squash-Merge.
- PR-Template (`.github/pull_request_template.md`) vollständig ausfüllen.
- Branch-Naming: `feat/…`, `fix/…`, `chore/…`, `refactor/…`, `ci/…` (Conventional-Commit-Präfix).
- CODEOWNERS-Review ist für sicherheits-/infra-kritische Pfade Pflicht.

### Testing-Pflicht (kein Feature ohne Tests)
- **Neue Business-Logik → Unit-Tests.** Backend: Jest (`*.spec.ts`). Frontend: Vitest.
- **Neue/role-geschützte Resolver & Guards → Tests** für Permission- *und*
  Multi-Tenant-Isolation (Zugriff fremder Org muss fehlschlagen).
- **Kritische User-Flows → Playwright E2E** (`e2e/`): Login, Org-Switch, jeder neue
  CRUD-Hauptpfad. Mindestens ein Happy-Path + ein Negativ-/Auth-Fall.
- Bugfix → zuerst ein **Regressions-Test**, der den Bug reproduziert, dann der Fix.
- Tests laufen lokal grün **bevor** der PR aufgemacht wird (`pnpm turbo run lint test build`,
  E2E via `pnpm --filter @restart/e2e test:e2e`).

### CI-Gates (müssen grün sein — werden erzwungen)
Bei jedem PR und vor jedem Deploy (8 Required Checks auf `main`, strict = Branch muss up to date sein):
- `CI`: lint (check-only, ohne `--fix`) · typecheck (Backend/Web über `build` mit tsc, Mobile über den `typecheck`-Turbo-Task) · unit-tests · build · **Playwright E2E** · **Codegen-Drift-Check** (bootet Backend gegen Postgres, `git diff` auf generierte Types in `packages/shared-types`)
- `CodeQL` (security-extended + quality)
- `Security`: gitleaks (Secrets) · Trivy (Vulns/Misconfig) · pnpm-audit · **Dependency Review** (blockt neue Dependencies mit Vulns ≥ high) — **blockierend**
- CI-Postgres ist auf **16-alpine** gepinnt (= Zielversion in Prod/Compose). NICHT auf neuere Major heben, ohne die Deployment-DB mitzuziehen — PG-versionsspezifisches Verhalten (z.B. Enum-Regel 55P04) muss in CI reproduzierbar sein.
- Schlägt ein Gate fehl → **kein Build, kein Deploy**.

### Security (Dauer-Anforderung)
- Secrets nur als K8s-/Environment-Secrets, nie im Code/Repo (gitleaks gated).
- Multi-Tenant-Isolation in jeder org-scoped Query (siehe oben) — testen.
- Mutations hinter `@Permissions()`/`@SuperAdminOnly()`.
- **Keine US-Vendors** für Daten-/Infra-Dienste (DSGVO/Cloud-Act) — CH oder echtes Self-Hosting.
- Trivy/CodeQL-Findings werden behoben oder bewusst per `.trivyignore`/Suppression dokumentiert.

### Dependency-Aktualität
- **Dependabot** wöchentlich (Mo, Europe/Zurich), gruppiert pro Ökosystem.
- Auto-Merge nur für *safe* Updates (Patch / Dev-Minor / Actions / Docker non-major).
- Major-Updates: manuell, mit Test-Lauf + Changelog-Sichtung. Bewusste Pins respektieren
  (siehe `MEMORY.md` „Bekannte Issues").

### Deploy-Flow
- **Staging** (`staging.colibri-app.ch`): automatisch bei Merge auf `main`, **nach** dem CI-Gate.
  Pipeline: CI-Gate → Build/Push → Trivy → Migrate → Deploy → Smoke-Test → `:staging-current`.
- **Production** (`app.colibri-app.ch`): **manuell** (`workflow_dispatch`) mit Approval-Gate
  (`environment: production`). Promotet den **exakt auf Staging getesteten SHA** — kein Rebuild.
  Pipeline: resolve → validate → Migrate → Deploy → Smoke → Rollback-on-fail → `:production-current` → Audit-Log.
- **DB-Schema** nur über TypeORM-Migrationen (`apps/backend/src/migrations/`), nie via `synchronize` in Staging/Prod.
  Migrationen forward-only / expand-contract (Rollback rollt Schema nicht zurück).
  Migrationsläufe laufen überall mit `migrationsTransactionMode: 'each'` (Boot, CLI, migrate.ts) —
  Default `'all'` bricht auf frischer PG16-DB mit 55P04 ab, wenn eine Migration einen zuvor per
  `ALTER TYPE … ADD VALUE` ergänzten Enum-Wert nutzt. Bei `ADD VALUE`-Migrationen: Wert-Nutzung
  in eine SEPARATE Migration legen.

### Definition of Done
Eine Änderung ist erst fertig, wenn: Tests geschrieben & grün · lint/build/E2E grün ·
Security-Gates grün · i18n (DE+EN) ergänzt · Migration vorhanden (bei Schema-Änderung) ·
PR-Checkliste abgehakt · auf Staging verifiziert.

---

## Sprache

- Code, Variablen, Commits: **Englisch**
- Kommunikation mit dem Entwickler: **Deutsch**
- UI-Texte: i18n (DE + EN), in messages/*.json definiert
