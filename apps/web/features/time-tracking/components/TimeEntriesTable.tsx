"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Pencil, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { useSheet } from "@/components/providers/sheet-provider";
import { formatDurationMinutes } from "@/lib/formatting/duration";
import { TimeEntryForm } from "./TimeEntryForm";
import { deleteTimeEntryAction } from "../actions/mutate-time-entry.action";
import type { TimeEntry } from "../types";

interface Props {
  employeeId: string;
  entries: TimeEntry[];
  /** Kopfzeile (Titel + "Eintrag hinzufügen") ausblenden, wenn der Parent sie stellt. */
  showHeader?: boolean;
}

const timeStr = (iso?: string | null) =>
  iso ? new Date(iso).toISOString().substring(11, 16) : "–";

export const TimeEntriesTable = ({
  employeeId,
  entries,
  showHeader = true,
}: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const router = useRouter();
  const { open } = useSheet();

  const openForm = (entry?: TimeEntry) =>
    open({
      title: entry ? t("editEntry") : t("addEntry"),
      content: <TimeEntryForm employeeId={employeeId} entry={entry} />,
      side: "right",
    });

  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("entries")}</h2>
          <Button size="sm" onClick={() => openForm()}>
            <Plus className="size-4" /> {t("addEntry")}
          </Button>
        </div>
      )}
      <div className="overflow-hidden rounded-card border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("startTime")}</TableHead>
              <TableHead>{t("endTime")}</TableHead>
              <TableHead>{t("break")}</TableHead>
              <TableHead>{t("duration")}</TableHead>
              <TableHead>{t("source")}</TableHead>
              <TableHead className="text-right">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  {tc("noResults")}
                </TableCell>
              </TableRow>
            ) : (
              entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    {format(new Date(e.entryDate), "dd.MM.yyyy", { locale: de })}
                  </TableCell>
                  <TableCell>{timeStr(e.startedAt)}</TableCell>
                  <TableCell>{timeStr(e.endedAt)}</TableCell>
                  <TableCell>{e.breakMinutes ?? 0} min</TableCell>
                  <TableCell>
                    {e.workMinutes != null
                      ? formatDurationMinutes(e.workMinutes)
                      : "–"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {e.source === "CLOCK" ? t("clock") : t("manual")}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openForm(e)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <DeleteConfirmationDialog
                      onConfirm={async () => {
                        const res = await deleteTimeEntryAction(e.id);
                        return { success: res.success, error: res.error };
                      }}
                      onSuccess={() => router.refresh()}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
