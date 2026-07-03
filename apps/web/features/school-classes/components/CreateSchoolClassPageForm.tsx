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
  CreateSchoolClassFormSchema,
  CreateSchoolClassFormOutput,
} from "../schemas/create-school-class-form.schema";
import { createSchoolClassAction } from "../actions/create-school-class.action";
import { TeacherOption } from "../actions/get-teachers.action";
import { GradeLevelItem } from "@/features/grade-levels/actions/get-grade-levels.action";

interface Props {
  gradeLevels: GradeLevelItem[];
  teachers: TeacherOption[];
}

export default function CreateSchoolClassPageForm({
  gradeLevels,
  teachers,
}: Props) {
  const tS = useTranslations("SchoolClasses");
  const locale = useLocale();
  const router = useRouter();

  const gradeLevelOptions = gradeLevels.map((gl) => ({
    label: gl.name,
    value: gl.id,
  }));

  const teacherOptions = teachers.map((t) => ({
    label: `${t.firstName} ${t.lastName}`.trim(),
    value: t.id,
  }));

  const form = useForm({
    resolver: zodResolver(CreateSchoolClassFormSchema),
    defaultValues: {
      name: "",
      gradeLevelIds: [] as string[],
      teacherIds: [] as string[],
      color: null as string | null,
      description: "",
      maxCapacity: "" as unknown as number,
      room: "",
    },
  });

  const onSubmit = async (values: Record<string, unknown>) => {
    await handleAction({
      action: () =>
        createSchoolClassAction(values as CreateSchoolClassFormOutput),
      successMessage: tS("schoolClassCreated"),
      errorMessage: tS("schoolClassCreateError"),
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
    </Form>
  );
}
