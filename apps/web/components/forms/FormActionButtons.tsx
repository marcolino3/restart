"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface Props {
  onCancel?: () => void;
  disabled?: boolean;
  align?: "left" | "right" | "center";
}

export const FormActionButtons = ({
  onCancel,
  disabled = false,
  align = "right",
}: Props) => {
  const t = useTranslations("Common");

  const alignment =
    align === "left"
      ? "justify-start"
      : align === "center"
      ? "justify-center"
      : "justify-end";

  return (
    <div className={`mt-6 flex gap-2 ${alignment}`}>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={disabled}
        >
          {t("cancel")}
        </Button>
      )}
      <Button type="submit" disabled={disabled}>
        {t("save")}
      </Button>
    </div>
  );
};
