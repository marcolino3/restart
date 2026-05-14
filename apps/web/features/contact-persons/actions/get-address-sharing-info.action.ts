"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type SharingContactPerson = {
  id: string;
  firstName: string;
  lastName: string;
  roles: string[];
};

const GetSharingInfoDocument = gql`
  query GetContactPersonsSharingAddress(
    $addressId: ID!
    $excludeContactPersonId: ID!
  ) {
    contactPersonsSharingAddress(
      addressId: $addressId
      excludeContactPersonId: $excludeContactPersonId
    ) {
      id
      firstName
      lastName
      roles
    }
  }
`;

export const getAddressSharingInfoAction = async (
  addressId: string,
  excludeContactPersonId: string,
) => {
  const client = await serverCookieGqlClient();
  try {
    const { contactPersonsSharingAddress } = await client.request<{
      contactPersonsSharingAddress: SharingContactPerson[];
    }>(GetSharingInfoDocument, { addressId, excludeContactPersonId });
    return { success: true as const, data: contactPersonsSharingAddress };
  } catch (error) {
    console.log(error);
    return { success: true as const, data: [] as SharingContactPerson[] };
  }
};
