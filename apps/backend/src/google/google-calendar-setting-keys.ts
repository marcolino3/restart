/**
 * Per-org Google Workspace calendar configuration. Values live in the
 * encrypted `organization_settings` store (AES-256-GCM), keyed
 * UPPER_SNAKE_CASE like the SMTP keys.
 *
 * Unlike SMTP there is deliberately NO environment fallback: a deployment-wide
 * service account would let every organization write into the same calendar
 * and break tenant isolation. An org without these settings simply gets no
 * calendar sync.
 */
export const GOOGLE_CALENDAR_SETTING_KEYS = {
  /** Full service-account key JSON (contains `client_email` + `private_key`). */
  serviceAccountJson: 'GOOGLE_SERVICE_ACCOUNT_JSON',
  /** Domain-wide-delegation subject to impersonate, e.g. `hr@school.ch`. */
  impersonationUser: 'GOOGLE_IMPERSONATION_USER',
  /** Target calendar id events are written to. */
  calendarId: 'GOOGLE_CALENDAR_ID',
} as const;
