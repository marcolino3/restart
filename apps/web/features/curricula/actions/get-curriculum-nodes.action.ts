"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { CurriculumNodeDTO } from "../types";

type Response = { curriculumNodes: CurriculumNodeDTO[] };

const Document = gql`
  query GetCurriculumNodes(
    $curriculumId: ID!
    $levelId: ID!
    $includeArchived: Boolean
  ) {
    curriculumNodes(
      curriculumId: $curriculumId
      levelId: $levelId
      includeArchived: $includeArchived
    ) {
      id
      curriculumId
      levelId
      parentId
      nodeType
      position
      isArchived
      translations {
        locale
        name
        notes
      }
    }
  }
`;

export const getCurriculumNodesAction = async (
  curriculumId: string,
  levelId: string,
  includeArchived = false,
) => {
  const client = await serverCookieGqlClient();
  try {
    const { curriculumNodes } = await client.request<Response>(Document, {
      curriculumId,
      levelId,
      includeArchived,
    });
    return { success: true as const, data: curriculumNodes };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
