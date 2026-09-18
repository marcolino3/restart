export type ExpenseCategory = {
  id: string;
  name: string;
  color: string | null;
  position: number;
  isArchived: boolean;
};

export type BudgetSchoolYear = {
  start: string;
  end: string;
  startYear: number;
  label: string;
};

export type ClassBudget = {
  id: string;
  schoolClassId: string;
  schoolYearStart: number;
  amount: number;
  currency: string;
  note: string | null;
};

export type ClassExpense = {
  id: string;
  schoolClassId: string;
  schoolClass: { id: string; name: string } | null;
  categoryId: string;
  category: Pick<ExpenseCategory, "id" | "name" | "color"> | null;
  expenseDate: string;
  amount: number;
  currency: string;
  vendor: string | null;
  invoiceNumber: string | null;
  description: string | null;
  receiptFileId: string | null;
  createdByMembershipId: string | null;
  canModify: boolean;
};

export type ClassBudgetSummary = {
  schoolClassId: string;
  schoolYear: BudgetSchoolYear;
  budget: number | null;
  spent: number;
  remaining: number;
  isOverBudget: boolean;
  currency: string;
  /** Expenses booked in the school year. */
  expenseCount: number;
  /** Children enrolled in the class, basis for the per-child figures. */
  studentCount: number;
  byCategory: {
    category: Pick<ExpenseCategory, "id" | "name" | "color">;
    total: number;
  }[];
};

/** What the AI read from a receipt — a proposal, never saved by itself. */
export type ExpenseReceiptSuggestion = {
  vendor: string | null;
  invoiceNumber: string | null;
  expenseDate: string | null;
  amount: number | null;
  currency: string | null;
  description: string | null;
  suggestedCategoryId: string | null;
  confidence: number | null;
};

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
