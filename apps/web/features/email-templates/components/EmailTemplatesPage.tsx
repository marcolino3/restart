"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Mail, Pencil, Plus, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { EmailTemplateDialog } from "./EmailTemplateDialog";
import {
  deleteEmailTemplateAction,
} from "../actions/mutate-email-template.action";
import type { EmailTemplate } from "../actions/get-email-templates.action";

interface Props {
  initialTemplates: EmailTemplate[];
  canManage: boolean;
}

export function EmailTemplatesPage({ initialTemplates, canManage }: Props) {
  const t = useTranslations("EmailTemplates");
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);

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
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
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

      {initialTemplates.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <Mail className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm italic text-muted-foreground">
            {t("emptyState")}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {initialTemplates.map((template) => (
            <li
              key={template.id}
              className="flex items-start justify-between gap-3 rounded-lg border bg-card p-4 shadow-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{template.name}</div>
                <div className="mt-0.5 truncate text-sm text-muted-foreground">
                  {template.subject}
                </div>
                {template.description && (
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {template.description}
                  </div>
                )}
              </div>
              {canManage && (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(template)}
                    aria-label={t("edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <DeleteConfirmationDialog
                    itemName={template.name}
                    onConfirm={async () => {
                      const res = await deleteEmailTemplateAction(template.id);
                      return { success: res.success, error: res.success ? undefined : res.error };
                    }}
                    onSuccess={refresh}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

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
