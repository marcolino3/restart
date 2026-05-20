"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const Document = gql`
  query AdmissionsEnrollmentClasses {
    schoolClassesByOrgId {
      id
      name
      isActive
      gradeLevels {
        id
        name
      }
    }
  }
`;

export type EnrollmentClass = {
  id: string;
  name: string;
  gradeLevels: { id: string; name: string }[];
};

export const getClassesForEnrollmentAction = async (): Promise<
  | { success: true; data: EnrollmentClass[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      schoolClassesByOrgId: Array<{
        id: string;
        name: string;
        isActive: boolean;
        gradeLevels: { id: string; name: string }[] | null;
      }>;
    }>(Document);
    return {
      success: true as const,
      data: data.schoolClassesByOrgId
        .filter((c) => c.isActive)
        .map((c) => ({
          id: c.id,
          name: c.name,
          gradeLevels: c.gradeLevels ?? [],
        })),
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Failed to load classes",
    };
  }
};
