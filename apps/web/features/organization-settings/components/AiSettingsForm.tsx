"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  revealContractAiKeyAction,
  saveAiSettingsAction,
  type AiSettings,
} from "../actions/ai-settings-actions";
import { AiApiKeyField } from "./AiApiKeyField";

const MODELS = [
  "mistral-large-latest",
  "mistral-medium-latest",
  "mistral-small-latest",
];

interface Props {
  organizationId: string;
  initial: AiSettings;
  canManage: boolean;
}

export function AiSettingsForm({ organizationId, initial, canManage }: Props) {
  const t = useTranslations("OrganizationSettings");
  const [model, setModel] = useState(initial.model);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  // Remounts the key field after a save so a revealed key is dropped.
  const [saves, setSaves] = useState(0);

  const reveal = async () => {
    const res = await revealContractAiKeyAction(organizationId);
    return res.success ? res.value : null;
  };

  const save = async () => {
    setSaving(true);
    const res = await saveAiSettingsAction({ organizationId, model, apiKey });
    setSaving(false);
    if (!res.success) {
      toast.error(res.error ?? t("aiSaveError"));
      return;
    }
    setApiKey("");
    setSaves((count) => count + 1);
    toast.success(t("aiSaveOk"));
  };

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h2 className="text-base font-semibold">{t("aiTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("aiSubtitle")}</p>
      </div>

      <AiApiKeyField
        key={saves}
        id="ai-api-key"
        label={t("aiApiKeyLabel")}
        hint={t("expenseAiKeyHint")}
        value={apiKey}
        onChange={setApiKey}
        keyStored={initial.apiKeySet}
        keyHint={initial.apiKeyHint}
        reveal={reveal}
        canManage={canManage}
        disabled={!canManage || saving}
      />

      <div className="space-y-1.5">
        <Label>{t("aiModelLabel")}</Label>
        <Select value={model} onValueChange={setModel} disabled={!canManage}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODELS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t("aiModelHint")}</p>
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
