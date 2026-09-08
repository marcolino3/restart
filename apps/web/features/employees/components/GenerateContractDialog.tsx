"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, FileCheck, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Tiptap from "@/components/editor/tiptap";
import { API_URL } from "@/constants/api-url";

import { getContractTemplatesAction } from "@/features/contract-templates/actions/get-contract-templates.action";
import type { ContractTemplate } from "@/features/contract-templates/actions/get-contract-templates.action";
import {
  previewContractDocumentAction,
  type ContractDocumentPreview,
} from "@/features/contract-templates/actions/preview-contract-document.action";
import { getContractAiConfiguredAction } from "@/features/contract-templates/actions/contract-ai.action";
import { ContractAiChat } from "@/features/contract-templates/components/ContractAiChat";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  /** true when the contract already has a stored document (will be replaced). */
  hasDocument: boolean;
  /** refresh callback after a PDF was stored on the contract. */
  onGenerated: () => void;
}

/**
 * Two-step contract generation: pick a template, review/adjust the rendered
 * HTML, then either store it as the contract's PDF or download it as DOCX.
 */
export function GenerateContractDialog({
  open,
  onOpenChange,
  contractId,
  hasDocument,
  onGenerated,
}: Props) {
  const t = useTranslations("ContractTemplates");
  const [templates, setTemplates] = useState<ContractTemplate[] | null>(null);
  const [templateId, setTemplateId] = useState<string>("");
  const [preview, setPreview] = useState<ContractDocumentPreview | null>(null);
  const [html, setHtml] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generating, setGenerating] = useState<"pdf" | "docx" | null>(null);
  const [aiConfigured, setAiConfigured] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void getContractTemplatesAction().then((res) => {
      if (cancelled) return;
      if (res.success) setTemplates(res.data);
      else toast.error(res.error ?? t("loadError"));
    });
    void getContractAiConfiguredAction().then((configured) => {
      if (!cancelled) setAiConfigured(configured);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectTemplate = async (id: string) => {
    setTemplateId(id);
    setLoadingPreview(true);
    const res = await previewContractDocumentAction(contractId, id);
    setLoadingPreview(false);
    if (!res.success) {
      toast.error(res.error ?? t("previewError"));
      return;
    }
    setPreview(res.data);
    setHtml(res.data.bodyHtml);
  };

  const applyAiDraft = (draftHtml: string) => {
    // Without a chosen template the draft runs header-/footerless with logo.
    setPreview(
      (prev) =>
        prev ?? {
          bodyHtml: "",
          headerHtml: null,
          footerHtml: null,
          showLogo: true,
        },
    );
    setHtml(draftHtml);
  };

  const generate = async (format: "pdf" | "docx") => {
    if (!preview) return;
    setGenerating(format);
    try {
      const res = await fetch(`${API_URL}/contract-documents/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          html,
          headerHtml: preview.headerHtml ?? undefined,
          footerHtml: preview.footerHtml ?? undefined,
          showLogo: preview.showLogo,
          format,
        }),
      });
      if (!res.ok) {
        toast.error(
          res.status === 503 ? t("storageUnavailable") : t("generateError"),
        );
        return;
      }
      if (format === "docx") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "vertrag.docx";
        a.click();
        URL.revokeObjectURL(url);
        toast.success(t("docxDownloaded"));
      } else {
        toast.success(t("pdfStored"));
        onOpenChange(false);
        onGenerated();
      }
    } catch {
      toast.error(t("generateNetworkError"));
    } finally {
      setGenerating(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{t("generateTitle")}</DialogTitle>
          <DialogDescription>{t("generateDescription")}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("templateLabel")}</Label>
            <Select value={templateId} onValueChange={selectTemplate}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    templates === null
                      ? t("templatesLoading")
                      : t("templatePlaceholder")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(templates ?? []).map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {templates !== null && templates.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {t("noTemplatesHint")}
              </p>
            )}
          </div>

          {aiConfigured && (
            <ContractAiChat
              contractId={contractId}
              getCurrentHtml={() => html}
              onDraft={applyAiDraft}
              disabled={generating !== null}
            />
          )}

          {loadingPreview && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("previewLoading")}
            </div>
          )}

          {preview && !loadingPreview && (
            <div className="space-y-1.5">
              <Label>{t("reviewLabel")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("reviewHint")}
              </p>
              <Tiptap description={html} onChange={setHtml} />
            </div>
          )}

          {preview && hasDocument && (
            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              {t("replaceWarning")}
            </p>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generating !== null}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => generate("docx")}
            disabled={!preview || generating !== null}
            className="gap-1.5"
          >
            {generating === "docx" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t("downloadDocx")}
          </Button>
          <Button
            type="button"
            onClick={() => generate("pdf")}
            disabled={!preview || generating !== null}
            className="gap-1.5"
          >
            {generating === "pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4" />
            )}
            {t("storePdf")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
