"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { updateTag } from "next/cache";
import { gql } from "graphql-request";
import { studentEnrollmentsTag } from "../lib/enrollment-cache-tags";

const UpdateEnrollmentDocument = gql`
  mutation UpdateEnrollment($input: UpdateSchoolClassEnrollmentInput!) {
    updateEnrollment(input: $input) {
      id
    }
  }
`;

export const updateEnrollmentAction = async (
  id: string,
  leftAt: string,
  studentId: string,
) => {
  const client = await serverCookieGqlClient();
  try {
    const { updateEnrollment } = await client.request<{
      updateEnrollment: { id: string };
    }>(UpdateEnrollmentDocument, { input: { id, leftAt } });
    updateTag(studentEnrollmentsTag(studentId));
    return { success: true as const, data: updateEnrollment };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to update enrollment" };
  }
};
