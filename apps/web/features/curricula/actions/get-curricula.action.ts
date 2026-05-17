"use server";

import { unstable_cache } from "next/cache";
import { gql } from "graphql-request";
import {
  createGqlClientWithCookieHeader,
  readSessionCookieHeader,
} from "@/lib/graphql/server-cookie-graphql-client";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { curriculumListTag, curriculumOrgTag } from "../lib/cache-tags";
import type { CurriculumDTO } from "../types";

type Response = { curricula: CurriculumDTO[] };

const Document = gql`
  query GetCurricula($includeArchived: Boolean) {
    curricula(includeArchived: $includeArchived) {
      id
      slug
      position
      isArchived
      translations {
        locale
        name
        description
      }
    }
  }
`;

const fetchCurricula = async (
  includeArchived: boolean,
  cookieHeader: string,
) => {
  const client = createGqlClientWithCookieHeader(cookieHeader);
  const { curricula } = await client.request<Response>(Document, {
    includeArchived,
  });
  return curricula;
};

export const getCurriculaAction = async (includeArchived = false) => {
  try {
    const [userRes, cookieHeader] = await Promise.all([
      getCurrentUserAction(),
      readSessionCookieHeader(),
    ]);
    const orgId = userRes?.data?.orgId ?? "no-org";

    const cached = unstable_cache(
      async (archived: boolean, _orgKey: string) =>
        fetchCurricula(archived, cookieHeader),
      ["curricula", String(includeArchived), orgId],
      { tags: [curriculumListTag(orgId), curriculumOrgTag(orgId)] },
    );

    const data = await cached(includeArchived, orgId);
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
