"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants/routes";

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

const PeriodAnchorDocument = gql`
  query TimeTrackingPeriodAnchor {
    timeTrackingPeriodAnchor
  }
`;

/** Accounting-period anchor of the active org, as MM-DD. */
export const getTimeTrackingPeriodAnchorAction = async (): Promise<string> => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{ timeTrackingPeriodAnchor: string }>(
      PeriodAnchorDocument
    );
    return data.timeTrackingPeriodAnchor ?? "01-01";
  } catch (error) {
    console.error("getTimeTrackingPeriodAnchorAction", error);
    return "01-01";
  }
};

const SetPeriodAnchorDocument = gql`
  mutation SetTimeTrackingPeriodAnchor($anchor: String!) {
    setTimeTrackingPeriodAnchor(anchor: $anchor)
  }
`;

export const setPeriodAnchorAction = async (anchor: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(SetPeriodAnchorDocument, { anchor });
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
