"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { CurriculumLevelDTO } from "../types";

type Response = { curriculumLevels: CurriculumLevelDTO[] };

const Document = gql`
  query GetCurriculumLevels($curriculumId: ID!, $includeArchived: Boolean) {
    curriculumLevels(
      curriculumId: $curriculumId
      includeArchived: $includeArchived
    ) {
      id
      slug
      position
      isArchived
      translations {
        locale
        name
      }
    }
  }
`;

export const getCurriculumLevelsAction = async (
  curriculumId: string,
  includeArchived = false,
) => {
  const client = await serverCookieGqlClient();
  try {
    const { curriculumLevels } = await client.request<Response>(Document, {
      curriculumId,
      includeArchived,
    });
    return { success: true as const, data: curriculumLevels };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
