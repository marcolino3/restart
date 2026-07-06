"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { rejectApplicationAction } from "../actions/archive-application.action";
import type { AdmissionRejectionReason } from "../types";

interface Props {
  applicationId: string;
  reasons: AdmissionRejectionReason[];
  onClose: () => void;
  onRejected?: () => void;
  /** Child name shown in the dialog title (design: "Absage — <Kind>"). */
  childName?: string;
}

const NONE_VALUE = "__none__";

export function RejectApplicationDialog({
  applicationId,
  reasons,
  onClose,
  onRejected,
  childName,
}: Props) {
  const t = useTranslations("Admissions");
  const tC = useTranslations("Common");
  const router = useRouter();

  const [reasonId, setReasonId] = useState<string>(NONE_VALUE);
  const [rejectedBy, setRejectedBy] = useState<string>(NONE_VALUE);
  const [followUpYear, setFollowUpYear] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const rejectedByOptions: {
    value: "SCHOOL" | "PARENTS" | "OTHER";
    label: string;
  }[] = [
    { value: "SCHOOL", label: t("rejectedBySchool") },
    { value: "PARENTS", label: t("rejectedByParents") },
    { value: "OTHER", label: t("rejectedByOther") },
  ];

  const onConfirm = async () => {
    setBusy(true);
    const res = await rejectApplicationAction({
      id: applicationId,
      reason: note.trim() || undefined,
      rejectionReasonId: reasonId === NONE_VALUE ? undefined : reasonId,
      rejectedBy:
        rejectedBy === NONE_VALUE
          ? undefined
          : (rejectedBy as "SCHOOL" | "PARENTS" | "OTHER"),
      followUpYear: followUpYear.trim() || undefined,
    });
    setBusy(false);
    if (res.success) {
      toast.success(t("rejectSuccess"));
      onRejected?.();
      onClose();
      router.refresh();
    } else {
      toast.error(t("rejectError"), { description: res.error });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>
            {childName
              ? `${t("rejectApplication")} — ${childName}`
              : t("rejectApplication")}
          </DialogTitle>
          <DialogDescription>{t("rejectDialogHint")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("rejectionReason")}</Label>
            <Select value={reasonId} onValueChange={setReasonId}>
              <SelectTrigger>
                <SelectValue placeholder={t("rejectionReasonSelect")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>
                  {t("rejectionReasonNone")}
                </SelectItem>
                {reasons.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-border"
                        style={{ backgroundColor: r.color ?? "var(--muted)" }}
                      />
                      {r.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("rejectedByLabel")}</Label>
            <Select value={rejectedBy} onValueChange={setRejectedBy}>
              <SelectTrigger>
                <SelectValue placeholder={t("rejectedBySelect")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>
                  {t("rejectedByNone")}
                </SelectItem>
                {rejectedByOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("followUpYearLabel")}</Label>
            <Input
              value={followUpYear}
              onChange={(e) => setFollowUpYear(e.target.value)}
              placeholder={t("followUpYearPlaceholder")}
              maxLength={40}
            />
            <p className="text-[11px] text-muted-foreground">
              {t("followUpYearHint")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("rejectionNote")}</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("rejectionNotePlaceholder")}
              rows={3}
              maxLength={2000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            {tC("cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            {t("rejectConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
