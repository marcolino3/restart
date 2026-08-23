"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { EmployeeAbsenceStatusType } from "../schemas/employee-absence-notice-form.schema";

interface Props {
  status?: EmployeeAbsenceStatusType | null;
  decisionNote?: string | null;
}

/** Approval state of an absence — pending requests read as neutral, not as an error. */
export const AbsenceStatusBadge = ({ status, decisionNote }: Props) => {
  const tE = useTranslations("Employees");
  const value = status ?? "APPROVED";

  const variant =
    value === "APPROVED"
      ? ("secondary" as const)
      : value === "REJECTED"
        ? ("destructive" as const)
        : ("outline" as const);

  return (
    <Badge variant={variant} title={decisionNote ?? undefined}>
      {tE(`absence.status.${value}`)}
    </Badge>
  );
};
