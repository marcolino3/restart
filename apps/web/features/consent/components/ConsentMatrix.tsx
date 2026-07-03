"use client";

import { useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, X, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { handleAction } from "@/lib/actions/handle-action";

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
}: Props) {
  const t = useTranslations(NS);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const byPurpose = useMemo(
    () => new Map(consents.map((c) => [c.purposeId, c])),
    [consents],
  );

  const applicable = purposes.filter(
    (p) => !p.isArchived && p.appliesTo.includes(subjectType),
  );

  const record = (purposeId: string, status: "GRANTED" | "DENIED") =>
    startTransition(async () => {
      await handleAction({
        action: () =>
          recordConsentAction({
            subjectType,
            subjectId,
            purposeId,
            status,
            ...(subjectType === "STUDENT" && guardianContactPersonId
              ? { grantedByContactPersonId: guardianContactPersonId }
              : {}),
          }),
        successMessage: t("recordedToast"),
      });
      router.refresh();
    });

  const withdraw = (consentId: string) =>
    startTransition(async () => {
      await handleAction({
        action: () => withdrawConsentAction(consentId),
        successMessage: t("withdrawnToast"),
      });
      router.refresh();
    });

  if (applicable.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{t("noApplicablePurposes")}</p>
    );
  }

  return (
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
                onClick={() => record(purpose.id, "GRANTED")}
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
  );
}
