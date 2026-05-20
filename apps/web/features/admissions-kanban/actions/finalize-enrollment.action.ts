"use server";

import { revalidatePath } from "next/cache";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

const Document = gql`
  mutation FinalizeAdmissionEnrollment($input: FinalizeEnrollmentInput!) {
    finalizeAdmissionEnrollment(input: $input) {
      application {
        id
        status
        enrolledStudentId
      }
      student {
        id
        firstName
        lastName
      }
    }
  }
`;

export type FinalizeEnrollmentInput = {
  applicationId: string;
  schoolClassId: string;
  enrollmentDate: string;
};

export const finalizeEnrollmentAction = async (
  input: FinalizeEnrollmentInput,
) => {
  const client = await serverCookieGqlClient();
  try {
    const data = await client.request<{
      finalizeAdmissionEnrollment: {
        application: {
          id: string;
          status: string;
          enrolledStudentId: string | null;
        };
        student: { id: string; firstName: string; lastName: string };
      };
    }>(Document, { input });
    revalidatePath("/[locale]/admin/admissions/kanban", "page");
    revalidatePath("/[locale]/admin/students", "page");
    return { success: true as const, data: data.finalizeAdmissionEnrollment };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Enrollment failed",
    };
  }
};
