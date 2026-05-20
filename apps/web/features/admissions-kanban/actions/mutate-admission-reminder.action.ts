"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";

const CreateDoc = gql`
  mutation CreateAdmissionReminder($input: CreateAdmissionReminderInput!) {
    createAdmissionReminder(input: $input) {
      id
    }
  }
`;

const UpdateDoc = gql`
  mutation UpdateAdmissionReminder($input: UpdateAdmissionReminderInput!) {
    updateAdmissionReminder(input: $input) {
      id
    }
  }
`;

const CompleteDoc = gql`
  mutation CompleteAdmissionReminder($id: ID!) {
    completeAdmissionReminder(id: $id) {
      id
    }
  }
`;

const UncompleteDoc = gql`
  mutation UncompleteAdmissionReminder($id: ID!) {
    uncompleteAdmissionReminder(id: $id) {
      id
    }
  }
`;

const DeleteDoc = gql`
  mutation DeleteAdmissionReminder($id: ID!) {
    deleteAdmissionReminder(id: $id)
  }
`;

const revalidateBoth = (applicationId: string) => {
  revalidatePath(`/admin/admissions/${applicationId}`);
  revalidatePath(`/admin/admissions/reminders`);
};

export interface CreateAdmissionReminderInput {
  applicationId: string;
  dueAt: string;
  title: string;
  note?: string | null;
  assignedToMembershipId?: string | null;
}

export const createAdmissionReminderAction = async (
  input: CreateAdmissionReminderInput,
): Promise<{ success: true; id: string } | { success: false; error?: string }> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      createAdmissionReminder: { id: string };
    }>(CreateDoc, {
      input: {
        applicationId: input.applicationId,
        dueAt: input.dueAt,
        title: input.title,
        note: input.note ?? null,
        assignedToMembershipId: input.assignedToMembershipId ?? null,
      },
    });
    revalidateBoth(input.applicationId);
    return { success: true, id: resp.createAdmissionReminder.id };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
};

export interface UpdateAdmissionReminderInput {
  id: string;
  applicationId: string;
  dueAt?: string;
  title?: string;
  note?: string | null;
  assignedToMembershipId?: string | null;
}

export const updateAdmissionReminderAction = async (
  input: UpdateAdmissionReminderInput,
): Promise<{ success: true } | { success: false; error?: string }> => {
  const { applicationId, ...rest } = input;
  const client = await serverCookieGqlClient();
  try {
    await client.request(UpdateDoc, { input: rest });
    revalidateBoth(applicationId);
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};

export const completeAdmissionReminderAction = async (
  id: string,
  applicationId: string,
): Promise<{ success: true } | { success: false; error?: string }> => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(CompleteDoc, { id });
    revalidateBoth(applicationId);
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};

export const uncompleteAdmissionReminderAction = async (
  id: string,
  applicationId: string,
): Promise<{ success: true } | { success: false; error?: string }> => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(UncompleteDoc, { id });
    revalidateBoth(applicationId);
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};

export const deleteAdmissionReminderAction = async (
  id: string,
  applicationId: string,
): Promise<{ success: true } | { success: false; error?: string }> => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteDoc, { id });
    revalidateBoth(applicationId);
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
};
