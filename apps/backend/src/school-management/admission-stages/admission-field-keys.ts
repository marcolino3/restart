/**
 * Canonical set of optional fields that can be shown on a Kanban admission card
 * (per stage) and as columns in the admissions table (org-global).
 *
 * These keys are the single source of truth shared between backend validation
 * and the frontend renderer. Child name + avatar are always shown and are NOT
 * part of this list. Keep these in sync with the frontend registry in
 * `apps/web/features/admissions-kanban/field-registry.ts`.
 */
export const ADMISSION_CARD_FIELD_KEYS = [
  'birthYear',
  'age',
  'gender',
  'gradeLevel',
  'source',
  'status',
  'familyName',
  'siblings',
  'contactName',
  'contactEmail',
  'contactPhone',
  'daysInStage',
  'reminders',
] as const;

export type AdmissionCardFieldKey = (typeof ADMISSION_CARD_FIELD_KEYS)[number];

export const ADMISSION_TABLE_COLUMN_KEYS = [
  'stage',
  'gradeLevel',
  'family',
  'gender',
  'source',
  'status',
  'days',
  'contact',
  'reminders',
] as const;

export type AdmissionTableColumnKey =
  (typeof ADMISSION_TABLE_COLUMN_KEYS)[number];
