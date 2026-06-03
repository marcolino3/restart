"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type AdmissionEmailStatus = "SENT" | "FAILED";

export type AdmissionEmail = {
  id: string;
  toEmail: string;
  toName: string | null;
  subject: string;
  bodyHtml: string;
  status: AdmissionEmailStatus;
  errorMessage: string | null;
  sentAt: string;
  templateName: string | null;
  sentByName: string | null;
};

const Document = gql`
  query AdmissionEmails($applicationId: ID!) {
    admissionEmails(applicationId: $applicationId) {
      id
      toEmail
      toName
      subject
      bodyHtml
      status
      errorMessage
      sentAt
      template {
        id
        name
      }
      sentByMembership {
        id
        user {
          firstName
          lastName
        }
      }
    }
  }
`;

export const getAdmissionEmailsAction = async (
  applicationId: string,
): Promise<
  { success: true; data: AdmissionEmail[] } | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      admissionEmails: Array<{
        id: string;
        toEmail: string;
        toName: string | null;
        subject: string;
        bodyHtml: string;
        status: AdmissionEmailStatus;
        errorMessage: string | null;
        sentAt: string;
        template: { id: string; name: string } | null;
        sentByMembership: {
          id: string;
          user?: { firstName: string; lastName: string } | null;
        } | null;
      }>;
    }>(Document, { applicationId });

    return {
      success: true,
      data: resp.admissionEmails.map((e) => ({
        id: e.id,
        toEmail: e.toEmail,
        toName: e.toName,
        subject: e.subject,
        bodyHtml: e.bodyHtml,
        status: e.status,
        errorMessage: e.errorMessage,
        sentAt: e.sentAt,
        templateName: e.template?.name ?? null,
        sentByName: e.sentByMembership?.user
          ? `${e.sentByMembership.user.firstName} ${e.sentByMembership.user.lastName}`.trim()
          : null,
      })),
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load emails",
    };
  }
};
