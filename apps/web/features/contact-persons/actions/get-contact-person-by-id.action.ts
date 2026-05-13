"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type ContactPersonAddress = {
  id: string;
  street?: string | null;
  houseNumber?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  state?: string | null;
  country?: { id: string; isoCode?: string | null } | null;
};

export type ContactPersonDetail = {
  id: string;
  salutation?: string | null;
  title?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  dateOfBirth?: string | null;
  socialSecurityNumber?: string | null;
  nationalities: string[];
  preferredLanguages: string[];
  roles: string[];
  occupation?: string | null;
  notes?: string | null;
  addressId?: string | null;
  address?: ContactPersonAddress | null;
};

const GetContactPersonByIdDocument = gql`
  query GetContactPersonById($id: ID!) {
    contactPersonById(id: $id) {
      id
      salutation
      title
      firstName
      middleName
      lastName
      email
      phone
      mobile
      dateOfBirth
      socialSecurityNumber
      nationalities
      preferredLanguages
      roles
      occupation
      notes
      addressId
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
    }
  }
`;

export const getContactPersonByIdAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { contactPersonById } = await client.request<{
      contactPersonById: ContactPersonDetail;
    }>(GetContactPersonByIdDocument, { id });
    return { success: true as const, data: contactPersonById };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
