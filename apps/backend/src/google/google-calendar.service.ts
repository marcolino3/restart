import { OrganizationSettingsService } from '@/organization-settings/organization-settings.service';
import { Injectable, Logger } from '@nestjs/common';
import { calendar_v3, google } from 'googleapis';
import { GOOGLE_CALENDAR_SETTING_KEYS } from './google-calendar-setting-keys';

const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar'];

/** How long a built client is reused before its org settings are re-read. */
const CLIENT_CACHE_TTL_MS = 10 * 60 * 1000;

interface CachedClient {
  calendar: calendar_v3.Calendar;
  calendarId: string;
  expiresAt: number;
}

export interface AllDayEventInput {
  organizationId: string;
  /** Existing provider event id — when set the event is patched, not created. */
  externalEventId?: string | null;
  summary: string;
  description?: string;
  /** First day covered, `YYYY-MM-DD`. */
  startDate: string;
  /** Last day covered, `YYYY-MM-DD`. Google's exclusive end is derived from it. */
  endDate: string;
}

export interface AllDayEventResult {
  externalEventId: string;
  calendarId: string;
}

/**
 * Google Calendar access scoped per organization. Credentials come from the
 * org's encrypted settings (service account + domain-wide delegation), never
 * from deployment-wide environment variables — see
 * `GOOGLE_CALENDAR_SETTING_KEYS`.
 */
@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private readonly clientCache = new Map<string, CachedClient>();

  constructor(
    private readonly organizationSettings: OrganizationSettingsService,
  ) {}

  /** True when the org has a usable service-account calendar configuration. */
  async isConfigured(organizationId: string): Promise<boolean> {
    return (await this.getClient(organizationId)) !== null;
  }

  /**
   * Create or update an all-day event. Returns `null` when the organization
   * has no calendar configured — callers treat that as "sync skipped", not as
   * an error.
   *
   * Throws when the calendar is configured but the API call fails; the caller
   * is responsible for recording the failure.
   */
  async upsertAllDayEvent(
    input: AllDayEventInput,
  ): Promise<AllDayEventResult | null> {
    const client = await this.getClient(input.organizationId);
    if (!client) return null;

    const { calendar, calendarId } = client;
    const requestBody: calendar_v3.Schema$Event = {
      summary: input.summary,
      description: input.description,
      // All-day events use date-only bounds with an EXCLUSIVE end date.
      start: { date: input.startDate },
      end: { date: exclusiveEndDate(input.endDate) },
      visibility: 'private',
    };

    if (input.externalEventId) {
      try {
        const patched = await calendar.events.patch({
          calendarId,
          eventId: input.externalEventId,
          requestBody,
        });
        return { externalEventId: patched.data.id as string, calendarId };
      } catch (error) {
        // The event was removed on the calendar side — recreate it instead of
        // failing the sync. Any other error propagates to the caller.
        if (!isGoneError(error)) throw error;
        this.logger.warn(
          `Calendar event ${input.externalEventId} is gone; recreating it.`,
        );
      }
    }

    const created = await calendar.events.insert({
      calendarId,
      requestBody,
    });
    return { externalEventId: created.data.id as string, calendarId };
  }

  /**
   * Delete an event. Missing events are treated as success. Returns `false`
   * when the org has no calendar configured.
   */
  async deleteEvent(params: {
    organizationId: string;
    externalEventId: string;
  }): Promise<boolean> {
    const client = await this.getClient(params.organizationId);
    if (!client) return false;

    try {
      await client.calendar.events.delete({
        calendarId: client.calendarId,
        eventId: params.externalEventId,
      });
    } catch (error) {
      if (!isGoneError(error)) throw error;
    }
    return true;
  }

  /**
   * Verify the stored credentials by reading the target calendar's metadata.
   * Read-only — nothing is written. Used by the org settings "test connection"
   * action.
   */
  async testConnection(
    organizationId: string,
  ): Promise<{ ok: boolean; calendarSummary?: string; error?: string }> {
    let client: CachedClient | null;
    try {
      client = await this.getClient(organizationId);
    } catch (error) {
      return { ok: false, error: toMessage(error) };
    }
    if (!client) {
      return { ok: false, error: 'CALENDAR_NOT_CONFIGURED' };
    }

    try {
      const response = await client.calendar.calendars.get({
        calendarId: client.calendarId,
      });
      return { ok: true, calendarSummary: response.data.summary ?? undefined };
    } catch (error) {
      return { ok: false, error: toMessage(error) };
    }
  }

  /** Drop the cached client so the next call re-reads the org settings. */
  invalidateCache(organizationId: string): void {
    this.clientCache.delete(organizationId);
  }

  /**
   * Build (or reuse) the org's calendar client. Returns `null` when the org
   * has not configured a service account, an impersonation user and a calendar.
   */
  private async getClient(
    organizationId: string,
  ): Promise<CachedClient | null> {
    const cached = this.clientCache.get(organizationId);
    if (cached && cached.expiresAt > Date.now()) return cached;

    const [rawServiceAccount, impersonationUser, calendarId] =
      await Promise.all([
        this.readSetting(
          organizationId,
          GOOGLE_CALENDAR_SETTING_KEYS.serviceAccountJson,
        ),
        this.readSetting(
          organizationId,
          GOOGLE_CALENDAR_SETTING_KEYS.impersonationUser,
        ),
        this.readSetting(
          organizationId,
          GOOGLE_CALENDAR_SETTING_KEYS.calendarId,
        ),
      ]);

    if (!rawServiceAccount || !impersonationUser || !calendarId) {
      this.clientCache.delete(organizationId);
      return null;
    }

    const credentials = parseServiceAccount(rawServiceAccount);

    // JWT via `google.auth` statt direkt aus `google-auth-library`: das Repo
    // hat zwei aufgeloeste Versionen (11.x direkt, 10.x unter googleapis) und
    // nur die von googleapis mitgebrachte Kopie ist zu `google.calendar()`
    // typkompatibel.
    const auth = new google.auth.JWT({
      email: credentials.clientEmail,
      key: credentials.privateKey,
      scopes: CALENDAR_SCOPES,
      subject: impersonationUser,
    });

    const entry: CachedClient = {
      calendar: google.calendar({ version: 'v3', auth }),
      calendarId,
      expiresAt: Date.now() + CLIENT_CACHE_TTL_MS,
    };
    this.clientCache.set(organizationId, entry);
    return entry;
  }

  private async readSetting(
    organizationId: string,
    key: string,
  ): Promise<string | null> {
    const value = await this.organizationSettings.getDecryptedValue(
      organizationId,
      key,
    );
    return value && value.trim() ? value.trim() : null;
  }
}

/** Google's all-day `end.date` is exclusive, so the last covered day + 1. */
function exclusiveEndDate(lastDay: string): string {
  const date = new Date(`${lastDay}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function parseServiceAccount(raw: string): {
  clientEmail: string;
  privateKey: string;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }

  const record = parsed as Record<string, unknown>;
  const clientEmail = record.client_email;
  const privateKey = record.private_key;
  if (typeof clientEmail !== 'string' || typeof privateKey !== 'string') {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON is missing client_email or private_key',
    );
  }

  return {
    clientEmail,
    // Keys pasted through form fields often carry escaped newlines.
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };
}

/** 404/410 from the Calendar API — the event no longer exists. */
function isGoneError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  const status = (error as { response?: { status?: unknown } } | null)?.response
    ?.status;
  return code === 404 || code === 410 || status === 404 || status === 410;
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
