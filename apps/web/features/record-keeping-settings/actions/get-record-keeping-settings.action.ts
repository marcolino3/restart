"use server";

import { gql } from "graphql-request";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

export type RecordKeepingSettingsDTO = {
  introducedStuckDays: number;
  practicedStuckDays: number;
  bigGapDays: number;
};

type Response = {
  recordKeepingSettings: RecordKeepingSettingsDTO;
};

const Document = gql`
  query GetRecordKeepingSettings {
    recordKeepingSettings {
      introducedStuckDays
      practicedStuckDays
      bigGapDays
    }
  }
`;

export const getRecordKeepingSettingsAction = async (): Promise<
  | { success: true; data: RecordKeepingSettingsDTO }
  | { success: false; error?: string }
> => {
  try {
    const client = await serverCookieGqlClient();
    const { recordKeepingSettings } = await client.request<Response>(Document);
    return { success: true as const, data: recordKeepingSettings };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to load settings" };
  }
};
