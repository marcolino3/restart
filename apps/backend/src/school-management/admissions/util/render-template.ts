// The generic `{{placeholder}}` renderer lives in common/util so other
// features (e.g. contract templates) can share it.
export {
  renderTemplate,
  type TemplateVariables,
} from '@/common/util/render-template';

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
