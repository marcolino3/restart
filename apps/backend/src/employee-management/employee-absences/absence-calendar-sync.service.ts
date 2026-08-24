import { GoogleCalendarService } from '@/google/google-calendar.service';
import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { EntityManager } from 'typeorm';
import { AbsenceCalendarSync } from './entities/absence-calendar-sync.entity';
import { CalendarProvider } from './entities/calendar-provider.enum';

export interface AbsenceCalendarSyncInput {
  organizationId: string;
  absenceId: string;
  /** Full name of the absent employee, used verbatim in the event title. */
  employeeName: string;
  /** Localised absence label, e.g. `krank`. */
  absenceLabel: string;
  /**
   * Title template chosen by the employee; `{firstName}`, `{lastName}` and
   * `{category}` are resolved here. Null/blank = `employeeName absenceLabel`.
   */
  titleTemplate?: string | null;
  startDate: Date;
  endDate: Date;
  /** `HH:mm[:ss]` when the absence starts mid-day, otherwise null. */
  startTime?: string | null;
  note?: string | null;
}

/**
 * Mirrors an absence onto the organization's external calendar as a single
 * all-day event, remembering the provider event id so later extensions patch
 * that event instead of creating duplicates.
 *
 * Sync is best-effort by design: every failure is recorded on the sync row and
 * swallowed, because the absence itself is already persisted and must not be
 * rolled back over a calendar outage. Must be called AFTER the absence
 * transaction has committed — never inside it.
 */
@Injectable()
export class AbsenceCalendarSyncService {
  private readonly logger = new Logger(AbsenceCalendarSyncService.name);

  constructor(
    private readonly entityManager: EntityManager,
    private readonly googleCalendar: GoogleCalendarService,
  ) {}

  async sync(input: AbsenceCalendarSyncInput): Promise<void> {
    const { organizationId, absenceId } = input;

    // Inside the try as well: a lookup failure must not escape either, the
    // absence is already committed at this point.
    let existing: AbsenceCalendarSync | null = null;

    try {
      existing = await this.entityManager.findOne(AbsenceCalendarSync, {
        where: {
          organizationId,
          absenceId,
          provider: CalendarProvider.GOOGLE,
        },
      });

      const result = await this.googleCalendar.upsertAllDayEvent({
        organizationId,
        externalEventId: existing?.externalEventId,
        summary: buildSummary(input),
        description: input.note ?? undefined,
        startDate: toIsoDate(input.startDate),
        endDate: toIsoDate(input.endDate),
      });

      // Organization has no calendar configured — nothing to record.
      if (!result) return;

      await this.entityManager.save(
        AbsenceCalendarSync,
        this.entityManager.create(AbsenceCalendarSync, {
          ...(existing ? { id: existing.id, version: existing.version } : {}),
          organizationId,
          absenceId,
          provider: CalendarProvider.GOOGLE,
          calendarId: result.calendarId,
          externalEventId: result.externalEventId,
          lastSyncedAt: new Date(),
          lastError: null,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Calendar sync failed for absence ${absenceId}: ${message}`,
      );
      await this.recordFailure(input, existing, message);
    }
  }

  /** Remove the mirrored event, e.g. when an absence is deleted. */
  async remove(organizationId: string, absenceId: string): Promise<void> {
    let existing: AbsenceCalendarSync | null = null;

    try {
      existing = await this.entityManager.findOne(AbsenceCalendarSync, {
        where: { organizationId, absenceId, provider: CalendarProvider.GOOGLE },
      });
      if (!existing) return;

      await this.googleCalendar.deleteEvent({
        organizationId,
        externalEventId: existing.externalEventId,
      });
      await this.entityManager.delete(AbsenceCalendarSync, {
        id: existing.id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Calendar event removal failed for absence ${absenceId}: ${message}`,
      );
      if (!existing) return;
      try {
        existing.lastError = message;
        await this.entityManager.save(existing);
      } catch (persistError) {
        this.logger.error(
          `Could not persist calendar removal failure for absence ${absenceId}`,
          persistError as Error,
        );
      }
    }
  }

  private async recordFailure(
    input: AbsenceCalendarSyncInput,
    existing: AbsenceCalendarSync | null,
    message: string,
  ): Promise<void> {
    try {
      if (existing) {
        existing.lastError = message;
        await this.entityManager.save(existing);
        return;
      }
      // No event exists yet: keep a row so the failure stays visible.
      await this.entityManager.save(
        AbsenceCalendarSync,
        this.entityManager.create(AbsenceCalendarSync, {
          organizationId: input.organizationId,
          absenceId: input.absenceId,
          provider: CalendarProvider.GOOGLE,
          calendarId: '',
          externalEventId: '',
          lastError: message,
        }),
      );
    } catch (persistError) {
      this.logger.error(
        `Could not persist calendar sync failure for absence ${input.absenceId}`,
        persistError as Error,
      );
    }
  }
}

/**
 * `Vorname Nachname krank`, plus the start time when the employee fell ill
 * mid-day. The event stays all-day regardless — the time is informational.
 */
function buildSummary(input: AbsenceCalendarSyncInput): string {
  const template = input.titleTemplate?.trim();
  const base = template
    ? renderAbsenceCalendarTitle(template, input)
    : `${input.employeeName} ${input.absenceLabel}`.trim();
  const time = formatTime(input.startTime);
  return time ? `${base} (ab ${time})` : base;
}

/** Resolves `{firstName}`, `{lastName}` and `{category}` in a title template. */
export function renderAbsenceCalendarTitle(
  template: string,
  input: Pick<AbsenceCalendarSyncInput, 'employeeName' | 'absenceLabel'>,
): string {
  const [firstName, ...rest] = input.employeeName.split(' ');
  const values: Record<string, string> = {
    firstName: firstName ?? '',
    lastName: rest.join(' '),
    category: input.absenceLabel,
  };
  return template
    .replace(
      /\{(firstName|lastName|category)\}/g,
      (_, key: string) => values[key],
    )
    .replace(/\s+/g, ' ')
    .trim();
}

function formatTime(value?: string | null): string | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})/.exec(value);
  return match ? `${match[1]}:${match[2]}` : null;
}

/** Absence dates are stored as UTC midnight — read them back in UTC. */
function toIsoDate(date: Date): string {
  return DateTime.fromJSDate(date, { zone: 'utc' }).toISODate() as string;
}
