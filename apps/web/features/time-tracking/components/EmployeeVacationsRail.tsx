"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { format, eachDayOfInterval, isWeekend } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Calendar, Info, X, CalendarOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { DateRangePickerFormField } from "@/components/form/form-fields/DateRangePickerFormField";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmployeeVacationAccrualTypeValues } from "../schemas/settings-form.schema";
import type { EmployeeVacationAccrualType } from "../actions/employee-vacations.action";

import type { CompanyVacation, Holiday } from "../actions/settings.action";
import {
  assignCompanyVacationAction,
  unassignCompanyVacationAction,
  type EmployeeCompanyVacation,
} from "../actions/company-vacation-assignments.action";
import {
  createEmployeeVacationAction,
  deleteEmployeeVacationAction,
  type EmployeeVacationSegment,
} from "../actions/employee-vacations.action";
import {
  createEmployeeVacationFormSchema,
  type EmployeeVacationFormInput,
} from "../schemas/settings-form.schema";

function accrualLabelKey(option: EmployeeVacationAccrualType): string {
  switch (option) {
    case "CHARGED":
      return "Charged";
    case "PAID_NO_CHARGE":
      return "PaidNoCharge";
    case "UNPAID":
      return "Unpaid";
  }
}

type VacationRow = {
  kind: "company" | "individual";
  id: string;
  sourceId: string;
  name: string | null;
  startDate: string;
  endDate: string;
  effectiveDays: number;
  periodStartDate: string;
  periodEndDate: string;
};

interface Props {
  employeeId: string;
  assigned: EmployeeCompanyVacation[];
  allCompanyVacations: CompanyVacation[];
  individualVacations: EmployeeVacationSegment[];
  holidays: Holiday[];
  remainingVacationDays: number | null | undefined;
  editable?: boolean;
}

