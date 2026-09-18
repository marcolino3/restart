import type { ClassExpenseFormValues } from "../schemas/class-expense-form.schema";
import type { ExpenseReceiptSuggestion } from "../types";

export type SuggestedField = keyof Pick<
  ClassExpenseFormValues,
  | "vendor"
  | "invoiceNumber"
  | "expenseDate"
  | "amount"
  | "description"
  | "categoryId"
>;

/**
 * Form values an AI suggestion would set. Only fields the AI actually read
 * are returned, so an empty suggestion never wipes what the teacher typed.
 * A suggested category is only taken when it is selectable in the form, and
 * a date only when it is not in the future (the date picker forbids those).
 */
export const receiptSuggestionPatch = (
  suggestion: ExpenseReceiptSuggestion,
  selectableCategoryIds: string[],
  today: string,
): Partial<Pick<ClassExpenseFormValues, SuggestedField>> => {
  const patch: Partial<Pick<ClassExpenseFormValues, SuggestedField>> = {};
  if (suggestion.vendor) patch.vendor = suggestion.vendor;
  if (suggestion.invoiceNumber) patch.invoiceNumber = suggestion.invoiceNumber;
  if (suggestion.description) patch.description = suggestion.description;
  if (suggestion.amount !== null && suggestion.amount > 0) {
    patch.amount = suggestion.amount;
  }
  if (suggestion.expenseDate && suggestion.expenseDate <= today) {
    patch.expenseDate = suggestion.expenseDate;
  }
  if (
    suggestion.suggestedCategoryId &&
    selectableCategoryIds.includes(suggestion.suggestedCategoryId)
  ) {
    patch.categoryId = suggestion.suggestedCategoryId;
  }
  return patch;
};
