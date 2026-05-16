"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type EmployeeDetail = {
  id: string;
  timeTrackingEnabled: boolean;
  membership: {
    id: string;
    persona: string;
    contactPhone?: string | null;
    user?: {
      id: string;
      title?: string | null;
      firstName: string;
      lastName: string;
      dateOfBirth?: string | null;
      socialSecurityNumber?: string | null;
      street?: string | null;
      houseNumber?: string | null;
      addressLine2?: string | null;
      postalCode?: string | null;
      city?: string | null;
      country?: string | null;
      userEmails: {
        email: string;
        isPrimary: boolean;
      }[];
    } | null;
    organization?: {
      id: string;
      name: string;
    } | null;
    roles?: {
      id: string;
      name?: string | null;
      systemCode?: string | null;
    }[] | null;
  };
};

type GetEmployeeByIdResponse = {
  employeeById: EmployeeDetail;
};

const GetEmployeeByIdDocument = gql`
  query GetEmployeeById($employeeId: ID!) {
    employeeById(employeeId: $employeeId) {
      id
      timeTrackingEnabled
      membership {
        id
        persona
        contactPhone
        user {
          id
          title
          firstName
          lastName
          dateOfBirth
          socialSecurityNumber
          street
          houseNumber
          addressLine2
          postalCode
          city
          country
          userEmails {
            email
            isPrimary
          }
        }
        organization {
          id
          name
        }
        roles {
          id
          name
          systemCode
        }
      }
    }
  }
`;

export const getEmployeeByIdAction = async (id: string) => {
  const client = await serverCookieGqlClient();

  try {
    const { employeeById } =
      await client.request<GetEmployeeByIdResponse>(GetEmployeeByIdDocument, {
        employeeId: id,
      });

    return { success: true as const, data: employeeById };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load employee" };
  }
};
