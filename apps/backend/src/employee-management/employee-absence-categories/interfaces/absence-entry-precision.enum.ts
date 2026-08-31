import { registerEnumType } from '@nestjs/graphql';

/**
 * Finest unit an employee may use when reporting an absence of a category.
 * Coarser units stay allowed (a TIME category may still cover a full day).
 * Persisted as varchar, not a PG enum (see the 55P04 rule in CLAUDE.md).
 */
export enum AbsenceEntryPrecision {
  /** Whole days only. */
  DAY = 'DAY',
  /** Whole days or morning / afternoon. */
  HALF_DAY = 'HALF_DAY',
  /** Start and end time on a single day (appointments). */
  TIME = 'TIME',
}

registerEnumType(AbsenceEntryPrecision, {
  name: 'AbsenceEntryPrecision',
  description: 'Finest unit for reporting an absence of a category',
});
