"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import type { EmployeeNoteItem } from "../actions/get-employee-notes.action";
import { Lock, User } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  GENERAL: "bg-blue-100 text-blue-800",
  WARNING: "bg-red-100 text-red-800",
  MEETING: "bg-green-100 text-green-800",
  CONTRACT: "bg-purple-100 text-purple-800",
  REQUEST: "bg-yellow-100 text-yellow-800",
  PERFORMANCE: "bg-orange-100 text-orange-800",
  OTHER: "bg-gray-100 text-gray-800",
};

interface EmployeeNotesListProps {
  notes: EmployeeNoteItem[];
}

export default function EmployeeNotesList({ notes }: EmployeeNotesListProps) {
  const t = useTranslations("EmployeeNotes");

  if (notes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">{t("noNotes")}</p>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => {
        const authorName = note.authorMembership?.user
          ? `${note.authorMembership.user.firstName} ${note.authorMembership.user.lastName}`
          : t("unknownAuthor");

        return (
          <Card key={note.id}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge
                      className={`${CATEGORY_COLORS[note.category] || CATEGORY_COLORS.OTHER} border-0 text-xs`}
                    >
                      {t(`category.${note.category}`)}
                    </Badge>
                    {note.isConfidential && (
                      <Badge variant="destructive" className="text-xs gap-1">
                        <Lock className="h-3 w-3" />
                        {t("confidential")}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.date).toLocaleDateString("de-CH")}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm">{note.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{authorName}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
