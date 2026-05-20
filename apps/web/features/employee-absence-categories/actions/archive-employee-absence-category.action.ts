"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const Document = gql`
  mutation ArchiveEmployeeAbsenceCategory($id: ID!) {
    archiveEmployeeAbsenceCategory(id: $id)
  }
`;

type Response = { archiveEmployeeAbsenceCategory: boolean };

export const archiveEmployeeAbsenceCategoryAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const res = await client.request<Response>(Document, { id });
    revalidatePath(`/${locale}/admin/absence-categories`);
    return { success: true as const, data: res.archiveEmployeeAbsenceCategory };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
