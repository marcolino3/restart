"use client";

import { useTranslations } from "next-intl";
import type { EmployeeNoteItem } from "../actions/get-employee-notes.action";
import {
  MessageSquareText,
  AlertTriangle,
  Users,
  FileText,
  Hand,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  GENERAL: MessageSquareText,
  WARNING: AlertTriangle,
  MEETING: Users,
  CONTRACT: FileText,
  REQUEST: Hand,
  PERFORMANCE: TrendingUp,
  OTHER: MoreHorizontal,
};

const CATEGORY_BG: Record<string, string> = {
  GENERAL: "bg-blue-500",
  WARNING: "bg-red-500",
  MEETING: "bg-green-500",
  CONTRACT: "bg-purple-500",
  REQUEST: "bg-amber-500",
  PERFORMANCE: "bg-orange-500",
  OTHER: "bg-gray-400",
};

interface EmployeeNotesTimelineProps {
  notes: EmployeeNoteItem[];
}

export default function EmployeeNotesTimeline({
  notes,
}: EmployeeNotesTimelineProps) {
  const t = useTranslations("EmployeeNotes");
  const tC = useTranslations("Common");

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("de-CH", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="bg-card px-4 py-5 shadow-sm sm:rounded-lg sm:px-6 border">
      <h2 className="text-lg font-medium text-foreground">{tC("timeline")}</h2>

      <div className="mt-6 flow-root">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noNotes")}</p>
        ) : (
          <ul className="-mb-8">
            {notes.map((note, idx) => {
              const isLast = idx === notes.length - 1;
              const CategoryIcon =
                CATEGORY_ICONS[note.category] || CATEGORY_ICONS.OTHER;
              const bgColor =
                CATEGORY_BG[note.category] || CATEGORY_BG.OTHER;

              const authorName = note.authorMembership?.user
                ? `${note.authorMembership.user.firstName} ${note.authorMembership.user.lastName}`.trim()
                : "System";

              return (
                <li key={note.id}>
                  <div className="relative pb-8">
                    {!isLast && (
                      <span
                        aria-hidden="true"
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${bgColor} ring-8 ring-card`}
                        >
                          <CategoryIcon className="h-4 w-4 text-white" />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {note.title}{" "}
                            <span className="font-medium text-foreground">
                              {authorName}
                            </span>
                          </p>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-muted-foreground">
                          <time>{formatDate(note.date)}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
