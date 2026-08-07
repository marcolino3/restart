"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useState } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useSheet } from "@/components/providers/sheet-provider";
import { formatDurationMinutes } from "@/lib/formatting/duration";
import { TimeEntryForm } from "./TimeEntryForm";
import { deleteTimeEntryAction } from "../actions/mutate-time-entry.action";
import type {
  DailyTimeTracking,
  MonthlyTimeTrackingGroup,
  TimeEntry,
} from "../types";

interface Props {
  employeeId: string;
  monthlyGroups: MonthlyTimeTrackingGroup[];
}

const timeStr = (iso?: string | null) =>
  iso ? new Date(iso).toISOString().substring(11, 16) : "–";

const monthKeyOf = (group: { year: number; month: number }) =>
  `${group.year}-${group.month}`;

const rowClassName: Record<DailyTimeTracking["kind"], string> = {
  ENTRY: "",
  ABSENCE: "bg-destructive/10",
  VACATION: "bg-emerald-500/10",
  HOLIDAY: "bg-violet-500/10",
  NONE: "",
};

export const MonthlyTimeEntriesAccordion = ({
  employeeId,
  monthlyGroups,
}: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const dateLocale = locale === "en" ? enUS : de;
  const router = useRouter();
  const { open } = useSheet();
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  const openForm = (entry?: TimeEntry, defaultDate?: Date) =>
    open({
      title: entry ? t("editEntry") : t("addEntry"),
      content: (
        <TimeEntryForm
          employeeId={employeeId}
          entry={entry}
          defaultDate={defaultDate}
        />
      ),
      side: "right",
    });

  const currentKey = monthKeyOf({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const months = useMemo(
    () =>
      monthlyGroups.map((g) => {
        const key = monthKeyOf(g);
        return {
          ...g,
          key,
          label: format(new Date(g.year, g.month - 1, 1), "MMMM yyyy", {
            locale: dateLocale,
          }),
          days: key === currentKey ? [...g.days].reverse() : g.days,
        };
      }),
    [monthlyGroups, dateLocale, currentKey],
  );

  if (months.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("noEntriesYet")}</p>
    );
  }

  return (
    <Accordion type="multiple" defaultValue={[currentKey]}>
      {months.map((m) => (
        <AccordionItem key={m.key} value={m.key}>
          <AccordionTrigger>
            <span className="flex flex-1 items-center justify-between pr-2">
              <span className="capitalize">{m.label}</span>
              <span className="text-sm font-normal text-muted-foreground">
                {formatDurationMinutes(m.workedMinutes)}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <Card className="bg-white p-0">
              <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("startTime")}</TableHead>
                    <TableHead>{t("endTime")}</TableHead>
                    <TableHead>{t("break")}</TableHead>
                    <TableHead>{t("duration")}</TableHead>
                    <TableHead>{t("note")}</TableHead>
                    <TableHead className="text-right">
                      <span className="sr-only">{tc("actions")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {m.days.map((day) => {
                    const date = new Date(`${day.date}T12:00:00`);
                    const entries =
                      day.kind === "ENTRY" && day.entries?.length
                        ? day.entries
                        : [null];
                    return entries.map((entry, i) => (
                      <TableRow
                        key={`${day.date}-${i}`}
                        className={rowClassName[day.kind]}
                      >
                        {i === 0 ? (
                          <TableCell
                            className="whitespace-nowrap align-middle"
                            rowSpan={entries.length}
                          >
                            {format(date, "EEE dd.MM.yyyy", {
                              locale: dateLocale,
                            })}
                          </TableCell>
                        ) : null}
                        {entry ? (
                          <>
                            <TableCell>{timeStr(entry.startedAt)}</TableCell>
                            <TableCell>{timeStr(entry.endedAt)}</TableCell>
                            <TableCell>
                              {entry.breakMinutes ?? 0} min
                            </TableCell>
                            <TableCell>
                              {entry.workMinutes != null
                                ? formatDurationMinutes(entry.workMinutes)
                                : "–"}
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-40">
                              {entry.notes ? (
                                <HoverCard openDelay={200}>
                                  <HoverCardTrigger asChild>
                                    <span className="block truncate cursor-default">
                                      {entry.notes}
                                    </span>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-auto max-w-80 whitespace-pre-wrap text-sm">
                                    {entry.notes}
                                  </HoverCardContent>
                                </HoverCard>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      aria-label={t("openMenu")}
                                    >
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        openForm({
                                          ...entry,
                                          entryDate: day.date,
                                          source: "MANUAL",
                                        })
                                      }
                                    >
                                      <Pencil className="mr-2 size-4" />
                                      {t("editEntry")}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        setDeleteEntryId(entry.id);
                                      }}
                                    >
                                      <Trash2 className="mr-2 size-4" />
                                      {t("deleteEntry")}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </>
                        ) : day.kind === "NONE" ? (
                          <TableCell className="text-right" colSpan={6}>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openForm(undefined, date)}
                              aria-label={t("addEntry")}
                            >
                              <Plus className="size-4" />
                            </Button>
                          </TableCell>
                        ) : (
                          <TableCell colSpan={6}>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="secondary"
                                className="gap-1.5"
                              >
                                {day.color && (
                                  <span
                                    aria-hidden
                                    className="inline-block h-2 w-2 rounded-full"
                                    style={{ backgroundColor: day.color }}
                                  />
                                )}
                                {day.kind === "ABSENCE" && t("myAbsences")}
                                {day.kind === "VACATION" &&
                                  t("companyVacations")}
                                {day.kind === "HOLIDAY" && t("holidays")}
                              </Badge>
                              <span className="text-muted-foreground">
                                {day.label}
                              </span>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>
      ))}
      <DeleteConfirmationDialog
        open={deleteEntryId !== null}
        onOpenChange={(next) => !next && setDeleteEntryId(null)}
        description={t("deleteEntryConfirm")}
        onConfirm={async () => {
          const res = await deleteTimeEntryAction(deleteEntryId as string);
          return { success: res.success, error: res.error };
        }}
        onSuccess={() => router.refresh()}
      />
    </Accordion>
  );
};
