"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Loader2, Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InitialsAvatar } from "@/components/common/InitialsAvatar";
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
import { getEmployeesAction, type EmployeeListItem } from "@/features/employees/actions/get-employees.action";

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
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSourceRoleId, setSelectedSourceRoleId] = useState<string | null>(
    duplicateFromRoleId ?? null,
  );
  const [employees, setEmployees] = useState<EmployeeListItem[] | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<EmployeeListItem[]>([]);
  const [peoplePopoverOpen, setPeoplePopoverOpen] = useState(false);

  const isFixedDuplicate = !!duplicateFromRoleId;
  const isDuplicate = !!selectedSourceRoleId;

  const selectedMemberIds = useMemo(
    () => new Set(selectedMembers.map((m) => m.membership.id)),
    [selectedMembers],
  );

  async function ensureEmployeesLoaded() {
    if (employees !== null) return;
    const result = await getEmployeesAction();
    setEmployees(result.success && result.data ? result.data : []);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setName("");
      setDescription("");
      setSelectedMembers([]);
      if (!isFixedDuplicate) setSelectedSourceRoleId(null);
    }
  }

  function toggleMember(employee: EmployeeListItem) {
    setSelectedMembers((prev) =>
      prev.some((m) => m.membership.id === employee.membership.id)
        ? prev.filter((m) => m.membership.id !== employee.membership.id)
        : [...prev, employee],
    );
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const membershipIds = selectedMembers.map((m) => m.membership.id);
      const result = isDuplicate
        ? await duplicateRoleAction(selectedSourceRoleId!, name.trim())
        : await createRoleAction(
            name.trim(),
            description.trim() || undefined,
            undefined,
            membershipIds.length ? membershipIds : undefined,
          );

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
      <DialogContent className="sm:max-w-[560px]">
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

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">{t("roleName")}</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("roleNamePlaceholder")}
              maxLength={100}
              autoFocus
            />
          </div>

          {!isFixedDuplicate ? (
            <div className="space-y-2">
              <Label htmlFor="role-description">{t("roleDescriptionLabel")}</Label>
              <Textarea
                id="role-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("roleDescriptionPlaceholder")}
                maxLength={500}
              />
            </div>
          ) : null}

          {!isFixedDuplicate && availableSourceRoles?.length ? (
            <div className="space-y-2">
              <Label>{t("startingPoint")}</Label>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant={selectedSourceRoleId === null ? "default" : "outline"}
                  className="cursor-pointer rounded-full px-4 py-2"
                  onClick={() => setSelectedSourceRoleId(null)}
                >
                  {t("startEmpty")}
                </Badge>
                {availableSourceRoles.map((role) => (
                  <Badge
                    key={role.id}
                    variant={selectedSourceRoleId === role.id ? "default" : "outline"}
                    className="cursor-pointer rounded-full px-4 py-2"
                    onClick={() => setSelectedSourceRoleId(role.id)}
                  >
                    {t("copyOf", { roleName: role.name ?? "" })}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{t("startingPointHint")}</p>
            </div>
          ) : null}

          {!isFixedDuplicate ? (
            <div className="space-y-2">
              <Label>{t("assignMembersLabel")}</Label>
              <Popover open={peoplePopoverOpen} onOpenChange={setPeoplePopoverOpen}>
                <PopoverTrigger asChild>
                  <Input
                    readOnly
                    onClick={() => void ensureEmployeesLoaded()}
                    value=""
                    placeholder={
                      selectedMembers.length > 0
                        ? selectedMembers
                            .map((m) => `${m.membership.user?.firstName} ${m.membership.user?.lastName}`)
                            .join(", ")
                        : t("searchPeoplePlaceholder")
                    }
                    className="cursor-pointer placeholder:text-foreground"
                  />
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={t("searchPeoplePlaceholder")} />
                    <CommandList>
                      <CommandEmpty>{t("noPeopleFound")}</CommandEmpty>
                      <CommandGroup>
                        {(employees ?? []).map((employee) => {
                          const selected = selectedMemberIds.has(employee.membership.id);
                          return (
                            <CommandItem
                              key={employee.membership.id}
                              value={`${employee.membership.user?.firstName ?? ""} ${employee.membership.user?.lastName ?? ""}`}
                              onSelect={() => toggleMember(employee)}
                              className="flex items-center gap-2"
                            >
                              <InitialsAvatar
                                firstName={employee.membership.user?.firstName}
                                lastName={employee.membership.user?.lastName}
                                className="size-6"
                              />
                              <span className="flex-1">
                                {employee.membership.user?.firstName}{" "}
                                {employee.membership.user?.lastName}
                              </span>
                              {selected ? <Check className="size-4" /> : null}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedMembers.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedMembers.map((m) => (
                    <span
                      key={m.membership.id}
                      className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      {m.membership.user?.firstName} {m.membership.user?.lastName}
                      <X className="size-3 cursor-pointer" onClick={() => toggleMember(m)} />
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
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
            {!isFixedDuplicate && selectedMembers.length > 0
              ? t("createRoleAndAssign")
              : tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
