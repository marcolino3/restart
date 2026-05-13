# Restart - Architektur & Spezifikation

> **Restart** (Markenname: **Colibri**) ist eine mandantenfähige SaaS-Plattform für Schulverwaltung (Privatschulen / Montessorischulen) und Arbeitszeiterfassung / Mitarbeiterverwaltung.

> Referenz-Dokument für Architektur-Patterns, Auth-System, Domain-Module und Komponenten-Architektur.
> Wird von Claude bei Bedarf gelesen (nicht automatisch geladen).

---

## Architektur-Muster (orientiert an Projekt Periparto)

### Backend-Patterns

**Module-Struktur:**
```
src/[feature]/
  [feature].module.ts
  [feature].service.ts
  [feature].resolver.ts        # GraphQL
  [feature].controller.ts      # REST (nur Auth-Endpoints)
  dto/
    create-[feature].input.ts
    update-[feature].input.ts
  entities/
    [feature].entity.ts
  interfaces/
    [feature].interface.ts
    [feature].enum.ts
```

**AbstractEntity** - Alle Entities erben von:
- `id` (UUID, auto-generated)
- `version` (optimistic locking)
- `isActive` (soft-delete Flag, default: true)
- `isArchived` (Archiv-Flag, default: false)
- `createdAt`, `updatedAt`, `deletedAt`

**Soft-Delete:** Kein physisches Löschen. `isActive: false` setzen. Services müssen `isActive: true` filtern.

**Resolver-Pattern:**
```typescript
@Resolver(() => Entity)
@UseGuards(GqlJwtAuthGuard, GraphQLAccessGuard)
export class FeatureResolver {
  @Query(() => Entity)
  @Permissions('FEATURE_READ')
  findOne(@Args('id', { type: () => ID }) id: string) { ... }

  @Mutation(() => Entity)
  @Permissions('FEATURE_WRITE')
  update(@Args('input') input: UpdateInput) { ... }
}
```

**Service-Pattern:**
- `EntityManager` für Transaktionen
- `Repository` für einfache Queries
- `NotFoundException` bei nicht gefundenen Entities
- Immer Relations nur laden wenn nötig

### Frontend-Patterns

**Feature-basierte Organisation:**
```
features/[feature]/
  actions/
    get-[feature]s.action.ts      # "use server" - Server Actions
    get-[feature]-by-id.action.ts
    create-[feature].action.ts
    update-[feature].action.ts
  components/
    [Feature]Table.tsx
    [Feature]Form.tsx
  schemas/
    [feature]-form.schema.ts      # Zod Schema
```

**Server Action Pattern:**
```typescript
"use server";

const Document = graphql(`query/mutation ...`);

export async function getFeature(id: string) {
  const client = await serverCookieGqlClient();
  const { result } = await client.request(Document, { id });
  return result;
}
```

**Form Pattern:**
```typescript
"use client";
const form = useForm({ resolver: zodResolver(Schema), defaultValues });
const onSubmit = async (values) => {
  const result = await updateAction(values);
  if (result.success) { toast.success(t('saved')); router.push(...); }
};
```

**GraphQL Client:**
- Server-seitig: `serverCookieGqlClient()` - liest Cookies, leitet Auth weiter, auto-redirect bei 401
- Queries/Mutations inline definiert mit `graphql()` Template Tag
- Types generiert nach `gql/graphql.ts` via Codegen

**i18n:**
- Alle Texte in `messages/de.json` und `messages/en.json`
- Namespaces pro Feature
- `useTranslations('Namespace')` in Client Components
- `getTranslations('Namespace')` in Server Components

---

## Auth-System

### Flow (better-auth-basiert)
1. Login (Email/Password, Google, Apple, Magic Link) -> **better-auth** setzt
   Session-Cookie. OAuth-Callbacks gehen via Next.js-Rewrite über
   `:4000/api/auth/callback/<provider>` damit das Cookie auf der Frontend-Domain
   landet (Server Actions können es lesen).
2. Backend liest Session über `auth.api.getSession({ headers })`
   (`apps/backend/src/lib/auth.ts`).
