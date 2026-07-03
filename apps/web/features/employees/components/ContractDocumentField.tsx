"use client";

import { useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { API_URL } from "@/constants/api-url";

interface Props {
  /** RHF field name, e.g. "documentUrl". */
  name: string;
  /** Employee the document belongs to (upload authorization scope). */
  employeeId: string;
  label?: string;
  /** i18n namespace for `label`. Default "Employees". */
  namespace?: string;
}

/**
 * Contract PDF upload. Posts to the authenticated /api/contract-documents
 * store (files live outside public/) and keeps the returned same-origin URL in
 * the form. Shows a link + remove control once a document is attached.
 */
export function ContractDocumentField({
  name,
  employeeId,
  label,
  namespace = "Employees",
}: Props) {
  const t = useTranslations(namespace);
  const { control } = useFormContext();
  const { field } = useController({ name, control });
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error(t("contract.docPdfOnly"));
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `${API_URL}/contract-documents?employeeId=${employeeId}`,
        { method: "POST", body: fd, credentials: "include" },
      );
      const result = await res.json();
      if (res.ok && result?.url) {
        field.onChange(result.url as string);
      } else {
        toast.error(result?.message ?? t("contract.docUploadError"));
      }
    } catch {
      toast.error(t("contract.docUploadError"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    const url = field.value as string | undefined;
    const fileId = url?.split("/").pop();
    if (fileId) {
      try {
        await fetch(`${API_URL}/contract-documents/${fileId}`, {
          method: "DELETE",
          credentials: "include",
        });
      } catch {
        // Ignore — the form value is cleared regardless.
      }
    }
    field.onChange("");
  };

  return (
    <FormField
      name={name}
      control={control}
      render={() => (
        <FormItem>
          {label && <FormLabel>{t(label)}</FormLabel>}
          <FormControl>
            {field.value ? (
              <div className="flex items-center gap-3 rounded-ctl border bg-field px-3 py-2">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <a
                  href={field.value as string}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 truncate text-sm font-medium text-primary hover:underline"
                >
                  {t("contract.docView")}
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-destructive"
                  onClick={handleRemove}
                  aria-label={t("contract.docRemove")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center gap-2 rounded-ctl border border-dashed bg-field px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                <span>
                  {uploading
                    ? t("contract.docUploading")
                    : t("contract.docUpload")}
                </span>
              </button>
            )}
          </FormControl>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={handleFile}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
