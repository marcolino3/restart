"use server";

import { graphql } from "@restart/shared-types";
import { CreateOrganizationMutation } from "@restart/shared-types/graphql";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import {
  OrganizationFormSchema,
  OrganizationFormOutput,
} from "../schemas/organization-form.schema";

const CreateOrganizationDocument = graphql(`
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      id
    }
  }
`);

/**
 * The create form is the update form, so it submits the full organization
 * profile. `id` only exists to satisfy the shared zod schema and is dropped
 * before the mutation — the backend assigns the real one.
 */
export type CreateOrganizationParams = Omit<OrganizationFormOutput, "id">;

export async function createOrganizationAction(values: OrganizationFormOutput) {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();
  const { id: _id, ...input } = OrganizationFormSchema.parse(values);

  let createdId: string;
  try {
    const { createOrganization } =
      await client.request<CreateOrganizationMutation>(
        CreateOrganizationDocument,
        { input }
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
