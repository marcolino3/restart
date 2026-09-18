"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

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
  saveExpenseAiSettingsAction,
  type ExpenseAiSettings,
} from "../actions/ai-settings-actions";
import {
  defaultExpenseAiModel,
  EXPENSE_AI_KEY_REQUIRED,
  EXPENSE_AI_PROVIDERS,
  expenseAiNeedsOwnKey,
  isNonEuExpenseAiProvider,
  type ExpenseAiProvider,
} from "../expense-ai-providers";

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

  const ownKey = expenseAiNeedsOwnKey(provider);
  // The stored key belongs to the stored provider only.
  const keyStoredForProvider =
    initial.apiKeySet && provider === initial.provider;

  const changeProvider = (value: string) => {
    const next = value as ExpenseAiProvider;
    setProvider(next);
    setApiKey("");
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

      {ownKey && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="expense-ai-api-key">
                {t("shiftAiApiKeyLabel")}
              </Label>
              {keyStoredForProvider && (
                <Badge variant="slate" className="text-[11px]">
                  {t("aiApiKeySet")}
                </Badge>
              )}
            </div>
            <Input
              id="expense-ai-api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                keyStoredForProvider ? t("aiApiKeyKeepPlaceholder") : "sk-..."
              }
              disabled={!canManage || saving}
            />
            <p className="text-xs text-muted-foreground">{t("aiApiKeyHint")}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expense-ai-model">{t("aiModelLabel")}</Label>
            <Input
              id="expense-ai-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={defaultExpenseAiModel(provider)}
              disabled={!canManage || saving}
            />
            <p className="text-xs text-muted-foreground">
              {t("expenseAiModelHint")}
            </p>
          </div>
        </>
      )}

      {canManage && (
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          {t("save")}
        </Button>
      )}
    </div>
  );
}
