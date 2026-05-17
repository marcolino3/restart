"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { SelectFormFieldWithoutTranslations } from "@/components/form/form-fields/SelectFormFieldWithoutTranslations";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { EnrollmentItem } from "../actions/get-student-enrollments.action";
import { updateEnrollmentAction } from "../actions/update-enrollment.action";
import { transferStudentAction } from "@/features/students-kanban/actions/transfer-student.action";
import { handleAction } from "@/lib/actions/handle-action";
import { SchoolClassListItem } from "@/features/school-classes/actions/get-school-classes.action";

interface Props {
  studentId: string;
  enrollments: EnrollmentItem[];
  schoolClasses: SchoolClassListItem[];
}

const EnrollmentFormSchema = z.object({
  schoolClassId: z.string().min(1),
  enrolledAt: z.date(),
});
type EnrollmentFormValues = z.infer<typeof EnrollmentFormSchema>;

export function StudentEnrollmentsList({
  studentId,
  enrollments: initialEnrollments,
  schoolClasses,
}: Props) {
  const tS = useTranslations("Students");
  const [enrollments, setEnrollments] =
    React.useState<EnrollmentItem[]>(initialEnrollments);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(EnrollmentFormSchema),
    defaultValues: {
      schoolClassId: "",
      enrolledAt: new Date(),
    },
  });

  const activeEnrollments = enrollments.filter((e) => !e.leftAt);
  const pastEnrollments = enrollments.filter((e) => e.leftAt);

  const handleAssign = async (values: EnrollmentFormValues) => {
    const enrolledAtStr = values.enrolledAt.toISOString().split("T")[0];

    // Transfer-Semantik: aktive Einschreibung(en) werden auf transferDate
    // beendet, neue wird ab transferDate erstellt — alles in einer Tx.
    // Idempotent bei Re-Zuweisung auf dieselbe Klasse.
    await handleAction({
      action: () =>
        transferStudentAction({
          studentId,
          targetSchoolClassId: values.schoolClassId,
          transferDate: enrolledAtStr,
        }),
      successMessage: tS("enrollmentCreated"),
      errorMessage: tS("enrollmentCreateError"),
      onSuccess: () => {
        setDialogOpen(false);
        form.reset({ schoolClassId: "", enrolledAt: new Date() });
        // Server-Action ruft revalidateTag(studentEnrollmentsTag(studentId)) auf —
        // Next refresht das RSC-Segment automatisch.
      },
    });
  };

  const handleMarkAsLeft = async (enrollmentId: string) => {
    const today = new Date().toISOString().split("T")[0];

    await handleAction({
      action: () => updateEnrollmentAction(enrollmentId, today, studentId),
      successMessage: tS("enrollmentUpdated"),
      errorMessage: tS("enrollmentUpdateError"),
      onSuccess: () => {
        setEnrollments((prev) =>
          prev.map((e) =>
            e.id === enrollmentId ? { ...e, leftAt: today } : e,
          ),
        );
      },
    });
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("de-CH");

  const schoolClassOptions = schoolClasses.map((sc) => ({
    label: sc.name,
    value: sc.id,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{tS("classEnrollments")}</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                {tS("assignClass")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{tS("assignClass")}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleAssign)}
                  className="space-y-4"
                >
                  <SelectFormFieldWithoutTranslations
                    name="schoolClassId"
                    label={tS("selectClass")}
                    placeholder={tS("selectClass")}
                    options={schoolClassOptions}
                  />
                  <DatePickerFormField
                    name="enrolledAt"
                    label="enrolledAt"
                    namespace="Students"
                    disabledDate={() => false}
                  />
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full"
                  >
                    {tS("assignClass")}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tS("noEnrollments")}</p>
        ) : (
          <div className="space-y-4">
            {activeEnrollments.length > 0 && (
              <div className="space-y-2">
                {activeEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between rounded-md border px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="default">{tS("currentClass")}</Badge>
                      <span className="font-medium">
                        {enrollment.schoolClass.name}
                      </span>
                      {enrollment.schoolClass.gradeLevels?.map((gl) => (
                        <Badge key={gl.id} variant="secondary">
                          {gl.name}
                        </Badge>
                      ))}
                      <span className="text-sm text-muted-foreground">
                        {tS("enrolledAt")}: {formatDate(enrollment.enrolledAt)}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsLeft(enrollment.id)}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {tS("markAsLeft")}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {pastEnrollments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  {tS("pastClasses")}
                </h4>
                {pastEnrollments.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-3 rounded-md border px-4 py-3 opacity-60"
                  >
                    <span className="font-medium">
                      {enrollment.schoolClass.name}
                    </span>
                    {enrollment.schoolClass.gradeLevels?.map((gl) => (
                      <Badge key={gl.id} variant="outline">
                        {gl.name}
                      </Badge>
                    ))}
                    <span className="text-sm text-muted-foreground">
                      {formatDate(enrollment.enrolledAt)} &ndash;{" "}
                      {formatDate(enrollment.leftAt!)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
