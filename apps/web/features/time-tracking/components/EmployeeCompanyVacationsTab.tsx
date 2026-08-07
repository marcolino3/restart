"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DetailPanel } from "@/components/common/DetailPanel";

import type { CompanyVacation } from "../actions/settings.action";
import {
  assignCompanyVacationAction,
  unassignCompanyVacationAction,
} from "../actions/company-vacation-assignments.action";

interface Props {
  employeeId: string;
  assigned: CompanyVacation[];
  allCompanyVacations: CompanyVacation[];
  editable?: boolean;
}

export default function EmployeeCompanyVacationsTab({
  employeeId,
  assigned,
  allCompanyVacations,
  editable,
}: Props) {
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const dateLocale = locale === "de" ? de : enUS;
  const fmtRange = (start: string, end: string) =>
    `${format(new Date(start), "dd.MM.yyyy", { locale: dateLocale })} – ${format(new Date(end), "dd.MM.yyyy", { locale: dateLocale })}`;

  const assignedIds = new Set(assigned.map((v) => v.id));
  const assignable = allCompanyVacations.filter((v) => !v.appliesToAll);

  const handleToggle = (vacationId: string, checked: boolean) => {
    setPendingId(vacationId);
    startTransition(async () => {
      const res = checked
        ? await assignCompanyVacationAction(vacationId, employeeId)
        : await unassignCompanyVacationAction(vacationId, employeeId);
      if (res.success) {
        toast.success(
          checked
            ? tE("companyVacations.assigned")
            : tE("companyVacations.unassigned"),
        );
      } else {
        toast.error(tE("companyVacations.error"));
      }
      setPendingId(null);
    });
  };

  return (
    <div className="space-y-6">
      <DetailPanel title={tE("companyVacations.appliesToAllTitle")}>
        {assigned
          .filter((v) => v.appliesToAll)
          .map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between py-1.5"
            >
              <span>{v.name}</span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                {fmtRange(v.startDate, v.endDate)}
                <Badge variant="secondary">
                  {tE("companyVacations.appliesToAll")}
                </Badge>
              </span>
            </div>
          ))}
        {assigned.filter((v) => v.appliesToAll).length === 0 && (
          <span className="text-sm text-muted-foreground">
            {tE("companyVacations.noneAppliesToAll")}
          </span>
        )}
      </DetailPanel>

      <DetailPanel title={tE("companyVacations.assignableTitle")}>
        {assignable.length === 0 && (
          <span className="text-sm text-muted-foreground">
            {tE("companyVacations.noneAssignable")}
          </span>
        )}
        {assignable.map((v) => {
          const checked = assignedIds.has(v.id);
          return (
            <div
              key={v.id}
              className="flex items-center justify-between py-1.5"
            >
              <label className="flex items-center gap-3">
                <Checkbox
                  checked={checked}
                  disabled={!editable || (isPending && pendingId === v.id)}
                  onCheckedChange={(value) =>
                    handleToggle(v.id, value === true)
                  }
                />
                <span>{v.name}</span>
              </label>
              <span className="text-sm text-muted-foreground">
                {fmtRange(v.startDate, v.endDate)}
              </span>
            </div>
          );
        })}
      </DetailPanel>
    </div>
  );
}
