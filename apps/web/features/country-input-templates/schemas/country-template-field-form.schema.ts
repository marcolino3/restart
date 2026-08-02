import { z } from "zod";

const validatorKindSchema = z.enum(["NONE", "IBAN_MOD97", "CH_SSN", "REGEX"]);

export const CountryTemplateFieldFormSchema = z.object({
  mask: z.string().trim().min(1, "maskRequired"),
  placeholder: z.string().optional(),
  maxLength: z.string().optional(),
  regex: z.string().optional(),
  prefix: z.string().optional(),
  validatorKind: validatorKindSchema,
});

export type CountryTemplateFieldFormType = z.infer<
  typeof CountryTemplateFieldFormSchema
>;

const CountryTemplateFieldSectionSchema = z.object({
  mask: z.string().trim(),
  placeholder: z.string().optional(),
  maxLength: z.string().optional(),
  regex: z.string().optional(),
  prefix: z.string().optional(),
  validatorKind: validatorKindSchema,
});

export const CountryTemplateFormSchema = z.object({
  PHONE: CountryTemplateFieldSectionSchema,
  SSN: CountryTemplateFieldSectionSchema,
  POSTAL_CODE: CountryTemplateFieldSectionSchema,
});

export type CountryTemplateFormType = z.infer<typeof CountryTemplateFormSchema>;
