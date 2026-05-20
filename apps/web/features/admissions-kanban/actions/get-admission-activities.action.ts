"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type AdmissionActivityType = "CALL" | "EMAIL" | "MEETING" | "NOTE";
export type AdmissionActivityDirection = "INBOUND" | "OUTBOUND";

export type AdmissionActivity = {
  id: string;
  applicationId: string;
  type: AdmissionActivityType;
  occurredAt: string;
  subject: string | null;
  body: string | null;
  direction: AdmissionActivityDirection | null;
  durationMinutes: number | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  createdByMembershipId: string | null;
  createdByName: string | null;
};

const Document = gql`
  query AdmissionActivities($applicationId: ID!) {
    admissionActivities(applicationId: $applicationId) {
      id
      applicationId
      type
      occurredAt
      subject
      body
      direction
      durationMinutes
      location
      createdAt
      updatedAt
      createdByMembershipId
      createdByMembership {
        id
        user {
          firstName
          lastName
        }
      }
    }
  }
`;

export const getAdmissionActivitiesAction = async (
  applicationId: string,
): Promise<
  | { success: true; data: AdmissionActivity[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      admissionActivities: Array<{
        id: string;
        applicationId: string;
        type: AdmissionActivityType;
        occurredAt: string;
        subject: string | null;
        body: string | null;
        direction: AdmissionActivityDirection | null;
        durationMinutes: number | null;
        location: string | null;
        createdAt: string;
        updatedAt: string;
        createdByMembershipId: string | null;
        createdByMembership: {
          id: string;
          user?: { firstName: string; lastName: string } | null;
        } | null;
      }>;
    }>(Document, { applicationId });

    return {
      success: true,
      data: resp.admissionActivities.map((a) => ({
        id: a.id,
        applicationId: a.applicationId,
        type: a.type,
        occurredAt: a.occurredAt,
        subject: a.subject,
        body: a.body,
        direction: a.direction,
        durationMinutes: a.durationMinutes,
        location: a.location,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        createdByMembershipId: a.createdByMembershipId,
        createdByName: a.createdByMembership?.user
          ? `${a.createdByMembership.user.firstName} ${a.createdByMembership.user.lastName}`.trim()
          : null,
      })),
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load activities",
    };
  }
};
