"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeUserEmailAction } from "../actions/change-user-email.action";

interface Props {
  userId: string;
  currentEmail?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ChangeEmailDialog = ({ userId, currentEmail }: Props) => {
  const t = useTranslations("Employees");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(currentEmail ?? "");
  const [submitting, setSubmitting] = useState(false);

  const invalid = !EMAIL_RE.test(email.trim());

  const onSubmit = async () => {
    setSubmitting(true);
    const res = await changeUserEmailAction(userId, email.trim());
    setSubmitting(false);
    if (res.success) {
      toast.success(t("emailChanged"));
      setOpen(false);
      router.refresh();
    } else {
      toast.error(t("emailChangeError"), {
        description: res.error ? String(res.error) : undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("changeEmail")}>
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("changeEmail")}</DialogTitle>
          <DialogDescription>{t("emailChangeVerifyNote")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="new-email">{t("newEmail")}</Label>
          <Input
            id="new-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={submitting || invalid}>
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
