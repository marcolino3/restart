"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import type { Locale } from "date-fns";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { DetailPanel } from "@/components/common/DetailPanel";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { cn } from "@/lib/utils";

import type {
  CompanyVacation,
  CompanyVacationHoliday,
} from "../actions/settings.action";
import {
  assignCompanyVacationAction,
  unassignCompanyVacationAction,
  type EmployeeCompanyVacation,
} from "../actions/company-vacation-assignments.action";

/**
 * Anzahl der wirksamen Feiertage im Segment; Hover listet alle auf,
 * Wochenend-Feiertage ausgegraut. Ohne Feiertage nur "0" ohne Trigger.
 */
const SegmentHolidaysCell = ({
  holidays,
  dateLocale,
  label,
  weekendHint,
}: {
  holidays: CompanyVacationHoliday[];
  dateLocale: Locale;
  label: string;
  weekendHint: string;
}) => {
  // Nur Werktags-Feiertage sparen einen Ferientag.
  const effectiveCount = holidays.filter((h) => !h.isWeekend).length;

  if (holidays.length === 0) {
    return <span className="tabular-nums">0</span>;
  }

  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 tabular-nums no-underline hover:no-underline"
          aria-label={label}
        >
          {effectiveCount}
        </Button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-72 p-0">
        <p className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
          {label}
        </p>
        <ul className="max-h-64 divide-y divide-border overflow-y-auto">
          {holidays.map((h) => (
            <li
              key={`${h.date}-${h.name}`}
              className={cn(
                "flex items-baseline justify-between gap-3 px-3 py-2 text-sm",
                h.isWeekend && "text-muted-foreground",
              )}
              title={h.isWeekend ? weekendHint : undefined}
            >
              <span>{h.name}</span>
              <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                {format(new Date(h.date), "EEE, dd.MM.yyyy", {
                  locale: dateLocale,
                })}
                {h.paidPercentage !== 100 && ` · ${h.paidPercentage}%`}
              </span>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
};

interface Props {
  employeeId: string;
  /** Auf Abrechnungsperioden zugeschnittene Segmente, nach Stichtag sortiert. */
  assigned: EmployeeCompanyVacation[];
  allCompanyVacations: CompanyVacation[];
  editable?: boolean;
}

export default function EmployeeCompanyVacationsPanel({
  employeeId,
  assigned,
  allCompanyVacations,
  editable,
}: Props) {
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const dateLocale = locale === "de" ? de : enUS;
  const fmtRange = (start: string, end: string) =>
    `${format(new Date(start), "EEE, dd.MM.yyyy", { locale: dateLocale })} – ${format(new Date(end), "EEE, dd.MM.yyyy", { locale: dateLocale })}`;

  // Segmente derselben Betriebsferien teilen sich eine companyVacationId.
  const assignedIds = new Set(assigned.map((v) => v.companyVacationId));

  // Backend liefert nur die laufende Periode; ihre Eckdaten stehen auf jedem
  // Segment und beschriften die Tabelle.
  const period = assigned[0];

  // Auswahl auf dieselbe Periode begrenzen, damit Tabelle und Dropdown
  // denselben Zeitraum zeigen. Ohne Segmente ist die Periode unbekannt — dann
  // bleiben alle noch nicht zugewiesenen Betriebsferien waehlbar.
  const assignableOptions = allCompanyVacations.filter((v) => {
    if (assignedIds.has(v.id)) return false;
    if (!period) return true;
    // Ueberlappung mit dem Periodenfenster.
    return (
      v.startDate <= period.periodEndDate && v.endDate >= period.periodStartDate
    );
  });

  const toggleSelected = (vacationId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(vacationId)) {
        next.delete(vacationId);
      } else {
        next.add(vacationId);
      }
      return next;
    });
  };

  const runAssignSelected = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startTransition(async () => {
      const results = await Promise.all(
        ids.map((id) => assignCompanyVacationAction(id, employeeId)),
      );
      if (results.every((r) => r.success)) {
        toast.success(tE("companyVacations.assigned"));
      } else {
        toast.error(tE("companyVacations.error"));
      }
      setSelectedIds(new Set());
      setOpen(false);
    });
  };

  const handleUnassign = async (vacationId: string) => {
    const res = await unassignCompanyVacationAction(vacationId, employeeId);
    return { success: res.success };
  };

  return (
    <DetailPanel title={tE("tabCompanyVacations")} className="md:max-w-[50%]">
      {editable && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="mb-3 w-full justify-between font-normal"
            >
              {selectedIds.size > 0
                ? tE("companyVacations.selectedCount", {
                    count: selectedIds.size,
                  })
                : assignableOptions.length === 0
                  ? tE("companyVacations.allAssigned")
                  : tE("companyVacations.assignPlaceholder")}
              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput
                placeholder={tE("companyVacations.searchPlaceholder")}
              />
              <CommandList>
                <CommandEmpty>
                  {tE("companyVacations.noneAssignable")}
                </CommandEmpty>
                <CommandGroup>
                  {assignableOptions.map((v) => {
                    const checked = selectedIds.has(v.id);
                    return (
                      <CommandItem
                        key={v.id}
                        value={v.name}
                        onSelect={() => toggleSelected(v.id)}
                      >
                        <div
                          className={cn(
                            "mr-2 flex size-4 items-center justify-center rounded-sm border border-primary",
                            checked
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50 [&_svg]:invisible",
                          )}
                        >
                          <Check className="size-3" />
                        </div>
                        <span className="flex-1">{v.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {fmtRange(v.startDate, v.endDate)}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
            {selectedIds.size > 0 && (
              <div className="border-t border-border p-2">
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={isPending}
                  onClick={runAssignSelected}
                >
                  {tE("companyVacations.assignSelected")}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      )}

      {period && (
        <p className="mb-2 text-xs text-muted-foreground">
          {tE("companyVacations.periodHeading", {
            label: period.periodLabel,
            range: fmtRange(period.periodStartDate, period.periodEndDate),
          })}
        </p>
      )}

      <div className="overflow-hidden rounded-ctl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">
                {tE("companyVacations.nameColumn")}
              </th>
              <th className="px-3 py-2 font-medium">
                {tE("companyVacations.rangeColumn")}
              </th>
              <th className="px-3 py-2 font-medium">
                {tE("companyVacations.effectiveDaysColumn")}
              </th>
              <th className="px-3 py-2 font-medium">
                {tE("companyVacations.holidaysColumn")}
              </th>
              <th className="w-8 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assigned.map((v) => (
              <tr key={v.id}>
                <td className="px-3 py-2">
                  {v.name}
                  {v.isSplit && (
                    <span
                      className="ml-2 text-xs text-muted-foreground"
                      title={tE("companyVacations.splitHint")}
                    >
                      {tE("companyVacations.splitBadge")}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {fmtRange(v.startDate, v.endDate)}
                </td>
                <td className="px-3 py-2 tabular-nums text-muted-foreground">
                  {v.effectiveDays}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  <SegmentHolidaysCell
                    holidays={v.holidays}
                    dateLocale={dateLocale}
                    label={tE("companyVacations.holidaysInRange")}
                    weekendHint={tE("companyVacations.holidayOnWeekend")}
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  {editable && (
                    <DeleteConfirmationDialog
                      title={tE("companyVacations.unassignConfirmTitle")}
                      description={tE("companyVacations.unassignConfirmDescription", {
                        name: v.name,
                      })}
                      onConfirm={() => handleUnassign(v.companyVacationId)}
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          aria-label={tE("companyVacations.unassignAction")}
                        >
                          <X className="size-3.5" />
                        </Button>
                      }
                    />
                  )}
                </td>
              </tr>
            ))}
            {assigned.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className={cn(
                    "px-3 py-4 text-center text-sm text-muted-foreground",
                  )}
                >
                  {tE("companyVacations.noneAssigned")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DetailPanel>
  );
}
