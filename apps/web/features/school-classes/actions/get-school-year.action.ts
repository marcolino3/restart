"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type SchoolYearInfo = {
  start: string;
  end: string;
  startYear: number;
  /** Display label, e.g. "2026/27". */
  label: string;
};

const GetSchoolYearDocument = gql`
  query GetSchoolYear($date: String) {
    schoolYear(date: $date) {
      start
      end
      startYear
      label
    }
  }
`;

/**
 * The school year a date falls into, per the organisation's cut-off.
 *
 * Derived server-side rather than in the browser — the cut-off is an org
 * setting, so the client would otherwise have to know it to label a period.
 */
export const getSchoolYearAction = async (date?: string) => {
  const client = await serverCookieGqlClient();

  try {
    const { schoolYear } = await client.request<{
      schoolYear: SchoolYearInfo;
    }>(GetSchoolYearDocument, { date: date ?? null });
    return { success: true as const, data: schoolYear };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
