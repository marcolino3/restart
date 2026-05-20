"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import type {
  AdmissionActivityDirection,
  AdmissionActivityType,
} from "./get-admission-activities.action";

export interface UpdateAdmissionActivityInput {
  id: string;
  applicationId: string;
  type?: AdmissionActivityType;
  occurredAt?: string;
  subject?: string | null;
  body?: string | null;
  direction?: AdmissionActivityDirection | null;
  durationMinutes?: number | null;
  location?: string | null;
}

const Document = gql`
  mutation UpdateAdmissionActivity($input: UpdateAdmissionActivityInput!) {
    updateAdmissionActivity(input: $input) {
      id
    }
  }
`;

export const updateAdmissionActivityAction = async (
  input: UpdateAdmissionActivityInput,
): Promise<{ success: true } | { success: false; error?: string }> => {
  const { applicationId, ...rest } = input;
  const client = await serverCookieGqlClient();
  try {
    await client.request(Document, { input: rest });
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
