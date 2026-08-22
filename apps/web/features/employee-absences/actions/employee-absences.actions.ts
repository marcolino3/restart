"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import {
  EmployeeAbsenceFormSchema,
  type EmployeeAbsenceFormOutput,
} from "../schemas/employee-absence-form.schema";
import { toAbsenceIsoDateTime } from "@restart/shared-schemas/employee-absences/absence-date";
import type { AbsenceDocument } from "@restart/shared-schemas/employee-absences/absence-document";
import type { AbsenceCategoryTranslation } from "@/features/employee-absence-categories/types";
import type { EmployeeAbsenceStatusType } from "../schemas/employee-absence-notice-form.schema";

export type EmployeeAbsence = Record<string, unknown> & {
  id: string;
  employeeId: string;
  absenceCategoryId: string;
  startDate: string;
  endDate?: string | null;
  note?: string | null;
  isTeamInformed: boolean;
  isVacationCapable: boolean;
  percentage: number;
  certificates?: AbsenceDocument[] | null;
  additionalDocuments?: AbsenceDocument[] | null;
  isActive: boolean;
  status: EmployeeAbsenceStatusType;
  requestedAt?: string | null;
  decidedAt?: string | null;
  decisionNote?: string | null;
  employee?: {
    id: string;
    membership?: {
      id: string;
      user?: { firstName?: string | null; lastName?: string | null } | null;
    } | null;
  } | null;
  absenceCategory?: {
    id: string;
    systemCode?: string | null;
    color?: string | null;
    defaultIsVacationCapable?: boolean;
    defaultPercentage?: number;
    requiresCertificate?: boolean;
    certificateRequiredFromDay?: number | null;
    translations?: AbsenceCategoryTranslation[];
  } | null;
};

const AbsenceFields = `
  id
  employeeId
  absenceCategoryId
  startDate
  endDate
  note
  isTeamInformed
  isVacationCapable
  percentage
  certificates {
    url
    label
  }
  additionalDocuments {
    url
    label
  }
  isActive
  status
  requestedAt
  decidedAt
  decisionNote
  absenceCategory {
    id
    systemCode
    color
    defaultIsVacationCapable
    defaultPercentage
    requiresCertificate
    certificateRequiredFromDay
    translations {
      locale
      name
    }
  }
`;

const ListByEmployeeDocument = gql`
  query EmployeeAbsencesByEmployeeId($employeeId: ID!) {
    employeeAbsencesByEmployeeId(employeeId: $employeeId) {
      ${AbsenceFields}
    }
  }
`;

const MyAbsencesDocument = gql`
  query MyEmployeeAbsences {
    myEmployeeAbsences {
      ${AbsenceFields}
    }
  }
`;

const ByIdDocument = gql`
  query EmployeeAbsenceById($id: ID!) {
    employeeAbsenceById(id: $id) {
      ${AbsenceFields}
    }
  }
`;

const CreateDocument = gql`
  mutation CreateEmployeeAbsence($input: CreateEmployeeAbsenceInput!) {
    createEmployeeAbsence(input: $input) {
      id
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateEmployeeAbsence(
    $updateEmployeeAbsenceInput: UpdateEmployeeAbsenceInput!
  ) {
    updateEmployeeAbsence(
      updateEmployeeAbsenceInput: $updateEmployeeAbsenceInput
    ) {
      id
    }
  }
`;

const PendingRequestsDocument = gql`
  query PendingAbsenceRequests {
    pendingAbsenceRequests {
      ${AbsenceFields}
      employee {
        id
        membership {
          id
          user {
            firstName
            lastName
          }
        }
      }
    }
  }
`;

const ApproveDocument = gql`
  mutation ApproveEmployeeAbsence($input: DecideEmployeeAbsenceInput!) {
    approveEmployeeAbsence(input: $input) {
      id
      status
    }
  }
`;

const RejectDocument = gql`
  mutation RejectEmployeeAbsence($input: DecideEmployeeAbsenceInput!) {
    rejectEmployeeAbsence(input: $input) {
      id
      status
    }
  }
`;

const WithdrawDocument = gql`
  mutation WithdrawMyEmployeeAbsenceRequest($id: ID!) {
    withdrawMyEmployeeAbsenceRequest(id: $id)
  }
`;

const DeleteDocument = gql`
  mutation DeleteEmployeeAbsence($id: ID!) {
    deleteEmployeeAbsence(id: $id)
  }
`;

