"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type SchoolClassDetail = {
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

type GetSchoolClassByIdResponse = {
  schoolClassById: SchoolClassDetail;
};

const GetSchoolClassByIdDocument = gql`
  query GetSchoolClassById($id: ID!) {
    schoolClassById(id: $id) {
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

export const getSchoolClassByIdAction = async (id: string) => {
  const client = await serverCookieGqlClient();

  try {
    const { schoolClassById } =
      await client.request<GetSchoolClassByIdResponse>(
        GetSchoolClassByIdDocument,
        { id }
      );
    return { success: true as const, data: schoolClassById };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load school class" };
  }
};
