"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

type Response = {
  deleteLessonRecordsGroup: boolean;
};

const Document = gql`
  mutation DeleteLessonRecordsGroup($recordIds: [ID!]!) {
    deleteLessonRecordsGroup(recordIds: $recordIds)
  }
`;

/** Deletes every record behind one overview-table row. */
export const deleteLessonRecordsGroupAction = async (recordIds: string[]) => {
  const client = await serverCookieGqlClient();
  try {
    const { deleteLessonRecordsGroup } = await client.request<Response>(
      Document,
      { recordIds },
    );
    revalidatePath("/[locale]/admin/record-keeping", "page");
    return { success: true as const, data: deleteLessonRecordsGroup };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
};
