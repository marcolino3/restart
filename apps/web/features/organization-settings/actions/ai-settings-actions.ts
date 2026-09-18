"use server";

import { revalidatePath } from "next/cache";
import { getOrganizationSettingsAction } from "@/features/organization-settings/actions/get-settings.action";
import { getOrganizationSettingValueAction } from "@/features/organization-settings/actions/get-setting-value.action";
import { createOrganizationSettingAction } from "@/features/organization-settings/actions/create-setting.action";
import { updateOrganizationSettingAction } from "@/features/organization-settings/actions/update-setting.action";
import {
  defaultShiftAiModel,
  isShiftAiProvider,
  SHIFT_AI_DEFAULT_PROVIDER,
  SHIFT_AI_SETTING_KEYS,
  type ShiftAiProvider,
} from "../shift-ai-providers";

const SETTINGS_PATH = "/admin/settings/ai";

// Keys must match CONTRACT_AI_SETTING_KEYS in the backend ContractAiService.
const KEYS = {
  apiKey: "CONTRACT_AI_MISTRAL_API_KEY",
  model: "CONTRACT_AI_MODEL",
} as const;

const AI_DEFAULT_MODEL = "mistral-large-latest";

export interface ShiftAiSettings {
  provider: ShiftAiProvider;
  model: string;
  /** Whether an own API key is stored (the value itself is never returned). */
  apiKeySet: boolean;
}

export interface AiSettings {
  model: string;
  /** Whether an API key is stored (the value itself is never returned). */
  apiKeySet: boolean;
  shiftPlanning: ShiftAiSettings;
}

const readValue = async (organizationId: string, key: string) => {
  const res = await getOrganizationSettingValueAction(organizationId, key);
  return res.success && res.data ? (res.data.value ?? "") : "";
};

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

    const model = have.has(KEYS.model)
      ? await readValue(organizationId, KEYS.model)
      : "";

    const storedProvider = have.has(SHIFT_AI_SETTING_KEYS.provider)
      ? await readValue(organizationId, SHIFT_AI_SETTING_KEYS.provider)
      : "";
    const provider = isShiftAiProvider(storedProvider)
      ? storedProvider
      : SHIFT_AI_DEFAULT_PROVIDER;
    const shiftModel = have.has(SHIFT_AI_SETTING_KEYS.model)
      ? await readValue(organizationId, SHIFT_AI_SETTING_KEYS.model)
      : "";

    return {
      success: true,
      data: {
        model: model || AI_DEFAULT_MODEL,
        apiKeySet: have.has(KEYS.apiKey),
        shiftPlanning: {
          provider,
          model: shiftModel || defaultShiftAiModel(provider),
          apiKeySet: have.has(SHIFT_AI_SETTING_KEYS.apiKey),
        },
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

const upsertSetting = async (
  organizationId: string,
  have: Set<string>,
  key: string,
  value: string,
) => {
  if (have.has(key)) {
    await updateOrganizationSettingAction({ organizationId, key, value });
  } else {
    await createOrganizationSettingAction({ organizationId, key, value });
  }
};

const storedKeys = async (organizationId: string) => {
  const list = await getOrganizationSettingsAction(organizationId);
  return new Set(list.success && list.data ? list.data.map((s) => s.key) : []);
};

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
    const have = await storedKeys(input.organizationId);
    const upsert = (key: string, value: string) =>
      upsertSetting(input.organizationId, have, key, value);

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

export interface SaveShiftAiSettingsInput {
  organizationId: string;
  provider: ShiftAiProvider;
  model: string;
  /** Empty string = keep the stored key unchanged. */
  apiKey?: string;
}

export async function saveShiftAiSettingsAction(
  input: SaveShiftAiSettingsInput,
): Promise<{ success: true } | { success: false; error?: string }> {
  try {
    if (!isShiftAiProvider(input.provider)) {
      return { success: false, error: "Unknown provider" };
    }
    const have = await storedKeys(input.organizationId);
    const upsert = (key: string, value: string) =>
      upsertSetting(input.organizationId, have, key, value);

    await upsert(SHIFT_AI_SETTING_KEYS.provider, input.provider);
    await upsert(
      SHIFT_AI_SETTING_KEYS.model,
      input.model.trim() || defaultShiftAiModel(input.provider),
    );
    // Only touch the key when the user actually entered a new one.
    if (input.apiKey && input.apiKey.trim().length > 0) {
      await upsert(SHIFT_AI_SETTING_KEYS.apiKey, input.apiKey.trim());
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
