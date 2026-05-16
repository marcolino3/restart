"use server";

import { graphql } from "@restart/shared-types";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { revalidatePath } from "next/cache";

const CreateOrganizationSettingDocument = graphql(`
  mutation CreateOrganizationSetting($input: CreateOrganizationSettingInput!) {
    createOrganizationSetting(input: $input) {
      id
      key
      description
      hasValue
    }
  }
`);

export interface CreateSettingInput {
  organizationId: string;
  key: string;
  value: string;
  description?: string;
}

export async function createOrganizationSettingAction(input: CreateSettingInput) {
  const client = await serverCookieGqlClient();

  try {
    const { createOrganizationSetting } = await client.request(
      CreateOrganizationSettingDocument,
      { input }
    );

    revalidatePath("/admin/settings");
    return { success: true, data: createOrganizationSetting };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
}
