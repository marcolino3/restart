"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const Document = gql`
  mutation ArchiveEmployeeFunction($id: ID!) {
    archiveEmployeeFunction(id: $id)
  }
`;

type Response = { archiveEmployeeFunction: boolean };

export const archiveEmployeeFunctionAction = async (id: string) => {
  try {
    const client = await serverCookieGqlClient();
    const locale = await getLocale();
    const res = await client.request<Response>(Document, { id });
    revalidatePath(`/${locale}/admin/employee-functions`);
    revalidatePath(`/${locale}/admin/employees`);
    return { success: true as const, data: res.archiveEmployeeFunction };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
