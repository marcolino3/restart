"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type TeacherOption = {
  id: string;
  firstName: string;
  lastName: string;
  /** Linked user id — used by SuperAdmin impersonation. */
  userId?: string | null;
};

type GetTeachersResponse = { teachersByOrgId: TeacherOption[] };

const GetTeachersDocument = gql`
  query GetTeachersByOrgId {
    teachersByOrgId {
      id
      firstName
      lastName
      userId
    }
  }
`;

export const getTeachersAction = async () => {
  const client = await serverCookieGqlClient();

  try {
    const { teachersByOrgId } = await client.request<GetTeachersResponse>(
      GetTeachersDocument
    );
    const data = teachersByOrgId;
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
