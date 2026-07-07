"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type AdmissionAppointment = {
  id: string;
  applicationId: string;
  appointmentTypeId: string | null;
  appointmentTypeLabel: string | null;
  appointmentTypeColor: string | null;
  scheduledAt: string;
  endsAt: string | null;
  assignedToMembershipIds: string[];
  assignedNames: string[];
  durationMinutes: number | null;
  location: string | null;
  note: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
};

const Document = gql`
  query AdmissionAppointmentsByApplication($applicationId: ID!) {
    admissionAppointmentsByApplication(applicationId: $applicationId) {
      id
      applicationId
      appointmentTypeId
      appointmentType {
        id
        label
        color
      }
      scheduledAt
      endsAt
      assignees {
        membershipId
        membership {
          id
          user {
            firstName
            lastName
          }
        }
      }
      durationMinutes
      location
      note
      status
      createdAt
    }
  }
`;

export const getAdmissionAppointmentsAction = async (
  applicationId: string,
): Promise<
  | { success: true; data: AdmissionAppointment[] }
  | { success: false; error?: string }
> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      admissionAppointmentsByApplication: Array<{
        id: string;
        applicationId: string;
        appointmentTypeId: string | null;
        appointmentType: {
          id: string;
          label: string;
          color: string | null;
        } | null;
        scheduledAt: string;
        endsAt: string | null;
        assignees: Array<{
          membershipId: string;
          membership?: {
            id: string;
            user?: { firstName: string; lastName: string } | null;
          } | null;
        }> | null;
        durationMinutes: number | null;
        location: string | null;
        note: string | null;
        status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
        createdAt: string;
      }>;
    }>(Document, { applicationId });
    return {
      success: true,
      data: resp.admissionAppointmentsByApplication.map((a) => ({
        id: a.id,
        applicationId: a.applicationId,
        appointmentTypeId: a.appointmentTypeId,
        appointmentTypeLabel: a.appointmentType?.label ?? null,
        appointmentTypeColor: a.appointmentType?.color ?? null,
        scheduledAt: a.scheduledAt,
        endsAt: a.endsAt,
        assignedToMembershipIds: (a.assignees ?? []).map(
          (x) => x.membershipId,
        ),
        assignedNames: (a.assignees ?? [])
          .map((x) =>
            x.membership?.user
              ? `${x.membership.user.firstName} ${x.membership.user.lastName}`.trim()
              : null,
          )
          .filter((n): n is string => !!n),
        durationMinutes: a.durationMinutes,
        location: a.location,
        note: a.note,
        status: a.status,
        createdAt: a.createdAt,
      })),
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load appointments",
    };
  }
};
