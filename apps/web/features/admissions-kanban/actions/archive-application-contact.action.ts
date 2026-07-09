"use server";

import { revalidatePath } from "next/cache";
import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const Document = gql`
  mutation ArchiveApplicationContactPerson($id: ID!) {
    archiveContactPerson(id: $id)
  }
`;

/**
 * Archives (soft-removes) a contact person from within the admission "Angaben"
 * dialog. Revalidates both the board and the detail page so the removal shows
 * up on router.refresh() without a hard reload.
 */
export const archiveApplicationContactAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{ archiveContactPerson: boolean }>(
      Document,
      { id },
    );
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    revalidatePath("/[locale]/admin/admissions/[id]", "page");
    return { success: true as const, data: data.archiveContactPerson };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Archive failed",
    };
  }
};
