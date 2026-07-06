"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type GradeLevelItem = {
  id: string;
  name: string;
  parentId: string | null;
  color: string | null;
  shortCode: string | null;
  ageMin: number | null;
  ageMax: number | null;
  sortOrder: number;
  classCount: number | null;
  studentCount: number | null;
};

type GetGradeLevelsResponse = {
  gradeLevelsByOrgId: GradeLevelItem[];
};

const GetGradeLevelsDocument = gql`
  query GetGradeLevels {
    gradeLevelsByOrgId {
      id
      name
      parentId
      color
      shortCode
      ageMin
      ageMax
      sortOrder
      classCount
      studentCount
    }
  }
`;

export const getGradeLevelsAction = async () => {
  const client = await serverCookieGqlClient();

  try {
    const { gradeLevelsByOrgId } =
      await client.request<GetGradeLevelsResponse>(GetGradeLevelsDocument);
    return { success: true as const, data: gradeLevelsByOrgId };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
