"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { de } from "date-fns/locale";
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
import { PaidOvertimeForm } from "./PaidOvertimeForm";
import {
  deleteEmployeePaidOvertimeAction,
  getEmployeePaidOvertimeAction,
  type PaidOvertimeEntry,
} from "../actions/paid-overtime.action";
import type { EmployeeOption } from "../types";

interface Props {
  employees: EmployeeOption[];
}

const fmt = (d: string) => format(new Date(d), "dd.MM.yyyy", { locale: de });

export const PaidOvertimeSection = ({ employees }: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const { open } = useSheet();

  const [employeeId, setEmployeeId] = useState<string>("");
  const [entries, setEntries] = useState<PaidOvertimeEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (empId: string) => {
    setLoading(true);
    const r = await getEmployeePaidOvertimeAction(empId);
    setEntries(r.data);
    setLoading(false);
  }, []);

  const handleEmployeeChange = (id: string) => {
    setEmployeeId(id);
    void load(id);
  };

  const openForm = (entry?: PaidOvertimeEntry) =>
    open({
      title: entry ? t("editPaidOvertime") : t("addPaidOvertime"),
      content: (
        <PaidOvertimeForm
          employeeId={employeeId}
          entry={entry}
          onSaved={() => void load(employeeId)}
        />
      ),
    });

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{t("paidOvertime")}</h2>
        <Button size="sm" disabled={!employeeId} onClick={() => openForm()}>
          <Plus className="size-4" /> {t("addPaidOvertime")}
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
                <TableHead>{t("date")}</TableHead>
                <TableHead className="text-right">{t("duration")}</TableHead>
                <TableHead>{t("note")}</TableHead>
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
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center">
                    {tc("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{fmt(entry.date)}</TableCell>
                    <TableCell className="text-right">
                      {formatDurationMinutes(entry.minutes)}
                    </TableCell>
                    <TableCell>{entry.note || "–"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openForm(entry)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <DeleteConfirmationDialog
                        onConfirm={async () => {
                          const r = await deleteEmployeePaidOvertimeAction(
                            entry.id
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
