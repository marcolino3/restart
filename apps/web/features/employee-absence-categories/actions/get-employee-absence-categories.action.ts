"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { AbsenceCategoryItem } from "../types";

const Document = gql`
  query EmployeeAbsenceCategoriesByOrgIdFull {
    employeeAbsenceCategoriesByOrgId {
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

type Response = { employeeAbsenceCategoriesByOrgId: AbsenceCategoryItem[] };

export const getEmployeeAbsenceCategoriesAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { employeeAbsenceCategoriesByOrgId } =
      await client.request<Response>(Document);
    return { success: true as const, data: employeeAbsenceCategoriesByOrgId };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
