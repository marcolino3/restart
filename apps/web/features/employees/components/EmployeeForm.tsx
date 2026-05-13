"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import { SwitchFormField } from "@/components/form/form-fields/SwitchFormField";
import { DatePickerFormField } from "@/components/form/form-fields/DatePickerFormField";
import { FormActionButtons } from "@/components/form/form-fields/FormActionButtons";
import { ROUTES } from "@/constants/routes";
import { handleAction } from "@/lib/actions/handle-action";
import { Persona } from "@/gql/graphql";

import {
  EmployeeFormSchema,
  EmployeeFormOutput,
} from "../schemas/employee-form.schema";
import { createEmployeeAction } from "../actions/create-employee.action";
import { updateEmployeeAction } from "../actions/update-employee.action";
import type { EmployeeDetail } from "../actions/get-employee-by-id.action";

const mapEnumToOptions = (enumObj: Record<string, string>) =>
  Object.values(enumObj).map((value) => ({
    value,
    label: value,
  }));

const personaOptions = mapEnumToOptions(Persona);

interface Props {
  employee?: EmployeeDetail;
}

export default function EmployeeForm({ employee }: Props) {
  const t = useTranslations("Common");
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const router = useRouter();
  const isEdit = Boolean(employee);

  const user = employee?.membership?.user;
  const primaryEmail = user?.userEmails?.find((e) => e.isPrimary)?.email ?? "";

  const form = useForm({
    resolver: zodResolver(EmployeeFormSchema),
    defaultValues: {
      id: employee?.id,
      title: user?.title ?? "",
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: undefined,
      persona: (employee?.membership?.persona as Persona) ?? Persona.Employee,
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : null,
      socialSecurityNumber: "",
      contactPhone: employee?.membership?.contactPhone ?? "",
      timeTrackingEnabled: employee?.timeTrackingEnabled ?? false,
    },
  });

  const onSubmit = async (values: Record<string, unknown>) => {
    await handleAction({
      action: () =>
        isEdit
          ? updateEmployeeAction(values as EmployeeFormOutput)
          : createEmployeeAction(values as EmployeeFormOutput),
      successMessage: isEdit ? tE("employeeUpdated") : tE("employeeCreated"),
      errorMessage: isEdit
        ? tE("employeeUpdateError")
        : tE("employeeCreateError"),
      onSuccess: () => {
        router.push(ROUTES.admin.employees(locale));
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{t("personalData")}</h3>
          <SelectFormField
            name="title"
            label="title"
            placeholder="selectPlaceholder"
            options={[
              { label: "titleMr", value: "Herr" },
              { label: "titleMs", value: "Frau" },
            ]}
            width="w-1/3"
          />
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
            <InputFormField
              name="socialSecurityNumber"
              label="socialSecurityNumber"
              width="w-1/2"
            />
          </div>
        </section>

        <Separator />

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{t("contact")}</h3>
          {isEdit ? (
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("email")}</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {primaryEmail}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {t("primaryEmail")}
                </Badge>
              </div>
            </div>
          ) : (
            <InputFormField
              name="email"
              label="email"
              type="email"
              width="w-1/2"
            />
          )}
          <InputFormField
            name="contactPhone"
            label="phone"
            type="tel"
            width="w-1/2"
          />
        </section>

        <Separator />

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">{tE("employment")}</h3>
          <SelectFormField
            name="persona"
            label="persona"
            options={personaOptions}
            width="w-1/2"
          />
          <SwitchFormField
            name="timeTrackingEnabled"
            label="timeTrackingEnabled"
            description="timeTrackingEnabledDescription"
          />
        </section>

        <FormActionButtons
          disabled={form.formState.isSubmitting}
          onCancel={() => router.push(ROUTES.admin.employees(locale))}
        />
      </form>
    </Form>
  );
}
