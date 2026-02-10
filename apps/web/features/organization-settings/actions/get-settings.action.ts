"use server";

import { graphql } from "@/gql";
import { executeGraphQL } from "@/lib/actions/execute-graphql";

const GetOrganizationSettingsDocument = graphql(`
  query GetOrganizationSettings($organizationId: ID!) {
    organizationSettings(organizationId: $organizationId) {
      id
      organizationId
      key
      description
      hasValue
      version
      createdAt
      updatedAt
    }
  }
`);

export interface OrganizationSetting {
  id: string;
  organizationId: string;
  key: string;
  description?: string | null;
  hasValue: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export async function getOrganizationSettingsAction(organizationId: string) {
  return executeGraphQL<OrganizationSetting[]>(async (client) => {
    const { organizationSettings } = await client.request(
      GetOrganizationSettingsDocument,
      { organizationId }
    );
    return organizationSettings as OrganizationSetting[];
  });
}
