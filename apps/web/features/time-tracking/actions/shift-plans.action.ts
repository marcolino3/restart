"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { ROUTES } from "@/constants/routes";
import type { Shift } from "./shifts.action";

export type ShiftPlanTeam = { id: string; name: string; canWrite: boolean };

export type ShiftCoverageRow = {
  id: string;
  teamId: string;
  shiftId: string;
  weekday: string;
  requiredCount: number;
};

export type ShiftPlanStatus = "DRAFT" | "PUBLISHED";
export type ShiftPlanSource = "MANUAL" | "AI";

export type ShiftPlanSummary = {
  id: string;
  teamId: string;
  startDate: string;
  endDate: string;
  status: ShiftPlanStatus;
  source: ShiftPlanSource;
  createdAt: string;
  updatedAt: string;
};

export type ShiftPlanEmployee = {
  employeeId: string;
  firstName: string | null;
  lastName: string | null;
};

export type ShiftPreferenceLevel = "PREFERRED" | "NEUTRAL" | "AVOID";

export type ShiftPlanCandidate = ShiftPlanEmployee & {
  availableDates: string[];
  preferences: { shiftId: string; level: ShiftPreferenceLevel }[];
};

export type ShiftAssignment = {
  id: string;
  planId: string;
  date: string;
  shiftId: string;
  employeeId: string;
};

export type ShiftPlanDetail = {
  plan: ShiftPlanSummary;
  shifts: Shift[];
  coverage: ShiftCoverageRow[];
  assignments: ShiftAssignment[];
  employees: ShiftPlanEmployee[];
  candidates: ShiftPlanCandidate[];
};

export type MyShiftAssignment = {
  id: string;
  date: string;
  shiftId: string;
  shift: Pick<Shift, "id" | "name" | "color" | "startTime" | "endTime"> | null;
};

export type SetShiftCoverageInput = {
  teamId: string;
  rows: { shiftId: string; weekday: string; requiredCount: number }[];
};

export type CreateShiftPlanInput = {
  teamId: string;
  startDate: string;
  endDate: string;
};

export type SetShiftAssignmentsInput = {
  planId: string;
  date: string;
  shiftId: string;
  employeeIds: string[];
};

const PLAN_FIELDS = `
  id
  teamId
  startDate
  endDate
  status
  source
  createdAt
  updatedAt
`;

const SHIFT_FIELDS = `
  id
  name
  startTime
  endTime
  color
  sortOrder
  breaks {
    startTime
    endTime
  }
  teamIds
`;

const ShiftPlanTeamsDocument = gql`
  query ShiftPlanTeams {
    shiftPlanTeams {
      id
      name
      canWrite
    }
  }
`;

const ShiftCoverageDocument = gql`
  query ShiftCoverage($teamId: ID!) {
    shiftCoverage(teamId: $teamId) {
      id
      teamId
      shiftId
      weekday
      requiredCount
    }
  }
`;

const SetShiftCoverageDocument = gql`
  mutation SetShiftCoverage($input: SetShiftCoverageInput!) {
    setShiftCoverage(input: $input) {
      id
      teamId
      shiftId
      weekday
      requiredCount
    }
  }
`;

const ShiftPlansDocument = gql`
  query ShiftPlans($teamId: ID) {
    shiftPlans(teamId: $teamId) {
      ${PLAN_FIELDS}
    }
  }
`;

const ShiftPlanDocument = gql`
  query ShiftPlan($id: ID!) {
    shiftPlan(id: $id) {
      plan {
        ${PLAN_FIELDS}
      }
      shifts {
        ${SHIFT_FIELDS}
      }
      coverage {
        id
        teamId
        shiftId
        weekday
        requiredCount
      }
      assignments {
        id
        planId
        date
        shiftId
        employeeId
      }
      employees {
        employeeId
        firstName
        lastName
      }
      candidates {
        employeeId
        firstName
        lastName
        availableDates
        preferences {
          shiftId
          level
        }
      }
    }
  }
`;

const CreateShiftPlanDocument = gql`
  mutation CreateShiftPlan($input: CreateShiftPlanInput!) {
    createShiftPlan(input: $input) {
      ${PLAN_FIELDS}
    }
  }
`;

const SetShiftAssignmentsDocument = gql`
  mutation SetShiftAssignments($input: SetShiftAssignmentsInput!) {
    setShiftAssignments(input: $input) {
      id
      planId
      date
      shiftId
      employeeId
    }
  }
`;

const PublishShiftPlanDocument = gql`
  mutation PublishShiftPlan($id: ID!) {
    publishShiftPlan(id: $id) {
      ${PLAN_FIELDS}
    }
  }
`;

const UnpublishShiftPlanDocument = gql`
  mutation UnpublishShiftPlan($id: ID!) {
    unpublishShiftPlan(id: $id) {
      ${PLAN_FIELDS}
    }
  }
`;

const DeleteShiftPlanDocument = gql`
  mutation DeleteShiftPlan($id: ID!) {
    deleteShiftPlan(id: $id)
  }
`;