3. `customSession`-Plugin liest das `Active-Org`-Cookie aus dem Request und
   surfaced `session.activeOrganizationId`.
4. `GqlBetterAuthGuard` validiert Session, lädt Domain-User per Email, ruft
   `getAuthContext` mit `activeOrganizationId` auf und schreibt
   `{ sub, orgId, membershipId, roles, permissions, isSuperAdmin }` nach
   `req.user`. Ohne aktive Org bleibt `req.user` ohne `orgId`/Permissions —
   der nachgelagerte `GraphQLAccessGuard` blockt dann automatisch alle
   org-scoped Mutations/Queries (Ausnahme: `@SuperAdminOnly()`).
5. Frontend Server Actions reichen die Cookies weiter
   (`serverCookieGqlClient`), `authContext`-Query liefert User + aktive
   `orgId` + `permissions`.

### Org-Switch (Multi-Tenant)
- `POST /api/org/switch` (`apps/backend/src/auth/org-switch.controller.ts`)
- Validiert better-auth-Session + Membership in Ziel-Org (SuperAdmin bypass)
- Setzt httpOnly `Active-Org`-Cookie (30 Tage, sameSite=lax)
- KEINE Route unter `/api/auth/*` (gehört better-auth)
- Frontend redirected User ohne aktive Org auf `/select-org`. SuperAdmin darf
  ohne Org bleiben und nur globale Routen nutzen.

### Guards & Decorators
- `@CurrentUser()` - injiziert TokenPayload (aus `req.user`, via `GqlBetterAuthGuard`)
- `@CurrentOrgId()` - extrahiert orgId aus Token
- `@Permissions('CODE')` - verlangt spezifische Permission (AND-Logik)
- `@Roles(SystemRole.X)` - verlangt System-Rolle (OR-Logik)
- `@SuperAdminOnly()` - nur Super-Admins

### Personas
`ADMIN`, `HR`, `OFFICE`, `TEACHER`, `PARENT`, `STUDENT`, `EMPLOYEE`

### Legacy-JWT
Der ursprüngliche Passport/JWT-Stack (`AuthController` unter `/api/auth-legacy/*`,
`JwtAuthGuard`, `AUTH_COOKIE`) ist noch im Code, wird aber für neue Flows
NICHT mehr genutzt. Wird in einer späteren Phase entfernt, sobald alle
Resolver auf `GqlBetterAuthGuard` umgestellt sind.

---

## Domain-Module

### Implementiert
| Modul | Backend | Frontend | Status |
|---|---|---|---|
| **Auth** (Local, Google, Apple, Magic Link, Refresh) | Ja | Ja | Fertig |
| **Users** (CRUD, Multi-Email, OAuth-Linking) | Ja | Ja | Fertig |
| **User-Emails** (primär/sekundär, Verifizierung) | Ja | Teilweise | In Arbeit |
| **Organizations** (Multi-Tenant, Domains, Geocoding) | Ja | Ja | Fertig |
| **Memberships** (User-Org-Verknüpfung, Persona, Rollen) | Ja | Ja | Fertig |
| **Roles & Permissions** (RBAC, System-/Custom-Roles) | Ja | Ja | Fertig |
| **Employees** (CRUD, Detail/View, Edit, CSV-Import) | Ja | Ja | Fertig |
| **Employee Notes** (Logbuch: Vermerke, Verwarnungen, Gespräche) | Ja | Ja | Fertig |
| **Teams & Team-Members** | Ja | Nein | Backend fertig |
| **Employee Absences** (Kategorien, Tage) | Ja | Nein | Backend fertig |
| **Employee Contracts** | Ja | Nein | Backend fertig |
| **Organization Settings** (Key-Value, verschlüsselt) | Ja | Teilweise | In Arbeit |
| **Addresses & Countries** | Ja | Ja | Fertig |
| **Mail** (Magic Link Emails) | Ja | - | Fertig |
| **Upload** (Datei-Upload) | Ja | Nein | Backend fertig |
| **Health Checks** | Ja | - | Fertig |

