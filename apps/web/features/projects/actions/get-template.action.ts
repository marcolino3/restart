"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { ProjectTemplate } from "../types";

type Response = { projectTemplateById: ProjectTemplate };

const Document = gql`
  query ProjectTemplateById($id: ID!) {
    projectTemplateById(id: $id) {
      id
      title
      description
      createdAt
      tasks {
        id
        title
        description
        priority
        sortOrder
        dueOffsetDays
      }
    }
  }
`;

export const getTemplateAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { projectTemplateById } = await client.request<Response>(Document, {
      id,
    });
    return { success: true as const, data: projectTemplateById };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
