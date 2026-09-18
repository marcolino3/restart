import type { ClassExpense } from "../types";

export type ExpenseCsvHeaders = Record<
  "expenseDate" | "category" | "vendor" | "invoiceNumber" | "description" | "amount" | "currency",
  string
>;

// A cell that starts with one of these is run as a formula by spreadsheets.
const FORMULA_START = /^[=+\-@\t\r]/;

const BOM = String.fromCharCode(0xfeff);

const cell = (value: string | number | null): string => {
  const text = value === null ? "" : String(value);
  // Numbers stay numbers: a negative amount is not a formula.
  const safe =
    typeof value === "string" && FORMULA_START.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
};

/**
 * The visible expenses as CSV. Semicolon-separated with a BOM, which is what
 * Excel with Swiss regional settings opens without an import dialog.
 */
export const expensesToCsv = (
  expenses: ClassExpense[],
  headers: ExpenseCsvHeaders,
): string => {
  const lines = [
    [
      headers.expenseDate,
      headers.category,
      headers.vendor,
      headers.invoiceNumber,
      headers.description,
      headers.amount,
      headers.currency,
    ],
    ...expenses.map((expense) => [
      expense.expenseDate,
      expense.category?.name ?? null,
      expense.vendor,
      expense.invoiceNumber,
      expense.description,
      expense.amount,
      expense.currency,
    ]),
  ];
  return `${BOM}${lines.map((line) => line.map(cell).join(";")).join("\r\n")}\r\n`;
};

/** Search over the free-text columns; an empty query keeps everything. */
export const filterExpenses = (
  expenses: ClassExpense[],
  query: string,
): ClassExpense[] => {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return expenses;
  return expenses.filter((expense) =>
    [expense.vendor, expense.description, expense.invoiceNumber].some((text) =>
      text?.toLocaleLowerCase().includes(needle),
    ),
  );
};
