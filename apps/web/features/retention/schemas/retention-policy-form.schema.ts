import { z } from "zod";

export const RETENTION_ENTITY_TYPES = [
  "STUDENT",
  "EMPLOYEE",
  "CONTACT_PERSON",
  "ADMISSION_APPLICATION",
  "DATA_SUBJECT_REQUEST",
] as const;

export const RETENTION_ACTIONS = ["ANONYMIZE", "DELETE"] as const;

export type RetentionEntityType = (typeof RETENTION_ENTITY_TYPES)[number];
export type RetentionAction = (typeof RETENTION_ACTIONS)[number];

/** Form fields for one policy; the entityType is fixed by the row being edited. */
export const RetentionPolicyFormSchema = z.object({
  retentionMonths: z.number().int().min(1).max(1200),
  action: z.enum(RETENTION_ACTIONS).default("ANONYMIZE"),
  description: z.string().max(1000).optional().default(""),
  isEnabled: z.boolean().default(true),
});

export type RetentionPolicyFormType = z.input<
  typeof RetentionPolicyFormSchema
>;
export type RetentionPolicyFormOutput = z.output<
  typeof RetentionPolicyFormSchema
>;
