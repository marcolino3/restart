"use server";

import { graphql } from "@restart/shared-types";
import { ExportOrganizationDataMutation } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const ExportOrganizationDataDocument = graphql(`
  mutation ExportOrganizationData($id: String!) {
    exportOrganizationData(id: $id) {
      jobId
      status
    }
  }
`);

export async function exportOrganizationDataAction(id: string) {
  const client = await serverCookieGqlClient();

  try {
    const { exportOrganizationData } =
      await client.request<ExportOrganizationDataMutation>(
        ExportOrganizationDataDocument,
        { id }
      );

    return { success: true as const, data: exportOrganizationData };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
