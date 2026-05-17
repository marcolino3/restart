"use server";

import { unstable_cache } from "next/cache";
import { gql } from "graphql-request";
import {
  createGqlClientWithCookieHeader,
  readSessionCookieHeader,
} from "@/lib/graphql/server-cookie-graphql-client";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";
import { curriculumByIdTag, curriculumOrgTag } from "../lib/cache-tags";
import type { CurriculumDTO } from "../types";

type Response = { curriculumById: CurriculumDTO };

const Document = gql`
  query GetCurriculumById($id: ID!) {
    curriculumById(id: $id) {
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

const fetchCurriculumById = async (id: string, cookieHeader: string) => {
  const client = createGqlClientWithCookieHeader(cookieHeader);
  const { curriculumById } = await client.request<Response>(Document, { id });
  return curriculumById;
};

export const getCurriculumByIdAction = async (id: string) => {
  try {
    const [userRes, cookieHeader] = await Promise.all([
      getCurrentUserAction(),
      readSessionCookieHeader(),
    ]);
    const orgId = userRes?.data?.orgId ?? "no-org";

    const cached = unstable_cache(
      async (cid: string, _orgKey: string) =>
        fetchCurriculumById(cid, cookieHeader),
      ["curriculum-by-id", id, orgId],
      { tags: [curriculumByIdTag(id), curriculumOrgTag(orgId)] },
    );

    const data = await cached(id, orgId);
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
