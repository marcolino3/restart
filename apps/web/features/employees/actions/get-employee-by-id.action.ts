import { graphql } from "@/gql";
import {
  GetEmployeeAbsenceCategoriesByOrgIdQuery,
  GetEmployeeByIdQuery,
} from "@/gql/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const GetEmployeeByIdDocument = graphql(`
  query GetEmployeeById($employeeId: ID!) {
    employeeById(employeeId: $employeeId) {
      id
      user {
        firstName
        lastName
        email
      }
      persona
      employee {
        timeTrackingEnabled
      }
    }
  }
`);

export const getEmployeeByIdAction = async (id: string) => {
  const client = await serverCookieGqlClient();

  try {
    const { employeeById } = await client.request<GetEmployeeByIdQuery>(
      GetEmployeeByIdDocument,
      {
        employeeId: id,
      }
    );

    return { success: true, data: employeeById };
  } catch (error) {
    console.log(error);
    return { success: false, error };
  }
};
