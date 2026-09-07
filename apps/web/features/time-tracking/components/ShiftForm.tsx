"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { NamedColorPickerFormField } from "@/components/form/form-fields/NamedColorPickerFormField";
import { useSheet } from "@/components/providers/sheet-provider";
import {
  createShiftFormSchema,
  shiftDurationMinutes,
  TIME_HH_MM_RE,
  type ShiftFormInput,
  type ShiftFormOutput,
} from "../schemas/shift-form.schema";
import {
  createShiftAction,
  updateShiftAction,
  type Shift,
} from "../actions/shifts.action";

interface Props {
  /** Edit an existing shift; omit to create. */
  shift?: Shift;
}

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

export const ShiftForm = ({ shift }: Props) => {
  const t = useTranslations("TimeTracking");
  const tc = useTranslations("Common");
  const router = useRouter();
  const { close } = useSheet();

  const schema = useMemo(() => createShiftFormSchema(t), [t]);

  const form = useForm<ShiftFormInput, unknown, ShiftFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: shift
      ? {
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
          color: shift.color,
        }
      : { name: "", startTime: "07:00", endTime: "12:00", color: null },
  });

  const [startTime, endTime] = useWatch({
    control: form.control,
    name: ["startTime", "endTime"],
  });
  const timesValid =
    TIME_HH_MM_RE.test(startTime ?? "") && TIME_HH_MM_RE.test(endTime ?? "");
  const crossesMidnight = timesValid && endTime < startTime;

  const onSubmit = async (values: ShiftFormOutput) => {
    const { success } = shift
      ? await updateShiftAction({ id: shift.id, ...values })
      : await createShiftAction(values);
    if (success) {
      toast.success(shift ? t("shiftSaved") : t("shiftCreated"));
      close();
      router.refresh();
    } else {
      toast.error(t("shiftSaveError"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="form-gap-y">
        <InputFormField
          name="name"
          label="shiftName"
          placeholder="shiftNamePlaceholder"
          namespace="TimeTracking"
        />
        <div className="grid grid-cols-2 gap-4">
          <InputFormField
            name="startTime"
            type="time"
            label="shiftStart"
            namespace="TimeTracking"
          />
          <InputFormField
            name="endTime"
            type="time"
            label="shiftEnd"
            namespace="TimeTracking"
          />
        </div>
        {timesValid && startTime !== endTime ? (
          <p className="text-xs text-muted-foreground tabular-nums">
            {t("shiftDuration", {
              duration: formatDuration(shiftDurationMinutes(startTime, endTime)),
            })}
            {crossesMidnight ? ` · ${t("shiftCrossesMidnight")}` : null}
          </p>
        ) : null}
        <NamedColorPickerFormField
          name="color"
          label="shiftColor"
          description="shiftColorHelp"
          namespace="TimeTracking"
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {shift ? tc("save") : t("addShift")}
        </Button>
      </form>
    </Form>
  );
};
