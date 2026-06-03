"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import type { AdmissionEmailStatus } from "./get-admission-emails.action";

const ResendDocument = gql`
  mutation ResendAdmissionEmail($id: ID!) {
    resendAdmissionEmail(id: $id) {
      id
      status
      errorMessage
    }
  }
`;

const DeleteDocument = gql`
  mutation DeleteAdmissionEmail($id: ID!) {
    deleteAdmissionEmail(id: $id)
  }
`;

export const resendAdmissionEmailAction = async (
  id: string,
  applicationId: string,
): Promise<
  | { success: true; status: AdmissionEmailStatus; errorMessage: string | null }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      resendAdmissionEmail: {
        id: string;
        status: AdmissionEmailStatus;
        errorMessage: string | null;
      };
    }>(ResendDocument, { id });
    revalidatePath(`/admin/admissions/${applicationId}`);
    return {
      success: true,
      status: resp.resendAdmissionEmail.status,
      errorMessage: resp.resendAdmissionEmail.errorMessage,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Resend failed",
    };
  }
};

export const deleteAdmissionEmailAction = async (
  id: string,
  applicationId: string,
): Promise<{ success: true } | { success: false; error?: string }> => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteDocument, { id });
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
