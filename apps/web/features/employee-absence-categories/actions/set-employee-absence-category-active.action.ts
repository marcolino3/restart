"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";
import type { AbsenceCategoryItem } from "../types";

const Document = gql`
  mutation SetEmployeeAbsenceCategoryActive($id: ID!, $isActive: Boolean!) {
    setEmployeeAbsenceCategoryActive(id: $id, isActive: $isActive) {
      id
      isActive
    }
  }
`;

type Response = {
  setEmployeeAbsenceCategoryActive: Pick<
    AbsenceCategoryItem,
    "id" | "isActive"
  >;
};

export const setEmployeeAbsenceCategoryActiveAction = async (
  id: string,
  isActive: boolean,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { setEmployeeAbsenceCategoryActive } =
      await client.request<Response>(Document, { id, isActive });
    revalidatePath(`/${locale}/admin/absence-categories`);
    return { success: true as const, data: setEmployeeAbsenceCategoryActive };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
