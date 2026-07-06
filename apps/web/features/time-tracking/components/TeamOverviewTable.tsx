"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PersonCell } from "@/components/common/PersonCell";
import { EmployeeAvatar } from "@/features/employees/components/EmployeeAvatar";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { formatSignedDurationMinutes } from "../format";
import type { EmployeeWorkTimeOverviewRow } from "../types";

interface Props {
  rows: EmployeeWorkTimeOverviewRow[];
}

/** Vor-/Nachname aus dem flachen `employeeName` für die Initialen ableiten. */
const nameParts = (name?: string | null) => {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0],
    lastName: parts.length > 1 ? parts[parts.length - 1] : undefined,
  };
};

export const TeamOverviewTable = ({ rows }: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const locale = useLocale();

  return (
    <div className="overflow-hidden rounded-card border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("employee")}</TableHead>
            <TableHead className="text-right">{t("netBalance")}</TableHead>
            <TableHead className="text-right">
              {t("vacationDaysUsedShort")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                {tc("noResults")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => {
              const { firstName, lastName } = nameParts(r.employeeName);
              return (
                <TableRow key={r.employeeId}>
                  <TableCell>
                    <Link
                      href={ROUTES.admin.timeTrackingReportEmployee(
                        locale,
                        r.employeeId
                      )}
                      className="block"
                    >
                      <PersonCell
                        avatar={
                          <EmployeeAvatar
                            firstName={firstName}
                            lastName={lastName}
                            className="size-8"
                          />
                        }
                        name={r.employeeName ?? r.employeeId}
                      />
                    </Link>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono text-[12.5px] font-medium tabular-nums",
                      r.netBalanceMinutes > 0 &&
                        "text-status-green-foreground",
                      r.netBalanceMinutes < 0 && "text-status-rose-foreground"
                    )}
                  >
                    {formatSignedDurationMinutes(r.netBalanceMinutes)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[12.5px] tabular-nums">
                    {r.vacationDaysUsed}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
