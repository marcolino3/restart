"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { FormActionButtons } from "@/components/form/form-fields/FormActionButtons";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";

import {
  StudentFormSchema,
  StudentFormOutput,
} from "../schemas/student-form.schema";
import { createStudentAction } from "../actions/create-student.action";
import { updateStudentAction } from "../actions/update-student.action";
import { StudentDetail } from "../actions/get-student-by-id.action";
import { StudentMasterDataFields } from "./StudentMasterDataFields";

interface Props {
  student?: StudentDetail;
}

export default function StudentForm({ student }: Props) {
  const tS = useTranslations("Students");
  const locale = useLocale();
  const router = useRouter();
  const isEdit = Boolean(student);

  const form = useForm({
    resolver: zodResolver(StudentFormSchema),
    defaultValues: {
      id: student?.id,
      firstName: student?.firstName ?? "",
      lastName: student?.lastName ?? "",
      dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth) : null,
      gender: student?.gender ?? "",
      enrollmentDate: student?.enrollmentDate
        ? new Date(student.enrollmentDate)
        : null,
      exitDate: student?.exitDate ? new Date(student.exitDate) : null,
      notes: student?.notes ?? "",
      preferredName: student?.preferredName ?? "",
      placeOfBirth: student?.placeOfBirth ?? "",
      firstLanguages: student?.firstLanguages ?? [],
      familyLanguages: student?.familyLanguages ?? [],
      religion: student?.religion ?? "",
      socialSecurityNumber: student?.socialSecurityNumber ?? "",
      externalStudentId: student?.externalStudentId ?? "",
      nationalities: student?.nationalities ?? [],
    },
  });

  const onSubmit = async (values: Record<string, unknown>) => {
    await handleAction({
      action: () =>
        isEdit
          ? updateStudentAction(values as StudentFormOutput)
          : createStudentAction(values as StudentFormOutput),
      successMessage: isEdit ? tS("studentUpdated") : tS("studentCreated"),
      errorMessage: isEdit
        ? tS("studentUpdateError")
        : tS("studentCreateError"),
      onSuccess: () => {
        router.push(ROUTES.admin.students(locale));
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{tS("personalData")}</h3>
          <div className="flex gap-4">
            <InputFormField name="firstName" label="firstName" width="w-1/2" />
            <InputFormField name="lastName" label="lastName" width="w-1/2" />
          </div>
          <div className="flex gap-4">
            <DatePickerFormField
              name="dateOfBirth"
              label="dateOfBirth"
              width="w-1/2"
            />
            <SelectFormField
              name="gender"
              label="gender"
              placeholder="selectPlaceholder"
              options={[
                { label: "MALE", value: "MALE" },
                { label: "FEMALE", value: "FEMALE" },
                { label: "OTHER", value: "OTHER" },
              ]}
              width="w-1/2"
            />
          </div>
          <StudentMasterDataFields />
        </section>

        <Separator />

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{tS("schoolData")}</h3>
          <InputFormField
            name="externalStudentId"
            label="externalStudentId"
            namespace="Students"
            width="w-1/2"
          />
          <div className="flex gap-4">
            <DatePickerFormField
              name="enrollmentDate"
              label="enrollmentDate"
              width="w-1/2"
              disabledDate={(date) => date < new Date("1900-01-01")}
            />
            <DatePickerFormField
              name="exitDate"
              label="exitDate"
              width="w-1/2"
              disabledDate={(date) => date < new Date("1900-01-01")}
            />
          </div>
          <InputFormField name="notes" label="notes" />
        </section>

        <FormActionButtons
          disabled={form.formState.isSubmitting}
          onCancel={() => router.push(ROUTES.admin.students(locale))}
        />
      </form>
    </Form>
  );
}
