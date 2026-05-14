"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
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
import { GradeLevelItem } from "../actions/get-grade-levels.action";

interface Props {
  schoolClass: SchoolClassDetail;
  gradeLevels: GradeLevelItem[];
}

export default function EditSchoolClassPageForm({
  schoolClass,
  gradeLevels,
}: Props) {
  const tS = useTranslations("SchoolClasses");
  const locale = useLocale();
  const router = useRouter();

  const gradeLevelOptions = gradeLevels.map((gl) => ({
    label: gl.name,
    value: gl.id,
  }));

  const form = useForm({
    resolver: zodResolver(UpdateSchoolClassFormSchema),
    defaultValues: {
      id: schoolClass.id,
      name: schoolClass.name,
      gradeLevelIds: schoolClass.gradeLevels?.map((gl) => gl.id) ?? [],
      color: schoolClass.color ?? "",
      description: schoolClass.description ?? "",
      sortOrder: schoolClass.sortOrder,
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
            <InputFormField name="description" label="description" />
            <div className="flex gap-4">
              <InputFormField
                name="color"
                label="color"
                type="color"
                width="w-1/4"
              />
              <InputFormField name="room" label="room" width="w-1/4" />
              <InputFormField
                name="maxCapacity"
                label="maxCapacity"
                type="number"
                width="w-1/4"
              />
              <InputFormField
                name="sortOrder"
                label="sortOrder"
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
