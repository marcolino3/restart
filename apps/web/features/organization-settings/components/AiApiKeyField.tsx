"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  id: string;
  label: string;
  hint: string;
  /** The newly typed key; the stored one never lands here. */
  value: string;
  onChange: (value: string) => void;
  keyStored: boolean;
  /** Masked end of the stored key, shown while nothing is typed. */
  keyHint: string;
  /** Fetches the stored key for the eye and copy buttons. */
  reveal: () => Promise<string | null>;
  canManage: boolean;
  readOnly?: boolean;
  disabled?: boolean;
}

/**
 * API key input of the AI settings: shows the end of the stored key, reveals
 * and copies it on demand. A revealed key only lives in this component — the
 * form keeps saving the typed value alone. Remount it (`key`) to reset.
 */
export function AiApiKeyField({
  id,
  label,
  hint,
  value,
  onChange,
  keyStored,
  keyHint,
  reveal,
  canManage,
  readOnly,
  disabled,
}: Props) {
  const t = useTranslations("OrganizationSettings");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [revealing, setRevealing] = useState(false);

  const storedKey = async (): Promise<string | null> => {
    if (revealedKey) return revealedKey;
    setRevealing(true);
    const key = await reveal();
    setRevealing(false);
    if (!key) toast.error(t("aiKeyRevealError"));
    return key;
  };

  const toggleKey = async () => {
    if (showKey) {
      setShowKey(false);
      setRevealedKey(null);
      return;
    }
    if (!value && keyStored) {
      const key = await storedKey();
      if (!key) return;
      setRevealedKey(key);
    }
    setShowKey(true);
  };

  const copyKey = async () => {
    const key = value || (keyStored ? await storedKey() : null);
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      toast.success(t("aiKeyCopied"));
    } catch {
      toast.error(t("aiKeyRevealError"));
    }
  };

  const nothingToShow = !value && !keyStored;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label htmlFor={id}>{label}</Label>
        {keyStored && (
          <Badge variant="slate" className="text-[11px]">
            {t("aiApiKeySet")}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type={showKey ? "text" : "password"}
          autoComplete="off"
          className="min-w-0 flex-1"
          value={value || (showKey ? (revealedKey ?? "") : "")}
          onChange={(e) => {
            onChange(e.target.value);
            setRevealedKey(null);
          }}
          placeholder={keyHint || (readOnly ? "" : "sk-...")}
          readOnly={readOnly}
          disabled={disabled}
        />
        {canManage && (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleKey}
              disabled={revealing || nothingToShow}
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
              disabled={revealing || nothingToShow}
              title={t("aiKeyCopy")}
              aria-label={t("aiKeyCopy")}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
