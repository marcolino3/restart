"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Pencil, Archive, ShieldCheck, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { handleAction } from "@/lib/actions/handle-action";

import { ProcessingActivityForm } from "./ProcessingActivityForm";
import { SubprocessorForm } from "./SubprocessorForm";
import { saveProcessingActivityAction } from "../actions/save-processing-activity.action";
import { archiveProcessingActivityAction } from "../actions/archive-processing-activity.action";
import { saveSubprocessorAction } from "../actions/save-subprocessor.action";
import { archiveSubprocessorAction } from "../actions/archive-subprocessor.action";
import type {
  ProcessingActivityFormType,
  SubprocessorFormType,
} from "../schemas/vvt-form.schema";
import type { ProcessingActivity, Subprocessor } from "../types";

const NS = "Vvt";

export function VvtSection({
  activities,
  subprocessors,
}: {
  activities: ProcessingActivity[];
  subprocessors: Subprocessor[];
}) {
  const t = useTranslations(NS);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [actOpen, setActOpen] = useState(false);
  const [actEditing, setActEditing] = useState<ProcessingActivity | null>(null);
  const [subOpen, setSubOpen] = useState(false);
  const [subEditing, setSubEditing] = useState<Subprocessor | null>(null);

  const saveActivity = (values: ProcessingActivityFormType) =>
    startTransition(async () => {
      const res = await handleAction({
        action: () => saveProcessingActivityAction(values, actEditing?.id),
        successMessage: t("savedToast"),
      });
      if (res.success) {
        setActOpen(false);
        router.refresh();
      }
    });

  const archiveActivity = (id: string) =>
    startTransition(async () => {
      await handleAction({
        action: () => archiveProcessingActivityAction(id),
        successMessage: t("removedToast"),
      });
      router.refresh();
    });

  const saveSubprocessor = (values: SubprocessorFormType) =>
    startTransition(async () => {
      const res = await handleAction({
        action: () => saveSubprocessorAction(values, subEditing?.id),
        successMessage: t("savedToast"),
      });
      if (res.success) {
        setSubOpen(false);
        router.refresh();
      }
    });

  const archiveSubprocessor = (id: string) =>
    startTransition(async () => {
      await handleAction({
        action: () => archiveSubprocessorAction(id),
        successMessage: t("removedToast"),
      });
      router.refresh();
    });

  return (
    <div className="space-y-8">
      {/* Processing activities */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t("activitiesTitle")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("activitiesSubtitle")}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setActEditing(null);
              setActOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            {t("addActivity")}
          </Button>
        </div>

        {activities.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
            {t("noActivities")}
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {activities.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-4 p-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{a.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {t(`legalBasis.${a.legalBasis}`)}
                    </Badge>
                  </div>
                  {a.purpose && (
                    <p className="text-muted-foreground text-sm">{a.purpose}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("edit")}
                    onClick={() => {
                      setActEditing(a);
                      setActOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("remove")}
                    disabled={pending}
                    onClick={() => archiveActivity(a.id)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Subprocessors */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t("subprocessorsTitle")}</h2>
            <p className="text-muted-foreground text-sm">
              {t("subprocessorsSubtitle")}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setSubEditing(null);
              setSubOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            {t("addSubprocessor")}
          </Button>
        </div>

        {subprocessors.length === 0 ? (
          <div className="text-muted-foreground rounded-lg border border-dashed p-8 text-center text-sm">
            {t("noSubprocessors")}
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {subprocessors.map((s) => (
              <li
                key={s.id}
                className="flex items-start justify-between gap-4 p-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    {s.country && (
                      <Badge variant="outline" className="text-xs">
                        {s.country}
                      </Badge>
                    )}
                    {s.dpaSigned ? (
                      <Badge variant="secondary" className="text-xs">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        {t("dpaSigned")}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        <ShieldAlert className="mr-1 h-3 w-3" />
                        {t("dpaMissing")}
                      </Badge>
                    )}
                  </div>
                  {s.purpose && (
                    <p className="text-muted-foreground text-sm">{s.purpose}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("edit")}
                    onClick={() => {
                      setSubEditing(s);
                      setSubOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("remove")}
                    disabled={pending}
                    onClick={() => archiveSubprocessor(s.id)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={actOpen} onOpenChange={setActOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {actEditing ? t("editActivity") : t("addActivity")}
            </DialogTitle>
          </DialogHeader>
          <ProcessingActivityForm
            key={actEditing?.id ?? "new"}
            initial={actEditing}
            submitting={pending}
            onSubmit={saveActivity}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={subOpen} onOpenChange={setSubOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {subEditing ? t("editSubprocessor") : t("addSubprocessor")}
            </DialogTitle>
          </DialogHeader>
          <SubprocessorForm
            key={subEditing?.id ?? "new"}
            initial={subEditing}
            submitting={pending}
            onSubmit={saveSubprocessor}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
