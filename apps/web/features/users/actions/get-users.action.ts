"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type UserListItem = {
  id: string;
  title?: string | null;
  firstName: string;
  lastName: string;
  isSuperAdmin: boolean;
  isActive: boolean;
  userEmails: {
    id: string;
    email: string;
    isPrimary: boolean;
    isVerified: boolean;
    authAccounts?: {
      id: string;
      provider: string;
    }[];
  }[];
  memberships: {
    id: string;
    persona: string;
    organization: {
      id: string;
      name: string;
    };
  }[];
};

type GetUsersResponse = {
  users: UserListItem[];
};

const GetUsersDocument = gql`
  query GetUsers {
    users {
      id
      title
      firstName
      lastName
      isSuperAdmin
      isActive
      userEmails {
        id
        email
        isPrimary
        isVerified
        authAccounts {
          id
          provider
        }
      }
      memberships {
        id
        persona
        organization {
          id
          name
        }
      }
    }
  }
`;

export const getUsersAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { users } = await client.request<GetUsersResponse>(GetUsersDocument);
    return { success: true as const, data: users };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load users" };
  }
};
