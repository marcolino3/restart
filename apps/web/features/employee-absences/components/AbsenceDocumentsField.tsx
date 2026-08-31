"use client";

import { useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { ExternalLink, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InlineEditField } from "@/components/inline-edit/InlineEditField";
import { API_URL } from "@/constants/api-url";
import {
  absenceDocumentAccessUrl,
  type AbsenceDocument,
} from "@restart/shared-schemas/employee-absences/absence-document";

interface Props {
  name: string;
  employeeId: string;
  label?: string;
  description?: string;
  uploadLabel?: string;
  labelPlaceholder?: string;
  namespace?: string;
}

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

/**
 * Multi-file upload with inline-editable labels (certificates or supplementary docs).
 * Uses authenticated /api/absence-certificates storage.
 */
export function AbsenceDocumentsField({
  name,
  employeeId,
  label,
  description,
  uploadLabel = "absence.docUpload",
  labelPlaceholder = "absence.docLabelPlaceholder",
  namespace = "Employees",
}: Props) {
  const t = useTranslations(namespace);
  const { control } = useFormContext();
  const { field } = useController({ name, control });
  const [uploading, setUploading] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const documents = Array.isArray(field.value)
    ? (field.value as AbsenceDocument[]).filter((doc) => doc?.url)
    : [];

  const setDocuments = (next: AbsenceDocument[]) => {
    field.onChange(next);
  };

  const uploadFile = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(
      `${API_URL}/absence-certificates?employeeId=${employeeId}`,
      { method: "POST", body: fd, credentials: "include" },
    );
    const result = await res.json();
    if (res.ok && result?.url) {
      return result.url as string;
    }
    throw new Error(result?.message ?? t("absence.docUploadError"));
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t("absence.docTypesOnly"));
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setDocuments([...documents, { url, label: "" }]);
      setEditingIndex(documents.length);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("absence.docUploadError"),
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async (index: number) => {
    const doc = documents[index];
    const fileId = doc?.url.split("/").pop()?.split("?")[0];
    if (fileId) {
      try {
        await fetch(
          `${API_URL}/absence-certificates/${fileId}?employeeId=${encodeURIComponent(employeeId)}`,
          { method: "DELETE", credentials: "include" },
        );
      } catch {
        // Ignore — remove from form regardless.
      }
    }
    setDocuments(documents.filter((_, i) => i !== index));
    setEditingIndex((current) =>
      current === null
        ? null
        : current === index
          ? null
          : current > index
            ? current - 1
            : current,
    );
  };

  const updateLabel = async (index: number, labelValue: string) => {
    setDocuments(
      documents.map((doc, i) =>
        i === index ? { ...doc, label: labelValue } : doc,
      ),
    );
    setEditingIndex(null);
  };

  const displayLabel = (doc: AbsenceDocument, index: number) =>
    doc.label.trim() || t("absence.docUntitled", { index: index + 1 });

  return (
    <FormField
      name={name}
      control={control}
      render={() => (
        <FormItem>
          {label && <FormLabel>{t(label)}</FormLabel>}
          <FormControl>
            <div className="flex flex-col gap-2">
              {documents.map((doc, index) => (
                <DocumentRow
                  key={doc.url}
                  doc={doc}
                  href={absenceDocumentAccessUrl(doc.url, employeeId)}
                  displayLabel={displayLabel(doc, index)}
                  labelPlaceholder={t(labelPlaceholder)}
                  editHint={t("absence.docLabelEditable")}
                  startEditing={editingIndex === index}
                  onEditingDone={() => setEditingIndex(null)}
                  onSave={(value) => updateLabel(index, value)}
                  onRemove={() => void handleRemove(index)}
                  removeLabel={t("absence.docRemove")}
                  openLabel={t("absence.docView")}
                />
              ))}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="flex w-full items-center gap-2 rounded-ctl border border-dashed bg-field px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                <span>
                  {uploading ? t("absence.docUploading") : t(uploadLabel)}
                </span>
              </button>
            </div>
          </FormControl>
          {description && <FormDescription>{t(description)}</FormDescription>}
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/png,.png,image/webp,.webp"
            className="hidden"
            onChange={handleFile}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function DocumentRow({
  doc,
  href,
  displayLabel,
  labelPlaceholder,
  editHint,
  startEditing,
  onEditingDone,
  onSave,
  onRemove,
  removeLabel,
  openLabel,
}: {
  doc: AbsenceDocument;
  href: string;
  displayLabel: string;
  labelPlaceholder: string;
  editHint: string;
  startEditing: boolean;
  onEditingDone: () => void;
  onSave: (value: string) => Promise<void>;
  onRemove: () => void;
  removeLabel: string;
  openLabel: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-ctl border bg-field px-3 py-2">
      <FileText className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 text-sm font-medium">
        <InlineEditField
          value={doc.label}
          placeholder={displayLabel}
          inputPlaceholder={labelPlaceholder}
          editHint={editHint}
          initialEditing={startEditing}
          onSave={async (value) => {
            await onSave(value);
            onEditingDone();
          }}
          className="w-full text-foreground"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        asChild
      >
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={openLabel}
          title={openLabel}
        >
          <ExternalLink className="size-4" />
        </a>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-destructive"
        onClick={onRemove}
        aria-label={removeLabel}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
