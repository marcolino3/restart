"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { ROUTES } from "@/constants/routes";

const Document = gql`
  mutation ScanRetention {
    scanRetention
  }
`;

type Response = { scanRetention: number };

export const scanRetentionAction = async () => {
  const locale = await getLocale();
  try {
    const client = await serverCookieGqlClient();
    const { scanRetention } = await client.request<Response>(Document);
    revalidatePath(ROUTES.admin.dataProtection(locale));
    return { success: true as const, data: scanRetention };
  } catch (error) {
    return { success: false as const, error };
  }
};
