/**
 * Resolves `{{placeholder}}` tokens in a template string against a variable map.
 *
 * - Matching is case-insensitive and tolerant of surrounding whitespace
 *   (`{{ childFirstName }}` === `{{childfirstname}}`).
 * - Known variables that resolve to `null`/`undefined` and unknown tokens are
 *   replaced with an empty string, so no raw `{{token}}` ever leaks into a
 *   rendered email.
 */
export type TemplateVariables = Record<string, string | null | undefined>;

const PLACEHOLDER_RE = /\{\{\s*([\w.]+)\s*\}\}/g;

export function renderTemplate(
  template: string,
  variables: TemplateVariables,
): string {
  if (!template) return template;

  // Lower-cased lookup so the token casing in the template does not matter.
  const lookup = new Map<string, string>();
  for (const [key, value] of Object.entries(variables)) {
    lookup.set(key.toLowerCase(), value ?? '');
  }

  return template.replace(PLACEHOLDER_RE, (_match, rawKey: string) => {
    return lookup.get(rawKey.toLowerCase()) ?? '';
  });
}

/**
 * The placeholder keys an admission email template may reference. Surfaced to
 * the UI so editors can insert tokens, and used to build the variable map.
 */
export const ADMISSION_EMAIL_PLACEHOLDERS = [
  'childFirstName',
  'childLastName',
  'childFullName',
  'desiredGradeLevel',
  'desiredSchoolClass',
  'desiredEnrollmentDate',
  'stageName',
  'recipientName',
  'orgName',
  'senderName',
] as const;

export type AdmissionEmailPlaceholder =
  (typeof ADMISSION_EMAIL_PLACEHOLDERS)[number];
