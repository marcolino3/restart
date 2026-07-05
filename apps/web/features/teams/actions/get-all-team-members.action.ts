"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { TeamMemberRole } from "./get-team-members.action";

/**
 * A team member enriched with the id of the team it belongs to, so the Teams
 * board can group every membership under its team card in a single request.
 */
export type OrgTeamMemberItem = {
  id: string;
  role: TeamMemberRole;
  team: { id: string } | null;
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

type Response = { teamMembersByOrgId: OrgTeamMemberItem[] };

const Document = gql`
  query GetAllTeamMembers {
    teamMembersByOrgId {
      id
      role
      team {
        id
      }
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

export const getAllTeamMembersAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { teamMembersByOrgId } = await client.request<Response>(Document);
    return { success: true as const, data: teamMembersByOrgId };
  } catch (error) {
    console.error(error);
    return { success: false as const };
  }
};
