"use client";

import { useState } from "react";
import { Archive, Loader2 } from "lucide-react";
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

interface ArchiveConfirmationDialogProps {
  title: string;
  description: string;
  onConfirm: () => Promise<{ success: boolean; error?: unknown }>;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

export function ArchiveConfirmationDialog({
  title,
  description,
  onConfirm,
  onSuccess,
  trigger,
  open: controlledOpen,
  onOpenChange,
  disabled = false,
}: ArchiveConfirmationDialogProps) {
  const tCommon = useTranslations("Common");
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      const result = await onConfirm();
      if (result.success) {
        toast.success(tCommon("success"));
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(tCommon("error"), {
          description: result.error ? String(result.error) : undefined,
        });
      }
    } catch (error) {
      toast.error(tCommon("error"), {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsPending(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" disabled={disabled}>
      <Archive className="h-4 w-4" />
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined || !isControlled ? (
        <AlertDialogTrigger asChild>
          {trigger ?? defaultTrigger}
        </AlertDialogTrigger>
      ) : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Archive className="mr-2 h-4 w-4" />
            {tCommon("archive")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
