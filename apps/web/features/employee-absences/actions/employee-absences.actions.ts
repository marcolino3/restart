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
