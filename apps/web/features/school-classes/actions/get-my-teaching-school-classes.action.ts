"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { SchoolClassListItem } from "./get-school-classes.action";

type Response = {
  myTeachingSchoolClasses: SchoolClassListItem[];
};

const Document = gql`
  query GetMyTeachingSchoolClasses {
    myTeachingSchoolClasses {
      id
      name
      gradeLevels {
        id
        name
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
      isActive
    }
  }
`;

/**
 * Returns the school classes the current user actually teaches.
 * Admins / SuperAdmin see ALL classes (same payload shape as
 * `schoolClassesByOrgId`). Used by the heatmap picker so teachers
 * don't see classrooms they can't open.
 */
export const getMyTeachingSchoolClassesAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { myTeachingSchoolClasses } =
      await client.request<Response>(Document);
    return { success: true as const, data: myTeachingSchoolClasses };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
