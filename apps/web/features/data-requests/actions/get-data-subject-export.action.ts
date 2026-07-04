"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const DataSubjectExportDocument = gql`
  query DataSubjectExport($subjectType: DataSubjectType!, $subjectId: ID!) {
    dataSubjectExport(subjectType: $subjectType, subjectId: $subjectId)
  }
`;

type Response = { dataSubjectExport: string };

/** Returns the subject's data as a pretty-printed JSON string (Art. 15/20). */
export const getDataSubjectExportAction = async (
  subjectType: string,
  subjectId: string,
) => {
  try {
    const client = await serverCookieGqlClient();
    const { dataSubjectExport } = await client.request<Response>(
      DataSubjectExportDocument,
      { subjectType, subjectId },
    );
    return { success: true as const, data: dataSubjectExport };
  } catch (error) {
    const message =
      (error as { response?: { errors?: { message?: string }[] } })?.response
        ?.errors?.[0]?.message ?? "Unknown error";
    return { success: false as const, error: message };
  }
};
