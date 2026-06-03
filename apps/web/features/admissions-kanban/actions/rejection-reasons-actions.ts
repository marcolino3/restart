"use server";

import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { AdmissionRejectionReason } from "../types";

const REASON_FIELDS = `
  id
  label
  color
  position
`;

const ListDocument = gql`
  query AdmissionRejectionReasons($includeArchived: Boolean) {
    admissionRejectionReasons(includeArchived: $includeArchived) {
      ${REASON_FIELDS}
    }
  }
`;

const CreateDocument = gql`
  mutation CreateAdmissionRejectionReason(
    $input: CreateAdmissionRejectionReasonInput!
  ) {
    createAdmissionRejectionReason(input: $input) {
      ${REASON_FIELDS}
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateAdmissionRejectionReason(
    $input: UpdateAdmissionRejectionReasonInput!
  ) {
    updateAdmissionRejectionReason(input: $input) {
      ${REASON_FIELDS}
    }
  }
`;

const ArchiveDocument = gql`
  mutation ArchiveAdmissionRejectionReason($id: ID!) {
    archiveAdmissionRejectionReason(id: $id)
  }
`;

const ReorderDocument = gql`
  mutation ReorderAdmissionRejectionReasons(
    $input: ReorderAdmissionRejectionReasonsInput!
  ) {
    reorderAdmissionRejectionReasons(input: $input) {
      id
      position
    }
  }
`;

const KANBAN_PATH = "/[locale]/admin/admissions/kanban";

export const getAdmissionRejectionReasonsAction = async (): Promise<
  AdmissionRejectionReason[]
> => {
  const client = await serverCookieGqlClient();
  const data = await client.request<{
    admissionRejectionReasons: AdmissionRejectionReason[];
  }>(ListDocument, { includeArchived: false });
  return data.admissionRejectionReasons;
};

export type CreateRejectionReasonInput = {
  label: string;
  color?: string | null;
  position?: number;
};

export const createAdmissionRejectionReasonAction = async (
  input: CreateRejectionReasonInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const clean = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== null && v !== undefined),
    );
    const data = await client.request<{
      createAdmissionRejectionReason: AdmissionRejectionReason;
    }>(CreateDocument, { input: clean });
    revalidatePath(KANBAN_PATH, "page");
    return { success: true as const, data: data.createAdmissionRejectionReason };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
};

export type UpdateRejectionReasonInput = {
  id: string;
  label?: string;
  color?: string | null;
};

export const updateAdmissionRejectionReasonAction = async (
  input: UpdateRejectionReasonInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      updateAdmissionRejectionReason: AdmissionRejectionReason;
    }>(UpdateDocument, { input });
    revalidatePath(KANBAN_PATH, "page");
    return { success: true as const, data: data.updateAdmissionRejectionReason };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};

export const archiveAdmissionRejectionReasonAction = async (id: string) => {
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

export const reorderAdmissionRejectionReasonsAction = async (ids: string[]) => {
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
