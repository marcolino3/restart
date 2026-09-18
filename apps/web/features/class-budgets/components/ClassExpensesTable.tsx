"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, FileText, Pencil, Trash2 } from "lucide-react";

import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { TableCard } from "@/components/common/TableCard";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { deleteClassExpenseAction } from "../actions/class-expenses-actions";
import { formatMoney } from "../lib/format-money";
import { receiptUrl } from "../lib/receipts";
import type { ClassExpense } from "../types";

const ICON_BUTTON = "size-[30px] rounded-[8px] text-muted-foreground";
const PILL =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold";

interface Props {
  expenses: ClassExpense[];
  /** Shown instead of the table when there is nothing to list. */
  empty: ReactNode;
  onEdit: (expense: ClassExpense) => void;
  onDeleted: () => void;
}

export function ClassExpensesTable({
  expenses,
  empty,
  onEdit,
  onDeleted,
}: Props) {
  const t = useTranslations("ClassBudgets");
  const locale = useLocale();
  const [newestFirst, setNewestFirst] = useState(true);
  const formatDate = (isoDate: string) =>
    new Intl.DateTimeFormat(locale === "de" ? "de-CH" : "en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(`${isoDate}T12:00:00`));

  if (expenses.length === 0) {
    return (
      <TableCard className="flex flex-col items-center gap-4 px-6 py-12 text-center text-sm text-muted-foreground">
        {empty}
      </TableCard>
    );
  }

  const sorted = [...expenses].sort((a, b) =>
    newestFirst
      ? b.expenseDate.localeCompare(a.expenseDate)
      : a.expenseDate.localeCompare(b.expenseDate),
  );
  // Summed in cents so the footer never shows a float artefact.
  const totalCents = expenses.reduce(
    (sum, expense) => sum + Math.round(expense.amount * 100),
    0,
  );
  const SortIcon = newestFirst ? ArrowDown : ArrowUp;

  return (
    <TableCard className="overflow-x-auto">
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow>
            <TableHead
              aria-sort={newestFirst ? "descending" : "ascending"}
            >
              <button
                type="button"
                className="inline-flex items-center gap-1 hover:text-foreground"
                onClick={() => setNewestFirst((value) => !value)}
              >
                {t("expenseDate")}
                <SortIcon className="size-3" aria-hidden />
              </button>
            </TableHead>
            <TableHead>{t("category")}</TableHead>
            <TableHead>{t("vendorAndInvoice")}</TableHead>
            <TableHead>{t("description")}</TableHead>
            <TableHead className="text-right">{t("amount")}</TableHead>
            <TableHead>{t("receipt")}</TableHead>
            <TableHead className="w-[84px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((expense) => (
            <TableRow
              key={expense.id}
              className={cn(
                "hover:bg-row-hover",
                expense.canModify && "cursor-pointer",
              )}
              onClick={expense.canModify ? () => onEdit(expense) : undefined}
            >
              <TableCell className="whitespace-nowrap font-mono text-[12.5px] tabular-nums">
                {formatDate(expense.expenseDate)}
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span
                    className="size-2 shrink-0 rounded-full bg-status-slate-foreground"
                    style={
                      expense.category?.color
                        ? { backgroundColor: expense.category.color }
                        : undefined
                    }
                  />
                  {expense.category?.name ?? "—"}
                </span>
              </TableCell>
              <TableCell>
                <span className="font-semibold">{expense.vendor ?? "—"}</span>
                {expense.invoiceNumber && (
                  <span className="block font-mono text-[11.5px] text-muted-foreground">
                    {expense.invoiceNumber}
                  </span>
                )}
              </TableCell>
              <TableCell className="min-w-[160px]">
                {expense.description ?? "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right font-mono tabular-nums">
                {formatMoney(expense.amount, expense.currency, locale)}
              </TableCell>
              <TableCell onClick={(event) => event.stopPropagation()}>
                {expense.receiptFileId ? (
                  <a
                    href={receiptUrl(
                      expense.schoolClassId,
                      expense.receiptFileId,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t("receiptView")}
                    title={t("receiptView")}
                    className={cn(
                      PILL,
                      "bg-accent text-accent-foreground hover:underline",
                    )}
                  >
                    <FileText className="size-3" aria-hidden />
                    {t("receiptAttached")}
                  </a>
                ) : (
                  <span className={cn(PILL, "bg-field text-muted-foreground")}>
                    {t("receiptMissing")}
                  </span>
                )}
              </TableCell>
              <TableCell onClick={(event) => event.stopPropagation()}>
                {expense.canModify && (
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className={ICON_BUTTON}
                      onClick={() => onEdit(expense)}
                      aria-label={t("editExpense")}
                      title={t("editExpense")}
                    >
                      <Pencil className="size-3.5" />
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
                          className={cn(
                            ICON_BUTTON,
                            "hover:bg-status-rose hover:text-status-rose-foreground",
                          )}
                          aria-label={t("deleteExpense")}
                          title={t("deleteExpense")}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      }
                    />
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter className="bg-row-hover">
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={4} className="font-semibold">
              {t("total")}
            </TableCell>
            <TableCell
              className="whitespace-nowrap text-right font-mono font-bold tabular-nums"
              data-testid="expenses-total"
            >
              {formatMoney(totalCents / 100, expenses[0].currency, locale)}
            </TableCell>
            <TableCell colSpan={2} />
          </TableRow>
        </TableFooter>
      </Table>
    </TableCard>
  );
}
