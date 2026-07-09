"use server";

import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const Document = gql`
  mutation CreateApplicationContactPerson($input: CreateContactPersonInput!) {
    createContactPerson(input: $input) {
      id
    }
  }
`;

/**
 * Slim contact-person create used from the admission detail's
 * "Angaben bearbeiten" dialog — attaches the person to the
 * application's family and positions it via sortOrder.
 */
export type CreateApplicationContactInput = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  roles?: string[];
  familyId: string;
  /** Ordering within the family; lowest = primary contact. */
  sortOrder: number;
};

export const createApplicationContactAction = async (
  input: CreateApplicationContactInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      createContactPerson: { id: string };
    }>(Document, { input });
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    revalidatePath("/[locale]/admin/admissions/[id]", "page");
    return { success: true as const, data: data.createContactPerson };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
};
