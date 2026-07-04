"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { handleAction } from "@/lib/actions/handle-action";

import { RetentionPolicyForm } from "./RetentionPolicyForm";
import { upsertRetentionPolicyAction } from "../actions/upsert-retention-policy.action";
import { deleteRetentionPolicyAction } from "../actions/delete-retention-policy.action";
import {
  RETENTION_ENTITY_TYPES,
  type RetentionEntityType,
  type RetentionPolicyFormType,
} from "../schemas/retention-policy-form.schema";
import type { RetentionPolicy } from "../types";

const NS = "RetentionSettings";

export function RetentionPoliciesList({
  initial,
}: {
  initial: RetentionPolicy[];
}) {
  const t = useTranslations(NS);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingType, setEditingType] = useState<RetentionEntityType | null>(
    null,
  );

  const byType = useMemo(
    () => new Map(initial.map((p) => [p.entityType, p])),
    [initial],
  );

  const editingPolicy = editingType ? byType.get(editingType) : undefined;

  const onSubmit = (values: RetentionPolicyFormType) =>
    startTransition(async () => {
      if (!editingType) return;
      const res = await handleAction({
        action: () =>
          upsertRetentionPolicyAction({
            entityType: editingType,
            retentionMonths: values.retentionMonths as number,
            action: values.action,
            description: values.description || undefined,
            isEnabled: values.isEnabled,
          }),
        successMessage: t("savedToast"),
      });
      if (res.success) {
        setEditingType(null);
        router.refresh();
      }
    });

  const onDelete = (id: string) =>
    startTransition(async () => {
      await handleAction({
        action: () => deleteRetentionPolicyAction(id),
        successMessage: t("removedToast"),
      });
      router.refresh();
    });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
      </div>

      <p className="text-muted-foreground rounded-lg border border-dashed p-3 text-xs">
        {t("executionNote")}
      </p>

      <ul className="divide-y rounded-lg border">
        {RETENTION_ENTITY_TYPES.map((entityType) => {
          const policy = byType.get(entityType);
          return (
            <li
              key={entityType}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {t(`entity.${entityType}`)}
                  </span>
                  {policy ? (
                    <>
                      <Badge variant="outline" className="text-xs">
                        {t("months", { count: policy.retentionMonths })}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {t(`action.${policy.action}`)}
                      </Badge>
                      {!policy.isEnabled && (
                        <Badge variant="outline" className="text-xs">
                          {t("disabled")}
                        </Badge>
                      )}
                      {typeof policy.dueCount === "number" && (
                        <Badge
                          variant={
                            policy.dueCount > 0 ? "destructive" : "outline"
                          }
                          className="text-xs"
                        >
                          {t("dueCount", { count: policy.dueCount })}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground text-sm">
                      {t("notConfigured")}
                    </span>
                  )}
                </div>
                {policy?.description && (
                  <p className="text-muted-foreground text-sm">
                    {policy.description}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                {policy ? (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingType(entityType)}
                      aria-label={t("edit")}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pending}
                      onClick={() => onDelete(policy.id)}
                      aria-label={t("remove")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingType(entityType)}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    {t("configure")}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={!!editingType}
        onOpenChange={(open) => !open && setEditingType(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingType ? t(`entity.${editingType}`) : ""}
            </DialogTitle>
          </DialogHeader>
          <RetentionPolicyForm
            key={editingType ?? "none"}
            initial={editingPolicy}
            submitting={pending}
            onSubmit={onSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
