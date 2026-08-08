"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants/routes";
import type { CompanyVacationHoliday } from "./settings.action";

/**
 * Individuelle Ferien eines Mitarbeiters, zugeschnitten auf eine
 * Abrechnungsperiode (Stichtag bis Vortag des naechsten Stichtags). Analog
 * `EmployeeCompanyVacation`, aber `employeeVacationId` statt
 * `companyVacationId` und `name` nullable.
 */
export type EmployeeVacationSegment = {
  id: string;
  employeeVacationId: string;
  name: string | null;
  startDate: string;
  endDate: string;
  effectiveDays: number;
  holidays: CompanyVacationHoliday[];
  periodLabel: string;
  periodStartDate: string;
  periodEndDate: string;
  isSplit: boolean;
};

const EmployeeVacationSegmentsDocument = gql`
  query EmployeeVacationSegments($employeeId: ID!) {
    employeeVacationSegments(employeeId: $employeeId) {
      id
      employeeVacationId
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

export const getEmployeeVacationSegmentsAction = async (
  employeeId: string,
): Promise<
  | { success: true; data: EmployeeVacationSegment[] }
  | { success: false; error: string }
> => {
  try {
    const client = await serverCookieGqlClient();
    const data = await client.request<{
      employeeVacationSegments: EmployeeVacationSegment[];
    }>(EmployeeVacationSegmentsDocument, { employeeId });
    return { success: true, data: data.employeeVacationSegments ?? [] };
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

const CreateDocument = gql`
  mutation CreateEmployeeVacation($input: CreateEmployeeVacationInput!) {
    createEmployeeVacation(input: $input) {
      id
      accrualType
      remark
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateEmployeeVacation($input: UpdateEmployeeVacationInput!) {
    updateEmployeeVacation(input: $input) {
      id
    }
  }
`;

const DeleteDocument = gql`
  mutation DeleteEmployeeVacation($id: ID!) {
    deleteEmployeeVacation(id: $id)
  }
`;

export type EmployeeVacationAccrualType =
  | "CHARGED"
  | "PAID_NO_CHARGE"
  | "UNPAID";

export type CreateEmployeeVacationInput = {
  employeeId: string;
  startDate: string;
  endDate: string;
  name?: string;
  accrualType?: EmployeeVacationAccrualType;
  remark?: string;
};

export type UpdateEmployeeVacationInput = {
  id: string;
  startDate?: string;
  endDate?: string;
  name?: string;
  accrualType?: EmployeeVacationAccrualType;
  remark?: string;
};

export const createEmployeeVacationAction = async (
  input: CreateEmployeeVacationInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(CreateDocument, { input });
    await revalidate(input.employeeId);
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};

export const updateEmployeeVacationAction = async (
  input: UpdateEmployeeVacationInput,
  employeeId: string,
) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(UpdateDocument, { input });
    await revalidate(employeeId);
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};

export const deleteEmployeeVacationAction = async (
  id: string,
  employeeId: string,
) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteDocument, { id });
    await revalidate(employeeId);
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};
