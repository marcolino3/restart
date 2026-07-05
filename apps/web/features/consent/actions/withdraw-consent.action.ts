"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { ConsentStatus } from "../types";

const WithdrawConsentDocument = gql`
  mutation WithdrawConsent($input: WithdrawConsentInput!) {
    withdrawConsent(input: $input) {
      id
      status
    }
  }
`;

type WithdrawConsentResponse = {
  withdrawConsent: { id: string; status: ConsentStatus };
};

export const withdrawConsentAction = async (id: string, note?: string) => {
  try {
    const client = await serverCookieGqlClient();
    const { withdrawConsent } = await client.request<WithdrawConsentResponse>(
      WithdrawConsentDocument,
      { input: { id, ...(note ? { note } : {}) } },
    );
    return { success: true as const, data: withdrawConsent };
  } catch (error) {
    const message =
      (error as { response?: { errors?: { message?: string }[] } })?.response
        ?.errors?.[0]?.message ?? "Unknown error";
    return { success: false as const, error: message };
  }
};
