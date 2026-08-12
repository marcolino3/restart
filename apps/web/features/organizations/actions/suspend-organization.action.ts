"use server";

import { graphql } from "@restart/shared-types";
import { SuspendOrganizationMutation } from "@restart/shared-types/graphql";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";

const SuspendOrganizationDocument = graphql(`
  mutation SuspendOrganization($input: SuspendOrganizationInput!) {
    suspendOrganization(input: $input) {
      id
      lifecycleStatus
      suspendedReason
    }
  }
`);

export async function suspendOrganizationAction(id: string, reason: string) {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { suspendOrganization } =
      await client.request<SuspendOrganizationMutation>(
        SuspendOrganizationDocument,
        { input: { id, reason } }
      );

    revalidatePath(ROUTES.admin.organizationsEdit(locale, id));
    revalidatePath(ROUTES.admin.organizations(locale));
    return { success: true as const, data: suspendOrganization };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
