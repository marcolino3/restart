"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

type Response = { archiveCurriculumNode: boolean };

const Document = gql`
  mutation ArchiveCurriculumNode($id: ID!) {
    archiveCurriculumNode(id: $id)
  }
`;

export const archiveCurriculumNodeAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { archiveCurriculumNode } = await client.request<Response>(Document, {
      id,
    });
    return {
      success: archiveCurriculumNode,
      data: archiveCurriculumNode,
    } as const;
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
