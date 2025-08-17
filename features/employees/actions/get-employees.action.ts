"use server";
import { graphql } from "@/gql";
import { GetEmployeesQuery } from "@/gql/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const GetEmployeesDocument = graphql(`
  query GetEmployees {
    employeesByOrgId {
      membership {
        employee {
          isActive
          timeTrackingEnabled
          id
        }
        user {
          firstName
          id
          email
          lastName
        }
        persona
      }
    }
  }
`);

export const getEmployeesAction = async () => {
  const client = await serverCookieGqlClient();

  try {
    const { employeesByOrgId } = await client.request<GetEmployeesQuery>(
      GetEmployeesDocument
    );
    return { success: true, data: employeesByOrgId };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};
