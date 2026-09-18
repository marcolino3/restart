import { z } from "zod";

export const EXPENSE_MAX_AMOUNT = 9_999_999_999.99;

/** True when the number has no more than two decimal places (no float drift). */
export const hasAtMostTwoDecimals = (value: number): boolean =>
  Number.isFinite(value) && Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

type Translate = (key: string) => string;

/**
 * Create and update share this schema on purpose — the dialog is the same in
 * both modes, and the backend applies the same rules to both inputs.
 */
export const createClassExpenseFormSchema = (t: Translate) =>
  z.object({
    schoolClassId: z.string().min(1, { message: t("validation.required") }),
    categoryId: z.string().min(1, { message: t("validation.required") }),
    expenseDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: t("validation.required") }),
    amount: z
      .number({ message: t("validation.amount") })
      .min(0.01, { message: t("validation.amount") })
      .max(EXPENSE_MAX_AMOUNT, { message: t("validation.amount") })
      .refine(hasAtMostTwoDecimals, { message: t("validation.decimals") }),
    vendor: z.string().max(200, { message: t("validation.tooLong") }),
    invoiceNumber: z.string().max(100, { message: t("validation.tooLong") }),
    description: z.string().max(2000, { message: t("validation.tooLong") }),
    receiptFileId: z.string().nullable(),
  });

export type ClassExpenseFormValues = z.infer<
  ReturnType<typeof createClassExpenseFormSchema>
>;

const blankToNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

/** Maps form values to the GraphQL input; blank optional text becomes null. */
export const toClassExpenseInput = (values: ClassExpenseFormValues) => ({
  schoolClassId: values.schoolClassId,
  categoryId: values.categoryId,
  expenseDate: values.expenseDate,
  amount: values.amount,
  vendor: blankToNull(values.vendor),
  invoiceNumber: blankToNull(values.invoiceNumber),
  description: blankToNull(values.description),
  receiptFileId: values.receiptFileId,
});
