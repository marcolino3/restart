"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { CurriculumLevelDTO } from "../types";

type Response = { curriculumLevelsByOrg: CurriculumLevelDTO[] };

/**
 * Every cycle of the organisation, across all curricula. Used where a cycle
 * has to be picked without a curriculum context — e.g. linking a school stage
 * to its cycle in the grade-level form.
 */
const Document = gql`
  query GetCurriculumLevelsByOrg {
    curriculumLevelsByOrg {
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

export const getCurriculumLevelsByOrgAction = async () => {
  try {
    const client = await serverCookieGqlClient();
    const { curriculumLevelsByOrg } = await client.request<Response>(Document);
    return { success: true as const, data: curriculumLevelsByOrg };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
