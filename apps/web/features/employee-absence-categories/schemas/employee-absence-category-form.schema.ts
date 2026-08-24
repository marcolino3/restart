import { z } from "zod";

const localeEnum = z.enum(["DE", "FR", "IT", "EN"]);

const translationSchema = z.object({
  locale: localeEnum,
  name: z.string().trim().max(120),
  description: z.string().trim().max(2000).optional(),
});

// Coerce empty string / null inputs to null; otherwise integer.
const nullableInt = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}, z.number().int().min(1).nullable());

const requiredInt = z.preprocess(
  (v) => (typeof v === "number" ? v : Number(v)),
  z.number().int(),
);

export function createAbsenceCategoryFormSchema(messages: {
  atLeastOneNameRequired: string;
  maxDaysPerRequestNeedsRange: string;
}) {
  return z
    .object({
      translations: z
        .array(translationSchema)
        .length(4, "translations: 4 locale slots required (DE/FR/IT/EN)"),
      countsAsWorkTime: z.boolean(),
      isPaid: z.boolean(),
      affectsVacationBalance: z.boolean(),
      defaultIsVacationCapable: z.boolean(),
      reducesVacationEntitlementAfterDays: nullableInt,
      requiresCertificate: z.boolean(),
      certificateRequiredFromDay: nullableInt,
      maxDaysPerYear: nullableInt,
      allowsDateRange: z.boolean(),
      entryPrecision: z.enum(["DAY", "HALF_DAY", "TIME"]),
      syncToCalendar: z.boolean(),
      calendarTitleTemplate: z.string().trim().max(200).nullable(),
      maxDaysPerRequest: nullableInt,
      maxDaysAhead: nullableInt,
      defaultPercentage: requiredInt.pipe(z.number().int().min(1).max(100)),
      requiresApproval: z.boolean(),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, "Hex like #RRGGBB")
        .nullable(),
      iconName: z.string().trim().max(64).nullable(),
      sortOrder: requiredInt.pipe(z.number().int().min(0)),
    })
    .superRefine((data, ctx) => {
      if (!data.allowsDateRange && data.maxDaysPerRequest != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maxDaysPerRequest"],
          message: messages.maxDaysPerRequestNeedsRange,
        });
      }
      const hasAny = data.translations.some((tr) => tr.name.trim());
      if (hasAny) return;

      const firstEmptyIndex = data.translations.findIndex(
        (tr) => !tr.name.trim(),
      );
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["translations", Math.max(firstEmptyIndex, 0), "name"],
        message: messages.atLeastOneNameRequired,
      });
    });
}

export type AbsenceCategoryFormInput = z.input<
  ReturnType<typeof createAbsenceCategoryFormSchema>
>;
export type AbsenceCategoryFormValues = z.output<
  ReturnType<typeof createAbsenceCategoryFormSchema>
>;

export const ABSENCE_CALENDAR_TITLE_DEFAULT =
  "{firstName} {lastName} {category}";

export const ABSENCE_CATEGORY_FORM_DEFAULTS: AbsenceCategoryFormInput = {
  translations: [
    { locale: "DE", name: "", description: undefined },
    { locale: "FR", name: "", description: undefined },
    { locale: "IT", name: "", description: undefined },
    { locale: "EN", name: "", description: undefined },
  ],
  countsAsWorkTime: true,
  isPaid: true,
  affectsVacationBalance: false,
  defaultIsVacationCapable: true,
  reducesVacationEntitlementAfterDays: null,
  requiresCertificate: false,
  certificateRequiredFromDay: null,
  maxDaysPerYear: null,
  allowsDateRange: false,
  entryPrecision: "DAY",
  syncToCalendar: true,
  calendarTitleTemplate: null,
  maxDaysPerRequest: null,
  maxDaysAhead: null,
  defaultPercentage: 100,
  requiresApproval: false,
  color: null,
  iconName: null,
  sortOrder: 0,
};
