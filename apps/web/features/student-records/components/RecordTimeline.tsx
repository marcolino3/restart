"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { MoreHorizontal, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import {
  deleteStudentRecordEntryAction,
  type StudentRecordEntry,
} from "../actions/record-entries-actions";
import type { StudentRecordCategory } from "../actions/record-categories-actions";
import { RecordComposer } from "./RecordComposer";
import { StudentRecordDocumentsBlock } from "./StudentRecordDocumentsBlock";

type Translator = ReturnType<typeof useTranslations<"StudentRecords">>;

/** "HEUTE, 14:20" / "GESTERN, 09:00" / "MO, 29. JUNI". */
function formatTimestamp(iso: string, locale: string, t: Translator): string {
  const date = new Date(iso);
  const now = new Date();
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);
  const time = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (dayDiff === 0) return `${t("timestampToday")}, ${time}`;
  if (dayDiff === -1) return `${t("timestampYesterday")}, ${time}`;
  return date.toLocaleDateString(locale, {
    weekday: "short",
    day: "2-digit",
    month: "long",
  });
}

interface Props {
  studentId: string;
  entries: StudentRecordEntry[];
  categories: StudentRecordCategory[];
  canEdit: boolean;
  canDelete: boolean;
  onChanged: () => void;
}

export function RecordTimeline({
  studentId,
  entries,
  categories,
  canEdit,
  canDelete,
  onChanged,
}: Props) {
  const t = useTranslations("StudentRecords");
  const locale = useLocale();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleDelete = (entry: StudentRecordEntry) => {
    if (!window.confirm(t("entryDeleteConfirm"))) return;
    startTransition(async () => {
      const res = await deleteStudentRecordEntryAction(entry.id, studentId);
      if (!res.success) {
        toast.error(t("entryDeleteError"));
        return;
      }
      toast.success(t("entryDeleteOk"));
      onChanged();
    });
  };

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("entriesEmpty")}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => {
        const isEditing = editingId === entry.id;
        const isExpanded = expandedId === entry.id;
        const dotColor = entry.categoryColor ?? "var(--muted-foreground)";

        return (
          <li
            key={entry.id}
            className="rounded-card border bg-card p-3 shadow-xs"
          >
            {isEditing ? (
              <RecordComposer
                studentId={studentId}
                categories={categories}
                initial={entry}
                onSaved={() => {
                  setEditingId(null);
                  onChanged();
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: dotColor }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {entry.categoryName && (
                        <Badge variant="outline">{entry.categoryName}</Badge>
                      )}
                      {entry.isConfidential && (
                        <Badge variant="secondary">{t("confidential")}</Badge>
                      )}
                      <span className="font-mono text-[11px] uppercase tabular-nums text-muted-foreground">
                        {formatTimestamp(entry.occurredAt, locale, t)}
                      </span>
                    </div>
                    {entry.title && (
                      <p className="mt-1 text-[13px] font-medium">
                        {entry.title}
                      </p>
                    )}
                    {entry.content && (
                      <p className="mt-0.5 whitespace-pre-wrap text-[13px] text-muted-foreground">
                        {entry.content}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      {entry.authorName && (
                        <span>{t("entryBy", { name: entry.authorName })}</span>
                      )}
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : entry.id)
                        }
                      >
                        <Paperclip className="h-3 w-3" />
                        {t("documents")}
                      </button>
                    </div>
                  </div>

                  {(canEdit || canDelete) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() => setEditingId(entry.id)}
                          >
                            {t("edit")}
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(entry)}
                          >
                            {t("delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-3 border-t pt-3">
                    <StudentRecordDocumentsBlock
                      entryId={entry.id}
                      canEdit={canEdit}
                    />
                  </div>
                )}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
