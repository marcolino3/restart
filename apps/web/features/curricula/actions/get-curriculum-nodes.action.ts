"use server";

import { unstable_cache } from "next/cache";
import { gql } from "graphql-request";
import {
  createGqlClientWithCookieHeader,
  readSessionCookieHeader,
} from "@/lib/graphql/server-cookie-graphql-client";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { curriculumNodesTag, curriculumOrgTag } from "../lib/cache-tags";
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
      lessonType
      lessonScale
      translations {
        locale
        name
        notes
      }
    }
  }
`;

const fetchCurriculumNodes = async (
  curriculumId: string,
  levelId: string,
  includeArchived: boolean,
  cookieHeader: string,
) => {
  const client = createGqlClientWithCookieHeader(cookieHeader);
  const { curriculumNodes } = await client.request<Response>(Document, {
    curriculumId,
    levelId,
    includeArchived,
  });
  return curriculumNodes;
};

export const getCurriculumNodesAction = async (
  curriculumId: string,
  levelId: string,
  includeArchived = false,
) => {
  try {
    const [userRes, cookieHeader] = await Promise.all([
      getCurrentUserAction(),
      readSessionCookieHeader(),
    ]);
    const orgId = userRes?.data?.orgId ?? "no-org";

    const cached = unstable_cache(
      async (
        cid: string,
        lid: string,
        archived: boolean,
        _orgKey: string,
      ) => fetchCurriculumNodes(cid, lid, archived, cookieHeader),
      [
        "curriculum-nodes",
        curriculumId,
        levelId,
        String(includeArchived),
        orgId,
      ],
      {
        tags: [
          curriculumNodesTag(curriculumId, levelId),
          curriculumOrgTag(orgId),
        ],
      },
    );

    const data = await cached(curriculumId, levelId, includeArchived, orgId);
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
