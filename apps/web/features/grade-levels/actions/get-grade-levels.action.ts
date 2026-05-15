"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type GradeLevelItem = {
  id: string;
  name: string;
  sortOrder: number;
};

type GetGradeLevelsResponse = {
  gradeLevelsByOrgId: GradeLevelItem[];
};

const GetGradeLevelsDocument = gql`
  query GetGradeLevels {
    gradeLevelsByOrgId {
      id
      name
      sortOrder
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
