"use server";

import { revalidatePath } from "next/cache";
import { getOrganizationSettingsAction } from "@/features/organization-settings/actions/get-settings.action";
import { getOrganizationSettingValueAction } from "@/features/organization-settings/actions/get-setting-value.action";
import { createOrganizationSettingAction } from "@/features/organization-settings/actions/create-setting.action";
import { updateOrganizationSettingAction } from "@/features/organization-settings/actions/update-setting.action";

const SETTINGS_PATH = "/admin/settings/ai";

// Keys must match CONTRACT_AI_SETTING_KEYS in the backend ContractAiService.
const KEYS = {
  apiKey: "CONTRACT_AI_MISTRAL_API_KEY",
  model: "CONTRACT_AI_MODEL",
} as const;

const AI_DEFAULT_MODEL = "mistral-large-latest";

export interface AiSettings {
  model: string;
  /** Whether an API key is stored (the value itself is never returned). */
  apiKeySet: boolean;
}

export async function getAiSettingsAction(
  organizationId: string,
): Promise<
  { success: true; data: AiSettings } | { success: false; error?: string }
> {
  try {
    const list = await getOrganizationSettingsAction(organizationId);
    const have = new Set(
      list.success && list.data ? list.data.map((s) => s.key) : [],
    );

    let model = "";
    if (have.has(KEYS.model)) {
      const res = await getOrganizationSettingValueAction(
        organizationId,
        KEYS.model,
      );
      model = res.success && res.data ? (res.data.value ?? "") : "";
    }

    return {
      success: true,
      data: {
        model: model || AI_DEFAULT_MODEL,
        apiKeySet: have.has(KEYS.apiKey),
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

export interface SaveAiSettingsInput {
  organizationId: string;
  model: string;
  /** Empty string = keep the stored key unchanged. */
  apiKey?: string;
}

export async function saveAiSettingsAction(
  input: SaveAiSettingsInput,
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

    await upsert(KEYS.model, input.model.trim());
    // Only touch the key when the user actually entered a new one.
    if (input.apiKey && input.apiKey.trim().length > 0) {
      await upsert(KEYS.apiKey, input.apiKey.trim());
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
