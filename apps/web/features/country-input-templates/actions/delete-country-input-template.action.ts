"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

const DeleteDocument = gql`
  mutation DeleteCountryInputTemplate($id: ID!) {
    deleteCountryInputTemplate(id: $id)
  }
`;

export const deleteCountryInputTemplateAction = async (id: string) => {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  try {
    await client.request(DeleteDocument, { id });
    revalidatePath(`/${locale}/admin/settings/country-templates`);
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to delete template" };
  }
};
