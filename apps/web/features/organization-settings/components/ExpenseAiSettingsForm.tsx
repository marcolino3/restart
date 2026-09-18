"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getExpenseAiModelsAction,
  revealExpenseAiKeyAction,
  saveExpenseAiSettingsAction,
  type ExpenseAiModelOption,
  type ExpenseAiSettings,
} from "../actions/ai-settings-actions";
import { AiApiKeyField } from "./AiApiKeyField";
import { AiModelSelectField } from "./AiModelSelectField";
import {
  defaultExpenseAiModel,
  EXPENSE_AI_KEY_REQUIRED,
  EXPENSE_AI_PROVIDERS,
  expenseAiNeedsOwnKey,
  isNonEuExpenseAiProvider,
  type ExpenseAiProvider,
} from "../expense-ai-providers";

interface LoadedModels {
  /** Provider and reload counter the list was fetched for. */
  key: string;
  models: ExpenseAiModelOption[];
  errorCode: string | null;
}

const MODELS_FAILED = "failed";

interface Props {
  organizationId: string;
  initial: ExpenseAiSettings;
  canManage: boolean;
}

export function ExpenseAiSettingsForm({
  organizationId,
  initial,
  canManage,
}: Props) {
  const t = useTranslations("OrganizationSettings");
  const [provider, setProvider] = useState<ExpenseAiProvider>(initial.provider);
  const [model, setModel] = useState(initial.model);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState<LoadedModels | null>(null);

  const ownKey = expenseAiNeedsOwnKey(provider);
  // The stored key belongs to the stored provider only.
  const keyStoredForProvider =
    initial.apiKeySet && provider === initial.provider;
  const keyStored = ownKey ? keyStoredForProvider : initial.contractKeySet;
  const keyHint = ownKey
    ? keyStoredForProvider
      ? initial.apiKeyHint
      : ""
    : initial.contractKeyHint;

  const loadKey = `${provider}:${reload}`;
  const current = loaded?.key === loadKey ? loaded : null;
  const loadingModels = canManage && keyStored && !current;

  useEffect(() => {
    if (!canManage || !keyStored) return;
    let cancelled = false;
    void (async () => {
      const res = await getExpenseAiModelsAction(provider);
      if (cancelled) return;
      setLoaded({
        key: loadKey,
        models: res.success ? res.data.models : [],
        errorCode: res.success ? res.data.errorCode : MODELS_FAILED,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [canManage, keyStored, provider, loadKey]);

  const modelsNote = !keyStored
    ? t("aiModelsNoKey")
    : current?.errorCode === "EXPENSE_AI_KEY_REJECTED"
      ? t("aiModelsKeyRejected")
      : current?.errorCode
        ? t("aiModelsFailed")
        : null;

  const reveal = async () => {
    const res = await revealExpenseAiKeyAction(organizationId, provider);
    return res.success ? res.value : null;
  };

  const changeProvider = (value: string) => {
    const next = value as ExpenseAiProvider;
    setProvider(next);
    setApiKey("");
    setModel(
      next === initial.provider
        ? initial.model
        : next === "contracts"
          ? initial.contractModel
          : defaultExpenseAiModel(next),
    );
  };

  const save = async () => {
    setSaving(true);
    const res = await saveExpenseAiSettingsAction({
      organizationId,
      provider,
      model,
      apiKey,
    });
    setSaving(false);
    if (!res.success) {
      toast.error(
        res.error === EXPENSE_AI_KEY_REQUIRED
          ? t("expenseAiKeyRequired")
          : (res.error ?? t("aiSaveError")),
      );
      return;
    }
    setApiKey("");
    setReload((count) => count + 1);
    toast.success(t("aiSaveOk"));
  };

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="text-base font-semibold">{t("expenseAiTitle")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("expenseAiSubtitle")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>{t("shiftAiProviderLabel")}</Label>
        <Select
          value={provider}
          onValueChange={changeProvider}
          disabled={!canManage || saving}
        >
          <SelectTrigger aria-label={t("expenseAiTitle")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_AI_PROVIDERS.map((p) => (
              <SelectItem key={p} value={p}>
                {t(`shiftAiProvider_${p}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t("expenseAiProviderHint")}
        </p>
      </div>

      {isNonEuExpenseAiProvider(provider) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t("expenseAiNonEuTitle")}</AlertTitle>
          <AlertDescription>{t("expenseAiNonEuText")}</AlertDescription>
        </Alert>
      )}

      <AiApiKeyField
        // A revealed key must not survive a provider switch or a save.
        key={loadKey}
        id="expense-ai-api-key"
        label={t("shiftAiApiKeyLabel")}
        hint={ownKey ? t("expenseAiKeyHint") : t("expenseAiContractKeyHint")}
        value={apiKey}
        onChange={setApiKey}
        keyStored={keyStored}
        keyHint={keyHint}
        reveal={reveal}
        canManage={canManage}
        readOnly={!ownKey}
        disabled={!canManage || saving}
      />

      <div className="space-y-1.5">
        <Label htmlFor="expense-ai-model">{t("aiModelLabel")}</Label>
        <AiModelSelectField
          id="expense-ai-model"
          value={model}
          onChange={setModel}
          models={current?.models ?? []}
          loading={loadingModels}
          onRefresh={
            canManage && keyStored
              ? () => setReload((count) => count + 1)
              : undefined
          }
          placeholder={defaultExpenseAiModel(provider)}
          disabled={!canManage || saving}
        />
        <p className="text-xs text-muted-foreground">
          {t("expenseAiModelHint")}
        </p>
        {modelsNote && (
          <p className="text-xs text-muted-foreground">{modelsNote}</p>
        )}
      </div>

      {canManage && (
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          {t("save")}
        </Button>
      )}
    </div>
  );
}
