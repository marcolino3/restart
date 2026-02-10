"use server";

import { graphql } from "@/gql";
import { executeGraphQL } from "@/lib/actions/execute-graphql";
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
  const result = await executeGraphQL<{ id: string; key: string }>(
    async (client) => {
      const { updateOrganizationSetting } = await client.request(
        UpdateOrganizationSettingDocument,
        { input }
      );
      return updateOrganizationSetting;
    }
  );

  if (result.success) {
    revalidatePath("/admin/settings");
  }

  return result;
}
