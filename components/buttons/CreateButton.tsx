"use client";
import { useTranslations } from "next-intl";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

interface Props {
  isSubmitting: boolean;
}

export const CreateButton = ({ isSubmitting }: Props) => {
  const t = useTranslations("Common");
  return (
    <Button type="submit">
      {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
      {t("create")}
    </Button>
  );
};
