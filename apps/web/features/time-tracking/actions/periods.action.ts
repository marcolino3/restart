"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants/routes";
import { toISODate } from "../lib/to-iso-date";

export type TimeTrackingPeriodStatus = "OPEN" | "LOCKED";

export type TimeTrackingPeriodItem = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  status: TimeTrackingPeriodStatus;
};

const PeriodsDocument = gql`
  query TimeTrackingPeriods {
    timeTrackingPeriods {
      id
      label
      startDate
      endDate
      status
    }
  }
`;

export const getTimeTrackingPeriodsAction = async (): Promise<
  TimeTrackingPeriodItem[]
> => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      timeTrackingPeriods: TimeTrackingPeriodItem[];
    }>(PeriodsDocument);
    return data.timeTrackingPeriods ?? [];
  } catch (error) {
    console.error("getTimeTrackingPeriodsAction", error);
    return [];
  }
};

async function revalidate() {
  const locale = await getLocale();
  revalidatePath(ROUTES.admin.timeTrackingSettings(locale));
}

const EnsurePeriodDocument = gql`
  mutation EnsureTimeTrackingPeriod($date: String!) {
    ensureTimeTrackingPeriod(date: $date) {
      id
      label
    }
  }
`;

/** Creates (idempotently) the accounting period containing today. */
export const ensureCurrentPeriodAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(EnsurePeriodDocument, { date: toISODate(new Date()) });
    await revalidate();
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};

const SetPeriodStatusDocument = gql`
  mutation SetTimeTrackingPeriodStatus(
    $id: ID!
    $status: TimeTrackingPeriodStatus!
  ) {
    setTimeTrackingPeriodStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

export const setPeriodStatusAction = async (
  id: string,
  status: TimeTrackingPeriodStatus
) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(SetPeriodStatusDocument, { id, status });
    await revalidate();
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};
