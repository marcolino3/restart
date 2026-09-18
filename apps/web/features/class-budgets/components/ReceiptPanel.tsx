"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ExternalLink, Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  RECEIPT_ACCEPT,
  discardReceipt,
  receiptUrl,
  rejectReceipt,
  uploadReceipt,
} from "../lib/receipts";

interface Props {
  /** Receipts are stored per class — no upload before a class is chosen. */
  schoolClassId: string;
  value: string | null;
  onChange: (fileId: string | null) => void;
  disabled?: boolean;
}

type Preview = { url: string; isPdf: boolean };

/**
 * Upload by drag and drop or click, and the receipt itself next to the form so
 * the values can be read off it. The preview runs on a blob URL: the app sends
 * `X-Frame-Options: DENY`, so the receipt endpoint cannot be framed directly.
 */
export function ReceiptPanel({
  schoolClassId,
  value,
  onChange,
  disabled,
}: Props) {
  const t = useTranslations("ClassBudgets");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  // Files uploaded on this page are not attached to an expense yet and must be
  // discarded when replaced/removed; an already saved receipt is cleaned up by
  // the backend when the expense is saved without it.
  const [pendingFileId, setPendingFileId] = useState<string | null>(null);

  const hasPreview = preview !== null;
  // A receipt saved earlier has no local file — load it for the preview.
  useEffect(() => {
    if (!value || !schoolClassId || hasPreview) return;
    let cancelled = false;
    fetch(receiptUrl(schoolClassId, value), { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error(String(response.status));
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        setPreview({
          url: URL.createObjectURL(blob),
          isPdf: blob.type === "application/pdf",
        });
      })
      .catch(() => {
        if (!cancelled) setPreviewFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [value, schoolClassId, hasPreview]);

  const previewUrl = preview?.url;
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const discardPending = async () => {
    if (pendingFileId) {
      await discardReceipt(schoolClassId, pendingFileId).catch(() => undefined);
      setPendingFileId(null);
    }
  };

  const onSelect = async (file: File | undefined) => {
    if (!file) return;
    const rejection = rejectReceipt(file);
    if (rejection) {
      toast.error(
        t(rejection === "type" ? "receiptTypeError" : "receiptSizeError"),
      );
      return;
    }
    setUploading(true);
    try {
      await discardPending();
      const fileId = await uploadReceipt(schoolClassId, file);
      setPendingFileId(fileId);
      setPreviewFailed(false);
      setPreview({
        url: URL.createObjectURL(file),
        isPdf: file.type === "application/pdf",
      });
      onChange(fileId);
    } catch {
      toast.error(t("receiptUploadError"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const onRemove = async () => {
    await discardPending();
    setPreview(null);
    setPreviewFailed(false);
    onChange(null);
  };

  const blocked = disabled || uploading || !schoolClassId;

  const onDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    if (!blocked) void onSelect(event.dataTransfer.files?.[0]);
  };

  return (
    <Card className="flex h-full min-h-[420px] flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{t("receipt")}</CardTitle>
        {value && (
          <div className="flex items-center gap-1">
            <Button asChild type="button" size="sm" variant="ghost">
              <a
                href={receiptUrl(schoolClassId, value)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-1 h-4 w-4" />
                {t("receiptView")}
              </a>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onRemove}
              disabled={blocked}
              aria-label={t("receiptRemove")}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={RECEIPT_ACCEPT}
          className="hidden"
          data-testid="receipt-input"
          onChange={(e) => onSelect(e.target.files?.[0])}
        />
        {value ? (
          <div
            className="min-h-0 flex-1 overflow-auto rounded-md border bg-muted/30"
            data-testid="receipt-preview"
          >
            {preview?.isPdf && (
              <iframe
                src={preview.url}
                title={t("receipt")}
                className="h-full min-h-[60vh] w-full"
              />
            )}
            {preview && !preview.isPdf && (
              // eslint-disable-next-line @next/next/no-img-element -- blob URL of a private upload, not optimisable
              <img
                src={preview.url}
                alt={t("receipt")}
                className="mx-auto h-auto w-full object-contain"
              />
            )}
            {!preview && (
              <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-muted-foreground">
                {previewFailed ? (
                  t("receiptPreviewError")
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            disabled={blocked}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              if (!blocked) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            data-testid="receipt-dropzone"
            className={cn(
              "flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              dragging ? "border-primary bg-primary/5" : "border-border",
              blocked ? "cursor-not-allowed opacity-60" : "hover:bg-muted/40",
            )}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <Upload className="h-8 w-8 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{t("receiptDropTitle")}</span>
            <span className="text-xs text-muted-foreground">
              {schoolClassId ? t("receiptHint") : t("receiptNeedsClass")}
            </span>
          </button>
        )}
      </CardContent>
    </Card>
  );
}
