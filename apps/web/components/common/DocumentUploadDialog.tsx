"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Uploads the picked file with title/tags; resolves to success. */
  onSubmit: (data: {
    file: File;
    title: string;
    tags: string[];
  }) => Promise<boolean>;
  accept?: string;
  allowedMimeTypes?: string[];
  maxBytes?: number;
  /** i18n namespace. Default `"Documents"`. */
  namespace?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload dialog: pick a file, give it an optional title + free-text tags
 * (chips), then upload. Reusable across any DocumentManager-backed feature.
 * The file is picked INSIDE the dialog, so the metadata is collected before
 * the upload starts.
 */
export function DocumentUploadDialog({
  open,
  onOpenChange,
  onSubmit,
  accept = "application/pdf,image/jpeg,image/png,image/webp",
  allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ],
  maxBytes = 15 * 1024 * 1024,
  namespace = "Documents",
}: Props) {
  const t = useTranslations(namespace);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setFile(null);
    setTitle("");
    setTags([]);
    setTagInput("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!picked) return;
    if (!allowedMimeTypes.includes(picked.type)) {
      toast.error(t("uploadTypeError"));
      return;
    }
    if (picked.size > maxBytes) {
      toast.error(t("uploadSizeError", { max: formatBytes(maxBytes) }));
      return;
    }
    setFile(picked);
  };

  const addTag = () => {
    const value = tagInput.trim();
    if (!value || tags.includes(value) || tags.length >= 20) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, value.slice(0, 50)]);
    setTagInput("");
  };

  const removeTag = (tag: string) =>
    setTags((prev) => prev.filter((x) => x !== tag));

  const onSave = async () => {
    if (!file) return;
    setBusy(true);
    const ok = await onSubmit({ file, title: title.trim(), tags });
    setBusy(false);
    if (ok) close();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("uploadDialogTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File picker (inside the dialog) */}
          <div className="space-y-[7px]">
            <Label className="text-[12.5px] font-semibold">
              {t("fileLabel")}
            </Label>
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={onFileSelected}
            />
            {file ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs">
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {file.name}
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  aria-label={t("delete")}
                  onClick={() => setFile(null)}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => inputRef.current?.click()}
              >
                <Paperclip className="mr-1.5 h-3.5 w-3.5" />
                {t("chooseFile")}
              </Button>
            )}
          </div>

          <div className="space-y-[7px]">
            <Label htmlFor="doc-title" className="text-[12.5px] font-semibold">
              {t("titleLabel")}
            </Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={file?.name ?? ""}
              maxLength={200}
            />
          </div>

          <div className="space-y-[7px]">
            <Label htmlFor="doc-tags" className="text-[12.5px] font-semibold">
              {t("tagsLabel")}
            </Label>
            <Input
              id="doc-tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
              placeholder={t("tagsPlaceholder")}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      aria-label={t("delete")}
                      onClick={() => removeTag(tag)}
                      className="inline-flex size-4 items-center justify-center rounded-full transition-colors hover:bg-foreground/10"
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={close}
            disabled={busy}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void onSave()}
            disabled={busy || !file}
          >
            {busy && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {t("uploadButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
