"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type ContactPersonListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  occupation?: string | null;
  isArchived: boolean;
};

type GetContactPersonsResponse = {
  contactPersonsByOrgId: ContactPersonListItem[];
};

const GetContactPersonsDocument = gql`
  query GetContactPersons {
    contactPersonsByOrgId {
      id
      firstName
      lastName
      email
      phone
      mobile
      occupation
      isArchived
    }
  }
`;

export const getContactPersonsAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { contactPersonsByOrgId } =
      await client.request<GetContactPersonsResponse>(GetContactPersonsDocument);
    return { success: true as const, data: contactPersonsByOrgId };
  } catch (error) {
    console.log(error);
    return { success: false as const };
  }
};
