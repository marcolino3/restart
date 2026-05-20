"use server";

import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { KanbanStage } from "../types";

const CreateDocument = gql`
  mutation CreateAdmissionStage($input: CreateAdmissionStageInput!) {
    createAdmissionStage(input: $input) {
      id
      name
      slug
      color
      position
      stageType
      isDefault
    }
  }
`;

const UpdateDocument = gql`
  mutation UpdateAdmissionStage($input: UpdateAdmissionStageInput!) {
    updateAdmissionStage(input: $input) {
      id
      name
      slug
      color
      position
      stageType
      isDefault
    }
  }
`;

const ArchiveDocument = gql`
  mutation ArchiveAdmissionStage($id: ID!) {
    archiveAdmissionStage(id: $id)
  }
`;

const ReorderDocument = gql`
  mutation ReorderAdmissionStages($input: ReorderAdmissionStagesInput!) {
    reorderAdmissionStages(input: $input) {
      id
      position
    }
  }
`;

export type CreateStageInput = {
  name: string;
  slug: string;
  color?: string | null;
  stageType?:
    | "INITIAL"
    | "IN_PROGRESS"
    | "ACCEPTED"
    | "ENROLLED"
    | "REJECTED"
    | null;
  isDefault?: boolean;
  position?: number;
};

export const createAdmissionStageAction = async (input: CreateStageInput) => {
  const client = await serverCookieGqlClient();
  try {
    const clean = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== null && v !== undefined),
    );
    const data = await client.request<{ createAdmissionStage: KanbanStage }>(
      CreateDocument,
      { input: clean },
    );
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    return { success: true as const, data: data.createAdmissionStage };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
};

export type UpdateStageInput = {
  id: string;
  name?: string;
  slug?: string;
  color?: string | null;
  stageType?:
    | "INITIAL"
    | "IN_PROGRESS"
    | "ACCEPTED"
    | "ENROLLED"
    | "REJECTED"
    | null;
  isDefault?: boolean;
};

export const updateAdmissionStageAction = async (input: UpdateStageInput) => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{ updateAdmissionStage: KanbanStage }>(
      UpdateDocument,
      { input },
    );
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    return { success: true as const, data: data.updateAdmissionStage };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};

export const archiveAdmissionStageAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(ArchiveDocument, { id });
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Archive failed",
    };
  }
};

export const reorderAdmissionStagesAction = async (ids: string[]) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(ReorderDocument, { input: { ids } });
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Reorder failed",
    };
  }
};
