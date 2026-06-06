"use server";

import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const ArchiveDocument = gql`
  mutation ArchiveAdmissionApplication($id: ID!) {
    archiveAdmissionApplication(id: $id)
  }
`;

const RejectDocument = gql`
  mutation RejectAdmissionApplication(
    $input: RejectAdmissionApplicationInput!
  ) {
    rejectAdmissionApplication(input: $input) {
      id
      status
      rejectionReason
      rejectionReasonId
      rejectedBy
    }
  }
`;

const DeleteDocument = gql`
  mutation DeleteAdmissionApplication($id: ID!) {
    deleteAdmissionApplication(id: $id)
  }
`;

const RestoreDocument = gql`
  mutation RestoreAdmissionApplication($id: ID!) {
    restoreAdmissionApplication(id: $id) {
      id
      status
    }
  }
`;

export const archiveApplicationAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(ArchiveDocument, { id });
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Archive failed",
    };
  }
};

export const rejectApplicationAction = async (input: {
  id: string;
  reason?: string;
  rejectionReasonId?: string;
  rejectedBy?: "SCHOOL" | "PARENTS" | "OTHER";
}) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(RejectDocument, { input });
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Reject failed",
    };
  }
};

export const deleteApplicationAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteDocument, { id });
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
};

export const restoreApplicationAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    await client.request(RestoreDocument, { id });
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Restore failed",
    };
  }
};
