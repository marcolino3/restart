"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { EmployeeFunctionItem } from "../types";

const Document = gql`
  mutation ReorderEmployeeFunctions($input: ReorderEmployeeFunctionsInput!) {
    reorderEmployeeFunctions(input: $input) {
      id
      sortOrder
    }
  }
`;

type Response = {
  reorderEmployeeFunctions: Array<Pick<EmployeeFunctionItem, "id" | "sortOrder">>;
};

export const reorderEmployeeFunctionsAction = async (ids: string[]) => {
  try {
    const client = await serverCookieGqlClient();
    const locale = await getLocale();
    const { reorderEmployeeFunctions } = await client.request<Response>(
      Document,
      { input: { ids } },
    );
    revalidatePath(`/${locale}/admin/employee-functions`);
    return { success: true as const, data: reorderEmployeeFunctions };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
