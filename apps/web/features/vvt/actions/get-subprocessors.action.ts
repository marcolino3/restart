"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { Subprocessor } from "../types";

const Document = gql`
  query Subprocessors {
    subprocessors {
      id
      name
      purpose
      country
      dpaSigned
      url
      notes
    }
  }
`;

type Response = { subprocessors: Subprocessor[] };

export const getSubprocessorsAction = async () => {
  try {
    const client = await serverCookieGqlClient();
    const { subprocessors } = await client.request<Response>(Document);
    return { success: true as const, data: subprocessors };
  } catch (error) {
    console.log(error);
    return { success: false as const, error, data: [] as Subprocessor[] };
  }
};
