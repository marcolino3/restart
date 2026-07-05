import { z } from "zod";

export const CONSENT_SUBJECT_TYPES = ["STUDENT", "EMPLOYEE"] as const;
export const CONSENT_LEGAL_BASES = [
  "CONSENT",
  "CONTRACT",
  "LEGAL_OBLIGATION",
  "VITAL_INTEREST",
  "PUBLIC_TASK",
  "LEGITIMATE_INTEREST",
] as const;

export type ConsentSubjectType = (typeof CONSENT_SUBJECT_TYPES)[number];
export type ConsentLegalBasis = (typeof CONSENT_LEGAL_BASES)[number];

/**
 * Frontend validation for the org-configurable consent purpose form. Mirrors the
 * backend CreateConsentPurposeInput (class-validator) — keep the two in sync.
 */
export const ConsentPurposeFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_-]+$/, {
      message: "Nur Kleinbuchstaben, Ziffern, - oder _",
    }),
  description: z.string().max(1000).optional().default(""),
  appliesTo: z.array(z.enum(CONSENT_SUBJECT_TYPES)).min(1),
  legalBasis: z.enum(CONSENT_LEGAL_BASES).default("CONSENT"),
  requiresEvidence: z.boolean().default(false),
  isMandatory: z.boolean().default(false),
});

export type ConsentPurposeFormType = z.input<typeof ConsentPurposeFormSchema>;
export type ConsentPurposeFormOutput = z.output<typeof ConsentPurposeFormSchema>;
