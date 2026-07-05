"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";

const DeleteRetentionPolicyDocument = gql`
  mutation DeleteRetentionPolicy($id: ID!) {
    deleteRetentionPolicy(id: $id)
  }
`;

type Response = { deleteRetentionPolicy: boolean };

export const deleteRetentionPolicyAction = async (id: string) => {
  const locale = await getLocale();
  try {
    const client = await serverCookieGqlClient();
    const { deleteRetentionPolicy } = await client.request<Response>(
      DeleteRetentionPolicyDocument,
      { id },
    );
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: deleteRetentionPolicy };
  } catch (error) {
    return { success: false as const, error };
  }
};
