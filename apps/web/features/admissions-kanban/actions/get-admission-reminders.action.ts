"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type AdmissionReminder = {
  id: string;
  applicationId: string;
  dueAt: string;
  title: string;
  note: string | null;
  assignedToMembershipId: string | null;
  assignedToName: string | null;
  completedAt: string | null;
  createdAt: string;
};

const Document = gql`
  query AdmissionReminders($applicationId: ID!) {
    admissionReminders(applicationId: $applicationId) {
      id
      applicationId
      dueAt
      title
      note
      assignedToMembershipId
      assignedToMembership {
        id
        user {
          firstName
          lastName
        }
      }
      completedAt
      createdAt
    }
  }
`;

export const getAdmissionRemindersAction = async (
  applicationId: string,
): Promise<
  | { success: true; data: AdmissionReminder[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      admissionReminders: Array<{
        id: string;
        applicationId: string;
        dueAt: string;
        title: string;
        note: string | null;
        assignedToMembershipId: string | null;
        assignedToMembership: {
          id: string;
          user?: { firstName: string; lastName: string } | null;
        } | null;
        completedAt: string | null;
        createdAt: string;
      }>;
    }>(Document, { applicationId });
    return {
      success: true,
      data: resp.admissionReminders.map((r) => ({
        id: r.id,
        applicationId: r.applicationId,
        dueAt: r.dueAt,
        title: r.title,
        note: r.note,
        assignedToMembershipId: r.assignedToMembershipId,
        assignedToName: r.assignedToMembership?.user
          ? `${r.assignedToMembership.user.firstName} ${r.assignedToMembership.user.lastName}`.trim()
          : null,
        completedAt: r.completedAt,
        createdAt: r.createdAt,
      })),
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load reminders",
    };
  }
};
