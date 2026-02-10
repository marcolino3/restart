"use server";

import { graphql } from "@/gql";
import { executeGraphQL } from "@/lib/actions/execute-graphql";

const GetOrganizationSettingDocument = graphql(`
  query GetOrganizationSetting($organizationId: ID!, $key: String!, $decrypt: Boolean!) {
    organizationSetting(organizationId: $organizationId, key: $key, decrypt: $decrypt) {
      id
      organizationId
      key
      description
      hasValue
      value
      version
      createdAt
      updatedAt
    }
  }
`);

export interface OrganizationSettingWithValue {
  id: string;
  organizationId: string;
  key: string;
  description?: string | null;
  hasValue: boolean;
  value?: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export async function getOrganizationSettingValueAction(
  organizationId: string,
  key: string
) {
  return executeGraphQL<OrganizationSettingWithValue>(async (client) => {
    const { organizationSetting } = await client.request(
      GetOrganizationSettingDocument,
      { organizationId, key, decrypt: true }
    );
    return organizationSetting as OrganizationSettingWithValue;
  });
}
