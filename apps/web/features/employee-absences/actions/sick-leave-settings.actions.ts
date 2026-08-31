"use server";

import { createOrganizationSettingAction } from "@/features/organization-settings/actions/create-setting.action";
import { getOrganizationSettingValueAction } from "@/features/organization-settings/actions/get-setting-value.action";
import { getOrganizationSettingsAction } from "@/features/organization-settings/actions/get-settings.action";
import { updateOrganizationSettingAction } from "@/features/organization-settings/actions/update-setting.action";
import { serverCookieGqlClient } from "@/lib/graphql/server-cookie-graphql-client";
import { graphql } from "@restart/shared-types";
import { TestCalendarConnectionMutation } from "@restart/shared-types/graphql";
import { revalidatePath } from "next/cache";

const SETTINGS_PATH = "/admin/settings/sick-leave";

// Keys must match SICK_LEAVE_SETTING_KEYS and GOOGLE_CALENDAR_SETTING_KEYS
// in the backend.
const KEYS = {
  notificationEmail: "SICK_LEAVE_NOTIFICATION_EMAIL",
  calendarEnabled: "SICK_LEAVE_CALENDAR_ENABLED",
  serviceAccountJson: "GOOGLE_SERVICE_ACCOUNT_JSON",
  impersonationUser: "GOOGLE_IMPERSONATION_USER",
  calendarId: "GOOGLE_CALENDAR_ID",
} as const;

export interface SickLeaveSettings {
  notificationEmail: string;
  calendarEnabled: boolean;
  impersonationUser: string;
  calendarId: string;
  /** Whether a service account is stored — the key itself is never returned. */
  serviceAccountSet: boolean;
}

export async function getSickLeaveSettingsAction(
  organizationId: string,
): Promise<
  | { success: true; data: SickLeaveSettings }
  | { success: false; error?: string }
> {
  try {
    const list = await getOrganizationSettingsAction(organizationId);
    const have = new Set(
      list.success && list.data ? list.data.map((s) => s.key) : [],
    );

    const readValue = async (key: string): Promise<string> => {
      if (!have.has(key)) return "";
      const res = await getOrganizationSettingValueAction(organizationId, key);
      return res.success && res.data ? (res.data.value ?? "") : "";
    };

    const [notificationEmail, calendarEnabled, impersonationUser, calendarId] =
      await Promise.all([
        readValue(KEYS.notificationEmail),
        readValue(KEYS.calendarEnabled),
        readValue(KEYS.impersonationUser),
        readValue(KEYS.calendarId),
      ]);

    return {
      success: true,
      data: {
        notificationEmail,
        // Unset counts as enabled, matching the backend default.
        calendarEnabled: calendarEnabled.toLowerCase() !== "false",
        impersonationUser,
        calendarId,
        serviceAccountSet: have.has(KEYS.serviceAccountJson),
      },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Load failed",
    };
  }
}

export interface SaveSickLeaveSettingsInput {
  organizationId: string;
  notificationEmail: string;
  calendarEnabled: boolean;
  impersonationUser: string;
  calendarId: string;
  /** Empty = keep the stored service account key unchanged. */
  serviceAccountJson?: string;
}

export async function saveSickLeaveSettingsAction(
  input: SaveSickLeaveSettingsInput,
): Promise<{ success: true } | { success: false; error?: string }> {
  try {
    const list = await getOrganizationSettingsAction(input.organizationId);
    const have = new Set(
      list.success && list.data ? list.data.map((s) => s.key) : [],
    );

    const upsert = async (key: string, value: string) => {
      if (have.has(key)) {
        await updateOrganizationSettingAction({
          organizationId: input.organizationId,
          key,
          value,
        });
      } else {
        await createOrganizationSettingAction({
          organizationId: input.organizationId,
          key,
          value,
        });
      }
    };

    await upsert(KEYS.notificationEmail, input.notificationEmail.trim());
    await upsert(
      KEYS.calendarEnabled,
      input.calendarEnabled ? "true" : "false",
    );
    await upsert(KEYS.impersonationUser, input.impersonationUser.trim());
    await upsert(KEYS.calendarId, input.calendarId.trim());
    // Only touch the service account when a new key was actually entered.
    if (input.serviceAccountJson && input.serviceAccountJson.length > 0) {
      await upsert(KEYS.serviceAccountJson, input.serviceAccountJson);
    }

    revalidatePath(SETTINGS_PATH);
    return { success: true };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Save failed",
    };
  }
}

const TestCalendarConnectionDocument = graphql(`
  mutation TestCalendarConnection {
    testCalendarConnection {
      ok
      calendarSummary
      error
    }
  }
`);

export async function testCalendarConnectionAction(): Promise<
  | { success: true; ok: boolean; calendarSummary?: string; error?: string }
  | { success: false; error?: string }
> {
  try {
    const client = await serverCookieGqlClient();
    const { testCalendarConnection } =
      await client.request<TestCalendarConnectionMutation>(
        TestCalendarConnectionDocument,
      );

    return {
      success: true,
      ok: testCalendarConnection.ok,
      calendarSummary: testCalendarConnection.calendarSummary ?? undefined,
      error: testCalendarConnection.error ?? undefined,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Test failed",
    };
  }
}
