"use server";

import { graphql } from "@restart/shared-types";
import { ChangeOrganizationPlanMutation } from "@restart/shared-types/graphql";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";

const ChangeOrganizationPlanDocument = graphql(`
  mutation ChangeOrganizationPlan($input: ChangeOrganizationPlanInput!) {
    changeOrganizationPlan(input: $input) {
      id
      plan
      userLicenseLimit
      contractEndsAt
      billingInterval
      billingAmountChf
    }
  }
`);

interface ChangeOrganizationPlanParams {
  id: string;
  plan: string;
  userLicenseLimit?: number;
  contractEndsAt?: string;
  billingInterval?: string;
  billingAmountChf?: number;
}

export async function changeOrganizationPlanAction(
  params: ChangeOrganizationPlanParams
) {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  try {
    const { changeOrganizationPlan } =
      await client.request<ChangeOrganizationPlanMutation>(
        ChangeOrganizationPlanDocument,
        { input: params }
      );

    revalidatePath(ROUTES.admin.organizationsEdit(locale, params.id));
    return { success: true as const, data: changeOrganizationPlan };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
