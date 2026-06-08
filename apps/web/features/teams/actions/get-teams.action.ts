"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type TeamItem = {
  id: string;
  name: string;
  sortOrder: number;
  parentId: string | null;
};

type Response = { teamsByOrgId: TeamItem[] };

const Document = gql`
  query GetTeams {
    teamsByOrgId {
      id
      name
      sortOrder
      parentId
    }
  }
`;

export const getTeamsAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { teamsByOrgId } = await client.request<Response>(Document);
    return { success: true as const, data: teamsByOrgId };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
