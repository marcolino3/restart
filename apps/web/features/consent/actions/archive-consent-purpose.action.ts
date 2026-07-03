"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";

const ArchiveConsentPurposeDocument = gql`
  mutation ArchiveConsentPurpose($id: ID!) {
    archiveConsentPurpose(id: $id)
  }
`;

type ArchiveResponse = { archiveConsentPurpose: boolean };

export const archiveConsentPurposeAction = async (id: string) => {
  const locale = await getLocale();
  try {
    const client = await serverCookieGqlClient();
    const { archiveConsentPurpose } = await client.request<ArchiveResponse>(
      ArchiveConsentPurposeDocument,
      { id },
    );
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: archiveConsentPurpose };
  } catch (error) {
    return { success: false as const, error };
  }
};
