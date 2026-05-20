"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import type {
  AdmissionActivityDirection,
  AdmissionActivityType,
} from "./get-admission-activities.action";

export interface CreateAdmissionActivityInput {
  applicationId: string;
  type: AdmissionActivityType;
  occurredAt: string;
  subject?: string | null;
  body?: string | null;
  direction?: AdmissionActivityDirection | null;
  durationMinutes?: number | null;
  location?: string | null;
}

const Document = gql`
  mutation CreateAdmissionActivity($input: CreateAdmissionActivityInput!) {
    createAdmissionActivity(input: $input) {
      id
    }
  }
`;

export const createAdmissionActivityAction = async (
  input: CreateAdmissionActivityInput,
): Promise<{ success: true; id: string } | { success: false; error?: string }> => {
  const client = await serverCookieGqlClient();
  try {
    const resp = await client.request<{
      createAdmissionActivity: { id: string };
    }>(Document, {
      input: {
        applicationId: input.applicationId,
        type: input.type,
        occurredAt: input.occurredAt,
        subject: input.subject ?? null,
        body: input.body ?? null,
        direction: input.direction ?? null,
        durationMinutes: input.durationMinutes ?? null,
        location: input.location ?? null,
      },
    });
    revalidatePath(`/admin/admissions/${input.applicationId}`);
    return { success: true, id: resp.createAdmissionActivity.id };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
};
