"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const DeleteGradeLevelDocument = gql`
  mutation DeleteGradeLevel($id: ID!) {
    deleteGradeLevel(id: $id)
  }
`;

export const deleteGradeLevelAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const result = await client.request<{ deleteGradeLevel: boolean }>(
      DeleteGradeLevelDocument,
      { id },
    );
    revalidatePath(`/${locale}/admin/school-classes`);
    return { success: true as const, data: result.deleteGradeLevel };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to delete grade level" };
  }
};
