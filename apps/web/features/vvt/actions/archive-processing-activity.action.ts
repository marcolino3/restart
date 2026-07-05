"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";

const Document = gql`
  mutation ArchiveProcessingActivity($id: ID!) {
    archiveProcessingActivity(id: $id)
  }
`;

export const archiveProcessingActivityAction = async (id: string) => {
  const locale = await getLocale();
  try {
    const client = await serverCookieGqlClient();
    await client.request(Document, { id });
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: null };
  } catch (error) {
    return { success: false as const, error };
  }
};
