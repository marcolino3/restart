/**
 * Per-org sick-leave configuration. Values live in the encrypted
 * `organization_settings` store, keyed UPPER_SNAKE_CASE like the SMTP and
 * Google Calendar keys. No environment fallback — configuration is a tenant
 * decision, not a deployment-wide one.
 */
export const SICK_LEAVE_SETTING_KEYS = {
  /** Fixed recipient (e.g. an HR shared mailbox) notified on every report. */
  notificationEmail: 'SICK_LEAVE_NOTIFICATION_EMAIL',
  /** `'true'`/`'false'` — mirror sick leaves to the org's Google calendar. */
  calendarEnabled: 'SICK_LEAVE_CALENDAR_ENABLED',
} as const;
