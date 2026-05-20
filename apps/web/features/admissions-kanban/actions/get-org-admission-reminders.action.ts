"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type AdmissionReminderListFilter =
  | "OVERDUE"
  | "TODAY"
  | "WEEK"
  | "OPEN"
  | "COMPLETED";

export type OrgAdmissionReminder = {
  id: string;
  applicationId: string;
  applicationChildName: string;
  dueAt: string;
  title: string;
  note: string | null;
  assignedToName: string | null;
  completedAt: string | null;
};

const Document = gql`
  query OrgAdmissionReminders($filter: AdmissionReminderFilter) {
    orgAdmissionReminders(filter: $filter) {
      id
      applicationId
      dueAt
      title
      note
      completedAt
      application {
        id
        childFirstName
        childLastName
      }
      assignedToMembership {
        id
        user {
          firstName
          lastName
        }
      }
    }
  }
`;

export const getOrgAdmissionRemindersAction = async (
  filter: AdmissionReminderListFilter = "OPEN",
): Promise<
  | { success: true; data: OrgAdmissionReminder[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      orgAdmissionReminders: Array<{
        id: string;
        applicationId: string;
        dueAt: string;
        title: string;
        note: string | null;
        completedAt: string | null;
        application: {
          id: string;
          childFirstName: string;
          childLastName: string;
        } | null;
        assignedToMembership: {
          id: string;
          user?: { firstName: string; lastName: string } | null;
        } | null;
      }>;
    }>(Document, { filter });
    return {
      success: true,
      data: resp.orgAdmissionReminders.map((r) => ({
        id: r.id,
        applicationId: r.applicationId,
        applicationChildName: r.application
          ? `${r.application.childFirstName} ${r.application.childLastName}`.trim()
          : "—",
        dueAt: r.dueAt,
        title: r.title,
        note: r.note,
        assignedToName: r.assignedToMembership?.user
          ? `${r.assignedToMembership.user.firstName} ${r.assignedToMembership.user.lastName}`.trim()
          : null,
        completedAt: r.completedAt,
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