const toIsoDateTime = (
  value: unknown,
  includesTime = true,
) => toAbsenceIsoDateTime(value, includesTime);

export const getEmployeeAbsencesAction = async (employeeId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { employeeAbsencesByEmployeeId } = await client.request<{
      employeeAbsencesByEmployeeId: EmployeeAbsence[];
    }>(ListByEmployeeDocument, { employeeId });
    return {
      success: true as const,
      data: employeeAbsencesByEmployeeId,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to load absences",
      data: [] as EmployeeAbsence[],
    };
  }
};

/** Self-service: the caller's own absences, no employeeId argument. */
export const getMyEmployeeAbsencesAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { myEmployeeAbsences } = await client.request<{
      myEmployeeAbsences: EmployeeAbsence[];
    }>(MyAbsencesDocument);
    return { success: true as const, data: myEmployeeAbsences };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to load absences",
      data: [] as EmployeeAbsence[],
    };
  }
};

export const getEmployeeAbsenceByIdAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { employeeAbsenceById } = await client.request<{
      employeeAbsenceById: EmployeeAbsence;
    }>(ByIdDocument, { id });
    return { success: true as const, data: employeeAbsenceById };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to load absence",
      data: null,
    };
  }
};

export const saveEmployeeAbsenceAction = async (
  values: EmployeeAbsenceFormOutput,
) => {
  const locale = await getLocale();
  let parsed: EmployeeAbsenceFormOutput;
  try {
    parsed = EmployeeAbsenceFormSchema.parse(values);
  } catch (error) {
    console.error("Absence form validation failed", error);
    return {
      success: false as const,
      error: "Validation failed — check required absence fields",
    };
  }

  const client = await serverCookieGqlClient();
  const base = {
    startDate:
      toIsoDateTime(parsed.startDate, parsed.includesTime) ?? "",
    endDate:
      toIsoDateTime(parsed.endDate, parsed.includesTime) ??
      toIsoDateTime(parsed.startDate, parsed.includesTime),
    absenceCategoryId: parsed.absenceCategoryId,
    note: parsed.note ?? "",
    isTeamInformed: parsed.isTeamInformed,
    isVacationCapable: parsed.isVacationCapable,
    percentage: parsed.percentage,
    certificates: parsed.certificates ?? [],
    additionalDocuments: parsed.additionalDocuments ?? [],
  };

  try {
    if (parsed.id) {
      await client.request(UpdateDocument, {
        updateEmployeeAbsenceInput: { id: parsed.id, ...base },
      });
    } else {
      await client.request(CreateDocument, {
        input: { employeeId: parsed.employeeId, ...base },
      });
    }
    revalidatePath(`/${locale}/admin/employees`, "layout");
    return { success: true as const, data: null };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error ? error.message : "Failed to save absence",
    };
  }
};

export const deleteEmployeeAbsenceAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteDocument, { id });
    revalidatePath(`/${locale}/admin/employees`, "layout");
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to delete absence" };
  }
};

/** Open requests the caller may decide (admin/HR: all, lead: own teams). */
export const getPendingAbsenceRequestsAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { pendingAbsenceRequests } = await client.request<{
      pendingAbsenceRequests: EmployeeAbsence[];
    }>(PendingRequestsDocument);
    return { success: true as const, data: pendingAbsenceRequests };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to load absence requests",
      data: [] as EmployeeAbsence[],
    };
  }
};

const revalidateAbsences = async () => {
  const locale = await getLocale();
  revalidatePath(`/${locale}/admin/absence-requests`, "page");
  revalidatePath(`/${locale}/admin/my-absences`, "page");
  revalidatePath(`/${locale}/admin/employees`, "layout");
};

export const approveEmployeeAbsenceAction = async (
  id: string,
  note?: string,
) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(ApproveDocument, {
      input: { id, note: note?.trim() || null },
    });
    await revalidateAbsences();
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to approve request" };
  }
};

export const rejectEmployeeAbsenceAction = async (id: string, note: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(RejectDocument, { input: { id, note: note.trim() } });
    await revalidateAbsences();
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to reject request" };
  }
};

/** Self-service: withdraw an own request that is still pending. */
export const withdrawMyEmployeeAbsenceRequestAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(WithdrawDocument, { id });
    await revalidateAbsences();
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to withdraw request" };
  }
};
