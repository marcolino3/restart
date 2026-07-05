"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";

const Document = gql`
  mutation ReviewPurgeCandidate($id: ID!, $approve: Boolean!) {
    reviewPurgeCandidate(id: $id, approve: $approve)
  }
`;

type Response = { reviewPurgeCandidate: boolean };

export const reviewPurgeCandidateAction = async (
  id: string,
  approve: boolean,
) => {
  const locale = await getLocale();
  try {
    const client = await serverCookieGqlClient();
    const { reviewPurgeCandidate } = await client.request<Response>(Document, {
      id,
      approve,
    });
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: reviewPurgeCandidate };
  } catch (error) {
    return { success: false as const, error };
  }
};
