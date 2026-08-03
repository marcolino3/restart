"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { EmployeeFunctionItem, EmployeeFunctionTranslation } from "../types";

const Document = gql`
  mutation CreateEmployeeFunction($input: CreateEmployeeFunctionInput!) {
    createEmployeeFunction(input: $input) {
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

type Response = { createEmployeeFunction: EmployeeFunctionItem };

export const createEmployeeFunctionAction = async (input: {
  translations: EmployeeFunctionTranslation[];
  sortOrder?: number;
}) => {
  try {
    const client = await serverCookieGqlClient();
    const locale = await getLocale();
    const { createEmployeeFunction } = await client.request<Response>(
      Document,
      { input },
    );
    revalidatePath(`/${locale}/admin/employee-functions`);
    revalidatePath(`/${locale}/admin/employees`);
    return { success: true as const, data: createEmployeeFunction };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
