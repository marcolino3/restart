"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type UserDetail = {
  id: string;
  title?: string | null;
  firstName: string;
  lastName: string;
  username?: string | null;
  dateOfBirth?: string | null;
  isSuperAdmin: boolean;
  isActive: boolean;
  userEmails: {
    id: string;
    email: string;
    isPrimary: boolean;
    isVerified: boolean;
  }[];
  memberships: {
    id: string;
    persona: string;
    contactPhone?: string | null;
    userEmailId?: string | null;
    organization: {
      id: string;
      name: string;
    };
  }[];
};

type GetUserResponse = {
  user: UserDetail;
};

const GetUserDocument = gql`
  query GetUserById($id: ID!) {
    user(id: $id) {
      id
      title
      firstName
      lastName
      username
      dateOfBirth
      isSuperAdmin
      isActive
      userEmails {
        id
        email
        isPrimary
        isVerified
      }
      memberships {
        id
        persona
        contactPhone
        userEmailId
        organization {
          id
          name
        }
      }
    }
  }
`;

export const getUserByIdAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { user } = await client.request<GetUserResponse>(GetUserDocument, {
      id,
    });
    return { success: true as const, data: user };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load user" };
  }
};
