"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { gql } from "graphql-request";

const Document = gql`
  mutation HardDeleteCurriculum($id: ID!) {
    hardDeleteCurriculum(id: $id)
  }
`;

export const hardDeleteCurriculumAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    const { hardDeleteCurriculum } = await client.request<{
      hardDeleteCurriculum: boolean;
    }>(Document, { id });
    revalidatePath(`/${locale}/admin/curricula`);
    return { success: hardDeleteCurriculum, data: hardDeleteCurriculum } as const;
  } catch (error) {
    console.error(error);
    return { success: false as const, error };
  }
};
