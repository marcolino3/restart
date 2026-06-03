"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import type { AdmissionEmailStatus } from "./get-admission-emails.action";

export interface SendAdmissionEmailInput {
  applicationId: string;
  templateId?: string | null;
  toEmail: string;
  toName?: string | null;
  subject: string;
  bodyHtml: string;
}

const Document = gql`
  mutation SendAdmissionEmail($input: SendAdmissionEmailInput!) {
    sendAdmissionEmail(input: $input) {
      id
      status
      errorMessage
    }
  }
`;

export const sendAdmissionEmailAction = async (
  input: SendAdmissionEmailInput,
): Promise<
  | { success: true; status: AdmissionEmailStatus; errorMessage: string | null }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      sendAdmissionEmail: {
        id: string;
        status: AdmissionEmailStatus;
        errorMessage: string | null;
      };
    }>(Document, {
      input: {
        applicationId: input.applicationId,
        templateId: input.templateId ?? null,
        toEmail: input.toEmail,
        toName: input.toName ?? null,
        subject: input.subject,
        bodyHtml: input.bodyHtml,
      },
    });
    revalidatePath(`/admin/admissions/${input.applicationId}`);
    return {
      success: true,
      status: resp.sendAdmissionEmail.status,
      errorMessage: resp.sendAdmissionEmail.errorMessage,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Send failed",
    };
  }
};
