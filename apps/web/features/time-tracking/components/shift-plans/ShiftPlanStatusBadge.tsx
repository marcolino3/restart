import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { ShiftPlanStatus } from "../../actions/shift-plans.action";

export const ShiftPlanStatusBadge = ({ status }: { status: ShiftPlanStatus }) => {
  const t = useTranslations("TimeTracking");
  return (
    <Badge variant={status === "PUBLISHED" ? "green" : "amber"}>
      {t(`shiftPlanStatus${status}`)}
    </Badge>
  );
};
