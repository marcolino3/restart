# Restart - Projekt-Kontext

## Produkt-Vision

**Restart** (Markenname: **Colibri**) ist eine mandantenfähige SaaS-Plattform für Schulverwaltung (Privatschulen / Montessorischulen) und Arbeitszeiterfassung / Mitarbeiterverwaltung.

**Fokus: Sicherheit** - Multi-Tenant-Isolation, RBAC mit feingranularen Permissions, JWT httpOnly Cookies, OAuth2, verschlüsselte Org-Settings.

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

## Sprache

- Code, Variablen, Commits: **Englisch**
- Kommunikation mit dem Entwickler: **Deutsch**
- UI-Texte: i18n (DE + EN), in messages/*.json definiert
