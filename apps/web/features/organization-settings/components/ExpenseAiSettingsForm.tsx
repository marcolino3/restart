"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Copy, Eye, EyeOff, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  // The stored key, fetched on demand for the eye button — never sent back.
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [revealing, setRevealing] = useState(false);
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

  const hideKey = () => {
    setShowKey(false);
    setRevealedKey(null);
  };

  const storedKey = async (): Promise<string | null> => {
    if (revealedKey) return revealedKey;
    setRevealing(true);
    const res = await revealExpenseAiKeyAction(organizationId, provider);
    setRevealing(false);
    if (!res.success) {
      toast.error(t("aiKeyRevealError"));
      return null;
    }
    return res.value;
  };

  const toggleKey = async () => {
    if (showKey) return hideKey();
    if (!apiKey && keyStored) {
      const value = await storedKey();
      if (!value) return;
      setRevealedKey(value);
    }
    setShowKey(true);
  };

  const copyKey = async () => {
    const value = apiKey || (keyStored ? await storedKey() : null);
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("aiKeyCopied"));
    } catch {
      toast.error(t("aiKeyRevealError"));
    }
  };

  const changeProvider = (value: string) => {
    const next = value as ExpenseAiProvider;
    setProvider(next);
    setApiKey("");
    hideKey();
    setModel(
      next === initial.provider ? initial.model : defaultExpenseAiModel(next),
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
    hideKey();
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

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label htmlFor="expense-ai-api-key">{t("shiftAiApiKeyLabel")}</Label>
          {keyStored && (
            <Badge variant="slate" className="text-[11px]">
              {t("aiApiKeySet")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            id="expense-ai-api-key"
            type={showKey ? "text" : "password"}
            autoComplete="off"
            className="min-w-0 flex-1"
            value={apiKey || (showKey ? (revealedKey ?? "") : "")}
            onChange={(e) => {
              setApiKey(e.target.value);
              setRevealedKey(null);
            }}
            placeholder={keyHint || (ownKey ? "sk-..." : "")}
            readOnly={!ownKey}
            disabled={!canManage || saving}
          />
          {canManage && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleKey}
                disabled={revealing || (!apiKey && !keyStored)}
                title={showKey ? t("aiKeyHide") : t("aiKeyShow")}
                aria-label={showKey ? t("aiKeyHide") : t("aiKeyShow")}
              >
                {revealing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyKey}
                disabled={revealing || (!apiKey && !keyStored)}
                title={t("aiKeyCopy")}
                aria-label={t("aiKeyCopy")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {ownKey ? t("expenseAiKeyHint") : t("expenseAiContractKeyHint")}
        </p>
      </div>

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
