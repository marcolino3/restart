"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";

export type TeamMemberItem = {
  id: string;
  employee: {
    id: string;
    isActive: boolean;
    membership: {
      user: {
        id: string;
        firstName: string;
        lastName: string;
        userEmails: { email: string; isPrimary: boolean }[];
      } | null;
    } | null;
  };
};

type Response = { teamMembersByTeamId: TeamMemberItem[] };

const Document = gql`
  query GetTeamMembers($teamId: ID!) {
    teamMembersByTeamId(teamId: $teamId) {
      id
      employee {
        id
        isActive
        membership {
          user {
            id
            firstName
            lastName
            userEmails {
              email
              isPrimary
            }
          }
        }
      }
    }
  }
`;

export const getTeamMembersAction = async (teamId: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { teamMembersByTeamId } = await client.request<Response>(Document, {
      teamId,
    });
    return { success: true as const, data: teamMembersByTeamId };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
