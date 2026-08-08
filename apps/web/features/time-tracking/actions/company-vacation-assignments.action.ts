"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants/routes";
import type { CompanyVacationHoliday } from "./settings.action";

/**
 * Eine zugewiesene Betriebsferien, zugeschnitten auf eine Abrechnungsperiode
 * (Stichtag bis Vortag des naechsten Stichtags). Betriebsferien ueber den
 * Stichtag hinweg erscheinen als mehrere Segmente mit `isSplit: true`;
 * `effectiveDays` und `holidays` zaehlen jeweils nur das Segment.
 */
export type EmployeeCompanyVacation = {
  id: string;
  companyVacationId: string;
  name: string;
  startDate: string;
  endDate: string;
  effectiveDays: number;
  holidays: CompanyVacationHoliday[];
  periodLabel: string;
  periodStartDate: string;
  periodEndDate: string;
  isSplit: boolean;
};

const CompanyVacationsForEmployeeDocument = gql`
  query CompanyVacationsForEmployee($employeeId: ID!) {
    companyVacationsForEmployee(employeeId: $employeeId) {
      id
      companyVacationId
      name
      startDate
      endDate
      effectiveDays
      holidays {
        date
        name
        paidPercentage
        isWeekend
      }
      periodLabel
      periodStartDate
      periodEndDate
      isSplit
    }
  }
`;

export const getCompanyVacationsForEmployeeAction = async (
  employeeId: string,
): Promise<{ success: true; data: EmployeeCompanyVacation[] } | { success: false; error: string }> => {
  try {
    const client = await serverCookieGqlClient();
    const data = await client.request<{
      companyVacationsForEmployee: EmployeeCompanyVacation[];
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
