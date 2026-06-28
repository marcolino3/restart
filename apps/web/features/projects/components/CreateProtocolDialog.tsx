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

import { createProtocolAction } from "../actions/manage-protocols.action";
import type { ProjectListItem } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectListItem[];
};

const NO_PROJECT = "__none__";

export function CreateProtocolDialog({ open, onOpenChange, projects }: Props) {
  const t = useTranslations("Protocols");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [meetingDate, setMeetingDate] = React.useState("");
  const [projectId, setProjectId] = React.useState<string>(NO_PROJECT);
  const [submitting, setSubmitting] = React.useState(false);

  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setTitle("");
    setMeetingDate("");
    setProjectId(NO_PROJECT);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const onSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const result = await handleAction({
      action: () =>
        createProtocolAction({
          title: title.trim(),
          meetingDate: meetingDate || null,
          projectId: projectId === NO_PROJECT ? null : projectId,
        }),
      successMessage: t("protocolCreated"),
      errorMessage: t("protocolCreateError"),
    });
    setSubmitting(false);
    if (result.success) {
      onOpenChange(false);
      router.push(ROUTES.admin.protocolEditor(locale, result.data.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("newProtocol")}</DialogTitle>
          <DialogDescription>{t("newProtocolSubtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t("title")}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("titlePlaceholder")}
            />
          </div>
          <div className="space-y-1">
            <Label>{t("meetingDate")}</Label>
            <Input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>{t("project")}</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_PROJECT}>{t("noProject")}</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
