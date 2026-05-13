"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

const UpdateEmployeeDocument = gql`
  mutation UpdateEmployee($updateEmployeeInput: UpdateEmployeeInput!) {
    updateEmployee(updateEmployeeInput: $updateEmployeeInput) {
      id
    }
  }
`;

function castValue(field: string, value: string): unknown {
  if (field === "timeTrackingEnabled") return value === "true";
  return value || undefined;
}

export const updateEmployeeFieldAction = async (
  employeeId: string,
  field: string,
  value: string,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    await client.request<{ updateEmployee: { id: string } }>(
      UpdateEmployeeDocument,
      {
        updateEmployeeInput: {
          id: employeeId,
          [field]: castValue(field, value),
        },
      },
    );
    revalidatePath(`/${locale}/admin/employees`);
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Update failed" };
  }
};
