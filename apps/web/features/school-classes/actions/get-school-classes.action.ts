"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type SchoolClassListItem = {
  id: string;
  name: string;
  gradeLevels?: { id: string; name: string }[];
  color?: string | null;
  description?: string | null;
  sortOrder: number;
  maxCapacity?: number | null;
  room?: string | null;
  isActive: boolean;
};

type GetSchoolClassesResponse = {
  schoolClassesByOrgId: SchoolClassListItem[];
};

const GetSchoolClassesDocument = gql`
  query GetSchoolClasses {
    schoolClassesByOrgId {
      id
      name
      gradeLevels {
        id
        name
      }
      color
      description
      sortOrder
      maxCapacity
      room
      isActive
    }
  }
`;

export const getSchoolClassesAction = async () => {
  const client = await serverCookieGqlClient();

  try {
    const { schoolClassesByOrgId } =
      await client.request<GetSchoolClassesResponse>(GetSchoolClassesDocument);
    return { success: true as const, data: schoolClassesByOrgId };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
