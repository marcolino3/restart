"use server";

import { graphql } from "@restart/shared-types";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { GetEmployeeAbsenceCategoriesByOrgIdQuery } from "@restart/shared-types/graphql";

const GetEmployeeAbsenceCategoriesByOrgIdDocument = graphql(`
  query GetEmployeeAbsenceCategoriesByOrgId {
    employeeAbsenceCategoriesByOrgId {
      id
      systemCode
    }
  }
`);

export const getEmployeeAbsenceCategoriesByOrgIdAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const {
      employeeAbsenceCategoriesByOrgId,
    }: GetEmployeeAbsenceCategoriesByOrgIdQuery = await client.request(
      GetEmployeeAbsenceCategoriesByOrgIdDocument
    );

    return { success: true, data: employeeAbsenceCategoriesByOrgId };
  } catch (error) {
    console.log(error);
    return { success: true, error };
  }
};
