"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { CurriculumLevelDTO } from "../types";

type Response = { curriculumLevels: CurriculumLevelDTO[] };

const Document = gql`
  query GetCurriculumLevels($includeArchived: Boolean) {
    curriculumLevels(includeArchived: $includeArchived) {
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

export const getCurriculumLevelsAction = async (includeArchived = false) => {
  const client = await serverCookieGqlClient();
  try {
    const { curriculumLevels } = await client.request<Response>(Document, {
      includeArchived,
    });
    return { success: true as const, data: curriculumLevels };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
