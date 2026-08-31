import { GoogleCalendarService } from '@/google/google-calendar.service';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { AbsenceCalendarSyncService } from './absence-calendar-sync.service';
import { AbsenceCalendarSync } from './entities/absence-calendar-sync.entity';
import { CalendarProvider } from './entities/calendar-provider.enum';

const ORG_ID = 'org-1';
const ABSENCE_ID = 'absence-1';

const syncInput = (overrides: Record<string, unknown> = {}) => ({
  organizationId: ORG_ID,
  absenceId: ABSENCE_ID,
  employeeName: 'Anna Muster',
  absenceLabel: 'krank',
  startDate: new Date(Date.UTC(2026, 2, 2)),
  endDate: new Date(Date.UTC(2026, 2, 3)),
  ...overrides,
});

describe('AbsenceCalendarSyncService', () => {
  let service: AbsenceCalendarSyncService;
  let entityManager: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let googleCalendar: {
    upsertAllDayEvent: jest.Mock;
    deleteEvent: jest.Mock;
  };

  beforeEach(async () => {
    // The service logs every swallowed failure — silenced so a passing run
    // does not print stack traces.
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    entityManager = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation((_entity, data) => data),
      save: jest.fn().mockImplementation((_entity, data) => data ?? _entity),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    googleCalendar = {
      upsertAllDayEvent: jest.fn().mockResolvedValue({
        externalEventId: 'event-1',
        calendarId: 'cal-1',
      }),
      deleteEvent: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AbsenceCalendarSyncService,
        { provide: EntityManager, useValue: entityManager },
        { provide: GoogleCalendarService, useValue: googleCalendar },
      ],
    }).compile();

    service = module.get(AbsenceCalendarSyncService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('sync', () => {
    it('creates an event and records the sync row when none exists yet', async () => {
      await service.sync(syncInput());

      expect(googleCalendar.upsertAllDayEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: ORG_ID,
          externalEventId: undefined,
          summary: 'Anna Muster krank',
          startDate: '2026-03-02',
          endDate: '2026-03-03',
        }),
      );
      expect(entityManager.save).toHaveBeenCalledWith(
        AbsenceCalendarSync,
        expect.objectContaining({
          organizationId: ORG_ID,
          absenceId: ABSENCE_ID,
          provider: CalendarProvider.GOOGLE,
          calendarId: 'cal-1',
          externalEventId: 'event-1',
          lastError: null,
        }),
      );
    });

    it('patches the known event instead of creating a duplicate', async () => {
      entityManager.findOne.mockResolvedValue({
        id: 'sync-1',
        version: 3,
        externalEventId: 'event-existing',
      });

      await service.sync(syncInput());

      expect(googleCalendar.upsertAllDayEvent).toHaveBeenCalledWith(
        expect.objectContaining({ externalEventId: 'event-existing' }),
      );
      // Same row is updated: id and version are carried over so the optimistic
      // lock applies instead of inserting a second sync record.
      expect(entityManager.save).toHaveBeenCalledWith(
        AbsenceCalendarSync,
        expect.objectContaining({ id: 'sync-1', version: 3 }),
      );
    });

    it('looks the sync row up scoped to organization, absence and provider', async () => {
      await service.sync(syncInput());

      expect(entityManager.findOne).toHaveBeenCalledWith(AbsenceCalendarSync, {
        where: {
          organizationId: ORG_ID,
          absenceId: ABSENCE_ID,
          provider: CalendarProvider.GOOGLE,
        },
      });
    });

    it('appends the start time to the summary but keeps the event all-day', async () => {
      await service.sync(syncInput({ startTime: '13:00:00' }));

      expect(googleCalendar.upsertAllDayEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: 'Anna Muster krank (ab 13:00)',
          startDate: '2026-03-02',
          endDate: '2026-03-03',
        }),
      );
    });

    it('renders the title template with employee name and category', async () => {
      await service.sync(
        syncInput({ titleTemplate: '{lastName} {firstName} – {category}' }),
      );

      expect(googleCalendar.upsertAllDayEvent).toHaveBeenCalledWith(
        expect.objectContaining({ summary: 'Muster Anna – krank' }),
      );
    });

    it('falls back to the default summary for a blank template', async () => {
      await service.sync(syncInput({ titleTemplate: '   ' }));

      expect(googleCalendar.upsertAllDayEvent).toHaveBeenCalledWith(
        expect.objectContaining({ summary: 'Anna Muster krank' }),
      );
    });

    it('writes no sync row when the organization has no calendar configured', async () => {
      googleCalendar.upsertAllDayEvent.mockResolvedValue(null);

      await service.sync(syncInput());

      expect(entityManager.save).not.toHaveBeenCalled();
    });

    it('records the transport failure and never throws', async () => {
      googleCalendar.upsertAllDayEvent.mockRejectedValue(
        new Error('ECONNRESET'),
      );

      await expect(service.sync(syncInput())).resolves.toBeUndefined();

      expect(entityManager.save).toHaveBeenCalledWith(
        AbsenceCalendarSync,
        expect.objectContaining({
          organizationId: ORG_ID,
          absenceId: ABSENCE_ID,
          lastError: 'ECONNRESET',
        }),
      );
    });

    it('records the failure on the existing row when one is present', async () => {
      const existing = {
        id: 'sync-1',
        externalEventId: 'event-existing',
        lastError: null as string | null,
      };
      entityManager.findOne.mockResolvedValue(existing);
      googleCalendar.upsertAllDayEvent.mockRejectedValue(new Error('403'));

      await service.sync(syncInput());

      expect(existing.lastError).toBe('403');
      expect(entityManager.save).toHaveBeenCalledWith(existing);
    });

    it('stays silent when even persisting the failure fails', async () => {
      googleCalendar.upsertAllDayEvent.mockRejectedValue(new Error('boom'));
      entityManager.save.mockRejectedValue(new Error('db down'));

      await expect(service.sync(syncInput())).resolves.toBeUndefined();
    });

    it('does not throw when the sync row lookup itself fails', async () => {
      entityManager.findOne.mockRejectedValue(new Error('db down'));

      await expect(service.sync(syncInput())).resolves.toBeUndefined();
      expect(googleCalendar.upsertAllDayEvent).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the event and its sync row', async () => {
      entityManager.findOne.mockResolvedValue({
        id: 'sync-1',
        externalEventId: 'event-1',
      });

      await service.remove(ORG_ID, ABSENCE_ID);

      expect(googleCalendar.deleteEvent).toHaveBeenCalledWith({
        organizationId: ORG_ID,
        externalEventId: 'event-1',
      });
      expect(entityManager.delete).toHaveBeenCalledWith(AbsenceCalendarSync, {
        id: 'sync-1',
      });
    });

    it('does nothing when no sync row exists', async () => {
      await service.remove(ORG_ID, ABSENCE_ID);

      expect(googleCalendar.deleteEvent).not.toHaveBeenCalled();
      expect(entityManager.delete).not.toHaveBeenCalled();
    });

    it('keeps the row with an error note when deletion fails', async () => {
      const existing = {
        id: 'sync-1',
        externalEventId: 'event-1',
        lastError: null as string | null,
      };
      entityManager.findOne.mockResolvedValue(existing);
      googleCalendar.deleteEvent.mockRejectedValue(new Error('403'));

      await expect(service.remove(ORG_ID, ABSENCE_ID)).resolves.toBeUndefined();

      expect(existing.lastError).toBe('403');
      expect(entityManager.delete).not.toHaveBeenCalled();
    });
  });
});
