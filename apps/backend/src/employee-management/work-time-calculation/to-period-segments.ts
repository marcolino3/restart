import { DateTime } from 'luxon';
import {
  periodBoundsFor,
  periodLabel,
} from '@/employee-management/time-tracking-periods/period-bounds';
import { Holiday } from '@/employee-management/holidays/entities/holiday.entity';
import {
  calculateEffectiveVacationDays,
  listVacationHolidays,
} from './work-time-calculation';
import { splitByPeriodAnchor } from '@/employee-management/company-vacation-assignments/split-by-period';

/** Minimaler Zeitraum, aus dem sich Periodensegmente bilden lassen. */
export interface PeriodSegmentSource {
  id: string;
  name: string | null;
  startDate: string;
  endDate: string;
}

/** Ein auf die laufende Abrechnungsperiode zugeschnittenes Segment. */
export interface CurrentPeriodSegment {
  id: string;
  sourceId: string;
  name: string | null;
  startDate: string;
  endDate: string;
  effectiveDays: number;
  holidays: {
    date: string;
    name: string;
    paidPercentage: number;
    isWeekend: boolean;
  }[];
  periodLabel: string;
  periodStartDate: string;
  periodEndDate: string;
  isSplit: boolean;
}

/**
 * Zerschneidet Zeiträume entlang der Stichtags-Grenzen und liefert nur die
 * Segmente der laufenden Abrechnungsperiode, angereichert mit `effectiveDays`
 * und Feiertagen. Gemeinsame Pipeline für Betriebsferien- und individuelle
 * Ferien-Zuweisungen — Verhalten muss für beide identisch bleiben.
 */
export function toCurrentPeriodSegments(
  sources: PeriodSegmentSource[],
  anchor: { month: number; day: number },
  holidays: Holiday[],
): CurrentPeriodSegment[] {
  const current = periodBoundsFor(anchor, DateTime.now());
  const currentStart = current.start.toISODate() as string;

  const segments = sources.flatMap((source) => {
    const parts = splitByPeriodAnchor(source.startDate, source.endDate, anchor);
    const isSplit = parts.length > 1;
    return parts
      .filter((part) => part.periodStartDate === currentStart)
      .map((part) => ({
        id: `${source.id}:${part.periodStartDate}`,
        sourceId: source.id,
        name: source.name,
        startDate: part.startDate,
        endDate: part.endDate,
        effectiveDays: calculateEffectiveVacationDays(
          part.startDate,
          part.endDate,
          holidays,
        ),
        holidays: listVacationHolidays(
          part.startDate,
          part.endDate,
          holidays,
        ).map(({ date, holiday, isWeekend }) => ({
          date,
          name: holiday.name,
          paidPercentage: holiday.paidPercentage,
          isWeekend,
        })),
        periodLabel: periodLabel(part.periodStartDate, part.periodEndDate),
        periodStartDate: part.periodStartDate,
        periodEndDate: part.periodEndDate,
        isSplit,
      }));
  });

  return segments.sort((a, b) => a.startDate.localeCompare(b.startDate));
}
