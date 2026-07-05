"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, X, Undo2, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { handleAction } from "@/lib/actions/handle-action";
import { API_URL } from "@/constants/api-url";

import { recordConsentAction } from "../actions/record-consent.action";
import { withdrawConsentAction } from "../actions/withdraw-consent.action";
import type { ConsentPurpose, Consent, ConsentStatus } from "../types";
import type { ConsentSubjectType } from "../schemas/consent-purpose-form.schema";

const NS = "ConsentManagement";

type Props = {
  subjectType: ConsentSubjectType;
  subjectId: string;
  purposes: ConsentPurpose[];
  consents: Consent[];
  /** Required to grant consent for a child (the custodial guardian). */
  guardianContactPersonId?: string;
  /** Called after a successful record/withdraw so the caller can refresh data. */
  onChanged?: () => void | Promise<void>;
};

const STATUS_VARIANT: Record<
  ConsentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  GRANTED: "default",
  DENIED: "destructive",
  WITHDRAWN: "secondary",
};

export function ConsentMatrix({
  subjectType,
  subjectId,
  purposes,
  consents,
  guardianContactPersonId,
  onChanged,
}: Props) {
  const t = useTranslations(NS);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Grant-with-evidence dialog state (for purposes that require a document).
  const [evidenceFor, setEvidenceFor] = useState<ConsentPurpose | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const byPurpose = useMemo(
    () => new Map(consents.map((c) => [c.purposeId, c])),
    [consents],
  );

  const applicable = purposes.filter(
    (p) => !p.isArchived && p.appliesTo.includes(subjectType),
  );

  const guardianArg =
    subjectType === "STUDENT" && guardianContactPersonId
      ? { grantedByContactPersonId: guardianContactPersonId }
      : {};

  const record = (
    purposeId: string,
    status: "GRANTED" | "DENIED",
    evidenceUrl?: string,
  ) =>
    startTransition(async () => {
      await handleAction({
        action: () =>
          recordConsentAction({
            subjectType,
            subjectId,
            purposeId,
            status,
            ...guardianArg,
            ...(evidenceUrl ? { evidenceUrl } : {}),
          }),
        successMessage: t("recordedToast"),
      });
      await onChanged?.();
      router.refresh();
    });

  const withdraw = (consentId: string) =>
    startTransition(async () => {
      await handleAction({
        action: () => withdrawConsentAction(consentId),
        successMessage: t("withdrawnToast"),
      });
      await onChanged?.();
      router.refresh();
    });

  const onGrant = (purpose: ConsentPurpose) => {
    if (purpose.requiresEvidence) {
      setFile(null);
      setEvidenceFor(purpose);
    } else {
      record(purpose.id, "GRANTED");
    }
  };

  const grantWithEvidence = async () => {
    if (!evidenceFor || !file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/consent-documents`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!res.ok) throw new Error("upload failed");
      const { url } = (await res.json()) as { url: string };
      const purposeId = evidenceFor.id;
      setEvidenceFor(null);
      setFile(null);
      record(purposeId, "GRANTED", url);
    } catch {
      toast.error(t("uploadFailed"));
    } finally {
      setUploading(false);
    }
  };

  if (applicable.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{t("noApplicablePurposes")}</p>
    );
  }

  return (
    <>
      <ul className="divide-y rounded-lg border">
        {applicable.map((purpose) => {
          const current = byPurpose.get(purpose.id);
          return (
            <li
              key={purpose.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{purpose.name}</span>
                  {current ? (
                    <Badge variant={STATUS_VARIANT[current.status]}>
                      {t(`status.${current.status}`)}
                    </Badge>
                  ) : (
                    <Badge variant="outline">{t("status.PENDING")}</Badge>
                  )}
                  {current?.status === "GRANTED" && current.evidenceUrl && (
                    <a
                      href={current.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                    >
                      <FileText className="h-3 w-3" />
                      {t("evidenceDoc")}
                    </a>
                  )}
                </div>
                {purpose.description && (
                  <p className="text-muted-foreground text-sm">
                    {purpose.description}
                  </p>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending || current?.status === "GRANTED"}
                  onClick={() => onGrant(purpose)}
                >
                  <Check className="mr-1 h-4 w-4" />
                  {t("grant")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending || current?.status === "DENIED"}
                  onClick={() => record(purpose.id, "DENIED")}
                >
                  <X className="mr-1 h-4 w-4" />
                  {t("deny")}
                </Button>
                {current?.status === "GRANTED" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => withdraw(current.id)}
                  >
                    <Undo2 className="mr-1 h-4 w-4" />
                    {t("withdraw")}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={!!evidenceFor}
        onOpenChange={(open) => {
          if (!open) {
            setEvidenceFor(null);
            setFile(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("uploadEvidenceTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm">
              {t("uploadEvidenceHint")}
            </p>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setEvidenceFor(null);
                  setFile(null);
                }}
              >
                {t("cancel")}
              </Button>
              <Button
                disabled={!file || uploading || pending}
                onClick={grantWithEvidence}
              >
                <Check className="mr-1 h-4 w-4" />
                {t("grant")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
