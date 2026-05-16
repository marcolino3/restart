"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTranslations } from "next-intl";
import type { StudentNoteItem } from "../actions/get-student-notes.action";
import { MessageSquareText } from "lucide-react";

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-cyan-600",
  "bg-pink-600",
  "bg-indigo-600",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.charAt(0)?.toUpperCase() ?? "";
  const l = lastName?.charAt(0)?.toUpperCase() ?? "";
  return f + l || "?";
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Heute";
  if (diffDays === 1) return "Gestern";
  if (diffDays < 7) return `vor ${diffDays} Tagen`;

  return date.toLocaleDateString("de-CH", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

interface StudentNotesFeedProps {
  notes: StudentNoteItem[];
}

export default function StudentNotesFeed({ notes }: StudentNotesFeedProps) {
  const t = useTranslations("StudentNotes");
  const tC = useTranslations("Common");

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <MessageSquareText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{t("noNotes")}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-8">
      {notes.map((note) => {
        const user = note.authorMembership?.user;
        const firstName = user?.firstName ?? "";
        const lastName = user?.lastName ?? "";
        const authorName =
          firstName || lastName
            ? `${firstName} ${lastName}`.trim()
            : "System";
        const initials = getInitials(firstName || "S", lastName || "A");
        const avatarColor = getAvatarColor(authorName);

        return (
          <li key={note.id}>
            <div className="flex space-x-3">
              <div className="shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarFallback
                    className={`${avatarColor} text-white text-xs font-semibold`}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <div className="text-sm">
                  <span className="font-medium text-foreground">
                    {authorName}
                  </span>
                </div>
                <div className="mt-0.5 text-sm font-medium text-foreground">
                  {note.title}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  <p className="whitespace-pre-wrap">{note.content}</p>
                </div>
                <div className="mt-2 flex items-center space-x-2 text-sm">
                  <span className="text-muted-foreground">
                    {formatRelativeDate(note.date)}
                  </span>
                  <span className="text-muted-foreground">&middot;</span>
                  <span className="text-muted-foreground">
                    {tC(note.category)}
                  </span>
                  {note.isConfidential && (
                    <>
                      <span className="text-muted-foreground">&middot;</span>
                      <span className="text-destructive text-xs font-medium">
                        {t("confidential")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
