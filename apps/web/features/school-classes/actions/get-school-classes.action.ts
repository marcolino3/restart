"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type SchoolClassListItem = {
  id: string;
  name: string;
  gradeLevels?: {
    id: string;
    name: string;
    ageMin?: number | null;
    ageMax?: number | null;
  }[];
  teachers?: {
    id: string;
    membership: {
      user?: { firstName: string; lastName: string } | null;
    };
  }[];
  color?: string | null;
  description?: string | null;
  sortOrder: number;
  maxCapacity?: number | null;
  room?: string | null;
  enrolledCount?: number | null;
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
        ageMin
        ageMax
      }
      teachers {
        id
        membership {
          user {
            firstName
            lastName
          }
        }
      }
      color
      description
      sortOrder
      maxCapacity
      room
      enrolledCount
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
