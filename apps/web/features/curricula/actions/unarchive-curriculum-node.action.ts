"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { invalidateCurriculumCache } from "../lib/invalidate-curriculum-cache";

type Response = { unarchiveCurriculumNode: boolean };

const Document = gql`
  mutation UnarchiveCurriculumNode($id: ID!) {
    unarchiveCurriculumNode(id: $id)
  }
`;

export const unarchiveCurriculumNodeAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { unarchiveCurriculumNode } = await client.request<Response>(
      Document,
      { id },
    );
    await invalidateCurriculumCache();
    return {
      success: unarchiveCurriculumNode,
      data: unarchiveCurriculumNode,
    } as const;
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
