"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type EmployeeListItem = {
  membership: {
    employee?: {
      isActive: boolean;
      timeTrackingEnabled: boolean;
      id: string;
      status: string;
      invitationStatus: string;
    } | null;
    user?: {
      firstName: string;
      id: string;
      lastName: string;
      userEmails: {
        email: string;
        isPrimary: boolean;
      }[];
    } | null;
    persona: string;
    contactPhone?: string | null;
  };
  workloadPercent?: number | null;
  timeBalanceMinutes?: number | null;
  teamMembers?: {
    team?: {
      id: string;
      name: string;
    } | null;
  }[] | null;
};

type GetEmployeesResponse = {
  employeesByOrgId: EmployeeListItem[];
};

const GetEmployeesDocument = gql`
  query GetEmployees {
    employeesByOrgId {
      workloadPercent
      timeBalanceMinutes
      membership {
        employee {
          isActive
          timeTrackingEnabled
          id
          status
          invitationStatus
        }
        user {
          firstName
          id
          lastName
          userEmails {
            email
            isPrimary
          }
        }
        persona
        contactPhone
      }
      teamMembers {
        team {
          id
          name
        }
      }
    }
  }
`;

export const getEmployeesAction = async () => {
  const client = await serverCookieGqlClient();

  try {
    const { employeesByOrgId } =
      await client.request<GetEmployeesResponse>(GetEmployeesDocument);
    return { success: true, data: employeesByOrgId };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};
