"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";

import { ROUTES } from "@/constants/routes";
import { DatePicker, toIsoDate } from "@/components/form/DatePicker";
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
import { cn } from "@/lib/utils";

import { createProtocolAction } from "../actions/manage-protocols.action";
import type { ProjectListItem, ProtocolTemplate } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectListItem[];
  templates: ProtocolTemplate[];
};

const NO_PROJECT = "__none__";
/** Sentinel for the "blank protocol" template card. */
const BLANK = "__blank__";

export function CreateProtocolDialog({
  open,
  onOpenChange,
  projects,
  templates,
}: Props) {
  const t = useTranslations("Protocols");
  const tc = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();

  const [templateId, setTemplateId] = React.useState<string>(BLANK);
  const [title, setTitle] = React.useState("");
  const [meetingDate, setMeetingDate] = React.useState<Date | null>(null);
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [projectId, setProjectId] = React.useState<string>(NO_PROJECT);
  const [submitting, setSubmitting] = React.useState(false);

  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setTemplateId(BLANK);
    setTitle("");
    setMeetingDate(null);
    setStartTime("");
    setEndTime("");
    setProjectId(NO_PROJECT);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const selectTemplate = (id: string) => {
    setTemplateId(id);
    // Prefill an untouched title with the template name.
    const tpl = templates.find((x) => x.id === id);
    const titles = new Set(templates.map((x) => x.title));
    if (tpl && (title.trim() === "" || titles.has(title))) {
      setTitle(tpl.title);
    }
  };

  const onSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const result = await handleAction({
      action: () =>
        createProtocolAction({
          title: title.trim(),
          meetingDate: toIsoDate(meetingDate),
          startTime: startTime || null,
          endTime: endTime || null,
          templateId: templateId === BLANK ? null : templateId,
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

  const cardClass = (selected: boolean) =>
    cn(
      "cursor-pointer rounded-md border p-3 text-left transition",
      selected
        ? "border-primary bg-primary/5 ring-1 ring-primary"
        : "border-border hover:border-primary/40"
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("newProtocol")}</DialogTitle>
          <DialogDescription>{t("templateHint")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t("templateLabel")}</Label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className={cardClass(templateId === tpl.id)}
                  onClick={() => selectTemplate(tpl.id)}
                  aria-pressed={templateId === tpl.id}
                >
                  <span className="block text-sm font-semibold">
                    {tpl.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t("templateMeta", {
                      agenda: (tpl.agendaItems ?? []).length,
                      used: tpl.usedCount,
                    })}
                  </span>
                </button>
              ))}
              <button
                type="button"
                className={cardClass(templateId === BLANK)}
                onClick={() => setTemplateId(BLANK)}
                aria-pressed={templateId === BLANK}
              >
                <span className="block text-sm font-semibold">
                  {t("emptyProtocol")}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t("emptyProtocolHint")}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>{t("title")}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("titlePlaceholder")}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("meetingAt")}</Label>
              <DatePicker
                value={meetingDate}
                onChange={setMeetingDate}
                placeholder={t("meetingAt")}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>{t("timeFrom")}</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("timeTo")}</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
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
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={!title.trim() || submitting}>
            {t("createProtocol")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
