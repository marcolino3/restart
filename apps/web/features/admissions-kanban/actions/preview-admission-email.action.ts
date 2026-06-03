"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type AdmissionEmailPreview = {
  subject: string;
  bodyHtml: string;
  toEmail: string | null;
  toName: string | null;
  availableVariables: string[];
};

const Document = gql`
  query PreviewAdmissionEmail($applicationId: ID!, $templateId: ID!) {
    previewAdmissionEmail(
      applicationId: $applicationId
      templateId: $templateId
    ) {
      subject
      bodyHtml
      toEmail
      toName
      availableVariables
    }
  }
`;

export const previewAdmissionEmailAction = async (
  applicationId: string,
  templateId: string,
): Promise<
  | { success: true; data: AdmissionEmailPreview }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      previewAdmissionEmail: AdmissionEmailPreview;
    }>(Document, { applicationId, templateId });
    return { success: true, data: resp.previewAdmissionEmail };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Preview failed",
    };
  }
};
