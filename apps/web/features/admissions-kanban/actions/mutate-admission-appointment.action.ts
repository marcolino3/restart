"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";

const CreateDoc = gql`
  mutation CreateAdmissionAppointment($input: CreateAdmissionAppointmentInput!) {
    createAdmissionAppointment(input: $input) {
      id
    }
  }
`;

const UpdateDoc = gql`
  mutation UpdateAdmissionAppointment($input: UpdateAdmissionAppointmentInput!) {
    updateAdmissionAppointment(input: $input) {
      id
    }
  }
`;

const DeleteDoc = gql`
  mutation DeleteAdmissionAppointment($id: ID!) {
    deleteAdmissionAppointment(id: $id)
  }
`;

export interface CreateAdmissionAppointmentInput {
  applicationId: string;
  appointmentTypeId?: string | null;
  scheduledAt: string;
  endsAt?: string | null;
  assignedToMembershipIds?: string[];
  durationMinutes?: number | null;
  location?: string | null;
  note?: string | null;
}

export const createAdmissionAppointmentAction = async (
  input: CreateAdmissionAppointmentInput,
): Promise<{ success: true; id: string } | { success: false; error?: string }> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      createAdmissionAppointment: { id: string };
    }>(CreateDoc, {
      input: {
        applicationId: input.applicationId,
        appointmentTypeId: input.appointmentTypeId ?? null,
        scheduledAt: input.scheduledAt,
        endsAt: input.endsAt ?? null,
        assignedToMembershipIds: input.assignedToMembershipIds ?? [],
        durationMinutes: input.durationMinutes ?? null,
        location: input.location ?? null,
        note: input.note ?? null,
      },
    });
    revalidatePath(`/admin/admissions/${input.applicationId}`);
    return { success: true, id: resp.createAdmissionAppointment.id };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
};

export interface UpdateAdmissionAppointmentInput {
  id: string;
  applicationId: string;
  appointmentTypeId?: string | null;
  scheduledAt?: string;
  endsAt?: string | null;
  assignedToMembershipIds?: string[];
  durationMinutes?: number | null;
  location?: string | null;
  note?: string | null;
  status?: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

export const updateAdmissionAppointmentAction = async (
  input: UpdateAdmissionAppointmentInput,
): Promise<{ success: true } | { success: false; error?: string }> => {
  const { applicationId, ...rest } = input;
  const client = await serverCookieGqlClient();
  try {
    await client.request(UpdateDoc, { input: rest });
    revalidatePath(`/admin/admissions/${applicationId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};

export const deleteAdmissionAppointmentAction = async (
  id: string,
  applicationId: string,
): Promise<{ success: true } | { success: false; error?: string }> => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteDoc, { id });
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
