"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import type { RoleWithPermissions } from "../actions/get-roles.action";

type Props = {
  duplicateFromRoleId?: string;
  duplicateFromRoleName?: string;
  /** Roles offered as "start from a copy of" chips. Omit when the trigger already fixes the source role. */
  availableSourceRoles?: RoleWithPermissions[];
  onCreated: () => void;
  trigger?: React.ReactNode;
};

export function CreateRoleDialog({
  duplicateFromRoleId,
  duplicateFromRoleName,
  availableSourceRoles,
  onCreated,
  trigger,
}: Props) {
  const t = useTranslations("Roles");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSourceRoleId, setSelectedSourceRoleId] = useState<string | null>(
    duplicateFromRoleId ?? null,
  );

  const isFixedDuplicate = !!duplicateFromRoleId;
  const isDuplicate = !!selectedSourceRoleId;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setName("");
      if (!isFixedDuplicate) setSelectedSourceRoleId(null);
    }
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const result = isDuplicate
        ? await duplicateRoleAction(selectedSourceRoleId!, name.trim())
        : await createRoleAction(name.trim());

      if (result.success) {
        toast.success(t("roleCreated"));
        handleOpenChange(false);
        onCreated();
      } else {
        toast.error(t("saveError"));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            {isFixedDuplicate ? t("duplicateRoleTitle") : t("createRoleTitle")}
          </DialogTitle>
          <DialogDescription>
            {isFixedDuplicate
              ? t("duplicateRoleDescription", {
                  roleName: duplicateFromRoleName ?? "",
                })
              : t("createRoleDescription")}
          </DialogDescription>
        </DialogHeader>

        {!isFixedDuplicate && availableSourceRoles?.length ? (
          <div className="space-y-2">
            <Label>{t("startingPoint")}</Label>
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant={selectedSourceRoleId === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedSourceRoleId(null)}
              >
                {t("startEmpty")}
              </Badge>
              {availableSourceRoles.map((role) => (
                <Badge
                  key={role.id}
                  variant={selectedSourceRoleId === role.id ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedSourceRoleId(role.id)}
                >
                  {t("copyOf", { roleName: role.name ?? "" })}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

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
            onClick={() => handleOpenChange(false)}
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
