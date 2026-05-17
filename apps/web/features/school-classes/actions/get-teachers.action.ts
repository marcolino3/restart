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

type GetTeachersResponse = {
  teachersByOrgId: {
    id: string;
    membership: {
      user?: {
        id: string;
        firstName: string;
        lastName: string;
      } | null;
    };
  }[];
};

const GetTeachersDocument = gql`
  query GetTeachersByOrgId {
    teachersByOrgId {
      id
      membership {
        user {
          id
          firstName
          lastName
        }
      }
    }
  }
`;

export const getTeachersAction = async () => {
  const client = await serverCookieGqlClient();

  try {
    const { teachersByOrgId } = await client.request<GetTeachersResponse>(
      GetTeachersDocument
    );
    const data: TeacherOption[] = teachersByOrgId.map((e) => ({
      id: e.id,
      firstName: e.membership.user?.firstName ?? "",
      lastName: e.membership.user?.lastName ?? "",
      userId: e.membership.user?.id ?? null,
    }));
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
