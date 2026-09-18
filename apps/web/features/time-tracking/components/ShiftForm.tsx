"use client";

import { useMemo } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { NamedColorPickerFormField } from "@/components/form/form-fields/NamedColorPickerFormField";
import { useSheet } from "@/components/providers/sheet-provider";
import {
  breakMinutes,
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

export const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

const isTime = (v: string | undefined) => TIME_HH_MM_RE.test(v ?? "");

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
          breaks: shift.breaks.map((b) => ({
            startTime: b.startTime,
            endTime: b.endTime,
          })),
        }
      : {
          name: "",
          startTime: "07:00",
          endTime: "12:00",
          color: null,
          breaks: [],
        },
  });

  const breaksArray = useFieldArray({ control: form.control, name: "breaks" });

  const [startTime, endTime, breaks] = useWatch({
    control: form.control,
    name: ["startTime", "endTime", "breaks"],
  });
  const timesValid = isTime(startTime) && isTime(endTime);
  const crossesMidnight = timesValid && endTime < startTime;
  const validBreaks = (breaks ?? []).filter(
    (b) => isTime(b?.startTime) && isTime(b?.endTime),
  );
  const gross =
    timesValid && startTime !== endTime
      ? shiftDurationMinutes(startTime, endTime)
      : null;
  const net = gross === null ? null : gross - breakMinutes(validBreaks);

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
          placeholder={t("shiftNamePlaceholder")}
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
        {gross !== null && net !== null ? (
          <p className="text-xs text-muted-foreground tabular-nums">
            {t("shiftDuration", { duration: formatDuration(gross) })}
            {validBreaks.length > 0 && net > 0
              ? ` · ${t("shiftNetDuration", { duration: formatDuration(net) })}`
              : null}
            {crossesMidnight ? ` · ${t("shiftCrossesMidnight")}` : null}
          </p>
        ) : null}

        <fieldset className="space-y-2">
          <div className="flex items-center justify-between">
            <legend className="text-sm font-medium">{t("shiftBreaks")}</legend>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={breaksArray.fields.length >= 10}
              onClick={() =>
                breaksArray.append({ startTime: "12:00", endTime: "12:30" })
              }
            >
              <Plus className="size-4" /> {t("addBreak")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{t("shiftBreaksHelp")}</p>
          {breaksArray.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_1fr_auto] items-end gap-2"
            >
              <InputFormField
                name={`breaks.${index}.startTime`}
                type="time"
                label="shiftBreakFrom"
                namespace="TimeTracking"
              />
              <InputFormField
                name={`breaks.${index}.endTime`}
                type="time"
                label="shiftBreakTo"
                namespace="TimeTracking"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mb-0.5"
                aria-label={t("removeBreak")}
                onClick={() => breaksArray.remove(index)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </fieldset>

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
