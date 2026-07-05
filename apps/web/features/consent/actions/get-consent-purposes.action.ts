"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { ConsentPurpose } from "../types";

const ConsentPurposesDocument = gql`
  query ConsentPurposes($includeArchived: Boolean) {
    consentPurposes(includeArchived: $includeArchived) {
      id
      name
      slug
      description
      appliesTo
      legalBasis
      requiresEvidence
      isMandatory
      position
      isArchived
    }
  }
`;

type ConsentPurposesResponse = {
  consentPurposes: ConsentPurpose[];
};

export const getConsentPurposesAction = async (includeArchived = false) => {
  try {
    const client = await serverCookieGqlClient();
    const { consentPurposes } = await client.request<ConsentPurposesResponse>(
      ConsentPurposesDocument,
      { includeArchived },
    );
    return { success: true as const, data: consentPurposes };
  } catch (error) {
    console.log(error);
    return { success: false as const, error, data: [] as ConsentPurpose[] };
  }
};
