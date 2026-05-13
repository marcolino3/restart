"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addUserEmailAction } from "../actions/add-user-email.action";
import { setPrimaryUserEmailAction } from "../actions/set-primary-user-email.action";
import { removeUserEmailAction } from "../actions/remove-user-email.action";

type EmailRow = {
  id: string;
  email: string;
  isPrimary: boolean;
  isVerified: boolean;
};

interface UserEmailsManagerProps {
  userId: string;
  emails: EmailRow[];
}

export function UserEmailsManager({ userId, emails }: UserEmailsManagerProps) {
  const t = useTranslations("Common");
  const router = useRouter();
  const [newEmail, setNewEmail] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isAdding, startAdd] = useTransition();

  const onAdd = () => {
    const email = newEmail.trim();
    if (!email) return;
    startAdd(async () => {
      const res = await addUserEmailAction(userId, email);
      if (res.success) {
        toast.success(t("emailAdded"));
        setNewEmail("");
        router.refresh();
      } else {
        toast.error(t("emailAddError"));
      }
    });
  };

  const onSetPrimary = async (id: string) => {
    setBusyId(id);
    const res = await setPrimaryUserEmailAction(id);
    setBusyId(null);
    if (res.success) {
      toast.success(t("primaryEmailUpdated"));
      router.refresh();
    } else {
      toast.error(t("primaryEmailUpdateError"));
    }
  };

  const onRemove = async (id: string) => {
    setBusyId(id);
    const res = await removeUserEmailAction(id);
    setBusyId(null);
    if (res.success) {
      toast.success(t("emailRemoved"));
      router.refresh();
    } else {
      toast.error(t("emailRemoveError"));
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {emails.map((ue) => (
          <div
            key={ue.id}
            className="flex items-center gap-2 rounded border p-2"
          >
            <span className="flex-1 break-all">{ue.email}</span>
            {ue.isPrimary && <Badge>{t("primaryEmail")}</Badge>}
            {ue.isVerified && (
              <Badge variant="secondary">{t("verifiedEmail")}</Badge>
            )}
            {!ue.isPrimary && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busyId !== null}
                  onClick={() => onSetPrimary(ue.id)}
                >
                  {busyId === ue.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Check className="h-3 w-3" />
                  )}
                  <span className="ml-1">{t("setAsPrimary")}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busyId !== null}
                  onClick={() => onRemove(ue.id)}
                  aria-label={t("removeEmail")}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="email"
          placeholder={t("addEmailPlaceholder")}
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          disabled={isAdding}
        />
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          disabled={isAdding || !newEmail.trim()}
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          <span className="ml-1">{t("addEmail")}</span>
        </Button>
      </div>
    </div>
  );
}
