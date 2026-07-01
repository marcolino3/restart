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
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { formatDurationMinutes } from "@/lib/formatting/duration";
import type { EmployeeWorkTimeOverviewRow } from "../types";

interface Props {
  rows: EmployeeWorkTimeOverviewRow[];
}

export const TeamOverviewTable = ({ rows }: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const locale = useLocale();

  return (
    <div className="rounded-md border">
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
            rows.map((r) => (
              <TableRow key={r.employeeId} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={ROUTES.admin.timeTrackingReportEmployee(
                      locale,
                      r.employeeId
                    )}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {r.employeeName ?? r.employeeId}
                  </Link>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    r.netBalanceMinutes > 0 && "text-green-600",
                    r.netBalanceMinutes < 0 && "text-red-600"
                  )}
                >
                  {formatDurationMinutes(r.netBalanceMinutes)}
                </TableCell>
                <TableCell className="text-right">
                  {r.vacationDaysUsed}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
