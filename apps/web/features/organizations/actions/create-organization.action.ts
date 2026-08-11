"use server";

import { graphql } from "@restart/shared-types";
import { CreateOrganizationMutation } from "@restart/shared-types/graphql";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const CreateOrganizationDocument = graphql(`
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      id
    }
  }
`);

export interface CreateOrganizationParams {
  organizationName?: string;
  organizationSubdomain?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerEmail?: string;
  street?: string;
  zip?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone?: string;
}

export async function createOrganizationAction(
  values: CreateOrganizationParams
) {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  let createdId: string;
  try {
    const { createOrganization } =
      await client.request<CreateOrganizationMutation>(
        CreateOrganizationDocument,
        { input: values }
      );
    createdId = createOrganization.id;
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  redirect(ROUTES.admin.organizationsEdit(locale, createdId));
}
