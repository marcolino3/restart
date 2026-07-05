"use server";

import { gql } from "graphql-request";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import type { ConsentStatus } from "../types";
import type { ConsentSubjectType } from "../schemas/consent-purpose-form.schema";

const RecordConsentDocument = gql`
  mutation RecordConsent($input: RecordConsentInput!) {
    recordConsent(input: $input) {
      id
      status
    }
  }
`;

type RecordConsentResponse = {
  recordConsent: { id: string; status: ConsentStatus };
};

export type RecordConsentArgs = {
  subjectType: ConsentSubjectType;
  subjectId: string;
  purposeId: string;
  status: "GRANTED" | "DENIED";
  grantedByContactPersonId?: string;
  decidedAt?: string;
  evidenceUrl?: string;
  note?: string;
};

export const recordConsentAction = async (args: RecordConsentArgs) => {
  try {
    const client = await serverCookieGqlClient();
    const { recordConsent } = await client.request<RecordConsentResponse>(
      RecordConsentDocument,
      { input: args },
    );
    return { success: true as const, data: recordConsent };
  } catch (error) {
    const message =
      (error as { response?: { errors?: { message?: string }[] } })?.response
        ?.errors?.[0]?.message ?? "Unknown error";
    return { success: false as const, error: message };
  }
};
