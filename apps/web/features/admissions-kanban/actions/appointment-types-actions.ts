"use server";

import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { AdmissionAppointmentType } from "../types";

const TYPE_FIELDS = `
  id
  label
  color
  position
`;

const ListDocument = gql`
  query AdmissionAppointmentTypes($includeArchived: Boolean) {
    admissionAppointmentTypes(includeArchived: $includeArchived) {
      ${TYPE_FIELDS}
    }
  }
`;

const CreateDocument = gql`
  mutation CreateAdmissionAppointmentType(
    $input: CreateAdmissionAppointmentTypeInput!
  ) {
    createAdmissionAppointmentType(input: $input) {
      ${TYPE_FIELDS}
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateAdmissionAppointmentType(
    $input: UpdateAdmissionAppointmentTypeInput!
  ) {
    updateAdmissionAppointmentType(input: $input) {
      ${TYPE_FIELDS}
    }
  }
`;

const ArchiveDocument = gql`
  mutation ArchiveAdmissionAppointmentType($id: ID!) {
    archiveAdmissionAppointmentType(id: $id)
  }
`;

const ReorderDocument = gql`
  mutation ReorderAdmissionAppointmentTypes(
    $input: ReorderAdmissionAppointmentTypesInput!
  ) {
    reorderAdmissionAppointmentTypes(input: $input) {
      id
      position
    }
  }
`;

const KANBAN_PATH = "/[locale]/admin/admissions/kanban";

export const getAdmissionAppointmentTypesAction = async (): Promise<
  AdmissionAppointmentType[]
> => {
  const client = await serverCookieGqlClient();
  const data = await client.request<{
    admissionAppointmentTypes: AdmissionAppointmentType[];
  }>(ListDocument, { includeArchived: false });
  return data.admissionAppointmentTypes;
};

export type CreateAppointmentTypeInput = {
  label: string;
  color?: string | null;
  position?: number;
};

export const createAdmissionAppointmentTypeAction = async (
  input: CreateAppointmentTypeInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const clean = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== null && v !== undefined),
    );
    const data = await client.request<{
      createAdmissionAppointmentType: AdmissionAppointmentType;
    }>(CreateDocument, { input: clean });
    revalidatePath(KANBAN_PATH, "page");
    return { success: true as const, data: data.createAdmissionAppointmentType };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
};

export type UpdateAppointmentTypeInput = {
  id: string;
  label?: string;
  color?: string | null;
};

export const updateAdmissionAppointmentTypeAction = async (
  input: UpdateAppointmentTypeInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      updateAdmissionAppointmentType: AdmissionAppointmentType;
    }>(UpdateDocument, { input });
    revalidatePath(KANBAN_PATH, "page");
    return { success: true as const, data: data.updateAdmissionAppointmentType };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};

export const archiveAdmissionAppointmentTypeAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(ArchiveDocument, { id });
    revalidatePath(KANBAN_PATH, "page");
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Archive failed",
    };
  }
};

export const reorderAdmissionAppointmentTypesAction = async (ids: string[]) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(ReorderDocument, { input: { ids } });
    revalidatePath(KANBAN_PATH, "page");
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Reorder failed",
    };
  }
};
