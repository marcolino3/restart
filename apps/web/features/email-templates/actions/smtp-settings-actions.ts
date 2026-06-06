"use server";

import { revalidatePath } from "next/cache";
import {
  getOrganizationSettingsAction,
} from "@/features/organization-settings/actions/get-settings.action";
import { getOrganizationSettingValueAction } from "@/features/organization-settings/actions/get-setting-value.action";
import { createOrganizationSettingAction } from "@/features/organization-settings/actions/create-setting.action";
import { updateOrganizationSettingAction } from "@/features/organization-settings/actions/update-setting.action";

const SETTINGS_PATH = "/admin/admissions/email-settings";

// Keys must match SMTP_SETTING_KEYS in the backend SmtpService.
const KEYS = {
  host: "SMTP_HOST",
  port: "SMTP_PORT",
  secure: "SMTP_SECURE",
  user: "SMTP_USER",
  password: "SMTP_PASSWORD",
  fromEmail: "SMTP_FROM_EMAIL",
  fromName: "SMTP_FROM_NAME",
} as const;

export interface SmtpSettings {
  host: string;
  port: string;
  secure: boolean;
  user: string;
  fromEmail: string;
  fromName: string;
  /** Whether a password is stored (the value itself is never returned). */
  passwordSet: boolean;
}

export async function getSmtpSettingsAction(
  organizationId: string,
): Promise<
  { success: true; data: SmtpSettings } | { success: false; error?: string }
> {
  try {
    const list = await getOrganizationSettingsAction(organizationId);
    const have = new Set(
      list.success && list.data ? list.data.map((s) => s.key) : [],
    );

    // Decrypt the non-secret fields to prefill the form; skip the password.
    const readValue = async (key: string): Promise<string> => {
      if (!have.has(key)) return "";
      const res = await getOrganizationSettingValueAction(organizationId, key);
      return res.success && res.data ? res.data.value ?? "" : "";
    };

    const [host, port, secure, user, fromEmail, fromName] = await Promise.all([
      readValue(KEYS.host),
      readValue(KEYS.port),
      readValue(KEYS.secure),
      readValue(KEYS.user),
      readValue(KEYS.fromEmail),
      readValue(KEYS.fromName),
    ]);

    return {
      success: true,
      data: {
        host,
        port,
        secure: secure.toLowerCase() === "true",
        user,
        fromEmail,
        fromName,
        passwordSet: have.has(KEYS.password),
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

export interface SaveSmtpSettingsInput {
  organizationId: string;
  host: string;
  port: string;
  secure: boolean;
  user: string;
  /** Empty string = keep the stored password unchanged. */
  password?: string;
  fromEmail: string;
  fromName: string;
}

export async function saveSmtpSettingsAction(
  input: SaveSmtpSettingsInput,
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

    await upsert(KEYS.host, input.host.trim());
    await upsert(KEYS.port, input.port.trim());
    await upsert(KEYS.secure, input.secure ? "true" : "false");
    await upsert(KEYS.user, input.user.trim());
    await upsert(KEYS.fromEmail, input.fromEmail.trim());
    await upsert(KEYS.fromName, input.fromName.trim());
    // Only touch the password when the user actually entered a new one.
    if (input.password && input.password.length > 0) {
      await upsert(KEYS.password, input.password);
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
