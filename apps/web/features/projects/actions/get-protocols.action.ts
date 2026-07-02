"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { ProtocolListItem } from "../types";

type Response = { protocolsByOrg: ProtocolListItem[] };

const Document = gql`
  query ProtocolsByOrg {
    protocolsByOrg {
      id
      title
      meetingDate
      status
      project {
        id
        title
      }
    }
  }
`;

export const getProtocolsAction = async () => {
  const client = await serverCookieGqlClient();
  try {
    const { protocolsByOrg } = await client.request<Response>(Document);
    return { success: true as const, data: protocolsByOrg };
  } catch (error) {
    console.log(error);
    return { success: false as const, error };
  }
};
