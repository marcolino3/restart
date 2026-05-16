"use server";

import { graphql } from "@restart/shared-types";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";

const DeleteOrganizationSettingDocument = graphql(`
  mutation DeleteOrganizationSetting($organizationId: ID!, $key: String!) {
    deleteOrganizationSetting(organizationId: $organizationId, key: $key)
  }
`);

export async function deleteOrganizationSettingAction(
  organizationId: string,
  key: string
) {
  const client = await serverCookieGqlClient();

  try {
    const { deleteOrganizationSetting } = await client.request(
      DeleteOrganizationSettingDocument,
      { organizationId, key }
    );

    revalidatePath("/admin/settings");
    return { success: true, data: deleteOrganizationSetting };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
}
