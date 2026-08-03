import { z } from "zod";

const localeEnum = z.enum(["DE", "FR", "IT", "EN"]);

const translationSchema = z.object({
  locale: localeEnum,
  name: z.string().trim().max(200),
});

export function createEmployeeFunctionFormSchema(messages: {
  atLeastOneNameRequired: string;
}) {
  return z
    .object({
      translations: z
        .array(translationSchema)
        .length(4, "translations: 4 locale slots required (DE/FR/IT/EN)"),
    })
    .superRefine((data, ctx) => {
      const hasAny = data.translations.some((tr) => tr.name.trim());
      if (hasAny) return;

      const firstEmptyIndex = data.translations.findIndex((tr) => !tr.name.trim());
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["translations", Math.max(firstEmptyIndex, 0), "name"],
        message: messages.atLeastOneNameRequired,
      });
    });
}

export type EmployeeFunctionFormInput = z.input<
  ReturnType<typeof createEmployeeFunctionFormSchema>
>;
export type EmployeeFunctionFormValues = z.output<
  ReturnType<typeof createEmployeeFunctionFormSchema>
>;

export const EMPLOYEE_FUNCTION_FORM_DEFAULTS: EmployeeFunctionFormInput = {
  translations: [
    { locale: "DE", name: "" },
    { locale: "FR", name: "" },
    { locale: "IT", name: "" },
    { locale: "EN", name: "" },
  ],
};
