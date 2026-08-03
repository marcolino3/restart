"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { EmployeeFunctionItem, EmployeeFunctionTranslation } from "../types";

const Document = gql`
  mutation UpdateEmployeeFunction($input: UpdateEmployeeFunctionInput!) {
    updateEmployeeFunction(input: $input) {
      id
      name
      sortOrder
      isActive
      isArchived
      translations {
        locale
        name
      }
    }
  }
`;

type Response = { updateEmployeeFunction: EmployeeFunctionItem };

export const updateEmployeeFunctionAction = async (input: {
  id: string;
  translations: EmployeeFunctionTranslation[];
}) => {
  try {
    const client = await serverCookieGqlClient();
    const locale = await getLocale();
    const { updateEmployeeFunction } = await client.request<Response>(
      Document,
      { input },
    );
    revalidatePath(`/${locale}/admin/employee-functions`);
    revalidatePath(`/${locale}/admin/employees`);
    return { success: true as const, data: updateEmployeeFunction };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
