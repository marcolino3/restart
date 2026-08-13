"use client";

import { CreateButton } from "@/components/buttons/CreateButton";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { TimeScrollFormField } from "@/components/form/form-fields/TimeScrollFormField";
import { useSheet } from "@/components/providers/sheet-provider";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { reportSickLeaveAction } from "../actions/report-sick-leave.action";
import {
  ReportSickLeaveFormSchema,
  ReportSickLeaveFormType,
} from "../schemas/report-sick-leave-form.schema";

export const SickLeaveForm = () => {
  const t = useTranslations("SickLeave");
  const tCommon = useTranslations("Common");
  const { close } = useSheet();
  const router = useRouter();

  const form = useForm<ReportSickLeaveFormType>({
    resolver: zodResolver(ReportSickLeaveFormSchema),
    defaultValues: ReportSickLeaveFormSchema.parse({}),
  });

  const hasStartTime = form.watch("hasStartTime");

  const onSubmit = async (values: ReportSickLeaveFormType) => {
    try {
      const res = await reportSickLeaveAction(values);
      if (!res.success) throw new Error("reportSickLeaveFailed");
      if (res.isUnchanged) {
        // Day was already covered — the server wrote nothing and notified
        // nobody, so claiming success would be a lie.
        toast.info(t("reportAlreadyExists"));
      } else if (res.isExtension) {
        toast.success(t("reportExtended"));
      } else {
        toast.success(t("reportSuccess"));
      }
      close();
      router.refresh();
    } catch (error) {
      console.log(error);
      toast.error(tCommon("error"));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="form-gap-y">
        <DatePickerFormField
          name="date"
          label="date"
          disabledDate={(date) => {
            // A sick day may be in the past (reported late), today, or tomorrow
            // — people do call in the evening for the next day. Anything beyond
            // that is a planned absence, not a sick report.
            const latest = new Date();
            latest.setDate(latest.getDate() + 1);
            latest.setHours(23, 59, 59, 999);
            return date > latest;
          }}
        />

        <SwitchFormField
          name="hasStartTime"
          label="hasStartTime"
          namespace="SickLeave"
        />

        {hasStartTime && (
          <TimeScrollFormField
            name="startTime"
            label="startTime"
            description="startTimeDescription"
            namespace="SickLeave"
          />
        )}

        <TextareaFormField
          name="comment"
          label="comment"
          description="commentDescription"
          namespace="SickLeave"
        />

        <CreateButton isSubmitting={form.formState.isSubmitting} />
      </form>
    </Form>
  );
};
