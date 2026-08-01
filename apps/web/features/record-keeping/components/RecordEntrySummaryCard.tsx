"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { STATUS_DOT_CLS } from "../lib/status-dot-cls";
import type { LessonRecordStatus } from "../types";

interface Props {
  areaName: string | null;
  lessonName: string | null;
  formattedDate: string | null;
  studentCount: number;
  status: LessonRecordStatus;
}

/**
 * Live read-out of the form state — no logic of its own, just presentation.
 * The parent derives every value (area/lesson lookup, date formatting, …).
 */
export const RecordEntrySummaryCard = ({
  areaName,
  lessonName,
  formattedDate,
  studentCount,
  status,
}: Props) => {
  const t = useTranslations("RecordKeeping");

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: t("summaryArea"), value: areaName ?? "—" },
    { label: t("lesson"), value: lessonName ?? "—" },
    { label: t("date"), value: formattedDate ?? "—" },
    { label: t("summaryChildren"), value: t("summaryChildrenCount", { count: studentCount }) },
    {
      label: t("cardStatusTitle"),
      value: (
        <Badge variant="secondary" className="gap-1.5">
          <span
            aria-hidden="true"
            className={cn("h-2 w-2 rounded-full shrink-0", STATUS_DOT_CLS[status])}
          />
          {t(status)}
        </Badge>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("summaryTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-medium text-right">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
};
