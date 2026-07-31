# Handoff: Colibri/Restart — SaaS-Shell mit Theme-System

## Overview

Themebares UI-Konzept für die Schulverwaltungs-Plattform **Restart** (Markenname Colibri): eine Admin-Webapp mit Sidebar-Navigation, 18 Ansichten (inkl. Detail-Screens), 2 Modals und **12 umschaltbaren Farbvarianten**. Fachlicher Umfang entspricht dem GitHub-Repo `marcolino3/restart`, Branch `integration/all-features` (Zeiterfassung, Zeitauswertung, Projekte, Aufgaben, Protokolle, Aufnahmeprozess mit Erinnerungen/Absagen/E-Mail-Vorlagen usw.).

## About the Design Files

Die Dateien in diesem Bundle (`index.html`, `styles.css`) sind **Design-Referenzen in HTML** — Prototypen, die Look und Verhalten zeigen, **kein Produktionscode**. Aufgabe ist es, diese Designs in der bestehenden Codebase nachzubauen: **Next.js 16 (App Router) + React 19 + shadcn/ui + Tailwind CSS 4** (siehe Repo `marcolino3/restart`, `apps/web/`). Bestehende Komponenten (`apps/web/components/ui/`) und Patterns weiterverwenden; nur das Theming und neue Screens ergänzen.

## ⚠️ Wichtigste Regel: Nichts überschreiben — Restyling, kein Rewrite

Der Prototyp zeigt einen **Ausschnitt** der App, nicht ihren vollen Funktionsumfang. Die echte Codebase enthält mehr Buttons, Aktionen, Formularfelder, Permission-Checks, Spalten und Flows als hier abgebildet. Daher gilt:

- **Bestehende Funktionalität bleibt vollständig erhalten.** Kein Button, keine Aktion, kein Feld, keine Server Action, kein Permission-Gate wird entfernt oder ersetzt, nur weil er/es im Prototyp fehlt.
- **Das Design ist additiv:** Theme-Tokens, Farbvarianten und Layout-Muster werden auf die vorhandenen Screens **angewendet** (Restyling der bestehenden shadcn-Komponenten über CSS-Variablen). Bestehende Logik nicht anfassen.
- **Elemente ohne Prototyp-Vorlage** (zusätzliche Buttons, Menüs, Dialoge, Tabellenspalten …) übernehmen einfach die Theme-Tokens und die hier dokumentierten Muster (Pillenform-Buttons 38px, Status-Pills, Karten-Radius `--r-card` usw.) — sie werden **nicht gelöscht oder versteckt**.
- **Neue Screens** aus dem Prototyp (z. B. Theme-Picker, Detail-Layouts) werden ergänzt, ohne bestehende Routen zu ersetzen.
- Im Zweifel: bestehendes Verhalten beibehalten und nur die visuelle Schicht ändern; Unklarheiten als Frage an den Menschen zurückgeben statt zu löschen.

## Fidelity

**High-fidelity (hifi).** Farben, Typografie, Abstände und Radii sind final gemeint. UI pixelgenau mit den vorhandenen shadcn-Komponenten nachbauen; exakte Werte stehen in `styles.css` (vollständig) und unten (Auszug).

## Theme-Architektur (Kernstück)

Ein Attribut `data-theme="<name>"` auf `<html>` schaltet das komplette Farbschema um. Jedes Theme definiert denselben Satz CSS Custom Properties — **alle Komponenten referenzieren ausschliesslich diese Variablen**, nie Hex-Werte direkt. Auswahl wird in `localStorage` persistiert.

### Variablen-Kontrakt (pro Theme)

| Variable | Bedeutung |
|---|---|
| `--bg` / `--panel` / `--line` | App-Hintergrund / Karten-Weiss / 1px-Border |
| `--ink` / `--soft` | Primärtext / Sekundärtext |
| `--row-h` / `--field` | Tabellenzeilen-Hover / Input-Hintergrund |
| `--side-bg` `--side-fg` `--side-line` `--side-soft` | Sidebar Fläche/Text/Border/gedämpft |
| `--side-on-bg` `--side-on-fg` | aktiver Nav-Eintrag |
| `--acc` `--acc-ink` | Akzent (Primary-Buttons, aktive Chips) + Textfarbe darauf |
| `--acc-soft` `--acc-soft-fg` | Akzent-Tint (Badges, Avatare) |
| `--timer-bg` `--timer-fg` | dunkles Band (Timer, Profil-Header) |
| `--gold` `--gold-ink` | CTA auf dunklem Band (Timer-Stop, Profil-Primary) |
| `--st-{slate,sky,amber,green,rose}-{bg,fg}` | 5 Status-Paare (Pills, Zeiteinträge) |
| `--hm-e`, `--hm-0`…`--hm-4` | Heatmap-Skala (leer, 0 %→100 %) |
| `--r-card` / `--r-ctl` | Radius Karten / Controls (variiert pro Theme!) |
| `--shadow` / `--panel-border` | Karten-Schatten / -Border |

