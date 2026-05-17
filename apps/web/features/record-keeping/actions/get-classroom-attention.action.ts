"use server";

import { gql } from "graphql-request";
import { unstable_cache } from "next/cache";
import { getLocale } from "next-intl/server";

import {
  createGqlClientWithCookieHeader,
  readSessionCookieHeader,
} from "@/lib/graphql/server-cookie-graphql-client";
import { getCurrentUserAction } from "@/features/users/actions/get-current-user.action";

import { classroomAttentionTag } from "../lib/cache-tags";
import type { AttentionItem } from "../lib/derive-attention-items";

export type StudentAttentionSummary = {
  studentId: string;
  firstName: string;
  lastName: string;
  totalSignals: number;
  topItems: AttentionItem[];
  byReason: Record<AttentionItem["reason"], number>;
};

type GqlAncestor = {
  id: string;
  nodeType: string;
  translations: { locale: string; name: string }[];
};

type GqlAttentionItem = {
  lessonId: string;
  lessonName: string;
  ancestors: GqlAncestor[];
  reason: AttentionItem["reason"];
  severity: number;
  days: number | null;
  since: string | null;
};

type GqlSummary = {
  studentId: string;
  firstName: string;
  lastName: string;
  totalSignals: number;
  topItems: GqlAttentionItem[];
  byReason: Record<AttentionItem["reason"], number>;
};

type Response = {
  classroomAttentionSummaries: GqlSummary[];
};

const Document = gql`
  query ClassroomAttention($schoolClassId: ID!, $locale: String!) {
    classroomAttentionSummaries(
      schoolClassId: $schoolClassId
      locale: $locale
    ) {
      studentId
      firstName
      lastName
      totalSignals
      byReason {
        NEEDS_MORE_CURRENT
        REPEATED_NEEDS_MORE
        STUCK_PRACTICED
        STUCK_INTRODUCED
        BIG_GAP_INTRO_TO_PRACTICED
      }
      topItems {
        lessonId
        lessonName
        reason
        severity
        days
        since
        ancestors {
          id
          nodeType
          translations {
            locale
            name
          }
        }
      }
    }
  }
`;

const fetchAttention = async (
  schoolClassId: string,
  locale: string,
  cookieHeader: string,
): Promise<StudentAttentionSummary[]> => {
  const client = createGqlClientWithCookieHeader(cookieHeader);
  const { classroomAttentionSummaries } = await client.request<Response>(
    Document,
    { schoolClassId, locale },
  );
  // The GQL shape already matches StudentAttentionSummary 1:1 — narrow
  // the typing without copying.
  return classroomAttentionSummaries as unknown as StudentAttentionSummary[];
};

export const getClassroomAttentionAction = async (
  schoolClassId: string,
): Promise<
  | { success: true; data: StudentAttentionSummary[] }
  | { success: false; error?: string }
> => {
  try {
    const [userRes, locale, cookieHeader] = await Promise.all([
      getCurrentUserAction(),
      getLocale(),
      readSessionCookieHeader(),
    ]);
    const orgId = userRes?.data?.orgId ?? "no-org";

    // Cache key includes locale + orgId so two locales / two orgs don't
    // collide. Tag-based invalidation triggers on record mutations.
    const cached = unstable_cache(
      async (cid: string, loc: string, _orgKey: string) =>
        fetchAttention(cid, loc, cookieHeader),
      ["classroom-attention", schoolClassId, locale, orgId],
      { tags: [classroomAttentionTag(schoolClassId)] },
    );

    const data = await cached(schoolClassId, locale, orgId);
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load attention list" };
  }
};
