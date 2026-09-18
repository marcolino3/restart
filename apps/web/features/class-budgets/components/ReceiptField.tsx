"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

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

export function ReceiptField({
  schoolClassId,
  value,
  onChange,
  disabled,
}: Props) {
  const t = useTranslations("ClassBudgets");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Files uploaded in this dialog session are not attached to an expense yet
  // and must be discarded when replaced/removed; an already saved receipt is
  // cleaned up by the backend when the expense is saved without it.
  const [pendingFileId, setPendingFileId] = useState<string | null>(null);

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
    onChange(null);
  };

  const blocked = disabled || uploading || !schoolClassId;

  return (
    <div className="space-y-[7px]">
      <Label className="text-[12.5px] font-semibold">{t("receipt")}</Label>
      <input
        ref={inputRef}
        type="file"
        accept={RECEIPT_ACCEPT}
        className="hidden"
        data-testid="receipt-input"
        onChange={(e) => onSelect(e.target.files?.[0])}
      />
      {value ? (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <a
            href={receiptUrl(schoolClassId, value)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate text-sm underline-offset-2 hover:underline"
          >
            {t("receiptView")}
          </a>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onRemove}
            disabled={blocked}
            aria-label={t("receiptRemove")}
            className="h-7 w-7 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={blocked}
        >
          {uploading ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-1 h-4 w-4" />
          )}
          {t("receiptUpload")}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        {schoolClassId ? t("receiptHint") : t("receiptNeedsClass")}
      </p>
    </div>
  );
}
