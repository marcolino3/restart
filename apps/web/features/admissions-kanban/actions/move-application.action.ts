"use server";

import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const Document = gql`
  mutation MoveAdmissionApplication($input: MoveAdmissionApplicationInput!) {
    moveAdmissionApplication(input: $input) {
      id
      admissionStageId
      position
      stageEnteredAt
    }
  }
`;

export type MoveApplicationInput = {
  id: string;
  toStageId: string;
  position?: number;
};

export const moveApplicationAction = async (input: MoveApplicationInput) => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      moveAdmissionApplication: {
        id: string;
        admissionStageId: string;
        position: number;
        stageEnteredAt: string;
      };
    }>(Document, { input });
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    return { success: true as const, data: data.moveAdmissionApplication };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Move failed",
    };
  }
};
