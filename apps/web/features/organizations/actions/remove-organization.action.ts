"use server";

import { graphql } from "@/gql";
import { RemoveOrganizationMutation } from "@/gql/graphql";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const RemoveOrganizationDocument = graphql(`
  mutation RemoveOrganization($id: String!) {
    removeOrganization(id: $id) {
      id
    }
  }
`);

export async function removeOrganizationAction(id: string) {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    await client.request<RemoveOrganizationMutation>(
      RemoveOrganizationDocument,
      { id }
    );

    revalidatePath(ROUTES.admin.organizations(locale));
    return { success: true as const };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: String(error) };
  }
}
