"use client";

import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { AdmissionReminder } from "../actions/get-admission-reminders.action";
import { ReminderForm, type ReminderMember } from "./ReminderForm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  members: ReminderMember[];
  initial?: AdmissionReminder | null;
  onSaved: () => void;
  /** Optional child name shown in the dialog title (design: "Neue Erinnerung — <Kind>"). */
  childName?: string;
}

export function ReminderDialog({
  open,
  onOpenChange,
  applicationId,
  members,
  initial,
  onSaved,
  childName,
}: Props) {
  const t = useTranslations("Admissions");
  const title = initial ? t("reminderEditTitle") : t("reminderNewTitle");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {childName ? `${title} — ${childName}` : title}
          </DialogTitle>
          <DialogDescription>{t("reminderDialogSubtitle")}</DialogDescription>
        </DialogHeader>

        <ReminderForm
          applicationId={applicationId}
          members={members}
          initial={initial}
          onSaved={() => {
            onOpenChange(false);
            onSaved();
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
