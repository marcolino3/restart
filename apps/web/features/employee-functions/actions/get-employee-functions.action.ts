"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { EmployeeFunctionItem } from "../types";

const Document = gql`
  query GetEmployeeFunctionsByOrgId($includeArchived: Boolean) {
    employeeFunctionsByOrgId(includeArchived: $includeArchived) {
      id
      name
      sortOrder
      isActive
      isArchived
      usageCount
      translations {
        locale
        name
      }
    }
  }
`;

type Response = {
  employeeFunctionsByOrgId: EmployeeFunctionItem[];
};

export const getEmployeeFunctionsAction = async (
  includeArchived = false,
) => {
  try {
    const client = await serverCookieGqlClient();
    const { employeeFunctionsByOrgId } = await client.request<Response>(
      Document,
      { includeArchived },
    );
    return { success: true as const, data: employeeFunctionsByOrgId };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
