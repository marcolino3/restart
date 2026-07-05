"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { handleAction } from "@/lib/actions/handle-action";

import { saveAsTemplateAction } from "../actions/save-as-template.action";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  defaultTitle: string;
};

export function SaveAsTemplateDialog({
  open,
  onOpenChange,
  projectId,
  defaultTitle,
}: Props) {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [title, setTitle] = React.useState(defaultTitle);
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Seed the fields each time the dialog opens (render-time reset, no effect).
  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setTitle(defaultTitle);
    setDescription("");
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const onSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const result = await handleAction({
      action: () =>
        saveAsTemplateAction({
          projectId,
          title: title.trim(),
          description: description.trim() || null,
        }),
      successMessage: t("templateCreated"),
      errorMessage: t("templateCreateError"),
    });
    setSubmitting(false);
    if (result.success) {
      onOpenChange(false);
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("saveAsTemplate")}</DialogTitle>
          <DialogDescription>{t("saveAsTemplateSubtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t("title")}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>{t("description")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Static "what gets copied" summary (design). */}
          <div className="space-y-1">
            <Label>{t("templateIncludes")}</Label>
            <div className="divide-y rounded-md border">
              <IncludeRow label={t("templateIncludesTasks")} included />
              <IncludeRow label={t("templateIncludesColumns")} included />
              <IncludeRow
                label={t("templateIncludesDates")}
                included={false}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={!title.trim() || submitting}>
            {tc("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IncludeRow({
  label,
  included,
}: {
  label: string;
  included: boolean;
}) {
  const tc = useTranslations("Common");
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <Badge variant={included ? "green" : "slate"}>
        {included ? tc("yes") : tc("no")}
      </Badge>
    </div>
  );
}