### Die 12 Themes (Akzentfarbe · App-Hintergrund · Charakter)

| Theme | `--acc` | `--bg` | Sidebar |
|---|---|---|---|
| Salbei (Default) | `#3a7d44` | `#f7f5f0` | warm getönt `#efebe1` |
| Lagune | `#2a9d8f` | `#faf7f2` | teal-getönt `#e9f3f1` |
| Himmel | `#2f7bd0` | `#f4f7fa` | blau-getönt `#e8f1f9` |
| Indigo | `#4f5dd8` | `#f4f5fa` | weiss, aktive Pille als Tint |
| Flieder | `#7d55cc` | `#f7f5fa` | lavendel `#f0eaf8` |
| Terracotta | `#bb5d3a` | `#faf6f1` | creme `#f4e9dd` |
| Ozean | `#20708d` | `#f3f7f8` | `#e5f0f3` |
| Wald | `#2d6a4f` | `#f5f7f4` | `#e7efe7` |
| Beere | `#a34d74` | `#faf6f8` | `#f6e9f0` |
| Honig | `#a97a24` | `#faf7f0` | `#f5edda` |
| Schiefer | `#42566b` | `#f4f6f8` | `#e9eef3` |
| Graphit (monochrom, wie shadcn neutral) | `#1c1c1a` | `#f7f7f6` | weiss |

Vollständige Wertetabellen (Status-Paare, Heatmap, Radii, Schatten) je Theme: **`styles.css`, Abschnitt `/* THEMES */`** — 1:1 übernehmen.

### Mapping auf shadcn/Tailwind-4-Tokens

| Prototyp-Variable | shadcn-Variable |
|---|---|
| `--bg` | `--background` |
| `--panel` | `--card` / `--popover` |
| `--ink` | `--foreground` |
| `--soft` | `--muted-foreground` |
| `--line` | `--border` |
| `--field` | `--input` / `--muted` |
| `--acc` / `--acc-ink` | `--primary` / `--primary-foreground` |
| `--acc-soft` / `--acc-soft-fg` | `--accent` / `--accent-foreground` |
| `--side-*` | `--sidebar`, `--sidebar-foreground`, `--sidebar-border`, `--sidebar-accent`… |
| `--r-card` / `--r-ctl` | `--radius` (+ abgeleitete) |

Empfehlung: Themes als `[data-theme="…"]`-Blöcke in `globals.css`, Umschaltung über ein kleines Theme-Context/Provider, Persistenz in `localStorage` (Key z. B. `restart-theme`).

## Layout-Grundgerüst (Shell)

