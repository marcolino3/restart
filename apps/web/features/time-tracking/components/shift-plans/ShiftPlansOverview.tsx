"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableCard } from "@/components/common/TableCard";
import { ROUTES } from "@/constants/routes";
import type { Shift } from "../../actions/shifts.action";
import type {
  ShiftCoverageRow,
  ShiftPlanSummary,
  ShiftPlanTeam,
} from "../../actions/shift-plans.action";
import { formatIsoDateLong } from "../../lib/shift-plan-dates";
import { ShiftCoverageGrid } from "./ShiftCoverageGrid";
import { CreateShiftPlanDialog } from "./CreateShiftPlanDialog";
import { ShiftPlanStatusBadge } from "./ShiftPlanStatusBadge";

interface Props {
  teams: ShiftPlanTeam[];
  selectedTeamId: string | null;
  shifts: Shift[];
  coverage: ShiftCoverageRow[];
  plans: ShiftPlanSummary[];
  canManageCoverage: boolean;
}

export const ShiftPlansOverview = ({
  teams,
  selectedTeamId,
  shifts,
  coverage,
  plans,
  canManageCoverage,
}: Props) => {
  const t = useTranslations("TimeTracking");
  const locale = useLocale();
  const router = useRouter();
  const team = teams.find((x) => x.id === selectedTeamId) ?? null;

  if (teams.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("shiftPlanNoTeams")}</p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium">{t("shiftPlanTeam")}</span>
        <Select
          value={team?.id ?? undefined}
          onValueChange={(id) =>
            router.push(`${ROUTES.admin.shiftPlans(locale)}?team=${id}`)
          }
        >
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {teams.map((x) => (
              <SelectItem key={x.id} value={x.id}>
                {x.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {team && (
        <>
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">{t("shiftCoverage")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("shiftCoverageHelp")}
              </p>
            </div>
            <ShiftCoverageGrid
              key={team.id}
              teamId={team.id}
              shifts={shifts}
              coverage={coverage}
              canEdit={canManageCoverage}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">{t("shiftPlanList")}</h2>
              {team.canWrite && shifts.length > 0 && (
                <CreateShiftPlanDialog teamId={team.id} />
              )}
            </div>
            {plans.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("shiftPlanNone")}</p>
            ) : (
              <TableCard>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("shiftPlanPeriod")}</TableHead>
                      <TableHead>{t("shiftPlanStatus")}</TableHead>
                      <TableHead>{t("shiftPlanSource")}</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {formatIsoDateLong(p.startDate, locale)} –{" "}
                          {formatIsoDateLong(p.endDate, locale)}
                        </TableCell>
                        <TableCell>
                          <ShiftPlanStatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {t(`shiftPlanSource${p.source}`)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={ROUTES.admin.shiftPlan(locale, p.id)}>
                              {t("shiftPlanOpen")}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableCard>
            )}
          </section>
        </>
      )}
    </div>
  );
};
