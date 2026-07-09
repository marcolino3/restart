"use server";

import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const Document = gql`
  mutation UpdateAdmissionApplication(
    $input: UpdateAdmissionApplicationInput!
  ) {
    updateAdmissionApplication(input: $input) {
      id
    }
  }
`;

export type UpdateApplicationInput = {
  id: string;
  childFirstName?: string;
  childLastName?: string;
  childDateOfBirth?: string | null;
  childGender?: "MALE" | "FEMALE" | "OTHER" | null;
  childNotes?: string | null;
  admissionSourceId?: string | null;
  assignedGradeLevelId?: string | null;
  desiredSchoolClassId?: string | null;
  desiredEnrollmentDate?: string | null;
};

export const updateApplicationAction = async (input: UpdateApplicationInput) => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      updateAdmissionApplication: { id: string };
    }>(Document, { input });
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    // The detail page reads the same application; invalidate it too so an edit
    // made there is reflected on router.refresh() without a hard reload.
    revalidatePath("/[locale]/admin/admissions/[id]", "page");
    return { success: true as const, data: data.updateAdmissionApplication };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Update failed",
    };
  }
};
