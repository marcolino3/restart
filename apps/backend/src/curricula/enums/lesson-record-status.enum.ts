import { registerEnumType } from '@nestjs/graphql';

/**
 * Status eines LessonRecord (Fortschritt pro Kind × Lektion).
 * - PLANNING:   geplant (Wochenplan), noch nicht durchgeführt
 * - INTRODUCED: Lehrperson hat die Lektion eingeführt
 * - PRACTICED:  Kind hat selbständig geübt
 * - MASTERED:   gemeistert (bei MASTERABLE-Lektionen sinnvoll)
 * - NEEDS_MORE: braucht mehr Übung
 */
export enum LessonRecordStatus {
  PLANNING = 'PLANNING',
  INTRODUCED = 'INTRODUCED',
  PRACTICED = 'PRACTICED',
  MASTERED = 'MASTERED',
  NEEDS_MORE = 'NEEDS_MORE',
}

registerEnumType(LessonRecordStatus, {
  name: 'LessonRecordStatus',
  description:
    'Status pro Kind × Lektion: PLANNING / INTRODUCED / PRACTICED / MASTERED / NEEDS_MORE.',
});