### Noch nicht implementiert
- **Time-Tracking** - Modul existiert als Stub
- **Stundenplan / Timetable**
- **Eltern-Portal**
- **Schüler-Verwaltung**
- **Noten / Bewertungen**
- **Kommunikation / Nachrichten**
- **Benachrichtigungen (Push/Email)**
- **Passwort-Reset Flow**
- **E-Mail-Verifizierungs-Flow** (Backend-Logik da, Frontend fehlt)
- **Audit-Log**
- **Reporting / Dashboards mit echten Daten**

---

## Komponenten-Architektur

### Grundprinzipien
- **Wiederverwendbare Komponenten** schreiben, die in mehreren Features einsetzbar sind
- **Kleine, fokussierte Komponenten** statt monolithischer Dateien — jede Komponente hat eine klare Aufgabe
- **Props statt Hardcoding** — Texte, Daten und Verhalten über Props steuern, nicht fest einbauen
- **Composition over Configuration** — flexible Komponenten über Children/Slots statt über viele Config-Props

### Komponenten-Hierarchie

**1. `components/ui/`** — shadcn/ui Basis-Komponenten (Button, Card, Input, Badge, Dialog, Tabs, etc.)
- Werden **nie** projektspezifisch verändert (außer Theme/Styling)
- Bei Updates von shadcn überschreibbar

**2. `components/form/form-fields/`** — Wiederverwendbare Formular-Felder
- Wrappen shadcn-Inputs mit react-hook-form + i18n
- Beispiele: `InputFormField`, `SelectFormField`, `DatePickerFormField`, `SwitchFormField`
- Übersetzen Labels automatisch via `useTranslations("Common")`
- **Alle neuen Label-Keys müssen im `Common`-Namespace stehen**, da die Form-Fields dort nachschlagen

**3. `components/` (Root)** — Projektweite wiederverwendbare Komponenten
- Layout-Komponenten: `app-sidebar.tsx`, `data-table.tsx`
- Shared UI-Patterns die in mehreren Features genutzt werden

**4. `features/[feature]/components/`** — Feature-spezifische Komponenten
- Nur innerhalb des eigenen Features verwendet
- Dürfen Komponenten aus `components/` und `components/ui/` importieren
- **Nicht** von anderen Features importieren (Ausnahme: explizit geteilte Sub-Features)

### Wiederverwendbare UI-Patterns

**DescriptionList** — Für Detail-/View-Seiten (3-Spalten-Grid mit Label + Wert):
```tsx
<div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
  <dt className="text-sm font-medium text-foreground">{label}</dt>
  <dd className="mt-1 text-sm text-muted-foreground sm:col-span-2 sm:mt-0">{value}</dd>
</div>
```

**Timeline/Feed** — Für chronologische Einträge (Logbuch, Aktivitäten):
- Vertikale Linie mit farbigen Dots
- Connector-Lines zwischen Einträgen

**Inline-Formulare** — Für schnelle Eingaben direkt auf der Seite (statt Dialog):
- Textarea mit Toolbar am unteren Rand
- Kategorie-Select + Submit-Button inline

### Seiten-Typen

| Typ | Pattern | Beispiel |
|---|---|---|
| **Liste** | DataTable mit Filter, Pagination, klickbare Zeilen | `employees/page.tsx` |
| **Detail/View** | DescriptionList + Feed unterhalb | `employees/[id]/page.tsx` |
| **Erstellen** | Card-basiertes Formular | `employees/edit/page.tsx` |
| **Bearbeiten** | Tabs mit Formularen pro Bereich | `employees/edit/[id]/page.tsx` |

### Regeln
- **Klick auf Tabellenzeile** → navigiert zur View-Seite; Bearbeiten nur über Dropdown-Menü
- **Checkbox- und Actions-Spalten** in Tabellen sind vom Zeilen-Klick ausgenommen (`stopPropagation`)
- **View-Seiten** zeigen Daten read-only mit "Bearbeiten"-Button oben rechts
- **Formulare** nutzen immer `react-hook-form` + `zodResolver` + `handleAction`-Utility
- **Neue UI-Texte** immer in `messages/de.json` UND `messages/en.json` — Umlaute korrekt (ä, ö, ü), nie ae/oe/ue
- **shadcn-Blöcke** als Design-Referenz nutzen (z.B. `login-03` für Login)
