"use server";

import { graphql } from "@restart/shared-types";
import { UpdateOrganizationFeatureToggleMutation } from "@restart/shared-types/graphql";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";

const UpdateOrganizationFeatureToggleDocument = graphql(`
  mutation UpdateOrganizationFeatureToggle(
    $input: UpdateOrganizationFeatureToggleInput!
  ) {
    updateOrganizationFeatureToggle(input: $input) {
      featureKey
      enabled
    }
  }
`);

interface UpdateOrganizationFeatureToggleParams {
  organizationId: string;
  featureKey: string;
  enabled: boolean;
}

export async function updateOrganizationFeatureToggleAction(
  params: UpdateOrganizationFeatureToggleParams
) {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { updateOrganizationFeatureToggle } =
      await client.request<UpdateOrganizationFeatureToggleMutation>(
        UpdateOrganizationFeatureToggleDocument,
        { input: params }
      );

    revalidatePath(ROUTES.admin.organizations(locale));
    return { success: true as const, data: updateOrganizationFeatureToggle };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: String(error) };
  }
}
