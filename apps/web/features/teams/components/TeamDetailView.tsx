"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { ComboboxFormField } from "@/components/form/form-fields/ComboboxFormField";
import { SelectFormField } from "@/components/form/form-fields/SelectFormField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { handleAction } from "@/lib/actions/handle-action";
import { ROUTES } from "@/constants/routes";
import { z } from "zod";

import type { TeamDetail } from "../actions/get-team-by-id.action";
import type {
  TeamMemberItem,
  TeamMemberRole,
} from "../actions/get-team-members.action";
import type { EmployeeListItem } from "@/features/employees/actions/get-employees.action";
import {
  TeamFormSchema,
  type TeamFormType,
} from "../schemas/team-form.schema";
import { updateTeamAction } from "../actions/update-team.action";
import { deleteTeamAction } from "../actions/delete-team.action";
import { addTeamMemberAction } from "../actions/add-team-member.action";
import { removeTeamMemberAction } from "../actions/remove-team-member.action";
import { updateTeamMemberRoleAction } from "../actions/update-team-member-role.action";

const AddMemberSchema = z.object({
  employeeId: z.string().uuid(),
  role: z.enum(["MEMBER", "LEAD"]),
});
type AddMemberType = z.infer<typeof AddMemberSchema>;

interface Props {
  team: TeamDetail;
  initialMembers: TeamMemberItem[];
  employees: EmployeeListItem[];
}

export function TeamDetailView({ team, initialMembers, employees }: Props) {
  const t = useTranslations("Teams");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const locale = useLocale();

  const [members, setMembers] = React.useState(initialMembers);
  const [addOpen, setAddOpen] = React.useState(false);

  const nameForm = useForm<TeamFormType>({
    resolver: zodResolver(TeamFormSchema),
    defaultValues: { name: team.name },
  });

  const onRename = async (values: TeamFormType) => {
    await handleAction({
      action: () => updateTeamAction({ id: team.id, name: values.name }),
      successMessage: t("teamUpdated"),
      errorMessage: t("teamUpdateError"),
      onSuccess: () => router.refresh(),
    });
  };

  const onDeleteTeam = async () => {
    const res = await deleteTeamAction(team.id);
    if (res.success) {
      router.push(ROUTES.admin.teams(locale));
    }
    return res;
  };

  const onRemoveMember = async (memberId: string) => {
    const previous = members;
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    await handleAction({
      action: () => removeTeamMemberAction(memberId, team.id),
      successMessage: t("memberRemoved"),
      errorMessage: t("memberRemoveError"),
      onSuccess: () => router.refresh(),
    }).catch(() => setMembers(previous));
  };

  const onChangeRole = async (memberId: string, role: TeamMemberRole) => {
    const previous = members;
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role } : m)),
    );
    const result = await handleAction({
      action: () =>
        updateTeamMemberRoleAction({ id: memberId, role, teamId: team.id }),
      successMessage: t("roleUpdated"),
      errorMessage: t("roleUpdateError"),
      onSuccess: () => router.refresh(),
    });
    if (!result.success) setMembers(previous);
  };

  const memberEmployeeIds = React.useMemo(
    () => new Set(members.map((m) => m.employee.id)),
    [members],
  );

  const availableEmployees = employees.filter((e) => {
    const empId = e.membership.employee?.id;
    return empId && !memberEmployeeIds.has(empId) && e.membership.employee?.isActive;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("teamDetails")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...nameForm}>
            <form
              onSubmit={nameForm.handleSubmit(onRename)}
              className="flex items-end gap-2"
            >
              <InputFormField
                name="name"
                label="name"
                namespace="Teams"
                width="flex-1"
              />
              <Button
                type="submit"
                disabled={
                  nameForm.formState.isSubmitting || !nameForm.formState.isDirty
                }
              >
                {tCommon("save")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("members")}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddOpen(true)}
            disabled={availableEmployees.length === 0}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {t("addMember")}
          </Button>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              {t("noMembersYet")}
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("role")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">{t("removeMember")}</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => {
                    const user = m.employee.membership?.user;
                    const fullName = user
                      ? `${user.firstName} ${user.lastName}`.trim()
                      : t("unknownMember");
                    const email =
                      user?.userEmails?.find((e) => e.isPrimary)?.email ??
                      user?.userEmails?.[0]?.email ??
                      "";
                    const initials = user
                      ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
                      : "?";
                    const active = m.employee.isActive;
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {fullName}
                              </div>
                              {email && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={m.role}
                            onValueChange={(value) =>
                              onChangeRole(m.id, value as TeamMemberRole)
                            }
                          >
                            <SelectTrigger
                              className="h-8 w-[140px]"
                              aria-label={t("changeRole")}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LEAD">
                                {t("roleLead")}
                              </SelectItem>
                              <SelectItem value="MEMBER">
                                {t("roleMember")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={active ? "default" : "secondary"}
                            className={
                              active
                                ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 hover:bg-green-50 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/50"
                                : ""
                            }
                          >
                            {active ? t("statusActive") : t("statusInactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => onRemoveMember(m.id)}
                            aria-label={t("removeMember")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <DeleteConfirmationDialog
          onConfirm={onDeleteTeam}
          itemName={team.name}
          trigger={
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              {t("deleteTeam")}
            </Button>
          }
        />
      </div>

      {addOpen && (
        <AddMemberDialog
          teamId={team.id}
          availableEmployees={availableEmployees}
          onOpenChange={setAddOpen}
          onAdded={(added) => {
            setMembers((prev) => [...prev, added]);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

interface AddMemberDialogProps {
  teamId: string;
  availableEmployees: EmployeeListItem[];
  onOpenChange: (open: boolean) => void;
  onAdded: (member: TeamMemberItem) => void;
}

function AddMemberDialog({
  teamId,
  availableEmployees,
  onOpenChange,
  onAdded,
}: AddMemberDialogProps) {
  const t = useTranslations("Teams");
  const tCommon = useTranslations("Common");

  const options = availableEmployees
    .map((e) => {
      const user = e.membership.user;
      const empId = e.membership.employee?.id;
      if (!user || !empId) return null;
      return {
        value: empId,
        label: `${user.firstName} ${user.lastName}`.trim(),
      };
    })
    .filter((o): o is { value: string; label: string } => o !== null);

  const form = useForm<AddMemberType>({
    resolver: zodResolver(AddMemberSchema),
    defaultValues: { employeeId: "", role: "MEMBER" },
  });

  const onSubmit = async (values: AddMemberType) => {
    const selected = availableEmployees.find(
      (e) => e.membership.employee?.id === values.employeeId,
    );
    await handleAction({
      action: () =>
        addTeamMemberAction({
          teamId,
          employeeId: values.employeeId,
          role: values.role,
        }),
      successMessage: t("memberAdded"),
      errorMessage: t("memberAddError"),
      onSuccess: (data) => {
        if (data && selected) {
          onAdded({
            id: data.id,
            role: data.role,
            employee: {
              id: values.employeeId,
              isActive: selected.membership.employee?.isActive ?? true,
              membership: { user: selected.membership.user ?? null },
            },
          });
        }
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addMember")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            id="add-member-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <ComboboxFormField
              name="employeeId"
              label="employee"
              namespace="Teams"
              options={options}
              translateOptions={false}
              width="w-full"
            />
            <SelectFormField
              name="role"
              label="role"
              namespace="Teams"
              options={[
                { value: "MEMBER", label: t("roleMember") },
                { value: "LEAD", label: t("roleLead") },
              ]}
              translateOptions={false}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={form.formState.isSubmitting}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            form="add-member-form"
            disabled={form.formState.isSubmitting}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
