"use server";

import { graphql } from "@restart/shared-types";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { GetMyAbsenceCategoryQuotaQuery } from "@restart/shared-types/graphql";

const GetMyAbsenceCategoryQuotaDocument = graphql(`
  query GetMyAbsenceCategoryQuota($absenceCategoryId: ID!, $date: String) {
    myAbsenceCategoryQuota(absenceCategoryId: $absenceCategoryId, date: $date) {
      absenceCategoryId
      maxDaysPerYear
      usedDays
      remainingDays
      periodStart
      periodEnd
    }
  }
`);

export type MyAbsenceCategoryQuota =
  GetMyAbsenceCategoryQuotaQuery["myAbsenceCategoryQuota"];

/** Remaining yearly allowance of one category for the signed-in employee. */
export const getMyAbsenceCategoryQuotaAction = async (
  absenceCategoryId: string,
  date?: string,
) => {
  const client = await serverCookieGqlClient();
  try {
    const { myAbsenceCategoryQuota }: GetMyAbsenceCategoryQuotaQuery =
      await client.request(GetMyAbsenceCategoryQuotaDocument, {
        absenceCategoryId,
        date: date ?? null,
      });
    return { success: true as const, data: myAbsenceCategoryQuota };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
