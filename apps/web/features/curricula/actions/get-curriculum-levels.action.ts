"use server";

import { unstable_cache } from "next/cache";
import { gql } from "graphql-request";
import {
  createGqlClientWithCookieHeader,
  readSessionCookieHeader,
} from "@/lib/graphql/server-cookie-graphql-client";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { curriculumLevelsTag, curriculumOrgTag } from "../lib/cache-tags";
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

const fetchCurriculumLevels = async (
  curriculumId: string,
  includeArchived: boolean,
  cookieHeader: string,
) => {
  const client = createGqlClientWithCookieHeader(cookieHeader);
  const { curriculumLevels } = await client.request<Response>(Document, {
    curriculumId,
    includeArchived,
  });
  return curriculumLevels;
};

export const getCurriculumLevelsAction = async (
  curriculumId: string,
  includeArchived = false,
) => {
  try {
    const [userRes, cookieHeader] = await Promise.all([
      getCurrentUserAction(),
      readSessionCookieHeader(),
    ]);
    const orgId = userRes?.data?.orgId ?? "no-org";

    const cached = unstable_cache(
      async (cid: string, archived: boolean, _orgKey: string) =>
        fetchCurriculumLevels(cid, archived, cookieHeader),
      ["curriculum-levels", curriculumId, String(includeArchived), orgId],
      { tags: [curriculumLevelsTag(curriculumId), curriculumOrgTag(orgId)] },
    );

    const data = await cached(curriculumId, includeArchived, orgId);
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
