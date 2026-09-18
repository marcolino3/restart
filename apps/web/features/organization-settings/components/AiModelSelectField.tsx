"use client";

import { useTranslations } from "next-intl";
import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AiModelOption {
  id: string;
  displayName?: string | null;
}

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Models discovered at the provider; empty = free-text fallback. */
  models: AiModelOption[];
  loading: boolean;
  onRefresh?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Model picker fed by the provider's model list. Without a list (no key yet,
 * provider unreachable) it degrades to a text input, so a model id can always
 * be entered by hand.
 */
export function AiModelSelectField({
  id,
  value,
  onChange,
  models,
  loading,
  onRefresh,
  placeholder,
  disabled,
}: Props) {
  const t = useTranslations("OrganizationSettings");

  // Keep the configured model selectable even when the provider no longer
  // lists it, so the active value never silently disappears.
  const options =
    value && !models.some((model) => model.id === value)
      ? [{ id: value, displayName: t("aiModelCurrent", { model: value }) }, ...models]
      : models;

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        {models.length > 0 ? (
          <Select value={value} onValueChange={onChange} disabled={disabled}>
            <SelectTrigger id={id} className="w-full">
              <SelectValue placeholder={t("aiModelSelectPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {options.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.displayName ?? model.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={loading ? t("aiModelsLoading") : placeholder}
            disabled={disabled}
          />
        )}
      </div>
      {onRefresh && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={disabled || loading}
          title={t("aiModelsRefresh")}
          aria-label={t("aiModelsRefresh")}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
