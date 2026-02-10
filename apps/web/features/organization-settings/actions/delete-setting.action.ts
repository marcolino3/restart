"use server";

import { graphql } from "@/gql";
import { executeGraphQL } from "@/lib/actions/execute-graphql";
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
  const result = await executeGraphQL<boolean>(async (client) => {
    const { deleteOrganizationSetting } = await client.request(
      DeleteOrganizationSettingDocument,
      { organizationId, key }
    );
    return deleteOrganizationSetting;
  });

  if (result.success) {
    revalidatePath("/admin/settings");
  }

  return result;
}
