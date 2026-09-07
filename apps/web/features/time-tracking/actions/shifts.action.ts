"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants/routes";

export type Shift = Record<string, unknown> & {
  id: string;
  name: string;
  /** `HH:MM` */
  startTime: string;
  /** `HH:MM` */
  endTime: string;
  color: string | null;
  sortOrder: number;
  /** Teams (of the active org) this shift is assigned to. */
  teamIds: string[];
};

export type ShiftInput = {
  name: string;
  startTime: string;
  endTime: string;
  color?: string | null;
  sortOrder?: number;
};

const ShiftsDocument = gql`
  query Shifts {
    shifts {
      id
      name
      startTime
      endTime
      color
      sortOrder
      teamIds
    }
  }
`;

const TeamShiftsDocument = gql`
  query TeamShifts($teamId: ID!) {
    teamShifts(teamId: $teamId) {
      id
      name
      startTime
      endTime
      color
      sortOrder
      teamIds
    }
  }
`;

const CreateShiftDocument = gql`
  mutation CreateShift($input: CreateShiftInput!) {
    createShift(input: $input) {
      id
      name
      startTime
      endTime
      color
      sortOrder
      teamIds
    }
  }
`;

const UpdateShiftDocument = gql`
  mutation UpdateShift($input: UpdateShiftInput!) {
    updateShift(input: $input) {
      id
      name
      startTime
      endTime
      color
      sortOrder
      teamIds
    }
  }
`;

const DeleteShiftDocument = gql`
  mutation DeleteShift($id: ID!) {
    deleteShift(id: $id)
  }
`;

const SetTeamShiftsDocument = gql`
  mutation SetTeamShifts($input: SetTeamShiftsInput!) {
    setTeamShifts(input: $input) {
      id
      name
      startTime
      endTime
      color
      sortOrder
      teamIds
    }
  }
`;

async function revalidateSettings() {
  const locale = await getLocale();
  revalidatePath(ROUTES.admin.timeTrackingSettings(locale));
}

export const getShiftsAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { shifts } = await client.request<{ shifts: Shift[] }>(
      ShiftsDocument,
    );
    return { success: true as const, data: shifts ?? [] };
  } catch (error) {
    console.error("getShiftsAction", error);
    return { success: false as const, error };
  }
};

export const getTeamShiftsAction = async (teamId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { teamShifts } = await client.request<{ teamShifts: Shift[] }>(
      TeamShiftsDocument,
      { teamId },
    );
    return { success: true as const, data: teamShifts ?? [] };
  } catch (error) {
    console.error("getTeamShiftsAction", error);
    return { success: false as const, error };
  }
};

export const createShiftAction = async (input: ShiftInput) => {
  const client = await serverCookieGqlClient();
  try {
    const { createShift } = await client.request<{ createShift: Shift }>(
      CreateShiftDocument,
      { input },
    );
    await revalidateSettings();
    return { success: true as const, data: createShift };
  } catch (error) {
    console.error("createShiftAction", error);
    return { success: false as const, error };
  }
};

export const updateShiftAction = async (input: ShiftInput & { id: string }) => {
  const client = await serverCookieGqlClient();
  try {
    const { updateShift } = await client.request<{ updateShift: Shift }>(
      UpdateShiftDocument,
      { input },
    );
    await revalidateSettings();
    return { success: true as const, data: updateShift };
  } catch (error) {
    console.error("updateShiftAction", error);
    return { success: false as const, error };
  }
};

export const deleteShiftAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteShiftDocument, { id });
    await revalidateSettings();
    return { success: true as const, data: true };
  } catch (error) {
    console.error("deleteShiftAction", error);
    return { success: false as const, error };
  }
};

export const setTeamShiftsAction = async (input: {
  teamId: string;
  shiftIds: string[];
}) => {
  const client = await serverCookieGqlClient();
  try {
    const { setTeamShifts } = await client.request<{ setTeamShifts: Shift[] }>(
      SetTeamShiftsDocument,
      { input },
    );
    const locale = await getLocale();
    revalidatePath(`${ROUTES.admin.teams(locale)}/${input.teamId}`);
    return { success: true as const, data: setTeamShifts };
  } catch (error) {
    console.error("setTeamShiftsAction", error);
    return { success: false as const, error };
  }
};
