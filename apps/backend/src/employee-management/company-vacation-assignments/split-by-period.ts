import { DateTime } from 'luxon';
import { periodBoundsFor } from '@/employee-management/time-tracking-periods/period-bounds';

/** Ein auf eine Abrechnungsperiode begrenztes Teilstück eines Zeitraums. */
export interface PeriodSegment {
  /** Beginn des Teilstücks (inklusiv). */
  startDate: string;
  /** Ende des Teilstücks (inklusiv). */
  endDate: string;
  /** Beginn der Periode (Stichtag). */
  periodStartDate: string;
  /** Ende der Periode (Vortag des nächsten Stichtags). */
  periodEndDate: string;
}

/**
 * Schneidet [startDate..endDate] entlang der Stichtags-Grenzen in Segmente.
 *
 * Ein Zeitraum innerhalb einer Periode ergibt genau ein Segment (identisch mit
 * dem Original). Überschreitet er den Stichtag, entsteht pro berührter Periode
 * ein Segment: das erste endet am Vortag des Stichtags, das nächste beginnt am
 * Stichtag. Segmente kommen in chronologischer Reihenfolge.
 */
export function splitByPeriodAnchor(
  startDate: string,
  endDate: string,
  anchor: { month: number; day: number },
): PeriodSegment[] {
  const start = DateTime.fromISO(startDate);
  const end = DateTime.fromISO(endDate);
  if (!start.isValid || !end.isValid || end < start) return [];

  const segments: PeriodSegment[] = [];
  let cursor: DateTime = start;

  while (cursor <= end) {
    const bounds = periodBoundsFor(anchor, cursor);
    // Segment endet am Periodenende oder am Zeitraumende — was frueher kommt.
    const segmentEnd = bounds.end < end ? bounds.end : end;
    segments.push({
      startDate: cursor.toISODate() as string,
      endDate: segmentEnd.toISODate() as string,
      periodStartDate: bounds.start.toISODate() as string,
      periodEndDate: bounds.end.toISODate() as string,
    });
    cursor = segmentEnd.plus({ days: 1 });
  }

  return segments;
}
