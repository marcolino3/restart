"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
import { ColorPickerFormField } from "@/components/form/form-fields/ColorPickerFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { ComboboxFormField } from "@/components/form/form-fields/ComboboxFormField";
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

interface Props {
  schoolClass: SchoolClassDetail;
  gradeLevels: GradeLevelItem[];
  teachers: TeacherOption[];
}

export default function EditSchoolClassPageForm({
  schoolClass,
  gradeLevels,
  teachers,
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

  const teacherOptions = teachers.map((t) => ({
    label: `${t.firstName} ${t.lastName}`.trim(),
    value: t.id,
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
      gradeLevelIds: schoolClass.gradeLevels?.map((gl) => gl.id) ?? [],
      teacherIds: schoolClass.teachers?.map((t) => t.id) ?? [],
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{tS("classDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="form-gap-y">
            <InputFormField name="name" label="name" />
            <ComboboxFormField
              name="gradeLevelIds"
              label="gradeLevel"
              options={gradeLevelOptions}
              multiple
              translateOptions={false}
              width="w-full"
            />
            <ComboboxFormField
              name="teacherIds"
              label="teachers"
              namespace="SchoolClasses"
              options={teacherOptions}
              multiple
              translateOptions={false}
              width="w-full"
            />
            <InputFormField name="description" label="description" />
            <div className="flex gap-4">
              <ColorPickerFormField name="color" label="color" width="w-1/4" />
              <InputFormField name="room" label="room" width="w-1/4" />
              <InputFormField
                name="maxCapacity"
                label="maxCapacity"
                type="number"
                width="w-1/4"
              />
            </div>
          </CardContent>
        </Card>

        <FormActionButtons
          disabled={form.formState.isSubmitting}
          onCancel={() => router.push(ROUTES.admin.schoolClasses(locale))}
        />
      </form>

      {/* SuperAdmin-only impersonation panel. The component renders nothing
          for non-SuperAdmin users — no PII leak. */}
      <div className="mt-6">
        <TeacherImpersonateList teachers={impersonatableTeachers} />
      </div>
    </Form>
  );
}