- **Sidebar:** 260px fix, `--side-bg`, 1px Border rechts. Aufbau: Brand (30×30 Mark mit `--acc`, Radius 9px, „R" + Wortmarke) → Nav (scrollbar) → Theme-Picker → User-Zeile. Nav-Items: 9px 12px Padding, Radius `--r-ctl`, 14px/500, Icon 17px, Opacity 0.85; aktiv: `--side-on-bg`/`--side-on-fg`, 600. Gruppen-Label: 10.5px/650 uppercase, letter-spacing 0.08em. Zähler-Badge: 11px Geist Mono, Pillenform.
- **Topbar:** 60px, `--panel`, 1px Border unten. Links Seitentitel 16px/650, rechts Suchfeld (280×36, Pillenform, `--field`) + Primary-Button.
- **Content:** Padding 26px 30px, scrollbar. Seiten sind `section.page`, nur `.on` ist sichtbar.

## Screens / Views (18)

Die Views zeigen den Design-Zielzustand der jeweiligen Route — **vorhandene Zusatzfunktionen der echten App auf diesen Screens bleiben bestehen** (siehe Regel oben). Alle in `index.html`, je eine `<section class="page" id="page-…" data-screen-label="…">`:

**Hauptnavigation:**
1. **Dashboard** — Begrüssung, 4 Stat-Karten (Label 12.5px, Wert 30px/700 tabular-nums), 2 Panels: „Braucht Aufmerksamkeit" (Avatar-Zeilen mit Status-Pills) und „Aufnahmeprozess" (Stage-Balken).
2. **Zeiterfassung** — dunkles Timer-Band (`--timer-bg`, laufende Zeit 28px Geist Mono, Kategorie-Chip, Stop-Button in `--gold`) + 5-Tage-Wochenraster mit farbigen Einträgen (Border-links 3.5px, Status-Farben), „heute" mit Akzent-Border.
3. **Zeitauswertung** — 4 KPIs in Leiste, Tabelle Mitarbeitende (Pensum, Soll, Ist, Saldo ±, Absenzen, Status-Pill).
4. **Mitarbeitende** — Filter-Chips, Tabelle mit Pensum-Balken, Zeitsaldo mono, Status heute. **Zeile klickbar → Mitarbeiter-Profil.**
5. **Schüler:innen** — Klassen-Chips, Tabelle. **Zeile klickbar → Schülerprofil.**
6. **Bezugspersonen** — Filter-Chips (Erziehungsberechtigte/Notfall/Abholberechtigt), Tabelle mit Rechte-Pills.
7. **Fortschritte** — KPI-Leiste + Klassen-Heatmap (Zellen `--hm-0`…`--hm-4`, Geist Mono 12px) + Legende.
8. **Aufnahmeprozess** — Sub-Tabs (Kanban · Erinnerungen · Absagen · E-Mail-Vorlagen) + 4-Spalten-Kanban. **Karte klickbar → Bewerbungs-Detail.**
9. **Projekte** — Karten-Grid 3-spaltig: Titel + Status-Pill, Beschreibung, Fortschrittsbalken, „x von y Aufgaben", Mitglieder-Avatare. **Karte klickbar → Projekt-Detail.**
10. **Meine Aufgaben** — Status-Chips, Tabelle mit Prioritäts-Pills (Dringend rose / Hoch amber / Mittel sky / Niedrig slate). **Zeile klickbar → Aufgaben-Modal.**
11. **Protokolle** — Tabelle (Titel, Sitzung, Projekt, Teilnehmende, Status Entwurf/Finalisiert). **Zeile klickbar → Protokoll-Detail.**

**Organisation:** 12. Teams (Karten mit Mitglieder-Zeilen) · 13. Schulklassen (Karten mit Kapazitätsbalken) · 14. Stufen (Tabelle) · 15. Lehrpläne (3-Spalten-Browser: Fachbereiche → Lektionen → Detail mit Status-Strip) · 16. Absenz-Kategorien (Tabelle mit Farb-Dots, Kürzel, bezahlt/Ferienabzug) · 17. Rollen & Berechtigungen (Tabelle).

**Detail-Screens (nicht in Nav, Parent-Nav-Item bleibt aktiv):**
- **Schülerprofil** (`page-profil`) — dunkles Profil-Band (`--timer-bg`) mit Gross-Avatar in `--gold`, Meta-Chips, Tabs; darunter Ereignis-Timeline + Lernstand-Kacheln + Bezugspersonen.
- **Mitarbeiter-Profil** (`page-maprofil`) — gleiches Band-Muster; Vertrag & Pensum (Key-Value-Zeilen), Salden-Kacheln, nächste Absenzen.
- **Projekt-Detail** (`page-projektdetail`) — Aufgaben-Kanban: Offen / In Arbeit / Blockiert / Erledigt (erledigte Karten opacity 0.65), „← Alle Projekte"-Chip.
- **Protokoll-Detail** (`page-protokolldetail`) — Traktanden (Ziel-Pills: Information sky / Entscheid green / Diskussion amber), Beschlüsse (mit „→ Aufgabe"-Hinweis), Teilnehmende, offene Punkte.
- **Bewerbungs-Detail** (`page-bewerbung`) — Stage-Fortschritt als Chips, Aktivitäten-Timeline, Angaben (Key-Value), Erinnerungen; Aktionen „Absage senden" / „Nächste Stage".
- **Aufnahme-Untertabs** (`page-erinnerungen`, `page-absagen`, `page-vorlagen`) — Tabellen bzw. Vorlagen-Karten mit `{platzhalter}`-Syntax.

## Modals (2)

Overlay `rgb(0 0 0 / 0.5)`, Dialog 500px, `--panel`, Radius `--r-card`, Schatten `0 16px 50px rgb(0 0 0 / 0.25)`, Padding 22px 24px. Titel 17px/700, ×-Button 30px rund in `--field`. Schliessen: ×, Klick auf Overlay, Escape.

1. **Neue Bewerbung** — öffnet vom Topbar-Button und vom Aufnahme-Button. Felder: Vor-/Nachname (2-spaltig), Geburtsdatum/Eintritt, Stage-Select, Notiz-Textarea (Platzhalter „z.B. Erstgespräch mit Mutter"). Footer rechts: Ghost „Abbrechen" + Primary „Bewerbung erstellen".
2. **Aufgabe** — öffnet per Klick auf Aufgaben-Zeile. Pills-Zeile (Projekt/Priorität/Status), Beschreibung, Fällig + Priorität, Zugewiesene Avatare, „Als erledigt markieren".

## Interactions & Behavior

- **Navigation:** Client-seitiges Umschalten der Sections; im echten Build: App-Router-Routen. Aktueller Zustand (Seite + Theme) in `localStorage`, beim Laden validieren (unbekannte Werte → Default).
- **Parent-Highlight:** Detailseiten markieren ihren Nav-Parent aktiv (Profil→Schüler:innen, Projekt-Detail→Projekte, Bewerbung/Erinnerungen/Absagen/Vorlagen→Aufnahmeprozess, …).
- **Hover:** Nav `color-mix(--side-fg 8%)`; Tabellenzeilen `--row-h`; keine Entrance-Animationen, Transitions kurz (~150ms).
- **Klickbare Elemente:** cursor pointer auf Projekt-Karten, Mitarbeiter-/Protokoll-/Aufgaben-Zeilen, Kanban-Karten, Tab-Chips.
- **Formulare:** Inputs 38px, Radius `--r-ctl`, `--field`-Hintergrund, 1px `--line`.

## State Management

- `currentPage` (string, persistiert), `currentTheme` (string, persistiert), `openModal` (string | null).
- Echte App: Daten via bestehende Server Actions/Fetching-Patterns des Repos; die Inhalte im Prototyp sind realistische Dummy-Daten (Schweizer Formate: `ss` statt `ß`, Du-Form, CHF, `1'848`).

## Design Tokens (Basis, themenunabhängig)

- **Fonts:** Geist 400/500/600/700, Geist Mono 400–600 (Google Fonts). Zahlen in Tabellen: Geist Mono + `tabular-nums`.
- **Typo-Skala:** Basis 14px · Seitentitel (Topbar) 16px/650 · Seiten-H2 26px/700/−0.025em · Panel-H3 15px/650 · Stat-Wert 30–34px/700 · Tabelle 13.5px · TH 11.5px/650 uppercase 0.05em · Pill 11px/600 · Hint 12.5px · Minimum 10.5px.
- **Buttons:** Höhe 38px, Pillenform (999px), 13.5px/600; Ghost: `--panel` + 1px `--line`.
- **Pills/Chips:** Pillenform; Chips 13px, 7px 15px Padding, aktiv = `--acc`.
- **Radii:** pro Theme via `--r-card` (10–16px) und `--r-ctl` (8–11px) — Themes unterscheiden sich bewusst auch in der Rundung.
- **Spacing:** Karten-Padding 18–22px, Grid-Gaps 14px, Content-Padding 26px 30px.
- **Schatten:** minimal (`0 1px 2–4px`, ≤7 % Alpha); Modal deutlich stärker. Keine Glows, kein Glassmorphism.

## Assets

Keine Bild-Assets. Icons sind Lucide-/Tabler-artige Outline-SVGs (2px Stroke) als Inline-Sprite (`<defs>` am Anfang von `index.html`); im Build durch `@tabler/icons-react` (Sidebar) bzw. `lucide-react` (Rest) ersetzen — gleiche Glyphen sind dort vorhanden (dashboard, clock, users, school, layers, kanban, list-checks, file-text, calendar-x, shield, book, …).

## Files

- `index.html` — komplette Shell, alle 18 Views, 2 Modals, Navigations-/Theme-/Modal-Logik (Vanilla JS am Dateiende)
- `styles.css` — **alle 12 Theme-Definitionen** (Zeilen 1–260) + sämtliche Komponenten-Stile

Prototyp im Browser öffnen und durchklicken — er ist die verbindliche Referenz.
