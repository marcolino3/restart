"use server";

import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const Document = gql`
  mutation UpdateContactPerson($input: UpdateContactPersonInput!) {
    updateContactPerson(input: $input) {
      id
    }
  }
`;

/**
 * Slim contact-person update used from the admission detail's
 * "Angaben bearbeiten" dialog — only the fields surfaced there.
 */
export type UpdateApplicationContactInput = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  roles?: string[];
};

export const updateApplicationContactAction = async (
  input: UpdateApplicationContactInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      updateContactPerson: { id: string };
    }>(Document, { input });
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    return { success: true as const, data: data.updateContactPerson };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};
