"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import {
  EmployeeFormSchema,
  EmployeeFormOutput,
} from "../schemas/employee-form.schema";

const UpdateEmployeeDocument = gql`
  mutation UpdateEmployee($updateEmployeeInput: UpdateEmployeeInput!) {
    updateEmployee(updateEmployeeInput: $updateEmployeeInput) {
      id
    }
  }
`;

export const updateEmployeeAction = async (values: EmployeeFormOutput) => {
  const locale = await getLocale();
  const parsed = EmployeeFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  if (!parsed.id) {
    return { success: false as const, error: "Missing employee id" };
  }

  const input = {
    id: parsed.id,
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    persona: parsed.persona,
    timeTrackingEnabled: parsed.timeTrackingEnabled,
    ...(parsed.title ? { title: parsed.title } : { title: "" }),
    ...(parsed.dateOfBirth
      ? { dateOfBirth: parsed.dateOfBirth.toISOString().split("T")[0] }
      : {}),
    ...(parsed.socialSecurityNumber
      ? { socialSecurityNumber: parsed.socialSecurityNumber }
      : {}),
    ...(parsed.contactPhone ? { contactPhone: parsed.contactPhone } : {}),
  };

  try {
    const { updateEmployee } = await client.request<{
      updateEmployee: { id: string };
    }>(UpdateEmployeeDocument, {
      updateEmployeeInput: input,
    });
    revalidatePath(`/${locale}/admin/employees`);
    return { success: true as const, data: updateEmployee };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to update employee" };
  }
};
