"use client";

import { IconTrash, IconUserPlus } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleAction } from "@/lib/actions/handle-action";

import {
  addProjectMemberAction,
  removeProjectMemberAction,
  updateProjectMemberRoleAction,
} from "../actions/manage-members.action";
import { membershipInitials, membershipName } from "../lib/membership-name";
import type {
  MembershipRef,
  ProjectDetail,
  ProjectMemberRole,
} from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectDetail;
  orgMemberships: MembershipRef[];
  canManage: boolean;
};

export function ProjectMembersDialog({
  open,
  onOpenChange,
  project,
  orgMemberships,
  canManage,
}: Props) {
  const t = useTranslations("Projects");
  const router = useRouter();
  const [addId, setAddId] = React.useState<string>("");
  const [addRole, setAddRole] = React.useState<ProjectMemberRole>("MEMBER");

  const memberMembershipIds = new Set(
    project.members.map((m) => m.membership?.id).filter(Boolean) as string[]
  );
  const addable = orgMemberships.filter((m) => !memberMembershipIds.has(m.id));

  const onAdd = async () => {
    if (!addId) return;
    const result = await handleAction({
      action: () =>
        addProjectMemberAction({
          projectId: project.id,
          membershipId: addId,
          role: addRole,
        }),
      successMessage: t("memberAdded"),
      errorMessage: t("memberAddError"),
    });
    if (result.success) {
      setAddId("");
      setAddRole("MEMBER");
      router.refresh();
    }
  };

  const onChangeRole = async (id: string, role: ProjectMemberRole) => {
    const result = await handleAction({
      action: () =>
        updateProjectMemberRoleAction({ id, role, projectId: project.id }),
      successMessage: t("memberRoleUpdated"),
      errorMessage: t("memberRoleUpdateError"),
    });
    if (result.success) router.refresh();
  };

  const onRemove = async (id: string) => {
    const result = await handleAction({
      action: () => removeProjectMemberAction({ id, projectId: project.id }),
      successMessage: t("memberRemoved"),
      errorMessage: t("memberRemoveError"),
    });
    if (result.success) router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("manageMembers")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {project.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-2 rounded-md border p-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">
                    {membershipInitials(member.membership)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm">
                  {membershipName(member.membership)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {canManage ? (
                  <Select
                    value={member.role}
                    onValueChange={(v) =>
                      onChangeRole(member.id, v as ProjectMemberRole)
                    }
                  >
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNER">{t("role_OWNER")}</SelectItem>
                      <SelectItem value="MEMBER">{t("role_MEMBER")}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t(`role_${member.role}`)}
                  </span>
                )}
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onRemove(member.id)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {canManage && addable.length > 0 && (
          <div className="mt-2 flex items-end gap-2 border-t pt-4">
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">
                {t("addMember")}
              </label>
              <Select value={addId} onValueChange={setAddId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectMember")} />
                </SelectTrigger>
                <SelectContent>
                  {addable.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {membershipName(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select
              value={addRole}
              onValueChange={(v) => setAddRole(v as ProjectMemberRole)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">{t("role_MEMBER")}</SelectItem>
                <SelectItem value="OWNER">{t("role_OWNER")}</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onAdd} disabled={!addId}>
              <IconUserPlus className="mr-1 h-4 w-4" />
              {t("add")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
