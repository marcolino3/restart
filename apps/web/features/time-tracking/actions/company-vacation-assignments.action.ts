"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants/routes";
import type { CompanyVacation } from "./settings.action";

const CompanyVacationsForEmployeeDocument = gql`
  query CompanyVacationsForEmployee($employeeId: ID!) {
    companyVacationsForEmployee(employeeId: $employeeId) {
      id
      name
      startDate
      endDate
      appliesToAll
    }
  }
`;

export const getCompanyVacationsForEmployeeAction = async (
  employeeId: string,
): Promise<{ success: true; data: CompanyVacation[] } | { success: false; error: string }> => {
  try {
    const client = await serverCookieGqlClient();
    const data = await client.request<{
      companyVacationsForEmployee: CompanyVacation[];
    }>(CompanyVacationsForEmployeeDocument, { employeeId });
    return { success: true, data: data.companyVacationsForEmployee ?? [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

async function revalidate(employeeId: string) {
  const locale = await getLocale();
  revalidatePath(ROUTES.admin.employeesView(locale, employeeId));
}

const AssignDocument = gql`
  mutation AssignCompanyVacationToEmployee(
    $companyVacationId: ID!
    $employeeId: ID!
  ) {
    assignCompanyVacationToEmployee(
      companyVacationId: $companyVacationId
      employeeId: $employeeId
    ) {
      id
    }
  }
`;

const UnassignDocument = gql`
  mutation UnassignCompanyVacationFromEmployee(
    $companyVacationId: ID!
    $employeeId: ID!
  ) {
    unassignCompanyVacationFromEmployee(
      companyVacationId: $companyVacationId
      employeeId: $employeeId
    )
  }
`;

export const assignCompanyVacationAction = async (
  companyVacationId: string,
  employeeId: string,
) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(AssignDocument, { companyVacationId, employeeId });
    await revalidate(employeeId);
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};

export const unassignCompanyVacationAction = async (
  companyVacationId: string,
  employeeId: string,
) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(UnassignDocument, { companyVacationId, employeeId });
    await revalidate(employeeId);
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};
