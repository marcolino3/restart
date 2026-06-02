/**
 * Placeholder tokens an admission email template may reference. Must stay in
 * sync with the backend `ADMISSION_EMAIL_PLACEHOLDERS`
 * (apps/backend/src/school-management/admissions/util/render-template.ts).
 * `labelKey` resolves in the `EmailTemplates` i18n namespace.
 */
export const ADMISSION_EMAIL_PLACEHOLDERS: Array<{
  token: string;
  labelKey: string;
}> = [
  { token: "childFirstName", labelKey: "phChildFirstName" },
  { token: "childLastName", labelKey: "phChildLastName" },
  { token: "childFullName", labelKey: "phChildFullName" },
  { token: "desiredGradeLevel", labelKey: "phDesiredGradeLevel" },
  { token: "desiredSchoolClass", labelKey: "phDesiredSchoolClass" },
  { token: "desiredEnrollmentDate", labelKey: "phDesiredEnrollmentDate" },
  { token: "stageName", labelKey: "phStageName" },
  { token: "recipientName", labelKey: "phRecipientName" },
  { token: "orgName", labelKey: "phOrgName" },
  { token: "senderName", labelKey: "phSenderName" },
];
