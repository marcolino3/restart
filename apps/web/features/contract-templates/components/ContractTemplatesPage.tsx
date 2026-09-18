"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Eye, FileText, Pencil, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { ROUTES } from "@/constants/routes";
import { deleteContractTemplateAction } from "../actions/mutate-contract-template.action";
import type { ContractTemplate } from "../actions/get-contract-templates.action";
import { buildA4PreviewDoc } from "../a4-preview";

interface Props {
  initialTemplates: ContractTemplate[];
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

export function ContractTemplatesPage({ initialTemplates, canManage }: Props) {
  const t = useTranslations("ContractTemplates");
  const locale = useLocale();
  const router = useRouter();
  const [preview, setPreview] = useState<ContractTemplate | null>(null);

  const openCreate = () =>
    router.push(ROUTES.admin.employeesContractTemplateCreate(locale));
  const openEdit = (template: ContractTemplate) =>
    router.push(
      ROUTES.admin.employeesContractTemplateEdit(locale, template.id),
    );
  const refresh = () => router.refresh();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{t("pageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("pageSubtitle")}</p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {t("newTemplate")}
          </Button>
        )}
      </div>

      {initialTemplates.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
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
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-semibold leading-tight">
                    {template.name}
                  </h3>
                  {template.showLogo && (
                    <Badge variant="slate" className="shrink-0">
                      {t("withLogo")}
                    </Badge>
                  )}
                </div>
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
                          const res = await deleteContractTemplateAction(
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
            <iframe
              title={preview.name}
              sandbox="allow-scripts"
              srcDoc={buildA4PreviewDoc({
                headerHtml: preview.headerHtml ?? "",
                bodyHtml: preview.bodyHtml,
                footerHtml: preview.footerHtml ?? "",
              })}
              className="h-[65vh] w-full rounded-md border bg-muted"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
