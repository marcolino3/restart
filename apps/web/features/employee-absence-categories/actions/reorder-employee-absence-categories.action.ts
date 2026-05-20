"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";
import type { AbsenceCategoryItem } from "../types";

const Document = gql`
  mutation ReorderEmployeeAbsenceCategories($ids: [ID!]!) {
    reorderEmployeeAbsenceCategories(ids: $ids) {
      id
      sortOrder
    }
  }
`;

type Response = {
  reorderEmployeeAbsenceCategories: Array<
    Pick<AbsenceCategoryItem, "id" | "sortOrder">
  >;
};

export const reorderEmployeeAbsenceCategoriesAction = async (ids: string[]) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { reorderEmployeeAbsenceCategories } = await client.request<Response>(
      Document,
      { ids },
    );
    revalidatePath(`/${locale}/admin/absence-categories`);
    return { success: true as const, data: reorderEmployeeAbsenceCategories };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