export default function EmployeeVacationsRail({
  employeeId,
  assigned,
  allCompanyVacations,
  individualVacations,
  holidays,
  remainingVacationDays,
  editable,
}: Props) {
  const tE = useTranslations("Employees");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [assignOpen, setAssignOpen] = useState(false);
  const [individualFormOpen, setIndividualFormOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const dateLocale = locale === "de" ? de : enUS;
  const today = format(new Date(), "yyyy-MM-dd");

  const fmtShortRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
    const startFmt = sameMonth ? format(s, "d.", { locale: dateLocale }) : format(s, "d. MMM", { locale: dateLocale });
    return `${startFmt} – ${format(e, "d. MMM yyyy", { locale: dateLocale })}`;
  };

  const rows: VacationRow[] = [
    ...assigned.map(
      (v): VacationRow => ({
        kind: "company",
        id: v.id,
        sourceId: v.companyVacationId,
        name: v.name,
        startDate: v.startDate,
        endDate: v.endDate,
        effectiveDays: v.effectiveDays,
        periodStartDate: v.periodStartDate,
        periodEndDate: v.periodEndDate,
      }),
    ),
    ...individualVacations.map(
      (v): VacationRow => ({
        kind: "individual",
        id: v.id,
        sourceId: v.employeeVacationId,
        name: v.name,
        startDate: v.startDate,
        endDate: v.endDate,
        effectiveDays: v.effectiveDays,
        periodStartDate: v.periodStartDate,
        periodEndDate: v.periodEndDate,
      }),
    ),
  ].sort((a, b) => a.startDate.localeCompare(b.startDate));

  const assignedIds = new Set(assigned.map((v) => v.companyVacationId));

  const assignableOptions = allCompanyVacations.filter(
    (v) => !assignedIds.has(v.id),
  );

  const toggleSelected = (vacationId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(vacationId)) next.delete(vacationId);
      else next.add(vacationId);
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
        toast.success(tE("vacations.assigned"));
        router.refresh();
      } else {
        toast.error(tE("vacations.error"));
      }
      setSelectedIds(new Set());
      setAssignOpen(false);
    });
  };

  const handleUnassign = async (vacationId: string) => {
    const res = await unassignCompanyVacationAction(vacationId, employeeId);
    if (res.success) router.refresh();
    return { success: res.success };
  };

  const handleDeleteIndividual = async (id: string) => {
    const res = await deleteEmployeeVacationAction(id, employeeId);
    if (res.success) router.refresh();
    return { success: res.success };
  };

  const defaultFormValues: Partial<EmployeeVacationFormInput> = {
    name: "",
    startDate: undefined,
    endDate: undefined,
    accrualType: "CHARGED",
    remark: "",
  };

  const form = useForm<EmployeeVacationFormInput>({
    resolver: zodResolver(createEmployeeVacationFormSchema(tCommon)),
    defaultValues: defaultFormValues,
  });

  const onSubmitIndividual = form.handleSubmit((values) => {
    startTransition(async () => {
      const res = await createEmployeeVacationAction({
        employeeId,
        name: values.name || undefined,
        startDate: format(values.startDate, "yyyy-MM-dd"),
        endDate: format(values.endDate, "yyyy-MM-dd"),
        accrualType: values.accrualType,
        remark: values.remark || undefined,
      });
      if (res.success) {
        toast.success(tE("vacations.individualSaved"));
        form.reset(defaultFormValues);
        setIndividualFormOpen(false);
        router.refresh();
      } else {
        toast.error(tE("vacations.error"));
      }
    });
  });

  const watchStart = form.watch("startDate");
  const watchEnd = form.watch("endDate");
  const previewWorkDays =
    watchStart && watchEnd && watchEnd >= watchStart
      ? eachDayOfInterval({ start: watchStart, end: watchEnd }).filter(
          (d) => !isWeekend(d),
        ).length
      : null;

  const totalAssignedDays = rows.reduce((sum, r) => sum + r.effectiveDays, 0);

  const upcomingHolidays = holidays
    .filter((h) => h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="rounded-card border bg-card p-[18px] shadow-xs">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-sm font-bold">{tE("tabCompanyVacations")}</h3>
          <span className="rounded-full bg-field px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {rows.length}
          </span>
          {editable && (
            <span className="ml-auto flex gap-1">
              <Popover open={assignOpen} onOpenChange={setAssignOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    title={tE("mz.manageCompanyVacations")}
                  >
                    <Calendar className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <Command>
                    <CommandInput placeholder={tE("vacations.searchPlaceholder")} />
                    <CommandList>
                      <CommandEmpty>{tE("vacations.noneAssignable")}</CommandEmpty>
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
                        {tE("vacations.assignSelected")}
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </span>
          )}
        </div>

        <p className="mb-3 text-xs text-muted-foreground">{tE("mz.vacationHint")}</p>

        <div className="space-y-1.5">
          {rows.map((v) => {
            const isNow = v.startDate <= today && v.endDate >= today;
            const isPast = v.endDate < today;
            const barColor = isNow
              ? "bg-primary"
              : v.kind === "individual"
                ? "bg-status-sky-foreground"
                : isPast
                  ? "bg-border"
                  : "bg-status-green-foreground";
            return (
              <div
                key={`${v.kind}-${v.id}`}
                className={cn(
                  "group flex items-center gap-2.5 rounded-ctl px-2 py-1.5",
                  isPast && "opacity-50",
                )}
              >
                <span className={cn("h-8 w-1 shrink-0 rounded-full", barColor)} />
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-sm">
                    {v.name ??
                      (v.kind === "individual"
                        ? tE("vacations.typeIndividual")
                        : tE("vacations.typeCompany"))}
                  </b>
                  <small className="block truncate text-xs text-muted-foreground">
                    {fmtShortRange(v.startDate, v.endDate)}
                    {v.kind === "individual" && ` · ${tE("vacations.typeIndividual")}`}
                  </small>
                </span>
                <span className="shrink-0 text-right font-mono text-[15px] font-semibold leading-tight tabular-nums">
                  {v.effectiveDays}
                  <small className="block font-sans text-[10px] font-medium tracking-wide text-muted-foreground">
                    {tE("mz.daysUnit")}
                  </small>
                </span>
                {editable && (
                  <DeleteConfirmationDialog
                    title={
                      v.kind === "company"
                        ? tE("vacations.unassignConfirmTitle")
                        : tE("vacations.deleteConfirmTitle")
                    }
                    description={
                      v.kind === "company"
                        ? tE("vacations.unassignConfirmDescription", { name: v.name ?? "" })
                        : tE("vacations.deleteConfirmDescription", { name: v.name ?? "" })
                    }
                    onConfirm={() =>
                      v.kind === "company"
                        ? handleUnassign(v.sourceId)
                        : handleDeleteIndividual(v.sourceId)
                    }
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
                        aria-label={
                          v.kind === "company"
                            ? tE("vacations.unassignAction")
                            : tE("vacations.deleteAction")
                        }
                      >
                        <X className="size-3.5" />
                      </Button>
                    }
                  />
                )}
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="py-3 text-center text-sm text-muted-foreground">
              {tE("vacations.noneInPeriod")}
            </p>
          )}
        </div>

        {editable && (
          <>
            <button
              type="button"
              onClick={() => setIndividualFormOpen(true)}
              className="mt-2.5 inline-flex w-auto items-center rounded-ctl border-[1.5px] border-dashed border-border bg-transparent px-3 py-1.5 text-center text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              + {tE("vacations.addIndividual")}
            </button>

            <Dialog
              open={individualFormOpen}
              onOpenChange={(o) => {
                setIndividualFormOpen(o);
                if (!o) form.reset(defaultFormValues);
              }}
            >
              <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                  <DialogTitle>{tE("vacations.addIndividual")}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  {tE("vacations.individualHint")}
                </p>
                <Form {...form}>
                  <form onSubmit={onSubmitIndividual} className="space-y-3">
                    <InputFormField
                      name="name"
                      label="vacations.individualNameLabel"
                      namespace="Employees"
                    />
                    <DateRangePickerFormField<EmployeeVacationFormInput>
                      startName="startDate"
                      endName="endDate"
                      label="vacations.individualRangeLabel"
                      namespace="Employees"
                      disabledDate={(date) => date < new Date("1900-01-01")}
                    />
                    <FormField
                      name="accrualType"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tE("vacations.accrualLabel")}</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {EmployeeVacationAccrualTypeValues.map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => field.onChange(option)}
                                className={cn(
                                  "rounded-full border px-3 py-1.5 text-xs font-semibold",
                                  field.value === option
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-field text-muted-foreground hover:bg-muted",
                                )}
                              >
                                {tE(`vacations.accrual${accrualLabelKey(option)}`)}
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <TextareaFormField
                      name="remark"
                      label="vacations.remarkLabel"
                      placeholder={tE("vacations.remarkPlaceholder")}
                      namespace="Employees"
                    />
                    {previewWorkDays != null && (
                      <p className="flex items-start gap-1.5 rounded-ctl bg-field p-2.5 text-xs text-muted-foreground">
                        <Info className="mt-0.5 size-3.5 shrink-0" />
                        {tE("vacations.individualDaysPreview", { count: previewWorkDays })}
                      </p>
                    )}
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIndividualFormOpen(false)}
                      >
                        {tCommon("cancel")}
                      </Button>
                      <Button type="submit" disabled={isPending}>
                        {tE("vacations.addIndividual")}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
          <span>
            <small className="block text-xs text-muted-foreground">
              {tE("mz.assignedTotal")}
            </small>
            <b>
              {totalAssignedDays} {tE("mz.daysUnit")}
            </b>
          </span>
          <span className="text-right">
            <small className="block text-xs text-muted-foreground">
              {tE("mz.remainingTotal")}
            </small>
            <b>
              {remainingVacationDays != null ? remainingVacationDays : "–"}{" "}
              {tE("mz.daysUnit")}
            </b>
          </span>
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {tE("mz.calendarHint")}
        </p>
      </div>

      <div className="rounded-card border bg-card p-[18px] shadow-xs">
        <h3 className="mb-2 text-sm font-bold">{tE("mz.nextClosures")}</h3>
        <div className="space-y-1">
          {upcomingHolidays.map((h) => (
            <div key={h.id} className="flex items-center gap-2.5 py-1.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-status-amber text-status-amber-foreground">
                <CalendarOff className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-sm">{h.name}</b>
                <small className="block text-xs text-muted-foreground">
                  {format(new Date(h.date), "EEE, d. MMMM yyyy", { locale: dateLocale })}
                </small>
              </span>
            </div>
          ))}
          {upcomingHolidays.length === 0 && (
            <p className="py-3 text-center text-sm text-muted-foreground">
              {tE("vacations.noneInPeriod")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
