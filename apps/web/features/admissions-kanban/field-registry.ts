/**
 * Single source of truth for the optional fields shown on Kanban admission
 * cards (configured per stage) and the columns of the admissions table
 * (configured org-globally).
 *
 * The child name + avatar are always rendered and are NOT part of these lists.
 * Keep these keys in sync with the backend whitelist in
 * `apps/backend/src/school-management/admission-stages/admission-field-keys.ts`.
 */

export const CARD_FIELD_KEYS = [
  "birthYear",
  "age",
  "gender",
  "gradeLevel",
  "source",
  "status",
  "familyName",
  "siblings",
  "contactName",
  "contactEmail",
  "contactPhone",
  "daysInStage",
  "reminders",
] as const;

export type CardFieldKey = (typeof CARD_FIELD_KEYS)[number];

export const TABLE_COLUMN_KEYS = [
  "stage",
  "gradeLevel",
  "family",
  "gender",
  "source",
  "status",
  "days",
  "contact",
  "reminders",
] as const;

export type TableColumnKey = (typeof TABLE_COLUMN_KEYS)[number];

/** Default card fields — mirrors the design-handoff card layout. */
export const DEFAULT_CARD_FIELDS: CardFieldKey[] = [
  "birthYear",
  "familyName",
  "siblings",
  "reminders",
  "daysInStage",
  "gradeLevel",
];

/** Default table columns — mirrors the historic hard-coded table layout. */
export const DEFAULT_TABLE_COLUMNS: TableColumnKey[] = [
  "stage",
  "gradeLevel",
  "family",
  "days",
  "source",
];

/** i18n label key (in the `Admissions` namespace) for each card field. */
export const CARD_FIELD_LABEL: Record<CardFieldKey, string> = {
  birthYear: "fieldBirthYear",
  age: "fieldAge",
  gender: "fieldGender",
  gradeLevel: "fieldGradeLevel",
  source: "fieldSource",
  status: "fieldStatus",
  familyName: "fieldFamilyName",
  siblings: "fieldSiblings",
  contactName: "fieldContactName",
  contactEmail: "fieldContactEmail",
  contactPhone: "fieldContactPhone",
  daysInStage: "fieldDaysInStage",
  reminders: "fieldReminders",
};

/** i18n label key (in the `Admissions` namespace) for each table column. */
export const TABLE_COLUMN_LABEL: Record<TableColumnKey, string> = {
  stage: "listColStage",
  gradeLevel: "listColGrade",
  family: "listColFamily",
  gender: "fieldGender",
  source: "listColSource",
  status: "fieldStatus",
  days: "listColDays",
  contact: "fieldContactName",
  reminders: "fieldReminders",
};

const CARD_FIELD_SET = new Set<string>(CARD_FIELD_KEYS);
const TABLE_COLUMN_SET = new Set<string>(TABLE_COLUMN_KEYS);

/**
 * Sanitises a stored card-field list: keeps only known keys, drops duplicates,
 * and falls back to the defaults when the input is null/empty.
 */
export const resolveCardFields = (
  stored: string[] | null | undefined,
): CardFieldKey[] => {
  if (!stored || stored.length === 0) return DEFAULT_CARD_FIELDS;
  const seen = new Set<string>();
  const out = stored.filter(
    (k): k is CardFieldKey =>
      CARD_FIELD_SET.has(k) && !seen.has(k) && (seen.add(k), true),
  );
  return out.length > 0 ? out : DEFAULT_CARD_FIELDS;
};

/** Same as {@link resolveCardFields} for org-global table columns. */
export const resolveTableColumns = (
  stored: string[] | null | undefined,
): TableColumnKey[] => {
  if (!stored || stored.length === 0) return DEFAULT_TABLE_COLUMNS;
  const seen = new Set<string>();
  const out = stored.filter(
    (k): k is TableColumnKey =>
      TABLE_COLUMN_SET.has(k) && !seen.has(k) && (seen.add(k), true),
  );
  return out.length > 0 ? out : DEFAULT_TABLE_COLUMNS;
};
