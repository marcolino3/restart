"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants/routes";
import {
  minutesOfDay,
  type TimeEntryFormOutput,
} from "../schemas/time-entry-form.schema";

const CreateDocument = gql`
  mutation CreateTimeTracking($input: CreateTimeTrackingInput!) {
    createTimeTracking(input: $input) {
      id
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateTimeTracking($input: UpdateTimeTrackingInput!) {
    updateTimeTracking(input: $input) {
      id
    }
  }
`;

const DeleteDocument = gql`
  mutation DeleteTimeTracking($id: ID!) {
    deleteTimeTracking(id: $id)
  }
`;

const StartDocument = gql`
  mutation StartTimeTracking($employeeId: ID!) {
    startTimeTracking(employeeId: $employeeId) {
      id
    }
  }
`;

const StopDocument = gql`
  mutation StopTimeTracking($employeeId: ID!) {
    stopTimeTracking(employeeId: $employeeId) {
      id
    }
  }
`;

async function revalidate() {
  const locale = await getLocale();
  revalidatePath(ROUTES.admin.myTimeTracking(locale));
}

/** Baut aus Formularwerten das GraphQL-Input (startedAt/endedAt als ISO). */
function toTimeInput(values: TimeEntryFormOutput) {
  const startMin = minutesOfDay(values.startTime);
  const endMin = minutesOfDay(values.endTime);
  const started = new Date(values.date);
  started.setHours(Math.floor(startMin / 60), startMin % 60, 0, 0);
  const ended = new Date(values.date);
  ended.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
  return {
    startedAt: started.toISOString(),
    endedAt: ended.toISOString(),
    breakMinutes: values.breakMinutes ?? 0,
    notes: values.notes ?? null,
  };
}

export const createTimeEntryAction = async (
  employeeId: string,
  values: TimeEntryFormOutput
) => {
  const client = await serverCookieGqlClient();
  try {
    const { createTimeTracking } = await client.request<{
      createTimeTracking: { id: string };
    }>(CreateDocument, { input: { employeeId, ...toTimeInput(values) } });
    await revalidate();
    return { success: true as const, data: createTimeTracking };
  } catch (error) {
    return { success: false as const, error };
  }
};

export const updateTimeEntryAction = async (
  id: string,
  values: TimeEntryFormOutput
) => {
  const client = await serverCookieGqlClient();
  try {
    const { updateTimeTracking } = await client.request<{
      updateTimeTracking: { id: string };
    }>(UpdateDocument, { input: { id, ...toTimeInput(values) } });
    await revalidate();
    return { success: true as const, data: updateTimeTracking };
  } catch (error) {
    return { success: false as const, error };
  }
};

export const deleteTimeEntryAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteDocument, { id });
    await revalidate();
    return { success: true as const, data: true };
  } catch (error) {
    return { success: false as const, error };
  }
};

export const startClockAction = async (employeeId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { startTimeTracking } = await client.request<{
      startTimeTracking: { id: string };
    }>(StartDocument, { employeeId });
    await revalidate();
    return { success: true as const, data: startTimeTracking };
  } catch (error) {
    return { success: false as const, error };
  }
};

export const stopClockAction = async (employeeId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { stopTimeTracking } = await client.request<{
      stopTimeTracking: { id: string };
    }>(StopDocument, { employeeId });
    await revalidate();
    return { success: true as const, data: stopTimeTracking };
  } catch (error) {
    return { success: false as const, error };
  }
};
