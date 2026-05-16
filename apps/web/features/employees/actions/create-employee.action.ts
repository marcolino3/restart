"use server";

import {
  EmployeeFormSchema,
  EmployeeFormOutput,
} from "../schemas/employee-form.schema";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const CreateEmployeeDocument = gql`
  mutation CreateEmployee($createEmployeeInput: CreateEmployeeInput!) {
    createEmployee(createEmployeeInput: $createEmployeeInput) {
      id
    }
  }
`;

type CreateEmployeeResponse = {
  createEmployee: { id: string };
};

export const createEmployeeAction = async (values: EmployeeFormOutput) => {
  const locale = await getLocale();
  const parsed = EmployeeFormSchema.parse(values);
  const client = await serverCookieGqlClient();

  if (!parsed.email) {
    return { success: false as const, error: "Email is required for create" };
  }

  const input = {
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    email: parsed.email,
    persona: parsed.persona,
    ...(parsed.title ? { title: parsed.title } : {}),
    ...(parsed.dateOfBirth
      ? { dateOfBirth: parsed.dateOfBirth.toISOString().split("T")[0] }
      : {}),
    ...(parsed.socialSecurityNumber
      ? { socialSecurityNumber: parsed.socialSecurityNumber }
      : {}),
    ...(parsed.contactPhone ? { contactPhone: parsed.contactPhone } : {}),
    ...(parsed.timeTrackingEnabled
      ? { timeTrackingEnabled: parsed.timeTrackingEnabled }
      : {}),
    ...(parsed.street ? { street: parsed.street } : {}),
    ...(parsed.houseNumber ? { houseNumber: parsed.houseNumber } : {}),
    ...(parsed.addressLine2 ? { addressLine2: parsed.addressLine2 } : {}),
    ...(parsed.postalCode ? { postalCode: parsed.postalCode } : {}),
    ...(parsed.city ? { city: parsed.city } : {}),
    ...(parsed.country ? { country: parsed.country } : {}),
  };

  try {
    const { createEmployee } =
      await client.request<CreateEmployeeResponse>(CreateEmployeeDocument, {
        createEmployeeInput: input,
      });
    revalidatePath(ROUTES.admin.employees(locale));
    return { success: true as const, data: createEmployee };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
