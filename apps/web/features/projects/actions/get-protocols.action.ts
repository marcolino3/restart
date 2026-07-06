"use server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { gql } from "graphql-request";
import type { ProtocolListItem } from "../types";

// List rows carry a minimal participants projection so the table can show a
// participant count without loading full membership data.
export type ProtocolListRow = ProtocolListItem & {
  participants?: { id: string }[];
};

type Response = { protocolsByOrg: ProtocolListRow[] };

const Document = gql`
  query ProtocolsByOrg {
    protocolsByOrg {
      id
      title
      meetingDate
      startTime
      endTime
      status
      project {
        id
        title
      }
      participants {
        id
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
