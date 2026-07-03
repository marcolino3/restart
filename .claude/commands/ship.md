# /ship — Release-Checkliste für ein Feature/Fix

Führe die folgenden Schritte der Reihe nach aus, bevor eine Änderung als fertig gilt (Definition of Done aus CLAUDE.md, ergänzt um Design-System-Gates). Brich bei rotem Schritt ab, fixe, und starte den Schritt neu.

## 1. Komponentenbasiertes Styling (Design-System-Review)
Prüfe den Diff auf Verstösse gegen das komponentenbasierte Arbeiten:
- Kein per-Instanz-Styling von Farben/Radius/Typografie via `className` — solche Styles gehören als Variante/Token in die Basis-Komponente (`components/ui/*`, cva-Varianten) oder als wiederverwendbare Komponente (`components/common/*`, `components/form/form-fields/*`).
- Wiederkehrende UI-Muster (Page-Header, Such-Pille, Stat-Karten, Pills, Dialog-Aufbau) müssen als Komponente extrahiert und wiederverwendet werden — nicht kopiert.
- `className` an Aufrufstellen nur für Layout (Breite, Grid, Abstände).
- Alle Styles referenzieren Design-Tokens des Handoffs (`data-theme`-Variablen, `bg-field`, `rounded-card`, Badge-Varianten …), nie Hex-Werte. Referenz: Memory `project_design_handoff.md` + `memory/design_handoff_saas_shell/`.
- Schriften/Typo-Skala gemäss Handoff (Geist / Geist Mono + tabular-nums für Zahlen).

## 2. Tests
- Neue Business-Logik → Unit-Tests (Backend Jest, Frontend Vitest); Resolver/Guards → Permission- UND Multi-Tenant-Isolationstests.
- Kritische User-Flows → Playwright E2E (Happy-Path + Negativ-/Auth-Fall).
- Bugfix → zuerst Regressions-Test.

## 3. Lokale Gates (müssen grün sein)
```bash
pnpm turbo run lint test build
pnpm --filter @restart/e2e test:e2e
```

## 4. i18n & Schema
- DE + EN Keys vollständig (Feature-Namespace, nicht Common; Schweizer Schreibweise: ss statt ß).
- Bei Schema-Änderung: TypeORM-Migration vorhanden (forward-only; `ADD VALUE` und Wert-Nutzung in getrennten Migrationen).

## 5. Verifikation im echten Flow
- Betroffene Flows im Browser durchklicken (oder /verify), nicht nur Tests/Typecheck.

## 6. PR
- Feature-Branch (`feat/…`, `fix/…`), Conventional Commits, PR-Template vollständig, kein direkter Push auf `main`.
