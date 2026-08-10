"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { createRoleAction } from "../actions/create-role.action";
import { duplicateRoleAction } from "../actions/duplicate-role.action";

type Props = {
  duplicateFromRoleId?: string;
  duplicateFromRoleName?: string;
  onCreated: () => void;
  trigger?: React.ReactNode;
};

export function CreateRoleDialog({
  duplicateFromRoleId,
  duplicateFromRoleName,
  onCreated,
  trigger,
}: Props) {
  const t = useTranslations("Roles");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isDuplicate = !!duplicateFromRoleId;

  async function handleSubmit() {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const result = isDuplicate
        ? await duplicateRoleAction(duplicateFromRoleId!, name.trim())
        : await createRoleAction(name.trim());

      if (result.success) {
        toast.success(t("roleCreated"));
        setOpen(false);
        setName("");
        onCreated();
      } else {
        toast.error(t("saveError"));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" size="sm">
            <Plus className="mr-1 size-4" />
            {t("createRole")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isDuplicate ? t("duplicateRoleTitle") : t("createRoleTitle")}
          </DialogTitle>
          <DialogDescription>
            {isDuplicate
              ? t("duplicateRoleDescription", {
                  roleName: duplicateFromRoleName ?? "",
                })
              : t("createRoleDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="role-name">{t("roleName")}</Label>
          <Input
            id="role-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSaving}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || !name.trim()}
          >
            {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
