"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type TeamDetail = {
  id: string;
  name: string;
};

type Response = { teamById: TeamDetail };

const Document = gql`
  query GetTeamById($id: ID!) {
    teamById(id: $id) {
      id
      name
    }
  }
`;

export const getTeamByIdAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { teamById } = await client.request<Response>(Document, { id });
    return { success: true as const, data: teamById };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
