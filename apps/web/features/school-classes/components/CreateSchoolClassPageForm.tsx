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
  CreateSchoolClassFormSchema,
  CreateSchoolClassFormOutput,
} from "../schemas/create-school-class-form.schema";
import { createSchoolClassAction } from "../actions/create-school-class.action";
import { TeacherOption } from "../actions/get-teachers.action";
import { GradeLevelItem } from "@/features/grade-levels/actions/get-grade-levels.action";
import { TeacherAssignmentField } from "./TeacherAssignmentField";

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

  // Only top-level Stufen are assignable to classes — subgroups ("Untergruppen")
  // are purely organizational and never carry class/student assignments.
  const gradeLevelOptions = gradeLevels
    .filter((gl) => gl.parentId == null)
    .map((gl) => ({
      label: gl.name,
      value: gl.id,
    }));

  const form = useForm({
    resolver: zodResolver(CreateSchoolClassFormSchema),
    defaultValues: {
      name: "",
      shortCode: "",
      gradeLevelIds: [] as string[],
      teacherIds: [] as string[],
      teachers: [] as {
        employeeId: string;
        role: "LEAD" | "ASSISTANT";
        workloadPercent: number | null;
      }[],
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
              <ColorPickerFormField name="color" label="color" width="w-full" />
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
