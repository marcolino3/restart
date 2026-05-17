"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteOrganizationSettingAction } from "../actions/delete-setting.action";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { OrganizationSetting } from "../actions/get-settings.action";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  organizationId: string;
  setting: OrganizationSetting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteSettingDialog = ({
  organizationId,
  setting,
  open,
  onOpenChange,
}: Props) => {
  const router = useRouter();
  const t = useTranslations("OrganizationSettings");
  const tCommon = useTranslations("Common");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!setting) return;

    setIsDeleting(true);

    const result = await deleteOrganizationSettingAction(
      organizationId,
      setting.key
    );

    setIsDeleting(false);

    if (result.success) {
      toast.success(t("deleteSuccess", { key: setting.key }));
      router.refresh();
      onOpenChange(false);
    } else {
      toast.error(
        typeof result.error === "string" ? result.error : t("deleteError"),
      );
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDescriptionStart")}{" "}
            <code className="bg-muted rounded px-1 font-mono">
              {setting?.key}
            </code>{" "}
            {t("deleteDescriptionEnd")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
