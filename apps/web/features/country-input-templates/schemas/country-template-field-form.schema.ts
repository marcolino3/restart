import { z } from "zod";

export const CountryTemplateFieldFormSchema = z.object({
  mask: z.string().trim().min(1, "maskRequired"),
  placeholder: z.string().optional(),
  maxLength: z.string().optional(),
  regex: z.string().optional(),
  prefix: z.string().optional(),
  validatorKind: z.enum(["NONE", "IBAN_MOD97", "CH_SSN", "REGEX"]),
});

export type CountryTemplateFieldFormType = z.infer<
  typeof CountryTemplateFieldFormSchema
>;
