"use server";

import { gql } from "graphql-request";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";

import type { RecordKeepingSettingsDTO } from "./get-record-keeping-settings.action";

const Document = gql`
  mutation UpdateRecordKeepingSettings(
    $input: UpdateRecordKeepingSettingsInput!
  ) {
    updateRecordKeepingSettings(input: $input) {
      introducedStuckDays
      practicedStuckDays
      bigGapDays
    }
  }
`;

export const updateRecordKeepingSettingsAction = async (
  input: RecordKeepingSettingsDTO,
): Promise<
  | { success: true; data: RecordKeepingSettingsDTO }
  | { success: false; error?: string }
> => {
  try {
    const client = await serverCookieGqlClient();
    const { updateRecordKeepingSettings } = await client.request<{
      updateRecordKeepingSettings: RecordKeepingSettingsDTO;
    }>(Document, { input });
    const locale = await getLocale();
    revalidatePath(`/${locale}/admin/settings/record-keeping`);
    revalidatePath(`/${locale}/admin/record-keeping`);
    revalidatePath(`/${locale}/admin/record-keeping/heatmap`);
    return { success: true as const, data: updateRecordKeepingSettings };
  } catch (error) {
    console.error(error);
    return { success: false as const, error: "Failed to update settings" };
  }
};
