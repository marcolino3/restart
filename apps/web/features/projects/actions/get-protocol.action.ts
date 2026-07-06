"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { Protocol } from "../types";

type Response = { protocolById: Protocol };

const Document = gql`
  query ProtocolById($id: ID!) {
    protocolById(id: $id) {
      id
      title
      meetingDate
      startTime
      endTime
      status
      projectId
      externalParticipants
      createdByMembershipId
      createdBy {
        userId
      }
      project {
        id
        title
      }
      participants {
        id
        membershipId
        membership {
          id
          userId
          user {
            firstName
            lastName
          }
          userEmail {
            email
          }
        }
      }
      sections {
        agendaItems {
          no
          topic
          goal
        }
        decisions {
          topic
          decision
          responsible
          dueDate
        }
        communications {
          topic
          audience
          responsible
          channel
          dueDate
        }
        infoPoints
        challenges {
          topic
          challenge
          supportNeeded
        }
        openPoints {
          topic
          nextStep
          forNextMeeting
        }
      }
    }
  }
`;

export const getProtocolAction = async (id: string) => {
  const client = await serverCookieGqlClient();
  try {
    const { protocolById } = await client.request<Response>(Document, { id });
    return { success: true as const, data: protocolById };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
