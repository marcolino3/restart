"use server";

import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const Document = gql`
  mutation ReorderAdmissionApplications(
    $input: ReorderAdmissionApplicationsInput!
  ) {
    reorderAdmissionApplications(input: $input) {
      id
      position
    }
  }
`;

export type ReorderApplicationsInput = {
  stageId: string;
  applicationIds: string[];
};

export const reorderApplicationsAction = async (
  input: ReorderApplicationsInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      reorderAdmissionApplications: Array<{ id: string; position: number }>;
    }>(Document, { input });
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    return { success: true as const, data: data.reorderAdmissionApplications };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Reorder failed",
    };
  }
};
