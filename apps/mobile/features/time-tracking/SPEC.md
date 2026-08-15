# Mobile Zeiterfassung — Umsetzungsauftrag

Arbeitsauftrag für den Umbau der mobilen Zeiterfassung auf das Design aus dem
Artefakt „Restart — Mobile Zeiterfassung" (Artefakt-ID
`e23f2658-8f60-4bf2-9eef-e45fbbe535f5`). Diese Datei hält fest, was gebaut
wird und was bewusst wegfällt.

Branch: `feat/mobile-timetracking-design`.

## Designquelle

Das Artefakt ist ein self-unpacking Bundle; der Loader enthält kein lesbares
Markup. Das eigentliche Template steckt in
`<script type="__bundler/template">` als JSON-String und lässt sich so lösen:

```js
const h = fs.readFileSync(artifactHtml, "utf8");
const t = JSON.parse(h.match(/<script type="__bundler\/template">([\s\S]*?)<\/script>/)[1]);
```

Relevante Stellen im entpackten Template: Theme-Tokens ab Zeile 548, das
Screen-CSS ab Zeile 1957, das Markup der drei Screens ab Zeile 2119.

## Umfang

Drei Screens plus Tabbar, im Design des Artefakts, gegen das bestehende
Backend. Nur Mobile/PWA — die Web-App bleibt unberührt.

### 1 · Heute

Dunkles Band der laufenden Erfassung (`--timer-bg`, Gold-Akzent für Punkt und
Fortschrittsbalken), darunter Kennzahlen im 2×2-Raster, darunter die letzten
Tage als Liste mit Datumskachel.

### 2 · Verlauf

Monatskalender mit Punkten je erfasstem Tag, Soll/Ist/Saldo darunter, dann die
Tagesliste. Ausgewählter Tag als gefüllte Zeile.

### 3 · Tagesansicht

Ein Tag, bearbeitbar: Kommen, Gehen, Pause, Notiz. Kein Zeitstrahl mehrerer
Blöcke — siehe Ein-Eintrag-pro-Tag unten.

### Tabbar

Fünf Positionen: Heute · Verlauf · Stempel-FAB (erhöht, Akzentfarbe) ·
Absenzen · Mehr.

## Verbindliche Entscheidungen

Vom Entwickler festgelegt, gegen das Artefakt-Design:

1. **Ein Zeiteintrag pro Tag.** Das Backend erzwingt das bereits
   (`assertNoDuplicateForDay`, Fehler `TIME_TRACKING_DUPLICATE_DAY`). Der
   Mehrblock-Zeitstrahl aus dem Artefakt entfällt ersatzlos.
2. **Saldo und Absenzen über die Abrechnungsperiode**, nicht über den Monat.
   Die Periode ergibt sich aus dem Org-Stichtag (`timeTrackingPeriodAnchor`,
   Format `MM-DD`) — nicht aus dem Kalenderjahr. Ein Stichtag `08-01` heisst:
   Januar gehört zur Periode, die im August davor begann.
3. **Berechnung bleibt die des Backends.** Keine eigene Rechenlogik in Mobile;
   die exakte Berechnung wird später separat nachgezogen.
4. **Zeiteinträge bearbeitbar**, mit Datepicker und Timepicker.
5. **Notizfeld** in der Tagesansicht.
6. **Arbeitszeit direkt erfassbar**, ohne Ein- und Ausstempeln (Backend kann
   das über `createTimeTracking` mit `source: MANUAL`).
7. **Weggelassen:** Standort-Chip, Korrekturantrag, „Bereits freigegeben",
   „Korrektur offen". Kein Feld dafür im Backend — nichts erfinden.

## Datenlage

Das Backend deckt den Umfang ab; kein Schema-Umbau nötig.

`TimeTracking`-Entity: `startedAt`, `endedAt`, `breakMinutes`, `workMinutes`,
`notes`, `entryDate`, `source` (`CLOCK` | `MANUAL`).

Vorhandene Operationen in `lib/time-tracking.ts`: `fetchMyTimeTracking`,
`startClock`, `stopClock`, `createEntry`, `updateEntry`, `deleteEntry`,
`formatDuration`, `timeOf`.

Für den Stichtag zusätzlich abgefragt: `timeTrackingPeriodAnchor` (org-scoped,
hinter `TIMESHEET_READ`).

Alle Zahlen kommen aus dem Backend, nichts wird im Client gerechnet oder
gruppiert. Der Kalender speist sich aus zwei weiteren Queries, beide ebenfalls
hinter `TIMESHEET_READ`:

- `myMissingRecordDays(from, to): [String!]!` — Arbeitstage der Periode ohne
  Eintrag, im Kalender markiert.
- `myMonthlyTimeTracking(from, to, locale): [MonthlyTimeTrackingGroup!]!` —
  Monatssummen (`workedMinutes`, `plannedMinutes`) und je Tag `date`, `label`,
  `color`, `workMinutes`, `plannedMinutes`. `month` ist 1-basiert
  (`EXTRACT(MONTH FROM date)` in `getMonthlySummaries`). `locale` ist nullable
  und wird von Mobile nicht gesetzt.

Die Design-Vorlage liegt entpackt als `design-reference.html` neben dieser
Datei.

Nicht im Backend vorhanden und daher nicht baubar: Standort, Freigabestatus,
Pause als eigener Stempelzustand, tagesgenaues Soll (und damit „Feierabend
ca."). Das Artefakt zeigt diese Elemente — sie entfallen.

## Tokens

`tailwind.config.js` trug die Salbei-Palette bereits. Ergänzt wurden:
`timer` / `timer-foreground` (dunkles Band), `row-hover`, `field` sowie die
Radien `tile` 15, `row` 20, `card` 22, `band` 24 — das Artefakt nutzt weichere
Ecken als der `--r-card`-Token.

Die übrigen elf Farbvarianten des Artefakts (lagune, himmel, indigo, flieder,
terracotta, ozean, wald, beere, honig, schiefer, graphit) sind **nicht** Teil
dieses Auftrags. Salbei bleibt gesetzt.
