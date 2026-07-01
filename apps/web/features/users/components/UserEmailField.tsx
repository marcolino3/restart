"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser, usePermissions } from "@/features/users/context/current-user.context";
import { isAdminPersona } from "@/features/users/lib/admin-persona";
import { changeUserEmailAction } from "../actions/change-user-email.action";

interface Props {
  userId: string;
  currentEmail?: string | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Inline editierbares E-Mail-Feld. Bei fehlender Berechtigung disabled.
 * Speichern erscheint nur, wenn der Wert geändert wurde und gültig ist.
 */
export const UserEmailField = ({ userId, currentEmail }: Props) => {
  const t = useTranslations("Employees");
  const tc = useTranslations("Common");
  const router = useRouter();
  const user = useUser();
  const { hasPermission } = usePermissions();

  const canEdit =
    (user?.isSuperAdmin ?? false) ||
    (isAdminPersona(user?.persona) && hasPermission("EMPLOYEE_WRITE"));

  const original = (currentEmail ?? "").trim();
  const [email, setEmail] = useState(original);
  const [submitting, setSubmitting] = useState(false);

  const dirty = email.trim() !== original;
  const invalid = !EMAIL_RE.test(email.trim());

  const onSave = async () => {
    setSubmitting(true);
    const res = await changeUserEmailAction(userId, email.trim());
    setSubmitting(false);
    if (res.success) {
      toast.success(t("emailChanged"));
      router.refresh();
    } else {
      toast.error(t("emailChangeError"), {
        description: res.error ? String(res.error) : undefined,
      });
    }
  };

  return (
    <div className="flex max-w-sm items-center gap-2">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={!canEdit}
        autoComplete="off"
        aria-label={t("email")}
      />
      {canEdit && dirty && (
        <Button
          size="icon"
          variant="outline"
          onClick={onSave}
          disabled={submitting || invalid}
          aria-label={tc("save")}
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
        </Button>
      )}
    </div>
  );
};
