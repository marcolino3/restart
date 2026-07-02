"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type PaidOvertimeEntry = {
  id: string;
  employeeId: string;
  date: string;
  minutes: number;
  note?: string | null;
};

const PaidOvertimeDocument = gql`
  query EmployeePaidOvertime($employeeId: ID!) {
    employeePaidOvertime(employeeId: $employeeId) {
      id
      employeeId
      date
      minutes
      note
    }
  }
`;

export const getEmployeePaidOvertimeAction = async (
  employeeId: string
): Promise<{ success: boolean; data: PaidOvertimeEntry[] }> => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      employeePaidOvertime: PaidOvertimeEntry[];
    }>(PaidOvertimeDocument, { employeeId });
    return { success: true, data: data.employeePaidOvertime ?? [] };
  } catch (error) {
    console.error("getEmployeePaidOvertimeAction", error);
    return { success: false, data: [] };
  }
};

const CreatePaidOvertimeDocument = gql`
  mutation CreateEmployeePaidOvertime($input: CreateEmployeePaidOvertimeInput!) {
    createEmployeePaidOvertime(input: $input) {
      id
    }
  }
`;

export const createEmployeePaidOvertimeAction = async (input: {
  employeeId: string;
  date: string;
  minutes: number;
  note?: string | null;
}) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(CreatePaidOvertimeDocument, { input });
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};

const UpdatePaidOvertimeDocument = gql`
  mutation UpdateEmployeePaidOvertime($input: UpdateEmployeePaidOvertimeInput!) {
    updateEmployeePaidOvertime(input: $input) {
      id
    }
  }
`;

export const updateEmployeePaidOvertimeAction = async (input: {
  id: string;
  date?: string;
  minutes?: number;
  note?: string | null;
}) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(UpdatePaidOvertimeDocument, { input });
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};

const DeletePaidOvertimeDocument = gql`
  mutation DeleteEmployeePaidOvertime($id: ID!) {
    deleteEmployeePaidOvertime(id: $id)
  }
`;

export const deleteEmployeePaidOvertimeAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeletePaidOvertimeDocument, { id });
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};
