"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import { updateRoleMembersAction } from "../actions/update-role-members.action";
import type { RoleMember } from "../actions/get-roles.action";
import { getEmployeesAction, type EmployeeListItem } from "@/features/employees/actions/get-employees.action";

type Props = {
  roleId: string;
  roleName: string;
  currentMembers: RoleMember[];
  onUpdated: () => void;
  trigger: React.ReactNode;
};

export function ManageRoleMembersDialog({
  roleId,
  roleName,
  currentMembers,
  onUpdated,
  trigger,
}: Props) {
  const t = useTranslations("Roles");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [employees, setEmployees] = useState<EmployeeListItem[] | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<EmployeeListItem[]>([]);
  const [peoplePopoverOpen, setPeoplePopoverOpen] = useState(false);

  const selectedMemberIds = useMemo(
    () => new Set(selectedMembers.map((m) => m.membership.id)),
    [selectedMembers],
  );

  async function ensureEmployeesLoaded() {
    if (employees !== null) return;
    const result = await getEmployeesAction();
    const loaded = result.success && result.data ? result.data : [];
    setEmployees(loaded);
    setSelectedMembers(
      loaded.filter((e) => currentMembers.some((m) => m.id === e.membership.id)),
    );
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setSelectedMembers([]);
  }

  function toggleMember(employee: EmployeeListItem) {
    setSelectedMembers((prev) =>
      prev.some((m) => m.membership.id === employee.membership.id)
        ? prev.filter((m) => m.membership.id !== employee.membership.id)
        : [...prev, employee],
    );
  }

  async function handleSubmit() {
    setIsSaving(true);
    try {
      const membershipIds = selectedMembers.map((m) => m.membership.id);
      const result = await updateRoleMembersAction(roleId, membershipIds);

      if (result.success) {
        toast.success(t("membersUpdated"));
        handleOpenChange(false);
        onUpdated();
      } else {
        toast.error(result.error ?? t("saveError"));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{t("manageMembersTitle")}</DialogTitle>
          <DialogDescription>
            {t("manageMembersDescription", { roleName })}
          </DialogDescription>
        </DialogHeader>

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
                </span>
              ))}
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
          <Button type="button" onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
