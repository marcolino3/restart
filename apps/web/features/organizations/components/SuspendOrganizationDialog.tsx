"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { suspendOrganizationAction } from "../actions/suspend-organization.action";

interface SuspendOrganizationDialogProps {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const SuspendOrganizationDialog = ({
  organizationId,
  open,
  onOpenChange,
  onSuccess,
}: SuspendOrganizationDialogProps) => {
  const tO = useTranslations("Organizations");
  const t = useTranslations("Common");
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError(true);
      return;
    }
    setIsSubmitting(true);
    const result = await suspendOrganizationAction(organizationId, reason.trim());
    setIsSubmitting(false);

    if (result.success) {
      toast.success(tO("suspendSuccess"));
      setReason("");
      setError(false);
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(tO("suspendError"), { description: result.error });
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setReason("");
          setError(false);
        }
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tO("suspendDialogTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tO("suspendDialogDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="suspend-reason">{tO("suspendReasonLabel")}</Label>
          <Textarea
            id="suspend-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setError(false);
            }}
            disabled={isSubmitting}
          />
          {error && (
            <p className="text-sm text-destructive">
              {tO("suspendReasonRequired")}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isSubmitting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tO("suspendConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
