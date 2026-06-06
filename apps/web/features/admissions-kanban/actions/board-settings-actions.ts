"use server";

import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { AdmissionBoardSettings } from "../types";

const UpdateDocument = gql`
  mutation UpdateAdmissionBoardSettings(
    $input: UpdateAdmissionBoardSettingsInput!
  ) {
    updateAdmissionBoardSettings(input: $input) {
      tableColumns
    }
  }
`;

export const updateBoardSettingsAction = async (tableColumns: string[]) => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      updateAdmissionBoardSettings: AdmissionBoardSettings;
    }>(UpdateDocument, { input: { tableColumns } });
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    return {
      success: true as const,
      data: data.updateAdmissionBoardSettings,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};
