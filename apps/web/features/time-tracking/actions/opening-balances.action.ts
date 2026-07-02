"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type OpeningBalanceEntry = {
  id: string;
  employeeId: string;
  periodId: string;
  openingWorkMinutes: number;
  openingVacationDays: number;
};

const OpeningBalancesDocument = gql`
  query EmployeePeriodOpeningBalances($employeeId: ID!) {
    employeePeriodOpeningBalances(employeeId: $employeeId) {
      id
      employeeId
      periodId
      openingWorkMinutes
      openingVacationDays
    }
  }
`;

export const getEmployeePeriodOpeningBalancesAction = async (
  employeeId: string
): Promise<{ success: boolean; data: OpeningBalanceEntry[] }> => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      employeePeriodOpeningBalances: OpeningBalanceEntry[];
    }>(OpeningBalancesDocument, { employeeId });
    return { success: true, data: data.employeePeriodOpeningBalances ?? [] };
  } catch (error) {
    console.error("getEmployeePeriodOpeningBalancesAction", error);
    return { success: false, data: [] };
  }
};

const UpsertOpeningBalanceDocument = gql`
  mutation UpsertEmployeePeriodOpeningBalance(
    $input: UpsertEmployeePeriodOpeningBalanceInput!
  ) {
    upsertEmployeePeriodOpeningBalance(input: $input) {
      id
    }
  }
`;

export const upsertEmployeePeriodOpeningBalanceAction = async (input: {
  employeeId: string;
  periodId: string;
  openingWorkMinutes: number;
  openingVacationDays: number;
}) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(UpsertOpeningBalanceDocument, { input });
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};

const DeleteOpeningBalanceDocument = gql`
  mutation DeleteEmployeePeriodOpeningBalance($id: ID!) {
    deleteEmployeePeriodOpeningBalance(id: $id)
  }
`;

export const deleteEmployeePeriodOpeningBalanceAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteOpeningBalanceDocument, { id });
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};
