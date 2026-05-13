"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationDialogProps {
  itemName?: string;
  title?: string;
  description?: string;
  onConfirm: () => Promise<{ success: boolean; error?: unknown }>;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  disabled?: boolean;
}

export function DeleteConfirmationDialog({
  itemName,
  title,
  description,
  onConfirm,
  onSuccess,
  trigger,
  disabled = false,
}: DeleteConfirmationDialogProps) {
  const t = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      const result = await onConfirm();
      if (result.success) {
        toast.success(t("success"));
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(t("error"), {
          description: result.error ? String(result.error) : t("deleteError"),
        });
      }
    } catch (error) {
      toast.error(t("error"), {
        description: error instanceof Error ? error.message : t("deleteError"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      disabled={disabled}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger ?? defaultTrigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title ?? t("deleteConfirmTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description ??
              t("deleteConfirmDescription", { itemName: itemName ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
