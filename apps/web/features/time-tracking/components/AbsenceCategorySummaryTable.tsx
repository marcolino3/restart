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
import type { AbsenceCategorySummary } from "../types";

/** Absenz-Tage je Kategorie mit Split 100 % / Teilabsenzen (colibri-Parität). */
export const AbsenceCategorySummaryTable = ({
  categories,
}: {
  categories: AbsenceCategorySummary[];
}) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("absenceCategory")}</TableHead>
            <TableHead className="text-right">{t("absenceDays")}</TableHead>
            <TableHead className="text-right">{t("absenceFullDays")}</TableHead>
            <TableHead className="text-right">
              {t("absencePartialDays")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                {tc("noResults")}
              </TableCell>
            </TableRow>
          ) : (
            categories.map((c) => (
              <TableRow key={c.categoryId}>
                <TableCell>
                  <span className="flex items-center gap-2">
                    {c.color ? (
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                    ) : null}
                    {c.name ?? "—"}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {c.totalDays}
                </TableCell>
                <TableCell className="text-right">{c.fullDays}</TableCell>
                <TableCell className="text-right">{c.partialDays}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
