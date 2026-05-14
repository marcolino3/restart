"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const DeleteSchoolClassDocument = gql`
  mutation DeleteSchoolClass($id: ID!) {
    deleteSchoolClass(id: $id)
  }
`;

export const deleteSchoolClassAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const result = await client.request<{ deleteSchoolClass: boolean }>(
      DeleteSchoolClassDocument,
      { id },
    );
    revalidatePath(`/${locale}/admin/school-classes`);
    return { success: true as const, data: result.deleteSchoolClass };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to delete school class" };
  }
};
