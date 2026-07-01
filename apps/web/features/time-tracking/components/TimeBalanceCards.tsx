"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDurationMinutes } from "@/lib/formatting/duration";
import type { VacationBalance, WorkTimeBalance } from "../types";

interface Props {
  balance: WorkTimeBalance | null;
  vacation: VacationBalance | null;
}

export const TimeBalanceCards = ({ balance, vacation }: Props) => {
  const t = useTranslations("TimeTracking");

  const net = balance?.netBalanceMinutes ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("netBalance")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold",
              net > 0 && "text-green-600",
              net < 0 && "text-red-600"
            )}
          >
            {formatDurationMinutes(net)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("worked")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDurationMinutes(balance?.workedMinutes ?? 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("ofPlanned", {
              planned: formatDurationMinutes(balance?.plannedMinutes ?? 0),
            })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("vacationRemaining")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(vacation?.remainingDays ?? 0).toFixed(1)}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("ofEntitlement", {
              days: (vacation?.entitlementDays ?? 0).toFixed(0),
            })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t("absenceDays")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {balance?.absenceDaysCount ?? 0}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
