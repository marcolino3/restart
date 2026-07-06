"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSheet } from "@/components/providers/sheet-provider";
import { TimeBalanceCards } from "./TimeBalanceCards";
import { TimerBand } from "./TimerBand";
import { WeekTimeEntries } from "./WeekTimeEntries";
import { TimeEntriesTable } from "./TimeEntriesTable";
import { TimeEntryForm } from "./TimeEntryForm";
import type { MyTimeTrackingData } from "../types";

interface Props {
  data: MyTimeTrackingData;
}

export const MyTimeTrackingView = ({ data }: Props) => {
  const t = useTranslations("TimeTracking");
  const { open } = useSheet();
  const [view, setView] = useState<"week" | "list">("week");

  if (!data.employeeId) {
    return (
      <p className="text-muted-foreground">{t("noTimeTrackingProfile")}</p>
    );
  }

  const employeeId = data.employeeId;

  return (
    <div className="space-y-6">
      <TimerBand employeeId={employeeId} openEntry={data.openEntry} />
      <TimeBalanceCards balance={data.balance} vacation={data.vacation} />
      {data.missingRecordDays.length > 0 && (
        <div className="rounded-card border border-destructive/30 bg-destructive/5 p-4">
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
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">{t("entries")}</h2>
          <div className="ml-auto flex items-center gap-3">
            <Tabs
              value={view}
              onValueChange={(v) => setView(v as "week" | "list")}
            >
              <TabsList>
                <TabsTrigger value="week">{t("weekView")}</TabsTrigger>
                <TabsTrigger value="list">{t("listView")}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              size="sm"
              onClick={() =>
                open({
                  title: t("addEntry"),
                  content: <TimeEntryForm employeeId={employeeId} />,
                  side: "right",
                })
              }
            >
              <Plus className="size-4" /> {t("addEntry")}
            </Button>
          </div>
        </div>
        {view === "week" ? (
          <WeekTimeEntries employeeId={employeeId} entries={data.entries} />
        ) : (
          <TimeEntriesTable
            employeeId={employeeId}
            entries={data.entries}
            showHeader={false}
          />
        )}
      </div>
    </div>
  );
};
