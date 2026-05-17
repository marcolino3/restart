"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type TransferStudentInput = {
  studentId: string;
  /** null = remove from any class (only end the current active enrollment). */
  targetSchoolClassId: string | null;
  /** ISO date `YYYY-MM-DD`. Defaults server-side to today. */
  transferDate?: string;
};

type Response = {
  transferStudentToSchoolClass: { id: string } | null;
};

const Document = gql`
  mutation TransferStudent($input: TransferStudentInput!) {
    transferStudentToSchoolClass(input: $input) {
      id
    }
  }
`;

export const transferStudentAction = async (input: TransferStudentInput) => {
  const client = await serverCookieGqlClient();
  try {
    const { transferStudentToSchoolClass } = await client.request<Response>(
      Document,
      { input },
    );
    return {
      success: true as const,
      data: transferStudentToSchoolClass,
    };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false as const, error: message };
  }
};
