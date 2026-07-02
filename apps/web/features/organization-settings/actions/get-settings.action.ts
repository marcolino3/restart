"use server";

import { graphql } from "@restart/shared-types";
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
    return {
      success: true as const,
      data: organizationSettings as OrganizationSetting[],
    };
  } catch (error) {
    console.error(error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
