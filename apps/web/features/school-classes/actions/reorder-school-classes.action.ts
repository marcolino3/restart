"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const ReorderSchoolClassesDocument = gql`
  mutation ReorderSchoolClasses($input: ReorderSchoolClassesInput!) {
    reorderSchoolClasses(input: $input) {
      id
      name
      sortOrder
    }
  }
`;

type ReorderResponse = {
  reorderSchoolClasses: { id: string; name: string; sortOrder: number }[];
};

export const reorderSchoolClassesAction = async (ids: string[]) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { reorderSchoolClasses } = await client.request<ReorderResponse>(
      ReorderSchoolClassesDocument,
      { input: { ids } },
    );
    revalidatePath(`/${locale}/admin/school-classes`);
    return { success: true as const, data: reorderSchoolClasses };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
