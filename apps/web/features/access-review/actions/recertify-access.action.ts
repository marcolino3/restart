"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";

const Document = gql`
  mutation RecertifyAccess($membershipId: ID!, $note: String) {
    recertifyAccess(membershipId: $membershipId, note: $note)
  }
`;

type Response = { recertifyAccess: boolean };

export const recertifyAccessAction = async (
  membershipId: string,
  note?: string,
) => {
  const locale = await getLocale();
  try {
    const client = await serverCookieGqlClient();
    const { recertifyAccess } = await client.request<Response>(Document, {
      membershipId,
      ...(note ? { note } : {}),
    });
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: recertifyAccess };
  } catch (error) {
    return { success: false as const, error };
  }
};
