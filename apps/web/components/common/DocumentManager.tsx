"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  FileText,
  FileImage,
  File as FileIcon,
  Download,
  Trash2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { DocumentUploadDialog } from "@/components/common/DocumentUploadDialog";
import { API_URL } from "@/constants/api-url";
import { cn } from "@/lib/utils";

/**
 * A managed document (metadata only — the file itself lives in object storage
 * and is streamed via the download endpoint). Shape is endpoint-agnostic so the
 * same manager works for admissions, employees, students, … .
 */
export interface ManagedDocument {
  id: string;
  originalName: string;
  /** Optional display title; falls back to `originalName` when empty. */
  title?: string | null;
  /** Free-text tags/keywords. */
  tags?: string[];
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadedByName?: string | null;
}

interface Props {
  /** Documents to render (this component is presentational — it does not fetch). */
  documents: ManagedDocument[];
  /**
   * REST endpoint segment under `/api`, e.g. "admission-documents". Upload posts
   * to `${API_URL}/${endpoint}?${uploadQuery}`, download/delete hit
   * `${API_URL}/${endpoint}/:id`.
   */
  endpoint: string;
  /** Query string appended to the upload URL, e.g. `applicationId=<uuid>`. */
  uploadQuery: string;
  /** Accept attribute + client-side MIME allowlist. */
  accept?: string;
  allowedMimeTypes?: string[];
  /** Max upload size in bytes (default 15 MB). */
  maxBytes?: number;
  canEdit: boolean;
  /** Called after a successful upload or delete so the parent can reload. */
  onChanged: () => void;
  /** i18n namespace for the manager's own strings. Default `"Documents"`. */
  namespace?: string;
}

const DEFAULT_MAX_BYTES = 15 * 1024 * 1024;
const DEFAULT_ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";
const DEFAULT_ALLOWED = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) {
    return <FileImage className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />;
  }
  return <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />;
}

/** Document-kind badge derived from the MIME type (PDF / Bild / Datei). */
function KindBadge({ mimeType }: { mimeType: string }) {
  if (mimeType === "application/pdf") {
    return (
      <Badge variant="rose" className="shrink-0 text-[9px]">
        PDF
      </Badge>
    );
  }
  if (mimeType.startsWith("image/")) {
    return (
      <Badge variant="sky" className="shrink-0 text-[9px]">
        {mimeType.replace("image/", "").toUpperCase()}
      </Badge>
    );
  }
  return (
    <Badge variant="slate" className="shrink-0 text-[9px]">
      {mimeType.split("/").pop()?.toUpperCase() ?? "?"}
    </Badge>
  );
}

/**
 * Reusable document manager: lists uploaded files, uploads new ones (multipart
 * to a REST endpoint with credentials) and deletes them via a confirm dialog.
 * Presentational for data (documents come in as a prop); side-effecting for
 * upload/delete (talks to the backend, then calls `onChanged`).
 */
export function DocumentManager({
  documents,
  endpoint,
  uploadQuery,
  accept = DEFAULT_ACCEPT,
  allowedMimeTypes = DEFAULT_ALLOWED,
  maxBytes = DEFAULT_MAX_BYTES,
  canEdit,
  onChanged,
  namespace = "Documents",
}: Props) {
  const t = useTranslations(namespace);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState<ManagedDocument | null>(null);
  const [, startTransition] = useTransition();

  // The dialog collects the file + title + tags, then calls this to upload.
  const doUpload = async (data: {
    file: File;
    title: string;
    tags: string[];
  }): Promise<boolean> => {
    try {
      const fd = new FormData();
      fd.append("file", data.file);
      const params = new URLSearchParams(uploadQuery);
      if (data.title) params.set("title", data.title);
      if (data.tags.length > 0) params.set("tags", data.tags.join(","));
      const res = await fetch(`${API_URL}/${endpoint}?${params.toString()}`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        toast.error(body?.message ?? t("uploadError"));
        return false;
      }
      toast.success(t("uploadOk"));
      onChanged();
      return true;
    } catch {
      toast.error(t("uploadError"));
      return false;
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return { success: false as const };
    try {
      const res = await fetch(`${API_URL}/${endpoint}/${deleting.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      return { success: res.ok };
    } catch (error) {
      return { success: false, error };
    }
  };

  return (
    <div className="space-y-2">
      {documents.length === 0 && (
        <p className="py-1 text-xs italic text-muted-foreground">
          {t("empty")}
        </p>
      )}

      {documents.length > 0 && (
        <ul className="space-y-0.5">
          {documents.map((doc) => (
            <li key={doc.id}>
              <div className="group flex items-start gap-2 rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-muted/50">
                <div className="mt-0.5 shrink-0">
                  <DocIcon mimeType={doc.mimeType} />
                </div>
                <a
                  href={`${API_URL}/${endpoint}/${doc.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 space-y-0.5"
                >
                  {/* Line 1: title (or filename) · kind badge · tags */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-xs font-medium text-foreground">
                      {doc.title?.trim() || doc.originalName}
                    </span>
                    <KindBadge mimeType={doc.mimeType} />
                    {doc.tags?.map((tag) => (
                      <Badge
                        key={tag}
                        variant="accent"
                        className="text-[9px] font-normal"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {formatBytes(doc.sizeBytes)}
                    {" · "}
                    {new Date(doc.createdAt).toLocaleDateString("de-CH", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                    {doc.uploadedByName ? ` · ${doc.uploadedByName}` : ""}
                  </div>
                </a>
                <a
                  href={`${API_URL}/${endpoint}/${doc.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 shrink-0 rounded p-1 text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
                  aria-label={t("download")}
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                {canEdit && (
                  <button
                    type="button"
                    className={cn(
                      "mt-0.5 shrink-0 rounded p-1 text-muted-foreground/60 opacity-0 transition",
                      "hover:bg-destructive/10 hover:text-destructive",
                      "focus-visible:opacity-100 group-hover:opacity-100",
                    )}
                    onClick={() => setDeleting(doc)}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {t("uploadButton")}
          </Button>

          <DocumentUploadDialog
            open={uploadOpen}
            onOpenChange={setUploadOpen}
            onSubmit={doUpload}
            accept={accept}
            allowedMimeTypes={allowedMimeTypes}
            maxBytes={maxBytes}
            namespace={namespace}
          />
        </>
      )}

      <DeleteConfirmationDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteTitle")}
        description={
          deleting
            ? t("deleteDescription", { name: deleting.originalName })
            : undefined
        }
        onConfirm={confirmDelete}
        onSuccess={() => {
          startTransition(onChanged);
        }}
      />
    </div>
  );
}
