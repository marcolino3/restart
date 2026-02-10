"use server";

import { graphql } from "@/gql";
import { executeGraphQL } from "@/lib/actions/execute-graphql";
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
  const result = await executeGraphQL<{ id: string; key: string }>(
    async (client) => {
      const { createOrganizationSetting } = await client.request(
        CreateOrganizationSettingDocument,
        { input }
      );
      return createOrganizationSetting;
    }
  );

  if (result.success) {
    revalidatePath("/admin/settings");
  }

  return result;
}
