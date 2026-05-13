"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const ArchiveContactPersonDocument = gql`
  mutation ArchiveContactPerson($id: ID!) {
    archiveContactPerson(id: $id)
  }
`;

export const archiveContactPersonAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const result = await client.request<{ archiveContactPerson: boolean }>(
      ArchiveContactPersonDocument,
      { id },
    );
    revalidatePath(`/${locale}/admin/contact-persons`);
    return { success: true as const, data: result.archiveContactPerson };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: "Failed to archive contact person",
    };
  }
};
