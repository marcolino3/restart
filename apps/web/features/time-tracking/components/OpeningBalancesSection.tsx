"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { useSheet } from "@/components/providers/sheet-provider";
import { formatDurationMinutes } from "@/lib/formatting/duration";
import { OpeningBalanceForm } from "./OpeningBalanceForm";
import {
  deleteEmployeePeriodOpeningBalanceAction,
  getEmployeePeriodOpeningBalancesAction,
  type OpeningBalanceEntry,
} from "../actions/opening-balances.action";
import type { TimeTrackingPeriodItem } from "../actions/periods.action";
import type { EmployeeOption } from "../types";

interface Props {
  employees: EmployeeOption[];
  periods: TimeTrackingPeriodItem[];
}

export const OpeningBalancesSection = ({ employees, periods }: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const { open } = useSheet();

  const [employeeId, setEmployeeId] = useState<string>("");
  const [balances, setBalances] = useState<OpeningBalanceEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const periodLabel = (periodId: string) =>
    periods.find((p) => p.id === periodId)?.label ?? periodId;

  const load = useCallback(async (empId: string) => {
    setLoading(true);
    const r = await getEmployeePeriodOpeningBalancesAction(empId);
    setBalances(r.data);
    setLoading(false);
  }, []);

  const handleEmployeeChange = (id: string) => {
    setEmployeeId(id);
    void load(id);
  };

  const openForm = (balance?: OpeningBalanceEntry) =>
    open({
      title: balance ? t("editOpeningBalance") : t("addOpeningBalance"),
      content: (
        <OpeningBalanceForm
          employeeId={employeeId}
          periods={periods}
          balance={balance}
          onSaved={() => void load(employeeId)}
        />
      ),
    });

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("openingBalances")}</h2>
        <Button
          size="sm"
          disabled={!employeeId || periods.length === 0}
          onClick={() => openForm()}
        >
          <Plus className="size-4" /> {t("addOpeningBalance")}
        </Button>
      </div>

      <Select value={employeeId} onValueChange={handleEmployeeChange}>
        <SelectTrigger className="w-full max-w-sm">
          <SelectValue placeholder={t("selectEmployee")} />
        </SelectTrigger>
        <SelectContent>
          {employees.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!employeeId ? (
        <p className="text-sm text-muted-foreground">
          {t("selectEmployeeFirst")}
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("period")}</TableHead>
                <TableHead className="text-right">
                  {t("openingWorkTime")}
                </TableHead>
                <TableHead className="text-right">
                  {t("openingVacationDays")}
                </TableHead>
                <TableHead className="text-right">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center">
                    <Loader2 className="mx-auto size-4 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : balances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center">
                    {tc("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                balances.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      {periodLabel(b.periodId)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatDurationMinutes(b.openingWorkMinutes)}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(b.openingVacationDays).toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openForm(b)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <DeleteConfirmationDialog
                        onConfirm={async () => {
                          const r =
                            await deleteEmployeePeriodOpeningBalanceAction(
                              b.id
                            );
                          return r.success
                            ? { success: true }
                            : { success: false, error: r.error };
                        }}
                        onSuccess={() => void load(employeeId)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
};
