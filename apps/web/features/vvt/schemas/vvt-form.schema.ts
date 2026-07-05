import { z } from "zod";

export const VVT_LEGAL_BASES = [
  "CONSENT",
  "CONTRACT",
  "LEGAL_OBLIGATION",
  "VITAL_INTEREST",
  "PUBLIC_TASK",
  "LEGITIMATE_INTEREST",
] as const;

export type VvtLegalBasis = (typeof VVT_LEGAL_BASES)[number];

export const ProcessingActivityFormSchema = z.object({
  name: z.string().min(1).max(200),
  purpose: z.string().max(2000).optional().default(""),
  legalBasis: z.enum(VVT_LEGAL_BASES).default("CONSENT"),
  dataCategories: z.string().max(2000).optional().default(""),
  dataSubjects: z.string().max(2000).optional().default(""),
  recipients: z.string().max(2000).optional().default(""),
  retentionNote: z.string().max(2000).optional().default(""),
});

export type ProcessingActivityFormType = z.input<
  typeof ProcessingActivityFormSchema
>;

export const SubprocessorFormSchema = z.object({
  name: z.string().min(1).max(200),
  purpose: z.string().max(1000).optional().default(""),
  country: z.string().max(120).optional().default(""),
  dpaSigned: z.boolean().default(false),
  url: z.string().max(500).optional().default(""),
  notes: z.string().max(1000).optional().default(""),
});

export type SubprocessorFormType = z.input<typeof SubprocessorFormSchema>;
