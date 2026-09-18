"use client";

import { useLocale, useTranslations } from "next-intl";
import { FileText, Pencil, Trash2 } from "lucide-react";

import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { deleteClassExpenseAction } from "../actions/class-expenses-actions";
import { formatMoney } from "../lib/format-money";
import { receiptUrl } from "../lib/receipts";
import type { ClassExpense } from "../types";

interface Props {
  expenses: ClassExpense[];
  onEdit: (expense: ClassExpense) => void;
  onDeleted: () => void;
}

export function ClassExpensesTable({ expenses, onEdit, onDeleted }: Props) {
  const t = useTranslations("ClassBudgets");
  const locale = useLocale();
  const formatDate = (isoDate: string) =>
    new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
      dateStyle: "medium",
    }).format(new Date(`${isoDate}T12:00:00`));

  if (expenses.length === 0) {
    return (
      <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        {t("noExpenses")}
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("expenseDate")}</TableHead>
            <TableHead>{t("category")}</TableHead>
            <TableHead>{t("vendor")}</TableHead>
            <TableHead>{t("description")}</TableHead>
            <TableHead className="text-right">{t("amount")}</TableHead>
            <TableHead className="w-[120px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="whitespace-nowrap">
                {formatDate(expense.expenseDate)}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2">
                  {expense.category?.color && (
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: expense.category.color }}
                    />
                  )}
                  {expense.category?.name ?? "—"}
                </span>
              </TableCell>
              <TableCell>
                {expense.vendor ?? "—"}
                {expense.invoiceNumber && (
                  <span className="block text-xs text-muted-foreground">
                    {expense.invoiceNumber}
                  </span>
                )}
              </TableCell>
              <TableCell className="max-w-[280px] truncate">
                {expense.description ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums">
                {formatMoney(expense.amount, expense.currency, locale)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  {expense.receiptFileId && (
                    <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                      <a
                        href={receiptUrl(
                          expense.schoolClassId,
                          expense.receiptFileId,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t("receiptView")}
                        title={t("receiptView")}
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  {expense.canModify && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onEdit(expense)}
                        aria-label={t("editExpense")}
                        title={t("editExpense")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <DeleteConfirmationDialog
                        itemName={
                          expense.vendor ??
                          formatMoney(expense.amount, expense.currency, locale)
                        }
                        onConfirm={() => deleteClassExpenseAction(expense.id)}
                        onSuccess={onDeleted}
                        trigger={
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            aria-label={t("deleteExpense")}
                            title={t("deleteExpense")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        }
                      />
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
