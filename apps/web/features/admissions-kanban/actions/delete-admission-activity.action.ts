"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";

const Document = gql`
  mutation DeleteAdmissionActivity($id: ID!) {
    deleteAdmissionActivity(id: $id)
  }
`;

export const deleteAdmissionActivityAction = async (
  id: string,
  applicationId: string,
): Promise<{ success: true } | { success: false; error?: string }> => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(Document, { id });
    revalidatePath(`/admin/admissions/${applicationId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
};