const MyShiftAssignmentsDocument = gql`
  query MyShiftAssignments($from: String!, $to: String!) {
    myShiftAssignments(from: $from, to: $to) {
      id
      date
      shiftId
      shift {
        id
        name
        color
        startTime
        endTime
      }
    }
  }
`;

async function revalidatePlans(planId?: string) {
  const locale = await getLocale();
  revalidatePath(ROUTES.admin.shiftPlans(locale));
  if (planId) revalidatePath(ROUTES.admin.shiftPlan(locale, planId));
}

export const getShiftPlanTeamsAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { shiftPlanTeams } = await client.request<{
      shiftPlanTeams: ShiftPlanTeam[];
    }>(ShiftPlanTeamsDocument);
    return { success: true as const, data: shiftPlanTeams ?? [] };
  } catch (error) {
    console.error("getShiftPlanTeamsAction", error);
    return { success: false as const, error };
  }
};

export const getShiftCoverageAction = async (teamId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { shiftCoverage } = await client.request<{
      shiftCoverage: ShiftCoverageRow[];
    }>(ShiftCoverageDocument, { teamId });
    return { success: true as const, data: shiftCoverage ?? [] };
  } catch (error) {
    console.error("getShiftCoverageAction", error);
    return { success: false as const, error };
  }
};

export const setShiftCoverageAction = async (input: SetShiftCoverageInput) => {
  const client = await serverCookieGqlClient();
  try {
    const { setShiftCoverage } = await client.request<{
      setShiftCoverage: ShiftCoverageRow[];
    }>(SetShiftCoverageDocument, { input });
    await revalidatePlans();
    return { success: true as const, data: setShiftCoverage };
  } catch (error) {
    console.error("setShiftCoverageAction", error);
    return { success: false as const, error };
  }
};

export const getShiftPlansAction = async (teamId?: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { shiftPlans } = await client.request<{
      shiftPlans: ShiftPlanSummary[];
    }>(ShiftPlansDocument, { teamId: teamId ?? null });
    return { success: true as const, data: shiftPlans ?? [] };
  } catch (error) {
    console.error("getShiftPlansAction", error);
    return { success: false as const, error };
  }
};

export const getShiftPlanAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { shiftPlan } = await client.request<{ shiftPlan: ShiftPlanDetail }>(
      ShiftPlanDocument,
      { id },
    );
    return { success: true as const, data: shiftPlan };
  } catch (error) {
    console.error("getShiftPlanAction", error);
    return { success: false as const, error };
  }
};

export const createShiftPlanAction = async (input: CreateShiftPlanInput) => {
  const client = await serverCookieGqlClient();
  try {
    const { createShiftPlan } = await client.request<{
      createShiftPlan: ShiftPlanSummary;
    }>(CreateShiftPlanDocument, { input });
    await revalidatePlans();
    return { success: true as const, data: createShiftPlan };
  } catch (error) {
    console.error("createShiftPlanAction", error);
    return { success: false as const, error };
  }
};

export const setShiftAssignmentsAction = async (
  input: SetShiftAssignmentsInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const { setShiftAssignments } = await client.request<{
      setShiftAssignments: ShiftAssignment[];
    }>(SetShiftAssignmentsDocument, { input });
    await revalidatePlans(input.planId);
    return { success: true as const, data: setShiftAssignments };
  } catch (error) {
    console.error("setShiftAssignmentsAction", error);
    return { success: false as const, error };
  }
};

export const publishShiftPlanAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { publishShiftPlan } = await client.request<{
      publishShiftPlan: ShiftPlanSummary;
    }>(PublishShiftPlanDocument, { id });
    await revalidatePlans(id);
    return { success: true as const, data: publishShiftPlan };
  } catch (error) {
    console.error("publishShiftPlanAction", error);
    return { success: false as const, error };
  }
};

export const unpublishShiftPlanAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { unpublishShiftPlan } = await client.request<{
      unpublishShiftPlan: ShiftPlanSummary;
    }>(UnpublishShiftPlanDocument, { id });
    await revalidatePlans(id);
    return { success: true as const, data: unpublishShiftPlan };
  } catch (error) {
    console.error("unpublishShiftPlanAction", error);
    return { success: false as const, error };
  }
};

export const deleteShiftPlanAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request<{ deleteShiftPlan: boolean }>(
      DeleteShiftPlanDocument,
      { id },
    );
    await revalidatePlans(id);
    return { success: true as const };
  } catch (error) {
    console.error("deleteShiftPlanAction", error);
    return { success: false as const, error };
  }
};

export const getMyShiftAssignmentsAction = async (from: string, to: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { myShiftAssignments } = await client.request<{
      myShiftAssignments: MyShiftAssignment[];
    }>(MyShiftAssignmentsDocument, { from, to });
    return { success: true as const, data: myShiftAssignments ?? [] };
  } catch (error) {
    console.error("getMyShiftAssignmentsAction", error);
    return { success: false as const, error };
  }
};
