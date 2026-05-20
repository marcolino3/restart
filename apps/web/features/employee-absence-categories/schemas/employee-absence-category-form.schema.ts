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

export const absenceCategoryFormSchema = z
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
    // DE-Name ist Pflicht; alle anderen Locales optional
    const de = data.translations.find((t) => t.locale === "DE");
    if (!de || !de.name || de.name.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["translations", 0, "name"],
        message: "german_name_required",
      });
    }
  });

export type AbsenceCategoryFormInput = z.input<typeof absenceCategoryFormSchema>;
export type AbsenceCategoryFormValues = z.output<typeof absenceCategoryFormSchema>;

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
  defaultPercentage: 100,
  requiresApproval: false,
  color: null,
  iconName: null,
  sortOrder: 0,
};
