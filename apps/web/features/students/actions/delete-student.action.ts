"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const DeleteStudentDocument = gql`
  mutation DeleteStudent($id: ID!) {
    deleteStudent(id: $id)
  }
`;

export const deleteStudentAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const result = await client.request<{ deleteStudent: boolean }>(
      DeleteStudentDocument,
      { id },
    );
    revalidatePath(`/${locale}/admin/students`);
    return { success: true as const, data: result.deleteStudent };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to delete student" };
  }
};
