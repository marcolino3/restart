import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import { GoogleCalendarService } from './google-calendar.service';
import { GOOGLE_CALENDAR_SETTING_KEYS } from './google-calendar-setting-keys';

const calendarMocks = {
  insert: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
};

/**
 * The service builds its client through `google.calendar()` / `google.auth.JWT`.
 * Both are replaced so no credential is ever parsed by the real library and no
 * network call can escape the test.
 */
jest.mock('googleapis', () => ({
  google: {
    auth: {
      JWT: jest.fn().mockImplementation((options: unknown) => ({
        __jwt: options,
      })),
    },
    calendar: jest.fn().mockImplementation(() => ({
      events: {
        insert: (...args: unknown[]) => calendarMocks.insert(...args),
        patch: (...args: unknown[]) => calendarMocks.patch(...args),
        delete: (...args: unknown[]) => calendarMocks.delete(...args),
      },
      calendars: {
        get: (...args: unknown[]) => calendarMocks.get(...args),
      },
    })),
  },
}));

const SERVICE_ACCOUNT = JSON.stringify({
  client_email: 'sa@example.iam.gserviceaccount.com',
  private_key: '-----BEGIN PRIVATE KEY-----\\nline\\n-----END PRIVATE KEY-----',
});

/** Settings for one org, keyed exactly like the production setting keys. */
const settingsFor = (calendarId: string) => ({
  [GOOGLE_CALENDAR_SETTING_KEYS.serviceAccountJson]: SERVICE_ACCOUNT,
  [GOOGLE_CALENDAR_SETTING_KEYS.impersonationUser]: 'hr@example.ch',
  [GOOGLE_CALENDAR_SETTING_KEYS.calendarId]: calendarId,
});

