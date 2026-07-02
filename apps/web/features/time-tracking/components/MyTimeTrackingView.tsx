"use client";

import { useTranslations } from "next-intl";
import { TimeBalanceCards } from "./TimeBalanceCards";
import { ClockButton } from "./ClockButton";
import { TimeEntriesTable } from "./TimeEntriesTable";
import type { MyTimeTrackingData } from "../types";

interface Props {
  data: MyTimeTrackingData;
}

export const MyTimeTrackingView = ({ data }: Props) => {
  const t = useTranslations("TimeTracking");

  if (!data.employeeId) {
    return (
      <p className="text-muted-foreground">{t("noTimeTrackingProfile")}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <TimeBalanceCards balance={data.balance} vacation={data.vacation} />
      </div>
      <div className="flex items-center gap-3">
        <ClockButton
          employeeId={data.employeeId}
          isRunning={Boolean(data.openEntry)}
        />
        {data.openEntry && (
          <span className="text-sm text-muted-foreground">
            {t("clockRunningSince", {
              time: new Date(data.openEntry.startedAt)
                .toISOString()
                .substring(11, 16),
            })}
          </span>
        )}
      </div>
      {data.missingRecordDays.length > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
          <h2 className="mb-1 font-semibold text-destructive">
            {t("missingRecords", { count: data.missingRecordDays.length })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {data.missingRecordDays
              .map((d) => new Date(`${d}T12:00:00`).toLocaleDateString("de-CH"))
              .join(", ")}
          </p>
        </div>
      )}
      <TimeEntriesTable employeeId={data.employeeId} entries={data.entries} />
    </div>
  );
};
