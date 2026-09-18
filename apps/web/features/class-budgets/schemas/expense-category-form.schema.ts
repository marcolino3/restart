import { z } from "zod";

/** Category name as the backend accepts it: trimmed, 1–120 characters. */
export const expenseCategoryNameSchema = z.string().trim().min(1).max(120);

export const expenseCategoryFormSchema = z.object({
  name: expenseCategoryNameSchema,
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable(),
});

export type ExpenseCategoryFormValues = z.infer<
  typeof expenseCategoryFormSchema
>;
