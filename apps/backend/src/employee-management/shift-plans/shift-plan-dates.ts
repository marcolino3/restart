import { BadRequestException } from '@nestjs/common';
import {
  WEEKDAY_KEYS,
  type WeekdayKey,
} from '@/employee-management/employee-contracts/contract-shifts';

/** Longest plan a single request may create / evaluate. */
export const MAX_PLAN_DAYS = 92;

const DAY_MS = 86_400_000;

export function parseIsoDate(value: string): Date {
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) {
    throw new BadRequestException(`Invalid date "${value}"`);
  }
  return d;
}

export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Accepts `date` columns (string) and JS dates alike. */
export function isoDateOf(value: string | Date): string {
  return typeof value === 'string' ? value.slice(0, 10) : toIsoDate(value);
}

/** mon..sun of an ISO date (UTC, dates carry no time). */
export function weekdayOf(isoDate: string): WeekdayKey {
  const js = parseIsoDate(isoDate).getUTCDay(); // 0 = sunday
  return WEEKDAY_KEYS[(js + 6) % 7];
}

/** Inclusive list of ISO dates; validates order and length. */
export function datesBetween(startDate: string, endDate: string): string[] {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  if (end < start) {
    throw new BadRequestException('endDate must not be before startDate');
  }
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  if (days > MAX_PLAN_DAYS) {
    throw new BadRequestException(`Plan must not exceed ${MAX_PLAN_DAYS} days`);
  }
  return Array.from({ length: days }, (_, i) =>
    toIsoDate(new Date(start.getTime() + i * DAY_MS)),
  );
}
