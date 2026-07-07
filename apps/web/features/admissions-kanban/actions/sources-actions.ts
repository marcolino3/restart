"use server";

import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { AdmissionSource } from "../types";

const SOURCE_FIELDS = `
  id
  name
  color
  isArchived
  position
`;

const ListDocument = gql`
  query AdmissionSources($includeArchived: Boolean) {
    admissionSources(includeArchived: $includeArchived) {
      ${SOURCE_FIELDS}
    }
  }
`;

const CreateDocument = gql`
  mutation CreateAdmissionSource($input: CreateAdmissionSourceInput!) {
    createAdmissionSource(input: $input) {
      ${SOURCE_FIELDS}
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateAdmissionSource($input: UpdateAdmissionSourceInput!) {
    updateAdmissionSource(input: $input) {
      ${SOURCE_FIELDS}
    }
  }
`;

const ArchiveDocument = gql`
  mutation ArchiveAdmissionSource($id: ID!) {
    archiveAdmissionSource(id: $id)
  }
`;

const ReorderDocument = gql`
  mutation ReorderAdmissionSources($input: ReorderAdmissionSourcesInput!) {
    reorderAdmissionSources(input: $input) {
      id
      position
    }
  }
`;

const KANBAN_PATH = "/[locale]/admin/admissions/kanban";

export const getAdmissionSourcesAction = async (): Promise<
  AdmissionSource[]
> => {
  const client = await serverCookieGqlClient();
  const data = await client.request<{
    admissionSources: AdmissionSource[];
  }>(ListDocument, { includeArchived: false });
  return data.admissionSources;
};

export type CreateSourceInput = {
  name: string;
  color?: string | null;
  position?: number;
};

export const createAdmissionSourceAction = async (
  input: CreateSourceInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const clean = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== null && v !== undefined),
    );
    const data = await client.request<{
      createAdmissionSource: AdmissionSource;
    }>(CreateDocument, { input: clean });
    revalidatePath(KANBAN_PATH, "page");
    return { success: true as const, data: data.createAdmissionSource };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
};

export type UpdateSourceInput = {
  id: string;
  name?: string;
  color?: string | null;
};

export const updateAdmissionSourceAction = async (
  input: UpdateSourceInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      updateAdmissionSource: AdmissionSource;
    }>(UpdateDocument, { input });
    revalidatePath(KANBAN_PATH, "page");
    return { success: true as const, data: data.updateAdmissionSource };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};

export const archiveAdmissionSourceAction = async (id: string) => {
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

export const reorderAdmissionSourcesAction = async (ids: string[]) => {
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
