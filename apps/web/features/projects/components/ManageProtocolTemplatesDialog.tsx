"use client";

import { IconPlus, IconX } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";

import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
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
import { handleAction } from "@/lib/actions/handle-action";

import {
  createProtocolTemplateAction,
  deleteProtocolTemplateAction,
  saveProtocolAsTemplateAction,
  updateProtocolTemplateAction,
} from "../actions/manage-protocol-templates.action";
import type { ProtocolTemplate } from "../types";

type Row = {
  id: string;
  title: string;
  agendaCount: number;
  usedCount: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ProtocolTemplate[];
};

/**
 * "Protokollvorlagen verwalten" — inline-editable list of protocol templates.
 * Titles are saved on "Speichern"; deletion is immediate (after confirmation).
 */
export function ManageProtocolTemplatesDialog({
  open,
  onOpenChange,
  templates,
}: Props) {
  const t = useTranslations("Protocols");
  const tc = useTranslations("Common");
  const router = useRouter();

  const toRows = React.useCallback(
    (list: ProtocolTemplate[]): Row[] =>
      list.map((tpl) => ({
        id: tpl.id,
        title: tpl.title,
        agendaCount: (tpl.agendaItems ?? []).length,
        usedCount: tpl.usedCount,
      })),
    []
  );

  const [rows, setRows] = React.useState<Row[]>(() => toRows(templates));
  const [savedTitles, setSavedTitles] = React.useState<Map<string, string>>(
    () => new Map(templates.map((tpl) => [tpl.id, tpl.title]))
  );
  const [busy, setBusy] = React.useState(false);

  // Re-sync from server data every time the dialog opens.
  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setRows(toRows(templates));
    setSavedTitles(new Map(templates.map((tpl) => [tpl.id, tpl.title])));
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const onAdd = async () => {
    setBusy(true);
    const result = await handleAction({
      action: () => createProtocolTemplateAction({ title: t("newTemplate") }),
      successMessage: t("templateCreated"),
      errorMessage: t("templateCreateError"),
    });
    setBusy(false);
    if (result.success) {
      setRows((prev) => [
        ...prev,
        {
          id: result.data.id,
          title: result.data.title,
          agendaCount: (result.data.agendaItems ?? []).length,
          usedCount: result.data.usedCount,
        },
      ]);
      setSavedTitles((prev) =>
        new Map(prev).set(result.data.id, result.data.title)
      );
      router.refresh();
    }
  };

  const onDelete = async (id: string) => {
    const res = await deleteProtocolTemplateAction(id);
    if (res.success) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      setSavedTitles((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      router.refresh();
      return { success: true };
    }
    return { success: false, error: String(res.error) };
  };

  const onSave = async () => {
    const changed = rows.filter(
      (r) => r.title.trim() !== "" && r.title.trim() !== savedTitles.get(r.id)
    );
    if (changed.length === 0) {
      onOpenChange(false);
      return;
    }
    setBusy(true);
    const result = await handleAction({
      action: async () => {
        for (const row of changed) {
          const res = await updateProtocolTemplateAction({
            id: row.id,
            title: row.title.trim(),
          });
          if (!res.success) return res;
        }
        return { success: true as const, data: true };
      },
      successMessage: t("templatesSaved"),
      errorMessage: t("templatesSaveError"),
    });
    setBusy(false);
    if (result.success) {
      router.refresh();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("manageTemplates")}</DialogTitle>
          <DialogDescription>{t("templatesHint")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {rows.length === 0 && (
            <p className="text-sm italic text-muted-foreground">
              {t("noTemplates")}
            </p>
          )}
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center gap-2 rounded-md border px-2 py-1.5"
            >
              <Input
                className="h-8 flex-1 border-none shadow-none focus-visible:ring-1"
                value={row.title}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r) =>
                      r.id === row.id ? { ...r, title: e.target.value } : r
                    )
                  )
                }
              />
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                {t("templateMeta", {
                  agenda: row.agendaCount,
                  used: row.usedCount,
                })}
              </span>
              <DeleteConfirmationDialog
                itemName={row.title}
                onConfirm={() => onDelete(row.id)}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={tc("delete")}
                    title={tc("delete")}
                  >
                    <IconX className="h-3.5 w-3.5" />
                  </Button>
                }
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={onAdd}
            disabled={busy}
          >
            <IconPlus className="mr-1 h-4 w-4" />
            {t("newTemplate")}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">{t("templatesTip")}</p>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("close")}
          </Button>
          <Button type="button" onClick={onSave} disabled={busy}>
            {tc("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type SaveProtocolTemplateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  protocolId: string;
  defaultTitle: string;
};

/**
 * Small "Als Vorlage speichern" dialog — shared by the protocol editor and
 * the read-only protocol view (⋯ menu).
 */
export function SaveProtocolTemplateDialog({
  open,
  onOpenChange,
  protocolId,
  defaultTitle,
}: SaveProtocolTemplateDialogProps) {
  const t = useTranslations("Protocols");
  const tc = useTranslations("Common");
  const router = useRouter();

  const [title, setTitle] = React.useState(defaultTitle);
  const [submitting, setSubmitting] = React.useState(false);

  const [wasOpen, setWasOpen] = React.useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setTitle(defaultTitle);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const onSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    const result = await handleAction({
      action: () =>
        saveProtocolAsTemplateAction({ protocolId, title: title.trim() }),
      successMessage: t("templateSaved"),
      errorMessage: t("templateSaveError"),
    });
    setSubmitting(false);
    if (result.success) {
      router.refresh();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("saveAsTemplate")}</DialogTitle>
          <DialogDescription>{t("templatesHint")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Label>{t("templateName")}</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!title.trim() || submitting}
          >
            {tc("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
