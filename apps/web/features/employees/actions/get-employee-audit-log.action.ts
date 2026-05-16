"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type EmployeeAuditLogEntityType = "USER" | "MEMBERSHIP" | "EMPLOYEE";

export type EmployeeAuditLogItem = {
  id: string;
  createdAt: string;
  entityType: EmployeeAuditLogEntityType;
  fieldName: string;
  oldValue?: string | null;
  newValue?: string | null;
  actorMembershipId?: string | null;
  actorMembership?: {
    id: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  } | null;
};

type GetEmployeeAuditLogResponse = {
  employeeAuditLog: EmployeeAuditLogItem[];
};

const GetEmployeeAuditLogDocument = gql`
  query GetEmployeeAuditLog($employeeId: ID!) {
    employeeAuditLog(employeeId: $employeeId) {
      id
      createdAt
      entityType
      fieldName
      oldValue
      newValue
      actorMembershipId
      actorMembership {
        id
        user {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

export const getEmployeeAuditLogAction = async (employeeId: string) => {
  const client = await serverCookieGqlClient();

  try {
    const { employeeAuditLog } =
      await client.request<GetEmployeeAuditLogResponse>(
        GetEmployeeAuditLogDocument,
        { employeeId },
      );

    return { success: true as const, data: employeeAuditLog };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to load audit log",
      data: [] as EmployeeAuditLogItem[],
    };
  }
};
