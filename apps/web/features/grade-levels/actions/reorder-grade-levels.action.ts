"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";
import type { GradeLevelItem } from "./get-grade-levels.action";

const ReorderGradeLevelsDocument = gql`
  mutation ReorderGradeLevels($input: ReorderGradeLevelsInput!) {
    reorderGradeLevels(input: $input) {
      id
      name
      parentId
      sortOrder
    }
  }
`;

type ReorderResponse = { reorderGradeLevels: GradeLevelItem[] };

export const reorderGradeLevelsAction = async (
  ids: string[],
  parentId?: string | null,
) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { reorderGradeLevels } = await client.request<ReorderResponse>(
      ReorderGradeLevelsDocument,
      { input: { ids, ...(parentId !== undefined ? { parentId } : {}) } },
    );
    revalidatePath(`/${locale}/admin/grade-levels`);
    revalidatePath(`/${locale}/admin/school-classes`);
    return { success: true as const, data: reorderGradeLevels };
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
