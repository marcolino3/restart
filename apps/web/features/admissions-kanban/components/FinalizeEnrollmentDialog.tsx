"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { SelectFormFieldWithoutTranslations } from "@/components/form/form-fields/SelectFormFieldWithoutTranslations";

import {
  type EnrollmentClass,
  getClassesForEnrollmentAction,
} from "../actions/get-school-classes-for-enrollment.action";
import { finalizeEnrollmentAction } from "../actions/finalize-enrollment.action";

interface Props {
  applicationId: string;
  childName: string;
  defaultDate?: string | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const Schema = z.object({
  schoolClassId: z.string().uuid({ message: "required" }),
  enrollmentDate: z.date(),
});

type FormValues = z.infer<typeof Schema>;

export function FinalizeEnrollmentDialog({
  applicationId,
  childName,
  defaultDate,
  onClose,
  onSuccess,
}: Props) {
  const t = useTranslations("Admissions");
  const tC = useTranslations("Common");
  const router = useRouter();

  const [classes, setClasses] = useState<EnrollmentClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      schoolClassId: undefined,
      enrollmentDate: defaultDate ? new Date(defaultDate) : new Date(),
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getClassesForEnrollmentAction();
      if (cancelled) return;
      if (res.success) setClasses(res.data);
      setLoadingClasses(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    const res = await finalizeEnrollmentAction({
      applicationId,
      schoolClassId: values.schoolClassId,
      enrollmentDate: values.enrollmentDate.toISOString().slice(0, 10),
    });
    setSubmitting(false);
    if (res.success) {
      toast.success(t("enrollOk", { name: childName }));
      onSuccess?.();
      onClose();
      router.refresh();
    } else {
      toast.error(t("enrollError"), { description: res.error });
    }
  };

  const classOptions = classes.map((c) => ({
    value: c.id,
    label:
      c.gradeLevels.length > 0
        ? `${c.name} — ${c.gradeLevels.map((g) => g.name).join(", ")}`
        : c.name,
  }));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("enrollTitle", { name: childName })}</DialogTitle>
          <DialogDescription>{t("enrollDescription")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            id="finalize-enrollment-form"
          >
            <SelectFormFieldWithoutTranslations
              name="schoolClassId"
              label={t("schoolClass")}
              placeholder={t("selectSchoolClass")}
              options={classOptions}
            />
            <DatePickerFormField
              name="enrollmentDate"
              label="enrollmentDate"
              namespace="Admissions"
              disabledDate={(d) =>
                d < new Date("1900-01-01") || d > new Date("2100-01-01")
              }
            />
          </form>
        </Form>

        {/* Summary: what gets carried over on enrollment (design element). */}
        <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("enrollSummaryTitle")}
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{childName}</span>
            <Badge variant="green">{t("enrollSummaryStudent")}</Badge>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{t("enrollSummaryContacts")}</span>
            <Badge variant="green">{t("enrollSummaryContactsTarget")}</Badge>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">
              {t("enrollSummaryHistory")}
            </span>
            <Badge variant="slate">{t("enrollSummaryHistoryTarget")}</Badge>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            {tC("cancel")}
          </Button>
          <Button
            type="submit"
            form="finalize-enrollment-form"
            disabled={submitting || loadingClasses}
          >
            {t("confirmEnroll")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
