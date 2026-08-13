"use client";

import { useSheet } from "@/components/providers/sheet-provider";
import { Button } from "@/components/ui/button"; // optional: dein eigener Button-Wrapper
import { useMessages, useTranslations } from "next-intl";
import { ComponentProps, ReactNode } from "react";

interface OpenSheetButtonProps {
  title?: string;
  description?: string;
  children: ReactNode; // das ist der Inhalt im Sheet
  buttonLabel: string;
  icon: ReactNode;
  side?: "left" | "right" | "top" | "bottom";
  /** Button style, for pages showing more than one sheet trigger. */
  variant?: ComponentProps<typeof Button>["variant"];
}

export const OpenSheetButton = ({
  title,
  description,
  children,
  buttonLabel,
  icon,
  side = "right",
  variant,
}: OpenSheetButtonProps) => {
  const t = useTranslations("Common");
  const messages = useMessages();
  const { open } = useSheet();

  const commonMessages = messages.Common as Record<string, unknown> | undefined;
  const translateCommon = (key?: string) => {
    if (!key) return undefined;
    if (commonMessages && key in commonMessages) return t(key);
    return key;
  };

  return (
    <Button
      variant={variant}
      onClick={() => {
        open({
          title: translateCommon(title),
          description: translateCommon(description),
          content: children,
          side,
        });
      }}
    >
      {icon}
      {translateCommon(buttonLabel) ?? buttonLabel}
    </Button>
  );
};
