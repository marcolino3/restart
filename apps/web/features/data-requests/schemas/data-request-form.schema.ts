import { z } from "zod";

export const DSAR_REQUEST_TYPES = [
  "ACCESS",
  "RECTIFICATION",
  "ERASURE",
  "PORTABILITY",
  "OBJECTION",
  "RESTRICTION",
] as const;

export const DSAR_SUBJECT_TYPES = [
  "STUDENT",
  "EMPLOYEE",
  "CONTACT_PERSON",
  "OTHER",
] as const;

export const DSAR_STATUSES = [
  "NEW",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED",
] as const;

export type DataSubjectRequestType = (typeof DSAR_REQUEST_TYPES)[number];
export type DataSubjectType = (typeof DSAR_SUBJECT_TYPES)[number];
export type DataSubjectRequestStatus = (typeof DSAR_STATUSES)[number];

/** Frontend validation for the "new request" form; mirrors the backend DTO. */
export const DataRequestFormSchema = z.object({
  type: z.enum(DSAR_REQUEST_TYPES),
  subjectType: z.enum(DSAR_SUBJECT_TYPES).default("OTHER"),
  subjectName: z.string().min(1).max(200),
  contactEmail: z
    .string()
    .email()
    .max(320)
    .optional()
    .or(z.literal("")),
  receivedAt: z.date().optional(),
  notes: z.string().max(2000).optional().default(""),
});

export type DataRequestFormType = z.input<typeof DataRequestFormSchema>;
export type DataRequestFormOutput = z.output<typeof DataRequestFormSchema>;
