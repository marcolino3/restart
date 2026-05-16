"use server";

import { graphql } from "@restart/shared-types";
import { UpdateOrganizationMutation } from "@restart/shared-types/graphql";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/constants/routes";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import {
  OrganizationFormSchema,
  OrganizationFormOutput,
} from "../schemas/organization-form.schema";

const UpdateOrganizationDocument = graphql(`
  mutation UpdateOrganization(
    $updateOrganizationInput: UpdateOrganizationInput!
  ) {
    updateOrganization(updateOrganizationInput: $updateOrganizationInput) {
      id
      name
      subdomain
    }
  }
`);

export async function updateOrganizationAction(values: OrganizationFormOutput) {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  const parsedValues = OrganizationFormSchema.parse(values);

  try {
    const { updateOrganization } =
      await client.request<UpdateOrganizationMutation>(
        UpdateOrganizationDocument,
        {
          updateOrganizationInput: parsedValues,
        }
      );

    revalidatePath(ROUTES.admin.organizations(locale));
    return { success: true as const, data: updateOrganization };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: String(error) };
  }
}
