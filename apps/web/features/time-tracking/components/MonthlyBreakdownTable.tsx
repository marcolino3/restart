"use client";

import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDurationMinutes } from "@/lib/formatting/duration";
import type { MonthlyWorkTimeSummary } from "../types";

const MONTHS = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

export const MonthlyBreakdownTable = ({
  monthly,
}: {
  monthly: MonthlyWorkTimeSummary[];
}) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("month")}</TableHead>
            <TableHead className="text-right">{t("planned")}</TableHead>
            <TableHead className="text-right">{t("actual")}</TableHead>
            <TableHead className="text-right">{t("difference")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {monthly.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                {tc("noResults")}
              </TableCell>
            </TableRow>
          ) : (
            monthly.map((m) => (
              <TableRow key={`${m.year}-${m.month}`}>
                <TableCell>
                  {MONTHS[m.month - 1]} {m.year}
                </TableCell>
                <TableCell className="text-right">
                  {formatDurationMinutes(m.plannedMinutes)}
                </TableCell>
                <TableCell className="text-right">
                  {formatDurationMinutes(m.actualMinutes)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    m.differenceMinutes > 0 && "text-green-600",
                    m.differenceMinutes < 0 && "text-red-600"
                  )}
                >
                  {formatDurationMinutes(m.differenceMinutes)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
