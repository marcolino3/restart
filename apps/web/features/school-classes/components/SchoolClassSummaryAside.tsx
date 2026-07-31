"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GradeLevelItem } from "@/features/grade-levels/actions/get-grade-levels.action";

interface Props {
  gradeLevels: GradeLevelItem[];
  enrolledCount?: number | null;
  schoolYearLabel?: string | null;
  isActive?: boolean;
}

/**
 * Read-only summary of the class next to the form.
 *
 * Reads from the live form state rather than the loaded record, so it reflects
 * edits before they are saved — the point of having it beside the form.
 */
export function SchoolClassSummaryAside({
  gradeLevels,
  enrolledCount,
  schoolYearLabel,
  isActive = true,
}: Props) {
  const t = useTranslations("SchoolClasses");
  const { watch } = useFormContext();

  const name = watch("name") as string | undefined;
  const shortCode = watch("shortCode") as string | undefined;
  const room = watch("room") as string | undefined;
  const maxCapacity = watch("maxCapacity") as number | string | undefined;
  const selectedIds = (watch("gradeLevelIds") as string[] | undefined) ?? [];

  const selected = gradeLevels.filter((gl) => selectedIds.includes(gl.id));
  const capacity =
    typeof maxCapacity === "number"
      ? maxCapacity
      : maxCapacity
        ? Number(maxCapacity)
        : null;

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: t("className"),
      value: [name, shortCode].filter(Boolean).join(" · ") || "—",
    },
    {
      label: t("gradeLevels"),
      value: selected.length
        ? selected.map((gl) => gl.name).join(", ")
        : "—",
    },
    { label: t("room"), value: room || "—" },
    {
      label: t("students"),
      value:
        capacity != null
          ? t("studentsOfCapacity", {
              count: enrolledCount ?? 0,
              capacity,
            })
          : (enrolledCount ?? 0),
    },
  ];

  if (schoolYearLabel) {
    rows.splice(1, 0, { label: t("schoolYear"), value: schoolYearLabel });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("summary")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-4 text-sm"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="text-right font-medium">{row.value}</span>
          </div>
        ))}
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">{t("status")}</span>
          <Badge variant={isActive ? "secondary" : "outline"}>
            {isActive ? t("statusActive") : t("statusArchived")}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
