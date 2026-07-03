import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import type { AdmissionsKanbanData } from "@/features/admissions-kanban/actions/get-admissions-data.action";

interface Props {
  data: AdmissionsKanbanData;
}

/**
 * Dashboard panel "Aufnahmeprozess" (design handoff): active applications
 * per stage as labeled progress bars, linking to the kanban board.
 */
export async function DashboardAdmissionStagesPanel({ data }: Props) {
  const t = await getTranslations("Dashboard");
  const locale = await getLocale();

  const activeCount = data.applications.filter(
    (a) => a.status === "ACTIVE"
  ).length;

  const rows = data.stages
    .filter((s) => s.stageType !== "REJECTED")
    .map((stage) => ({
      stage,
      count: (data.applicationsByStage[stage.id] ?? []).length,
    }));
  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t("admissionsTitle")}
          <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 font-mono text-[11px] font-semibold text-accent-foreground tabular-nums">
            {t("admissionsActive", { count: activeCount })}
          </span>
        </CardTitle>
        <p className="text-[12.5px] text-muted-foreground">
          {t("admissionsHint")}
        </p>
      </CardHeader>
      <CardContent>
        <Link
          href={ROUTES.admin.admissionsKanban(locale)}
          className="block"
        >
          {rows.map(({ stage, count }) => (
            <div
              key={stage.id}
              className="mb-3 grid grid-cols-[130px_1fr_30px] items-center gap-3 text-[13px] last:mb-0"
            >
              <span className="flex min-w-0 items-center gap-2 font-medium">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: stage.color ?? "var(--primary)" }}
                />
                <span className="truncate">{stage.name}</span>
              </span>
              <span className="h-2 overflow-hidden rounded-full bg-field">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${Math.round((count / maxCount) * 100)}%`,
                    background: stage.color ?? "var(--primary)",
                  }}
                />
              </span>
              <span className="text-right font-mono text-[12.5px] font-semibold text-muted-foreground tabular-nums">
                {count}
              </span>
            </div>
          ))}
        </Link>
      </CardContent>
    </Card>
  );
}
