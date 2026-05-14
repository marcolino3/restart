"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { CurriculumNodeDTO } from "../types";

type Input = {
  curriculumId: string;
  levelId: string;
  parentId: string | null;
  ids: string[];
};

type Response = { reorderCurriculumNodes: CurriculumNodeDTO[] };

const Document = gql`
  mutation ReorderCurriculumNodes($input: ReorderCurriculumNodesInput!) {
    reorderCurriculumNodes(input: $input) {
      id
      parentId
      position
    }
  }
`;

export const reorderCurriculumNodesAction = async (input: Input) => {
  const client = await serverCookieGqlClient();
  try {
    const { reorderCurriculumNodes } = await client.request<Response>(
      Document,
      { input },
    );
    return { success: true as const, data: reorderCurriculumNodes };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
