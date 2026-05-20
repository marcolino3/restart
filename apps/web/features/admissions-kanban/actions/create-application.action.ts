"use server";

import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const Document = gql`
  mutation CreateAdmissionApplication(
    $input: CreateAdmissionApplicationInput!
  ) {
    createAdmissionApplication(input: $input) {
      id
      admissionStageId
      familyId
    }
  }
`;

export type CreateApplicationInput = {
  familyId?: string | null;
  familyName?: string | null;
  admissionStageId?: string | null;
  childFirstName: string;
  childLastName: string;
  childDateOfBirth?: string | null;
  childGender?: "MALE" | "FEMALE" | "OTHER" | null;
  childNotes?: string | null;
  desiredGradeLevelId?: string | null;
  desiredSchoolClassId?: string | null;
  desiredEnrollmentDate?: string | null;
  source?:
    | "MANUAL"
    | "PUBLIC_FORM"
    | "OPEN_DAY"
    | "REFERRAL"
    | "OTHER"
    | null;
  contactPersons?: Array<{
    firstName: string;
    lastName: string;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
    roles?: string[];
  }>;
};

export const createApplicationAction = async (input: CreateApplicationInput) => {
  const client = await serverCookieGqlClient();
  try {
    // strip null values so backend Optional validators don't complain
    const clean = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== null && v !== undefined),
    );
    const data = await client.request<{
      createAdmissionApplication: {
        id: string;
        admissionStageId: string;
        familyId: string;
      };
    }>(Document, { input: clean });
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    return { success: true as const, data: data.createAdmissionApplication };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Create failed",
    };
  }
};
