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
    expectedVersion: parsed.expectedVersion,
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    persona: parsed.persona,
    timeTrackingEnabled: parsed.timeTrackingEnabled,
    ...(parsed.title ? { title: parsed.title } : { title: "" }),
    ...(parsed.dateOfBirth
      ? { dateOfBirth: typeof parsed.dateOfBirth === "string" ? parsed.dateOfBirth : `${parsed.dateOfBirth.getFullYear()}-${String(parsed.dateOfBirth.getMonth()+1).padStart(2,"0")}-${String(parsed.dateOfBirth.getDate()).padStart(2,"0")}` }
      : { dateOfBirth: null }),
    ...(parsed.socialSecurityNumber
      ? { socialSecurityNumber: parsed.socialSecurityNumber }
      : { socialSecurityNumber: null }),
    contactPhone: parsed.contactPhone?.trim() || null,
    street: parsed.street ?? "",
    houseNumber: parsed.houseNumber ?? "",
    addressLine2: parsed.addressLine2 ?? "",
    postalCode: parsed.postalCode ?? "",
    city: parsed.city ?? "",
    country: parsed.country ?? "",
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
