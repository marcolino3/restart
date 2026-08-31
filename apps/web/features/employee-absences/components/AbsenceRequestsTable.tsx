"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableColumnHeader } from "@/components/data-table/DataTableColumnHeader";
import {
  type AppTableFeatures,
  useDataTable,
} from "@/components/data-table/use-data-table";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { pickAbsenceCategoryName } from "@/features/employee-absence-categories/types";
import {
  absenceIncludesTime,
  formatAbsenceDateTime,
} from "@restart/shared-schemas/employee-absences/absence-date";

import type { EmployeeAbsence } from "../actions/employee-absences.actions";
import {
  approveEmployeeAbsenceAction,
  rejectEmployeeAbsenceAction,
} from "../actions/employee-absences.actions";

interface Props {
  requests: EmployeeAbsence[];
}

/** Open absence requests with approve/reject actions for leads, HR and admins. */
export default function AbsenceRequestsTable({ requests }: Props) {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const router = useRouter();

  const [rejecting, setRejecting] = useState<EmployeeAbsence | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatDate = (absence: EmployeeAbsence, value?: string | null) =>
    formatAbsenceDateTime(value, locale, {
      includeTime: absenceIncludesTime(absence.startDate, absence.endDate),
    }) ?? "–";

  const employeeName = (absence: EmployeeAbsence) => {
    const user = absence.employee?.membership?.user;
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
    return name || "–";
  };

  const categoryLabel = (absence: EmployeeAbsence) =>
    absence.absenceCategory
      ? pickAbsenceCategoryName(
          {
            translations: absence.absenceCategory.translations ?? [],
            systemCode: absence.absenceCategory.systemCode ?? null,
          },
          locale,
        )
      : "–";

  const handleApprove = async (id: string) => {
    const res = await approveEmployeeAbsenceAction(id);
    return res.success
      ? { success: true as const }
      : { success: false as const, error: tE("absence.approveError") };
  };

  const submitRejection = async () => {
    if (!rejecting || !rejectNote.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await rejectEmployeeAbsenceAction(rejecting.id, rejectNote);
      if (!res.success) throw new Error("rejectFailed");
      toast.success(tE("absence.rejectSuccess"));
      setRejecting(null);
      setRejectNote("");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(tE("absence.rejectError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo<
    ColumnDef<AppTableFeatures, EmployeeAbsence, unknown>[]
  >(
    () => [
      {
        id: "employee",
        accessorFn: (a) => employeeName(a),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={tE("absence.employeeColumn")}
          />
        ),
        meta: { labelKey: "absence.employeeColumn" },
        cell: ({ getValue }) => getValue<string>(),
      },
      {
        id: "category",
        accessorFn: (a) => categoryLabel(a),
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={tE("absence.category")}
          />
        ),
        meta: { labelKey: "absence.category" },
        cell: ({ row, getValue }) => (
          <span className="flex items-center gap-2">
            <span
              className="inline-block size-2 shrink-0 rounded-full"
              style={{
                background:
                  row.original.absenceCategory?.color ?? "var(--muted)",
              }}
            />
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: "startDate",
        accessorFn: (a) => (a.startDate ? new Date(a.startDate).getTime() : 0),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("startDate")} />
        ),
        meta: { labelKey: "startDate" },
        cell: ({ row }) => formatDate(row.original, row.original.startDate),
      },
      {
        id: "endDate",
        accessorFn: (a) => (a.endDate ? new Date(a.endDate).getTime() : 0),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("endDate")} />
        ),
        meta: { labelKey: "endDate" },
        cell: ({ row }) => formatDate(row.original, row.original.endDate),
      },
      {
        id: "note",
        accessorFn: (a) => a.note ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("note")} />
        ),
        meta: { labelKey: "note" },
        cell: ({ getValue }) => {
          const note = getValue<string>();
          if (!note) return "–";
          return (
            <span className="line-clamp-1 max-w-[14rem] text-sm" title={note}>
              {note}
            </span>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        enableSorting: false,
        header: () => <span className="sr-only">{t("actions")}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <DeleteConfirmationDialog
              title={tE("absence.approveTitle")}
              description={tE("absence.approveConfirm")}
              onConfirm={() => handleApprove(row.original.id)}
              onSuccess={() => router.refresh()}
              trigger={
                <Button variant="ghost" size="sm">
                  <Check className="mr-1 h-4 w-4" />
                  {tE("absence.approve")}
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRejecting(row.original);
                setRejectNote("");
              }}
            >
              <X className="mr-1 h-4 w-4 text-destructive" />
              {tE("absence.reject")}
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, tE, locale],
  );

  const { table, globalFilter, setGlobalFilter } = useDataTable({
    data: requests,
    columns,
    initialSorting: [{ id: "startDate", desc: false }],
  });

  return (
    <>
      <DataTable
        table={table}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
      />

      <Dialog
        open={rejecting !== null}
        onOpenChange={(open) => {
          if (!open) setRejecting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tE("absence.rejectTitle")}</DialogTitle>
            <DialogDescription>
              {tE("absence.rejectDescription")}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(event) => setRejectNote(event.target.value)}
            placeholder={tE("absence.rejectNotePlaceholder")}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectNote.trim() || isSubmitting}
              onClick={submitRejection}
            >
              {tE("absence.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
