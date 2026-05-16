"use server";

import { graphql } from "@restart/shared-types";
import { CreateOrganizationMutation } from "@restart/shared-types/graphql";
import { redirect } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const CreateOrganizationDocument = graphql(`
  mutation CreateOrganization {
    createOrganization {
      id
    }
  }
`);

export async function createOrganizationAction() {
  const locale = await getLocale();
  const client = await serverCookieGqlClient();

  const { createOrganization } =
    await client.request<CreateOrganizationMutation>(
      CreateOrganizationDocument
    );

  redirect(ROUTES.admin.organizationsEdit(locale, createOrganization.id));
}