describe('GoogleCalendarService', () => {
  let service: GoogleCalendarService;
  let store: Record<string, Record<string, string>>;
  let organizationSettings: { getDecryptedValue: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();

    store = {
      'org-a': settingsFor('cal-a@group.calendar.google.com'),
      'org-b': settingsFor('cal-b@group.calendar.google.com'),
      'org-unconfigured': {},
    };

    organizationSettings = {
      getDecryptedValue: jest
        .fn()
        .mockImplementation((organizationId: string, key: string) =>
          Promise.resolve(store[organizationId]?.[key] ?? null),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleCalendarService,
        {
          provide: OrganizationSettingsService,
          useValue: organizationSettings,
        },
      ],
    }).compile();

    service = module.get(GoogleCalendarService);
  });

  describe('multi-tenant isolation', () => {
    it('writes each organization to its own calendar', async () => {
      calendarMocks.insert
        .mockResolvedValueOnce({ data: { id: 'event-a' } })
        .mockResolvedValueOnce({ data: { id: 'event-b' } });

      const a = await service.upsertAllDayEvent({
        organizationId: 'org-a',
        summary: 'Anna Muster krank',
        startDate: '2026-03-02',
        endDate: '2026-03-02',
      });
      const b = await service.upsertAllDayEvent({
        organizationId: 'org-b',
        summary: 'Beat Muster krank',
        startDate: '2026-03-02',
        endDate: '2026-03-02',
      });

      expect(a).toEqual({
        externalEventId: 'event-a',
        calendarId: 'cal-a@group.calendar.google.com',
      });
      expect(b).toEqual({
        externalEventId: 'event-b',
        calendarId: 'cal-b@group.calendar.google.com',
      });
      expect(calendarMocks.insert).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          calendarId: 'cal-a@group.calendar.google.com',
        }),
      );
      expect(calendarMocks.insert).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          calendarId: 'cal-b@group.calendar.google.com',
        }),
      );
    });

    it('never falls back to another organization when settings are missing', async () => {
      calendarMocks.insert.mockResolvedValue({ data: { id: 'event-a' } });
      await service.upsertAllDayEvent({
        organizationId: 'org-a',
        summary: 'Anna Muster krank',
        startDate: '2026-03-02',
        endDate: '2026-03-02',
      });
      calendarMocks.insert.mockClear();

      const result = await service.upsertAllDayEvent({
        organizationId: 'org-unconfigured',
        summary: 'Carla Muster krank',
        startDate: '2026-03-02',
        endDate: '2026-03-02',
      });

      expect(result).toBeNull();
      expect(calendarMocks.insert).not.toHaveBeenCalled();
    });
  });

  describe('upsertAllDayEvent', () => {
    it('returns null instead of throwing when the org has no calendar configured', async () => {
      await expect(
        service.upsertAllDayEvent({
          organizationId: 'org-unconfigured',
          summary: 'Carla Muster krank',
          startDate: '2026-03-02',
          endDate: '2026-03-02',
        }),
      ).resolves.toBeNull();
    });

    it('sends an exclusive end date for all-day events', async () => {
      calendarMocks.insert.mockResolvedValue({ data: { id: 'event-a' } });

      await service.upsertAllDayEvent({
        organizationId: 'org-a',
        summary: 'Anna Muster krank',
        startDate: '2026-03-02',
        endDate: '2026-03-04',
      });

      expect(calendarMocks.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            start: { date: '2026-03-02' },
            end: { date: '2026-03-05' },
            visibility: 'private',
          }),
        }),
      );
    });

    it('crosses a month boundary correctly when deriving the exclusive end', async () => {
      calendarMocks.insert.mockResolvedValue({ data: { id: 'event-a' } });

      await service.upsertAllDayEvent({
        organizationId: 'org-a',
        summary: 'Anna Muster krank',
        startDate: '2026-01-30',
        endDate: '2026-01-31',
      });

      expect(calendarMocks.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({
            end: { date: '2026-02-01' },
          }),
        }),
      );
    });

    it('patches the existing event instead of creating a second one', async () => {
      calendarMocks.patch.mockResolvedValue({ data: { id: 'event-a' } });

      const result = await service.upsertAllDayEvent({
        organizationId: 'org-a',
        externalEventId: 'event-a',
        summary: 'Anna Muster krank',
        startDate: '2026-03-02',
        endDate: '2026-03-03',
      });

      expect(result?.externalEventId).toBe('event-a');
      expect(calendarMocks.patch).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'event-a' }),
      );
      expect(calendarMocks.insert).not.toHaveBeenCalled();
    });

    it('recreates the event when it was deleted on the calendar side (404)', async () => {
      calendarMocks.patch.mockRejectedValue(
        Object.assign(new Error('Not Found'), { code: 404 }),
      );
      calendarMocks.insert.mockResolvedValue({ data: { id: 'event-new' } });

      const result = await service.upsertAllDayEvent({
        organizationId: 'org-a',
        externalEventId: 'event-gone',
        summary: 'Anna Muster krank',
        startDate: '2026-03-02',
        endDate: '2026-03-03',
      });

      expect(result?.externalEventId).toBe('event-new');
      expect(calendarMocks.insert).toHaveBeenCalledTimes(1);
    });

    it('propagates non-404 API errors to the caller', async () => {
      calendarMocks.patch.mockRejectedValue(
        Object.assign(new Error('Backend Error'), { code: 500 }),
      );

      await expect(
        service.upsertAllDayEvent({
          organizationId: 'org-a',
          externalEventId: 'event-a',
          summary: 'Anna Muster krank',
          startDate: '2026-03-02',
          endDate: '2026-03-03',
        }),
      ).rejects.toThrow('Backend Error');
      expect(calendarMocks.insert).not.toHaveBeenCalled();
    });

    it('rejects a malformed service account instead of building a client', async () => {
      store['org-a'][GOOGLE_CALENDAR_SETTING_KEYS.serviceAccountJson] =
        'not-json';

      await expect(
        service.upsertAllDayEvent({
          organizationId: 'org-a',
          summary: 'Anna Muster krank',
          startDate: '2026-03-02',
          endDate: '2026-03-02',
        }),
      ).rejects.toThrow('not valid JSON');
    });
  });

  describe('deleteEvent', () => {
    it('treats an already deleted event as success', async () => {
      calendarMocks.delete.mockRejectedValue(
        Object.assign(new Error('Gone'), { code: 410 }),
      );

      await expect(
        service.deleteEvent({
          organizationId: 'org-a',
          externalEventId: 'event-a',
        }),
      ).resolves.toBe(true);
    });

    it('returns false when the org has no calendar configured', async () => {
      await expect(
        service.deleteEvent({
          organizationId: 'org-unconfigured',
          externalEventId: 'event-a',
        }),
      ).resolves.toBe(false);
    });
  });

  describe('client cache', () => {
    it('re-reads settings after the cache is invalidated', async () => {
      calendarMocks.insert.mockResolvedValue({ data: { id: 'event-a' } });
      const event = {
        organizationId: 'org-a',
        summary: 'Anna Muster krank',
        startDate: '2026-03-02',
        endDate: '2026-03-02',
      };

      await service.upsertAllDayEvent(event);
      const callsAfterFirst =
        organizationSettings.getDecryptedValue.mock.calls.length;
      await service.upsertAllDayEvent(event);
      expect(organizationSettings.getDecryptedValue).toHaveBeenCalledTimes(
        callsAfterFirst,
      );

      service.invalidateCache('org-a');
      await service.upsertAllDayEvent(event);
      expect(
        organizationSettings.getDecryptedValue.mock.calls.length,
      ).toBeGreaterThan(callsAfterFirst);
    });
  });

  describe('testConnection', () => {
    it('reports a missing configuration without touching the API', async () => {
      const result = await service.testConnection('org-unconfigured');

      expect(result).toEqual({ ok: false, error: 'CALENDAR_NOT_CONFIGURED' });
      expect(calendarMocks.get).not.toHaveBeenCalled();
    });

    it('returns the calendar summary on success', async () => {
      calendarMocks.get.mockResolvedValue({ data: { summary: 'HR Absenzen' } });

      await expect(service.testConnection('org-a')).resolves.toEqual({
        ok: true,
        calendarSummary: 'HR Absenzen',
      });
    });

    it('reports API errors instead of throwing', async () => {
      calendarMocks.get.mockRejectedValue(new Error('insufficient permission'));

      await expect(service.testConnection('org-a')).resolves.toEqual({
        ok: false,
        error: 'insufficient permission',
      });
    });
  });
});
