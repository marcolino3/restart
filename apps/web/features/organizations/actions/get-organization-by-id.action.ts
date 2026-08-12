"use server";

import { graphql } from "@restart/shared-types";
import { OrganizationQuery } from "@restart/shared-types/graphql";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

const OrganizationByIdDocument = graphql(`
  query Organization($id: String!) {
    organization(id: $id) {
      id
      name
      subdomain
      domain
      street
      zip
      city
      country
      phone
      email
      website
      timezone
      latitude
      longitude
      isActive
      shortCode
      schoolType
      legalEntity
      language
      logoUrl
      state
      billingAddressSameAsLocation
      billingAddressExtra
      contactName
      contactRole
      contactEmail
      contactPhone
      billingEmail
      parentMailSenderEmail
      currentSchoolYear
      activeLevels
      plan
      userLicenseLimit
      contractEndsAt
      billingInterval
      billingAmountChf
      storageLimitGb
      lifecycleStatus
      trialEndsAt
      suspendedReason
      bvgProvider
      bvgContactPhone
      uvgProvider
      uvgContactPhone
      dailySicknessProvider
      dailySicknessContactPhone
      createdAt
      updatedAt
    }
  }
`);

export async function getOrganizationByIdAction(id: string) {
  const client = await serverCookieGqlClient();

  try {
    const { organization } = await client.request<OrganizationQuery>(
      OrganizationByIdDocument,
      { id }
    );

    return { success: true as const, data: organization };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: String(error) };
  }
}
