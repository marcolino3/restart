"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Archive, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { handleAction } from "@/lib/actions/handle-action";

import { ConsentPurposeForm } from "./ConsentPurposeForm";
import { saveConsentPurposeAction } from "../actions/save-consent-purpose.action";
import { archiveConsentPurposeAction } from "../actions/archive-consent-purpose.action";
import type { ConsentPurposeFormType } from "../schemas/consent-purpose-form.schema";
import type { ConsentPurpose } from "../types";

const NS = "ConsentManagement";

export function ConsentPurposesList({
  initial,
}: {
  initial: ConsentPurpose[];
}) {
  const t = useTranslations(NS);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<ConsentPurpose | null>(null);
  const [open, setOpen] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (purpose: ConsentPurpose) => {
    setEditing(purpose);
    setOpen(true);
  };

  const onSubmit = (values: ConsentPurposeFormType) =>
    startTransition(async () => {
      const res = await handleAction({
        action: () => saveConsentPurposeAction(values),
        successMessage: t("savedToast"),
      });
      if (res.success) {
        setOpen(false);
        router.refresh();
      }
    });

  const onArchive = (id: string) =>
    startTransition(async () => {
      await handleAction({
        action: () => archiveConsentPurposeAction(id),
        successMessage: t("archivedToast"),
      });
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("purposesTitle")}</h2>
          <p className="text-muted-foreground text-sm">
            {t("purposesSubtitle")}
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          {t("addPurpose")}
        </Button>
      </div>

      {initial.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
          {t("noPurposes")}
        </div>
      ) : (
        <ul className="divide-y rounded-lg border">
          {initial.map((purpose) => (
            <li
              key={purpose.id}
              className="flex items-start justify-between gap-4 p-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{purpose.name}</span>
                  {purpose.isMandatory && (
                    <Badge variant="secondary">{t("mandatoryBadge")}</Badge>
                  )}
                  {purpose.requiresEvidence && (
                    <Badge variant="outline">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      {t("evidenceBadge")}
                    </Badge>
                  )}
                </div>
                {purpose.description && (
                  <p className="text-muted-foreground text-sm">
                    {purpose.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 pt-1">
                  {purpose.appliesTo.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">
                      {t(`subject.${s}`)}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-xs">
                    {t(`legalBasis.${purpose.legalBasis}`)}
                  </Badge>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(purpose)}
                  aria-label={t("edit")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onArchive(purpose.id)}
                  disabled={pending}
                  aria-label={t("archive")}
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editPurpose") : t("addPurpose")}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <ConsentPurposeForm
              key={editing?.id ?? "new"}
              initial={editing}
              submitting={pending}
              onSubmit={onSubmit}
            />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
