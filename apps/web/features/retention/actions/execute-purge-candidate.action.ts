"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";

const Document = gql`
  mutation ExecutePurgeCandidate($id: ID!) {
    executePurgeCandidate(id: $id)
  }
`;

type Response = { executePurgeCandidate: boolean };

export const executePurgeCandidateAction = async (id: string) => {
  const locale = await getLocale();
  try {
    const client = await serverCookieGqlClient();
    const { executePurgeCandidate } = await client.request<Response>(Document, {
      id,
    });
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: executePurgeCandidate };
  } catch (error) {
    return { success: false as const, error };
  }
};
