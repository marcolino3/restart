"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { ProtocolTemplate } from "../types";

type Response = { protocolTemplatesByOrg: ProtocolTemplate[] };

const Document = gql`
  query ProtocolTemplatesByOrg {
    protocolTemplatesByOrg {
      id
      title
      agendaItems {
        no
        topic
        goal
      }
      defaultParticipantMembershipIds
      usedCount
    }
  }
`;

export const getProtocolTemplatesAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { protocolTemplatesByOrg } = await client.request<Response>(Document);
    return { success: true as const, data: protocolTemplatesByOrg };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
