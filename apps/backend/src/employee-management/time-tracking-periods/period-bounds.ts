import { DateTime } from 'luxon';

/**
 * [start,end] der Abrechnungsperiode, die `date` enthält: vom Stichtag bis zum
 * Vortag des nächsten Stichtags. Liegt `date` vor dem Stichtag des eigenen
 * Jahres, gehört es noch zur Periode des Vorjahres.
 *
 * Reine Funktion — einzige Quelle der Periodengrenzen, damit Perioden-Erzeugung
 * und Betriebsferien-Zuschnitt nie auseinanderlaufen.
 */
export function periodBoundsFor(
  anchor: { month: number; day: number },
  date: DateTime,
): { start: DateTime; end: DateTime } {
  let start = DateTime.fromObject({
    year: date.year,
    month: anchor.month,
    day: anchor.day,
  });
  if (date < start) start = start.minus({ years: 1 });
  const end = start.plus({ years: 1 }).minus({ days: 1 });
  return { start, end };
}

/** Periodenlabel: "2026" bei Jahresdeckung, sonst "2026/27". */
export function periodLabel(
  periodStartDate: string,
  periodEndDate: string,
): string {
  const startYear = periodStartDate.slice(0, 4);
  const endYear = periodEndDate.slice(0, 4);
  return startYear === endYear ? startYear : `${startYear}/${endYear.slice(2)}`;
}
