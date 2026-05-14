"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type AddressSuggestion = {
  address: {
    id: string;
    street?: string | null;
    houseNumber?: string | null;
    addressLine2?: string | null;
    postalCode?: string | null;
    city?: string | null;
    state?: string | null;
    country?: { id: string; isoCode?: string | null } | null;
  };
  contactPersonName: string;
  relationshipType: string;
  studentName: string;
};

const GetRelatedAddressesDocument = gql`
  query GetRelatedAddresses($contactPersonId: ID!) {
    relatedAddressesForContactPerson(contactPersonId: $contactPersonId) {
      address {
        id
        street
        houseNumber
        addressLine2
        postalCode
        city
        state
        country {
          id
          isoCode
        }
      }
      contactPersonName
      relationshipType
      studentName
    }
  }
`;

export const getRelatedAddressesAction = async (contactPersonId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { relatedAddressesForContactPerson } = await client.request<{
      relatedAddressesForContactPerson: AddressSuggestion[];
    }>(GetRelatedAddressesDocument, { contactPersonId });
    return { success: true as const, data: relatedAddressesForContactPerson };
  } catch (error) {
    console.log(error);
    return { success: true as const, data: [] as AddressSuggestion[] };
  }
};
