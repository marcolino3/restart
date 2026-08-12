"use server";

import { graphql } from "@restart/shared-types";
import { ReactivateOrganizationMutation } from "@restart/shared-types/graphql";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";

const ReactivateOrganizationDocument = graphql(`
  mutation ReactivateOrganization($id: String!) {
    reactivateOrganization(id: $id) {
      id
      lifecycleStatus
      suspendedReason
    }
  }
`);

export async function reactivateOrganizationAction(id: string) {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { reactivateOrganization } =
      await client.request<ReactivateOrganizationMutation>(
        ReactivateOrganizationDocument,
        { id }
      );

    revalidatePath(ROUTES.admin.organizationsEdit(locale, id));
    revalidatePath(ROUTES.admin.organizations(locale));
    return { success: true as const, data: reactivateOrganization };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
