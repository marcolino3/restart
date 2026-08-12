"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { getOrganizationOwnerAction } from "../actions/get-organization-owner.action";
import { startOrgSupportImpersonationAction } from "@/features/auth/actions/impersonate-user.action";

interface StartSupportLoginDialogProps {
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const StartSupportLoginDialog = ({
  organizationId,
  open,
  onOpenChange,
}: StartSupportLoginDialogProps) => {
  const tO = useTranslations("Organizations");
  const t = useTranslations("Common");
  const router = useRouter();
  const [owner, setOwner] = useState<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);
  const [isLoadingOwner, setIsLoadingOwner] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setIsLoadingOwner(true);
    getOrganizationOwnerAction(organizationId).then((result) => {
      setIsLoadingOwner(false);
      if (result.success) {
        setOwner(result.data ?? null);
        if (!result.data) setError(tO("supportLoginNoOwner"));
      } else {
        setError(result.error);
      }
    });
  }, [open, organizationId, tO]);

  const handleConfirm = async () => {
    if (!owner) return;
    setIsStarting(true);
    const result = await startOrgSupportImpersonationAction(
      organizationId,
      owner.userId
    );
    setIsStarting(false);

    if (result.success) {
      onOpenChange(false);
      router.push("/");
      router.refresh();
    } else {
      toast.error(tO("supportLoginError"), { description: result.error });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tO("supportLoginDialogTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {isLoadingOwner
              ? t("loading")
              : owner
                ? tO("supportLoginDialogDescription", {
                    name: `${owner.firstName} ${owner.lastName}`,
                    email: owner.email,
                  })
                : (error ?? tO("supportLoginNoOwner"))}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isStarting}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isStarting || isLoadingOwner || !owner}
          >
            {isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {tO("supportLoginConfirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
