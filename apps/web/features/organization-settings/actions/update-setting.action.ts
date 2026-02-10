"use server";

import { graphql } from "@/gql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";

const UpdateOrganizationSettingDocument = graphql(`
  mutation UpdateOrganizationSetting($input: UpdateOrganizationSettingInput!) {
    updateOrganizationSetting(input: $input) {
      id
      key
      description
      hasValue
    }
  }
`);

export interface UpdateSettingInput {
  organizationId: string;
  key: string;
  value?: string;
  description?: string;
}

export async function updateOrganizationSettingAction(input: UpdateSettingInput) {
  const client = await serverCookieGqlClient();

  try {
    const { updateOrganizationSetting } = await client.request(
      UpdateOrganizationSettingDocument,
      { input }
    );

    revalidatePath("/admin/settings");
    return { success: true, data: updateOrganizationSetting };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
}
