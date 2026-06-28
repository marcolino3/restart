"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ROUTES } from "@/constants/routes";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleAction } from "@/lib/actions/handle-action";

import { createFromTemplateAction } from "../actions/create-from-template.action";
import type { ProjectTemplate } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ProjectTemplate[];
  presetTemplateId?: string;
};

export function CreateFromTemplateDialog({
  open,
  onOpenChange,
  templates,
  presetTemplateId,
}: Props) {
  const t = useTranslations("Projects");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();

  const [templateId, setTemplateId] = React.useState(presetTemplateId ?? "");
  const [title, setTitle] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Seed the fields each time the dialog opens (render-time reset, no effect).
  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setTemplateId(presetTemplateId ?? "");
    setTitle("");
    setStartDate("");
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const onSubmit = async () => {
    if (!templateId) return;
    setSubmitting(true);
    const result = await handleAction({
      action: () =>
        createFromTemplateAction({
          templateId,
          title: title.trim() || undefined,
          startDate: startDate || null,
        }),
      successMessage: t("projectCreated"),
      errorMessage: t("projectCreateError"),
    });
    setSubmitting(false);
    if (result.success) {
      onOpenChange(false);
      router.push(ROUTES.admin.projectsBoard(locale, result.data.id));
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("createFromTemplate")}</DialogTitle>
          <DialogDescription>
            {t("createFromTemplateSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t("template")}</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectTemplate")} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    {tpl.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>{t("projectTitleOptional")}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("projectTitlePlaceholder")}
            />
          </div>

          <div className="space-y-1">
            <Label>{t("startDateOptional")}</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t("startDateHint")}
            </p>
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
          <Button onClick={onSubmit} disabled={!templateId || submitting}>
            {t("createProject")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
