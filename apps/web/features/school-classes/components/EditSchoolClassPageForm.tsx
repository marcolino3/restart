"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
import { ColorPickerFormField } from "@/components/form/form-fields/ColorPickerFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { ComboboxFormField } from "@/components/form/form-fields/ComboboxFormField";
import { TextareaFormField } from "@/components/form/form-fields/TextareaFormField";
import { FormActionButtons } from "@/components/form/form-fields/FormActionButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";

import {
  UpdateSchoolClassFormSchema,
  UpdateSchoolClassFormType,
} from "../schemas/update-school-class-form.schema";
import { updateSchoolClassAction } from "../actions/update-school-class.action";
import { SchoolClassDetail } from "../actions/get-school-class-by-id.action";
import { TeacherOption } from "../actions/get-teachers.action";
import { GradeLevelItem } from "@/features/grade-levels/actions/get-grade-levels.action";
import { TeacherImpersonateList } from "@/features/auth/components/TeacherImpersonateList";
import { TeacherAssignmentField } from "./TeacherAssignmentField";
import { SchoolClassSummaryAside } from "./SchoolClassSummaryAside";

interface Props {
  schoolClass: SchoolClassDetail;
  gradeLevels: GradeLevelItem[];
  teachers: TeacherOption[];
  /** Label of the school year the class currently sits in, e.g. "2026/27". */
  schoolYearLabel?: string | null;
}

export default function EditSchoolClassPageForm({
  schoolClass,
  gradeLevels,
  teachers,
  schoolYearLabel,
}: Props) {
  const tS = useTranslations("SchoolClasses");
  const locale = useLocale();
  const router = useRouter();

  // Only top-level Stufen are assignable to classes — subgroups ("Untergruppen")
  // are purely organizational and never carry class/student assignments.
  const gradeLevelOptions = gradeLevels
    .filter((gl) => gl.parentId == null)
    .map((gl) => ({
      label: gl.name,
      value: gl.id,
    }));

  // Build the impersonatable list from the teachers currently assigned to the class.
  // Looks up the userId via the org-wide teachers list we already have.
  const assignedTeacherIds = new Set(
    schoolClass.teachers?.map((t) => t.id) ?? [],
  );
  const impersonatableTeachers = teachers
    .filter((t) => assignedTeacherIds.has(t.id))
    .map((t) => ({
      employeeId: t.id,
      userId: t.userId ?? null,
      firstName: t.firstName,
      lastName: t.lastName,
    }));

  const form = useForm({
    resolver: zodResolver(UpdateSchoolClassFormSchema),
    defaultValues: {
      id: schoolClass.id,
      name: schoolClass.name,
      shortCode: schoolClass.shortCode ?? "",
      gradeLevelIds: schoolClass.gradeLevels?.map((gl) => gl.id) ?? [],
      // Assignments carry role and workload. `teacherIds` stays empty so the
      // backend takes this richer list instead.
      teachers: (schoolClass.teacherAssignments ?? []).map((a) => ({
        employeeId: a.employeeId,
        role: a.role,
        workloadPercent: a.workloadPercent ?? null,
      })),
      color: schoolClass.color ?? null,
      description: schoolClass.description ?? "",
      maxCapacity: schoolClass.maxCapacity ?? ("" as unknown as number),
      room: schoolClass.room ?? "",
    },
  });

  const onSubmit = async (values: Record<string, unknown>) => {
    await handleAction({
      action: () =>
        updateSchoolClassAction(values as UpdateSchoolClassFormType),
      successMessage: tS("schoolClassUpdated"),
      errorMessage: tS("schoolClassUpdateError"),
      onSuccess: () => {
        router.push(ROUTES.admin.schoolClasses(locale));
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{tS("classDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="form-gap-y">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputFormField name="name" label="name" width="w-full" />
                  <InputFormField
                    name="shortCode"
                    label="shortCode"
                    namespace="SchoolClasses"
                    width="w-full"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ComboboxFormField
                    name="gradeLevelIds"
                    label="gradeLevel"
                    options={gradeLevelOptions}
                    multiple
                    translateOptions={false}
                    width="w-full"
                  />
                  <InputFormField name="room" label="room" width="w-full" />
                </div>
                <TextareaFormField name="description" label="description" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tS("teachers")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  {tS("teachersHint")}
                </p>
                <TeacherAssignmentField name="teachers" teachers={teachers} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tS("capacity")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InputFormField
                    name="maxCapacity"
                    label="maxCapacity"
                    type="number"
                    width="w-full"
                  />
                  <ColorPickerFormField
                    name="color"
                    label="color"
                    width="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            <FormActionButtons
              disabled={form.formState.isSubmitting}
              onCancel={() => router.push(ROUTES.admin.schoolClasses(locale))}
            />
          </div>

          <aside className="space-y-6">
            <SchoolClassSummaryAside
              gradeLevels={gradeLevels}
              enrolledCount={schoolClass.enrolledCount}
              schoolYearLabel={schoolYearLabel}
              isActive={schoolClass.isActive}
            />
            {/* SuperAdmin-only impersonation panel. The component renders
                nothing for non-SuperAdmin users — no PII leak. */}
            <TeacherImpersonateList teachers={impersonatableTeachers} />
          </aside>
        </div>
      </form>
    </Form>
  );
}
