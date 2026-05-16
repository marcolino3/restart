"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Form } from "@/components/ui/form";
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
import {
  PersonalEmploymentSection,
  AddressSection,
} from "./EmployeeFormSections";

interface Props {
  employee?: EmployeeDetail;
  orgCountry?: string | null;
}

export default function EmployeeForm({ employee, orgCountry }: Props) {
  const tE = useTranslations("Employees");
  const locale = useLocale();
  const router = useRouter();
  const isEdit = Boolean(employee);

  const user = employee?.membership?.user;

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
      socialSecurityNumber: user?.socialSecurityNumber ?? "",
      contactPhone: employee?.membership?.contactPhone ?? "",
      timeTrackingEnabled: employee?.timeTrackingEnabled ?? false,
      street: user?.street ?? "",
      houseNumber: user?.houseNumber ?? "",
      addressLine2: user?.addressLine2 ?? "",
      postalCode: user?.postalCode ?? "",
      city: user?.city ?? "",
      country: user?.country ?? orgCountry ?? "",
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
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="px-4 sm:px-0">
          <h3 className="text-base/7 font-semibold text-foreground">
            {tE("employeeInformation")}
          </h3>
          <p className="mt-1 max-w-2xl text-sm/6 text-muted-foreground">
            {tE("employeeDetails")}
          </p>
        </div>
        <div className="mt-6">
          <PersonalEmploymentSection
            employee={employee}
            orgCountry={orgCountry}
            isEdit={isEdit}
          />
        </div>

        <div className="mt-10 px-4 sm:px-0">
          <h3 className="text-base/7 font-semibold text-foreground">
            {tE("addressInformation")}
          </h3>
        </div>
        <div className="mt-6">
          <AddressSection />
        </div>

        <FormActionButtons
          disabled={form.formState.isSubmitting}
          onCancel={() => router.push(ROUTES.admin.employees(locale))}
        />
      </form>
    </Form>
  );
}
