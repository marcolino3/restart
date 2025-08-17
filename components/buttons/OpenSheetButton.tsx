"use client";

import { useSheet } from "@/components/providers/sheet-provider";
import { Button } from "@/components/ui/button"; // optional: dein eigener Button-Wrapper
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

interface OpenSheetButtonProps {
  title?: string;
  description?: string;
  children: ReactNode; // das ist der Inhalt im Sheet
  buttonLabel: string;
  icon: ReactNode;
  side?: "left" | "right" | "top" | "bottom";
}

export const OpenSheetButton = ({
  title,
  description,
  children,
  buttonLabel,
  icon,
  side = "right",
}: OpenSheetButtonProps) => {
  const t = useTranslations("Common");
  const { open } = useSheet();

  return (
    <Button
      onClick={() => {
        open({ title, description, content: children, side });
      }}
    >
      {icon}
      {t(buttonLabel)}
    </Button>
  );
};
