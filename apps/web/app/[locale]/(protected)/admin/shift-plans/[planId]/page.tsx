import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/common/PageHead";
import { ROUTES } from "@/constants/routes";
import {
  getShiftPlanAction,
  getShiftPlanTeamsAction,
} from "@/features/time-tracking/actions/shift-plans.action";
import { ShiftPlanActions } from "@/features/time-tracking/components/shift-plans/ShiftPlanActions";
import { ShiftPlanGrid } from "@/features/time-tracking/components/shift-plans/ShiftPlanGrid";
import { formatIsoDateLong } from "@/features/time-tracking/lib/shift-plan-dates";

type Props = { params: Promise<{ planId: string }> };

const ShiftPlanPage = async ({ params }: Props) => {
  const t = await getTranslations("TimeTracking");
  const locale = await getLocale();
  const { planId } = await params;

  const [detailRes, teamsRes] = await Promise.all([
    getShiftPlanAction(planId),
    getShiftPlanTeamsAction(),
  ]);

  if (!detailRes.success || !detailRes.data) {
    return (
      <div className="space-y-4 p-4">
        <p className="text-muted-foreground">{t("shiftPlanNotFound")}</p>
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.admin.shiftPlans(locale)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("shiftPlans")}
          </Link>
        </Button>
      </div>
    );
  }

  const detail = detailRes.data;
  const team = teamsRes.success
    ? teamsRes.data.find((x) => x.id === detail.plan.teamId)
    : undefined;
  const canWrite = team?.canWrite ?? false;

  return (
    <div className="space-y-6 p-4">
      <PageHead
        title={t("shiftPlan")}
        subtitle={`${team?.name ?? ""} · ${formatIsoDateLong(detail.plan.startDate, locale)} – ${formatIsoDateLong(detail.plan.endDate, locale)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link
                href={`${ROUTES.admin.shiftPlans(locale)}?team=${detail.plan.teamId}`}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                {t("shiftPlans")}
              </Link>
            </Button>
            <ShiftPlanActions plan={detail.plan} canWrite={canWrite} />
          </div>
        }
      />
      {!canWrite && (
        <p className="text-sm text-muted-foreground">{t("shiftPlanReadOnly")}</p>
      )}
      <ShiftPlanGrid detail={detail} canWrite={canWrite} />
    </div>
  );
};

export default ShiftPlanPage;
