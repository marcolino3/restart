"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { ProjectTemplate } from "../types";

type Response = { projectTemplates: ProjectTemplate[] };

const Document = gql`
  query ProjectTemplates {
    projectTemplates {
      id
      title
      description
      createdAt
    }
  }
`;

export const getTemplatesAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { projectTemplates } = await client.request<Response>(Document);
    return { success: true as const, data: projectTemplates };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
