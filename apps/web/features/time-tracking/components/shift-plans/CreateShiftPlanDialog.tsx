"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { ROUTES } from "@/constants/routes";
import { createShiftPlanAction } from "../../actions/shift-plans.action";
import {
  createShiftPlanFormSchema,
  type ShiftPlanFormInput,
  type ShiftPlanFormOutput,
} from "../../schemas/shift-plan-form.schema";
import { toISODate } from "../../lib/to-iso-date";

interface Props {
  teamId: string;
}

export const CreateShiftPlanDialog = ({ teamId }: Props) => {
  const t = useTranslations("TimeTracking");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ShiftPlanFormInput, unknown, ShiftPlanFormOutput>({
    resolver: zodResolver(createShiftPlanFormSchema(t)),
    defaultValues: {},
  });

  const onSubmit = async (values: ShiftPlanFormOutput) => {
    setSubmitting(true);
    const res = await createShiftPlanAction({
      teamId,
      startDate: toISODate(values.startDate),
      endDate: toISODate(values.endDate),
    });
    setSubmitting(false);
    if (res.success) {
      toast.success(t("shiftPlanCreated"));
      setOpen(false);
      form.reset({});
      router.push(ROUTES.admin.shiftPlan(locale, res.data.id));
    } else {
      toast.error(t("shiftPlanCreateError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          {t("shiftPlanCreate")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("shiftPlanCreate")}</DialogTitle>
          <DialogDescription>{t("shiftPlanCreateDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="form-gap-y">
            <DatePickerFormField<ShiftPlanFormInput>
              name="startDate"
              label={t("shiftPlanStartDate")}
              startOfDay
              showWeekday
            />
            <DatePickerFormField<ShiftPlanFormInput>
              name="endDate"
              label={t("shiftPlanEndDate")}
              startOfDay
              showWeekday
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t("shiftPlanCancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {t("shiftPlanCreate")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
