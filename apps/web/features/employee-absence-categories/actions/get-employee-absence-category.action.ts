"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { AbsenceCategoryItem } from "../types";

const Document = gql`
  query EmployeeAbsenceCategoryById($id: ID!) {
    employeeAbsenceCategoryById(id: $id) {
      id
      systemCode
      isSystem
      isActive
      countsAsWorkTime
      isPaid
      affectsVacationBalance
      defaultIsVacationCapable
      reducesVacationEntitlementAfterDays
      requiresCertificate
      certificateRequiredFromDay
      maxDaysPerYear
      defaultPercentage
      requiresApproval
      color
      iconName
      sortOrder
      translations {
        locale
        name
        description
      }
    }
  }
`;

type Response = { employeeAbsenceCategoryById: AbsenceCategoryItem };

export const getEmployeeAbsenceCategoryAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { employeeAbsenceCategoryById } = await client.request<Response>(
      Document,
      { id },
    );
    return { success: true as const, data: employeeAbsenceCategoryById };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
