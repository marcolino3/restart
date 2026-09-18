"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  saveShiftAiSettingsAction,
  type ShiftAiSettings,
} from "../actions/ai-settings-actions";
import {
  defaultShiftAiModel,
  SHIFT_AI_PROVIDERS,
  type ShiftAiProvider,
  shiftAiNeedsOwnKey,
} from "../shift-ai-providers";

interface Props {
  organizationId: string;
  initial: ShiftAiSettings;
  canManage: boolean;
}

export function ShiftAiSettingsForm({
  organizationId,
  initial,
  canManage,
}: Props) {
  const t = useTranslations("OrganizationSettings");
  const [provider, setProvider] = useState<ShiftAiProvider>(initial.provider);
  const [model, setModel] = useState(initial.model);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const ownKey = shiftAiNeedsOwnKey(provider);

  const changeProvider = (value: string) => {
    const next = value as ShiftAiProvider;
    setProvider(next);
    // Switching provider resets the model to that provider's default unless
    // the user keeps the originally stored provider.
    setModel(
      next === initial.provider ? initial.model : defaultShiftAiModel(next),
    );
  };

  const save = async () => {
    setSaving(true);
    const res = await saveShiftAiSettingsAction({
      organizationId,
      provider,
      model,
      apiKey,
    });
    setSaving(false);
    if (!res.success) {
      toast.error(res.error ?? t("aiSaveError"));
      return;
    }
    setApiKey("");
    toast.success(t("aiSaveOk"));
  };

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="text-base font-semibold">{t("shiftAiTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("shiftAiSubtitle")}</p>
      </div>

      <div className="space-y-1.5">
        <Label>{t("shiftAiProviderLabel")}</Label>
        <Select
          value={provider}
          onValueChange={changeProvider}
          disabled={!canManage || saving}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SHIFT_AI_PROVIDERS.map((p) => (
              <SelectItem key={p} value={p}>
                {t(`shiftAiProvider_${p}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t("shiftAiProviderHint")}
        </p>
      </div>

      {ownKey && (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="shift-ai-api-key">{t("shiftAiApiKeyLabel")}</Label>
              {initial.apiKeySet && (
                <Badge variant="slate" className="text-[11px]">
                  {t("aiApiKeySet")}
                </Badge>
              )}
            </div>
            <Input
              id="shift-ai-api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                initial.apiKeySet ? t("aiApiKeyKeepPlaceholder") : "sk-..."
              }
              disabled={!canManage || saving}
            />
            <p className="text-xs text-muted-foreground">{t("aiApiKeyHint")}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shift-ai-model">{t("aiModelLabel")}</Label>
            <Input
              id="shift-ai-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={defaultShiftAiModel(provider)}
              disabled={!canManage || saving}
            />
            <p className="text-xs text-muted-foreground">
              {t("shiftAiModelHint")}
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
