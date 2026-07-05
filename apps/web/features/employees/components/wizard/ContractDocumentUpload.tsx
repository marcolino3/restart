"use client";

import { useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FileText, Loader2, Upload, X } from "lucide-react";

import { API_URL } from "@/constants/api-url";

interface Props {
  /** Draft employee id — the PDF is stored privately per employee. */
  draftId?: string;
}

/**
 * Contract PDF upload for the onboarding wizard. Posts to the authenticated,
 * org-scoped /api/contract-documents/:employeeId endpoint (private storage,
 * never public — DSGVO). The returned URL is the authenticated GET path and
 * is persisted on the contract as `documentUrl`.
 */
export function ContractDocumentUpload({ draftId }: Props) {
  const t = useTranslations("EmployeeOnboarding");
  const { control } = useFormContext();
  const { field } = useController({ name: "documentUrl", control });
  const [uploading, setUploading] = useState(false);
  const value = (field.value as string | undefined) || "";

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !draftId) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(
        `${API_URL}/contract-documents?employeeId=${draftId}`,
        { method: "POST", body: formData, credentials: "include" },
      );
      const result = await res.json();
      if (res.ok && result?.url) {
        field.onChange(result.url as string);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const onRemove = async () => {
    // `value` is the authenticated document URL (/api/contract-documents/<fileId>).
    if (value) {
      await fetch(value, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => undefined);
    }
    field.onChange("");
  };

  if (!draftId) {
    return (
      <p className="text-xs text-muted-foreground">{t("contractAfterSave")}</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="flex items-center gap-2 rounded-ctl border border-border px-3 py-2 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="truncate text-primary hover:underline"
          >
            {t("contractUploaded")}
          </a>
          <button
            type="button"
            aria-label={t("removeWindow")}
            onClick={onRemove}
            className="ml-auto text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-ctl border border-input bg-field px-3 py-2 text-sm hover:bg-accent">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {t("uploadContract")}
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={onFile}
            disabled={uploading}
          />
        </label>
      )}
      <p className="text-xs text-muted-foreground">{t("contractHint")}</p>
    </div>
  );
}
