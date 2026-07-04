"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, Mail, Pencil, Plus, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { EmailTemplateDialog } from "./EmailTemplateDialog";
import { deleteEmailTemplateAction } from "../actions/mutate-email-template.action";
import type { EmailTemplate } from "../actions/get-email-templates.action";
import { ADMISSION_EMAIL_PLACEHOLDERS } from "../placeholders";

interface Props {
  initialTemplates: EmailTemplate[];
  canManage: boolean;
}

/** Plain-text excerpt from a template's HTML body for the card preview. */
function bodyExcerpt(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function EmailTemplatesPage({ initialTemplates, canManage }: Props) {
  const t = useTranslations("EmailTemplates");
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [preview, setPreview] = useState<EmailTemplate | null>(null);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (template: EmailTemplate) => {
    setEditing(template);
    setDialogOpen(true);
  };
  const refresh = () => router.refresh();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/admissions/email-settings")}
            className="gap-1.5"
          >
            <Settings2 className="h-4 w-4" />
            {t("smtpNavLabel")}
          </Button>
          {canManage && (
            <Button onClick={openCreate} className="gap-1.5">
              <Plus className="h-4 w-4" />
              {t("newTemplate")}
            </Button>
          )}
        </div>
      </div>

      {/* Available placeholders */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-muted/30 px-3 py-2 text-xs">
        <span className="font-medium text-muted-foreground">
          {t("variablesLabel")}:
        </span>
        {ADMISSION_EMAIL_PLACEHOLDERS.map((p) => (
          <code
            key={p.token}
            className="rounded bg-background px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground ring-1 ring-border"
          >
            {`{${p.token}}`}
          </code>
        ))}
      </div>

      {initialTemplates.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Mail className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm italic text-muted-foreground">
            {t("emptyState")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {initialTemplates.map((template) => {
            const excerpt =
              template.description || bodyExcerpt(template.bodyHtml);
            return (
              <section
                key={template.id}
                className="flex flex-col rounded-lg border bg-card p-5 shadow-sm"
              >
                <h3 className="text-[15px] font-semibold leading-tight">
                  {template.name}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-medium">{t("subject")}:</span>{" "}
                  <span>{template.subject}</span>
                </p>
                {excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {excerpt}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2 border-t pt-3">
                  <span className="flex-1 truncate text-xs text-muted-foreground">
                    {t("lastEdited")}:{" "}
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => setPreview(template)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {t("preview")}
                  </Button>
                  {canManage && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => openEdit(template)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {t("edit")}
                      </Button>
                      <DeleteConfirmationDialog
                        itemName={template.name}
                        onConfirm={async () => {
                          const res = await deleteEmailTemplateAction(
                            template.id,
                          );
                          return {
                            success: res.success,
                            error: res.success ? undefined : res.error,
                          };
                        }}
                        onSuccess={refresh}
                      />
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Read-only preview (sandboxed) */}
      <Dialog
        open={!!preview}
        onOpenChange={(open) => !open && setPreview(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{preview?.name}</DialogTitle>
          </DialogHeader>
          {preview && (
            <div className="space-y-3">
              <p className="text-sm">
                <span className="font-medium">{t("subject")}:</span>{" "}
                {preview.subject}
              </p>
              <iframe
                title={preview.name}
                sandbox=""
                srcDoc={preview.bodyHtml}
                className="h-[55vh] w-full rounded-md border bg-white"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {canManage && dialogOpen && (
        <EmailTemplateDialog
          key={editing?.id ?? "new"}
          open
          onOpenChange={setDialogOpen}
          initial={editing}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
