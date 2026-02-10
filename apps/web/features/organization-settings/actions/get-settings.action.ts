"use server";

import { graphql } from "@/gql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

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
  const client = await serverCookieGqlClient();

  try {
    const { organizationSettings } = await client.request(
      GetOrganizationSettingsDocument,
      { organizationId }
    );
    return { success: true, data: organizationSettings as OrganizationSetting[] };
  } catch (error) {
    console.error(error);
    return { success: false, error };
  }
}
