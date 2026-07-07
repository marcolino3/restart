"use client";

import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { AdmissionAppointment } from "../actions/get-admission-appointments.action";
import {
  AppointmentForm,
  type AppointmentMember,
  type AppointmentTypeOption,
} from "./AppointmentForm";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  types: AppointmentTypeOption[];
  members: AppointmentMember[];
  initial?: AdmissionAppointment | null;
  onSaved: () => void;
  /** Optional child name shown in the dialog title. */
  childName?: string;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  applicationId,
  types,
  members,
  initial,
  onSaved,
  childName,
}: Props) {
  const t = useTranslations("Admissions");
  const title = initial ? t("appointmentEditTitle") : t("appointmentNewTitle");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {childName ? `${title} — ${childName}` : title}
          </DialogTitle>
        </DialogHeader>

        <AppointmentForm
          applicationId={applicationId}
          types={types}
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
