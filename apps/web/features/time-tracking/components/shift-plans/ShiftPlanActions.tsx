"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { ROUTES } from "@/constants/routes";
import {
  deleteShiftPlanAction,
  publishShiftPlanAction,
  unpublishShiftPlanAction,
  type ShiftPlanSummary,
} from "../../actions/shift-plans.action";
import { ShiftPlanStatusBadge } from "./ShiftPlanStatusBadge";

interface Props {
  plan: ShiftPlanSummary;
  canWrite: boolean;
}

export const ShiftPlanActions = ({ plan, canWrite }: Props) => {
  const t = useTranslations("TimeTracking");
  const locale = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const toggleStatus = async () => {
    setBusy(true);
    const res =
      plan.status === "PUBLISHED"
        ? await unpublishShiftPlanAction(plan.id)
        : await publishShiftPlanAction(plan.id);
    setBusy(false);
    if (res.success) {
      toast.success(
        plan.status === "PUBLISHED"
          ? t("shiftPlanUnpublished")
          : t("shiftPlanPublished"),
      );
      router.refresh();
    } else {
      toast.error(t("shiftPlanStatusError"));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ShiftPlanStatusBadge status={plan.status} />
      {canWrite && (
        <>
          <Button size="sm" onClick={toggleStatus} disabled={busy}>
            {plan.status === "PUBLISHED"
              ? t("shiftPlanUnpublish")
              : t("shiftPlanPublish")}
          </Button>
          <DeleteConfirmationDialog
            title={t("shiftPlanDelete")}
            onConfirm={() => deleteShiftPlanAction(plan.id)}
            onSuccess={() => {
              toast.success(t("shiftPlanDeleted"));
              router.push(
                `${ROUTES.admin.shiftPlans(locale)}?team=${plan.teamId}`,
              );
            }}
            trigger={
              <Button size="sm" variant="outline" aria-label={t("shiftPlanDelete")}>
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        </>
      )}
    </div>
  );
};
