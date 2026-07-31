---
name: run-app
description: Launch and drive the Restart/Colibri app locally — Postgres via Docker Compose, then NestJS backend (:4001) and Next.js web (:4000) natively — and smoke-test the login flow. Use when asked to run, start, or verify the app works in the real app (not just tests).
---

# Restart/Colibri lokal starten & durchklicken

Verifizierter Pfad (2026-07-13, Branch `main`). Startet den vollen Stack so,
wie CLAUDE.md ihn für lokale Entwicklung empfiehlt: **Postgres via Compose,
Backend + Frontend nativ** (nicht die ganze `docker-compose.yml` hochziehen —
die baut Prod-Images).

Ports: Web `:4000` · Backend `:4001` · Postgres `:5433` (Compose → Container `5432`).

## 0. Voraussetzungen (einmalig geprüft)

- `apps/backend/.env` und `apps/web/.env.local` müssen existieren (tun sie im Repo).
  Backend-`.env` zeigt bereits `DB_HOST=localhost`, `DB_PORT=5433`, `PORT=4001`.
- Deps installiert: `node_modules/` in Root, `apps/backend`, `apps/web` vorhanden.
  Falls nicht: `pnpm install` im Root.
- Docker Desktop muss laufen. Falls nicht: `open -a Docker` und warten:
  `until docker info >/dev/null 2>&1; do sleep 1; done`.

## 1. Postgres starten (Docker Compose)

```bash
cd <repo-root>
docker compose up postgres -d
until docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do sleep 1; done
```

`pg_isready` grün = DB nimmt Verbindungen an.

## 2. Backend nativ starten (:4001, Watch)

Im **Hintergrund** starten (Watch-Prozess läuft dauerhaft), Log in eine Datei,
dann auf die Ready-Zeile warten:

```bash
cd <repo-root>/apps/backend
npm run start:dev > /tmp/restart-backend.log 2>&1 &
# warten auf Readiness ODER Fehler:
for i in $(seq 1 120); do
  grep -qiE "Nest application successfully started" /tmp/restart-backend.log && { echo READY; break; }
  grep -qiE "Error:|EADDRINUSE|ECONNREFUSED|QueryFailedError|password authentication" /tmp/restart-backend.log && { echo FEHLER; tail -30 /tmp/restart-backend.log; break; }
  sleep 1
done
```

**Wichtig:** Ein Background-Wrapper meldet evtl. „exit 0", obwohl der Server läuft
— das ist nur der Wrapper. Prozess-Check statt darauf vertrauen:

```bash
pgrep -fl "nest start"          # Watch-Prozess
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4001/api/health   # -> 200
curl -s -X POST http://localhost:4001/graphql -H 'content-type: application/json' -d '{"query":"{ __typename }"}'  # -> {"data":{"__typename":"Query"}}
```

Beim Boot wird der Superadmin (`marco@marranchelli.com`) automatisch gebootstrappt
und der Permission-Katalog geseedet — Log-Zeilen `SuperAdminBootstrapService` /
`PermissionBootstrapService` bestätigen das.

## 3. Frontend nativ starten (:4000, Next 16 Turbopack + Codegen-Watch)

```bash
cd <repo-root>/apps/web
npm run dev > /tmp/restart-web.log 2>&1 &
for i in $(seq 1 120); do
  grep -qiE "Ready in|http://localhost:4000" /tmp/restart-web.log && { echo READY; break; }
  grep -qiE "Failed to compile|Cannot find module" /tmp/restart-web.log && { echo FEHLER; tail -25 /tmp/restart-web.log; break; }
  sleep 1
done
```

`npm run dev` startet parallel den Next-Server **und** `graphql-codegen --watch`
(schreibt Types nach `packages/shared-types/src/`). Die Warnung
„middleware file convention is deprecated" ist bekannt und harmlos.

## 4. Flow durchklicken (Definition of „läuft")

Verifikation bevorzugt **per HTTP/curl**, nicht Browser-Automation
(Projekt-Präferenz: keine Browser-Verifikation). Der unauthentifizierte
Auth-Redirect-Flow ist der Happy-Path-Smoke-Test:

```bash
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" http://localhost:4000/        # 307 -> /en
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" http://localhost:4000/en       # 307 -> /en/sign-in
curl -s -L -o /dev/null -w "final %{http_code}\n" http://localhost:4000/en/sign-in          # 200
curl -s -L http://localhost:4000/en/sign-in | grep -oiE 'type="(email|password)"|Sign in|Google|Apple|Magic Link'
```

Erwartung: `/` → `/en` → `/en/sign-in` (next-intl Locale-Routing + Auth-Guard),
Sign-in-Seite HTTP 200 mit Email/Password-Feldern, „Sign in", Magic Link, Google-
und Apple-OAuth. Damit ist der volle Stack (DB ↔ Backend ↔ Frontend) nachweislich
erreichbar.

Für authentifizierte Flows (Dashboard, Schüler, Aufnahme, Zeiterfassung) mit dem
Superadmin `marco@marranchelli.com` einloggen — das dazugehörige Passwort steht in
`apps/backend/.env` (`SUPERADMIN_*`), nicht hier.

## 5. Aufräumen

```bash
pkill -f "nest start"           # Backend-Watch
pkill -f "apps/web.*next"       # Frontend (oder den dev-PID killen)
docker compose stop postgres    # DB (Volume bleibt erhalten)
```

## Häufige Stolperfallen

- **`ECONNREFUSED` / DB-Fehler beim Backend-Boot:** Postgres nicht ready oder auf
  falschem Port. `.env` muss `DB_PORT=5433` haben (Compose mappt 5433→5432).
- **`EADDRINUSE :4001/:4000`:** alter Dev-Prozess läuft noch → `pkill` (Schritt 5).
- **Codegen-Watch + Branch-Wechsel:** der laufende `graphql-codegen --watch` kann
  beim Branch-Switch Ops in `gql.ts` leaken (Build/Drift-Gate rot). Watcher killen
  bzw. pro Session/Worktree nur einen laufen lassen (siehe MEMORY.md).
- **Ganze `docker compose up`:** baut Prod-Images (Backend/Frontend Dockerfiles) —
  für lokale Entwicklung NICHT nötig, nur `postgres` hochziehen.
