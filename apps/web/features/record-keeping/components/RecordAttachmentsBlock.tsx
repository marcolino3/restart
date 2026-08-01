"use client";

import { Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";

/**
 * Material & attachments for a lesson record. Attachments hang off a
 * `lessonRecordId` (see PR1's `/lesson-record-attachments` REST endpoints),
 * but records only exist AFTER the bulk-create submit — there is no id yet
 * while the form is being filled in. Rather than introduce a temp-upload /
 * draft-record flow (an architecture change out of scope here), the section
 * stays disabled with an explanatory hint; attachments get added afterwards
 * from the student's record detail once the record exists.
 */
export const RecordAttachmentsBlock = () => {
  const t = useTranslations("RecordKeeping");

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <Paperclip className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <Label className="text-sm font-medium text-muted-foreground">
          {t("attachmentsTitle")}
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">{t("attachmentsHint")}</p>
    </div>
  );
};
