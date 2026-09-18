"use client";

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy } from "lucide-react";

import { TableCard } from "@/components/common/TableCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  copyClassBudgetsFromPreviousYearAction,
  upsertClassBudgetAction,
} from "../actions/class-budgets-actions";
import { formatMoney } from "../lib/format-money";
import { parseBudgetAmount } from "../schemas/class-budget-form.schema";

export type AdminBudgetRow = {
  schoolClassId: string;
  schoolClassName: string;
  budget: number | null;
  spent: number;
  currency: string;
};

interface Props {
  rows: AdminBudgetRow[];
  yearOptions: { startYear: number; label: string }[];
  selectedStartYear: number;
  /** Evaluation of the selected year, shown between year choice and table. */
  evaluation?: ReactNode;
}

export function AdminClassBudgetsTable({
  rows,
  yearOptions,
  selectedStartYear,
  evaluation,
}: Props) {
  const t = useTranslations("ClassBudgets");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [copying, setCopying] = useState(false);

  const currency = rows[0]?.currency ?? "CHF";
  const totalBudget = rows.reduce((sum, row) => sum + (row.budget ?? 0), 0);
  const totalSpent = rows.reduce((sum, row) => sum + row.spent, 0);

  const onCopy = async () => {
    setCopying(true);
    const result = await copyClassBudgetsFromPreviousYearAction(
      selectedStartYear,
    );
    setCopying(false);
    if (result.success) {
      toast.success(t("budgetsCopied", { count: result.data.length }));
      router.refresh();
    } else {
      toast.error(t("budgetSaveError"), { description: result.error });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={String(selectedStartYear)}
          onValueChange={(value) => router.push(`${pathname}?year=${value}`)}
        >
          <SelectTrigger className="w-[160px]" aria-label={t("schoolYear")}>
            <SelectValue placeholder={t("schoolYear")} />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map((year) => (
              <SelectItem key={year.startYear} value={String(year.startYear)}>
                {year.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="ml-auto"
          onClick={onCopy}
          disabled={copying}
        >
          <Copy className="mr-1 h-4 w-4" />
          {t("copyFromPreviousYear")}
        </Button>
      </div>
      {evaluation}
      <p className="text-sm text-muted-foreground">{t("copyHint")}</p>

      <TableCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("schoolClass")}</TableHead>
              <TableHead className="w-[200px]">{t("budget")}</TableHead>
              <TableHead className="text-right">{t("spent")}</TableHead>
              <TableHead className="text-right">{t("remaining")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <BudgetRow
                // Remount when the stored value changes (copy, other year).
                key={`${row.schoolClassId}-${selectedStartYear}-${row.budget}`}
                row={row}
                schoolYearStart={selectedStartYear}
              />
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>{t("total")}</TableCell>
              <TableCell className="tabular-nums">
                {formatMoney(totalBudget, currency, locale)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(totalSpent, currency, locale)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatMoney(totalBudget - totalSpent, currency, locale)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableCard>
    </div>
  );
}

function BudgetRow({
  row,
  schoolYearStart,
}: {
  row: AdminBudgetRow;
  schoolYearStart: number;
}) {
  const t = useTranslations("ClassBudgets");
  const locale = useLocale();
  const router = useRouter();
  const [value, setValue] = useState(
    row.budget === null ? "" : row.budget.toFixed(2),
  );
  const [saving, setSaving] = useState(false);

  const remaining = row.budget === null ? null : row.budget - row.spent;

  const onSave = async () => {
    if (value.trim() === "" && row.budget === null) return;
    const amount = parseBudgetAmount(value);
    if (amount === null) {
      toast.error(t("validation.amount"));
      return;
    }
    if (amount === row.budget) return;
    setSaving(true);
    const result = await upsertClassBudgetAction({
      schoolClassId: row.schoolClassId,
      schoolYearStart,
      amount,
    });
    setSaving(false);
    if (result.success) {
      toast.success(t("budgetSaved"));
      router.refresh();
    } else {
      toast.error(t("budgetSaveError"), { description: result.error });
    }
  };

  return (
    <TableRow>
      <TableCell>{row.schoolClassName}</TableCell>
      <TableCell>
        <Input
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          disabled={saving}
          placeholder="0.00"
          aria-label={t("budgetFor", { name: row.schoolClassName })}
          className="h-8 tabular-nums"
        />
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatMoney(row.spent, row.currency, locale)}
      </TableCell>
      <TableCell
        className={
          remaining !== null && remaining < 0
            ? "text-right tabular-nums text-destructive"
            : "text-right tabular-nums"
        }
      >
        {remaining === null ? "—" : formatMoney(remaining, row.currency, locale)}
      </TableCell>
    </TableRow>
  );
}
