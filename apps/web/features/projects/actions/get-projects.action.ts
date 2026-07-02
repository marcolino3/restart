"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { ProjectListItem } from "../types";

type Response = { myProjects: ProjectListItem[] };

const Document = gql`
  query MyProjects {
    myProjects {
      id
      title
      description
      status
      color
      isArchived
      createdAt
    }
  }
`;

export const getProjectsAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { myProjects } = await client.request<Response>(Document);
    return { success: true as const, data: myProjects };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
