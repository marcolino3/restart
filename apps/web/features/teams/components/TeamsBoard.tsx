"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { MoreHorizontal, Pencil, Plus, Trash2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { ComboboxFormField } from "@/components/form/form-fields/ComboboxFormField";
import { PageHead } from "@/components/common/PageHead";
import { EmployeeAvatar } from "@/features/employees/components/EmployeeAvatar";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { handleAction } from "@/lib/actions/handle-action";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { z } from "zod";

import {
  TeamFormSchema,
  type TeamFormType,
} from "../schemas/team-form.schema";
import type { TeamItem } from "../actions/get-teams.action";
import type { OrgTeamMemberItem } from "../actions/get-all-team-members.action";
import type { EmployeeListItem } from "@/features/employees/actions/get-employees.action";
import { createTeamAction } from "../actions/create-team.action";
import { updateTeamAction } from "../actions/update-team.action";
import { deleteTeamAction } from "../actions/delete-team.action";
import { addTeamMemberAction } from "../actions/add-team-member.action";
import { removeTeamMemberAction } from "../actions/remove-team-member.action";
import { moveTeamMemberAction } from "../actions/move-team-member.action";

interface Props {
  initialTeams: TeamItem[];
  initialMembers: OrgTeamMemberItem[];
  employees: EmployeeListItem[];
}

type MemberDragData = {
  memberId: string;
  fromTeamId: string;
  employeeId: string;
};

function memberName(m: OrgTeamMemberItem, unknown: string) {
  const user = m.employee.membership?.user;
  return user ? `${user.firstName} ${user.lastName}`.trim() : unknown;
}

export function TeamsBoard({ initialTeams, initialMembers, employees }: Props) {
  const t = useTranslations("Teams");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const locale = useLocale();

  const [teams, setTeams] = React.useState<TeamItem[]>(initialTeams);
  const [members, setMembers] =
    React.useState<OrgTeamMemberItem[]>(initialMembers);

  const [creating, setCreating] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TeamItem | null>(null);
  const [addingUnder, setAddingUnder] = React.useState<TeamItem | null>(null);
  const [addMemberTo, setAddMemberTo] = React.useState<TeamItem | null>(null);

  const [activeMemberId, setActiveMemberId] = React.useState<string | null>(
    null,
  );
  const [overTeamId, setOverTeamId] = React.useState<string | null>(null);

  React.useEffect(() => setTeams(initialTeams), [initialTeams]);
  React.useEffect(() => setMembers(initialMembers), [initialMembers]);

  // Alt held at drop time → copy (second membership) instead of move. dnd-kit's
  // DragEndEvent only carries the pointerdown modifiers, so track live keyboard
  // state ourselves.
  const altRef = React.useRef(false);
  React.useEffect(() => {
    const set = (e: KeyboardEvent) => {
      if (e.key === "Alt") altRef.current = e.type === "keydown";
    };
    window.addEventListener("keydown", set);
    window.addEventListener("keyup", set);
    return () => {
      window.removeEventListener("keydown", set);
      window.removeEventListener("keyup", set);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const teamsSorted = React.useMemo(
    () =>
      [...teams].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
      ),
    [teams],
  );

  const membersByTeam = React.useMemo(() => {
    const map = new Map<string, OrgTeamMemberItem[]>();
    for (const m of members) {
      const teamId = m.team?.id;
      if (!teamId) continue;
      const bucket = map.get(teamId);
      if (bucket) bucket.push(m);
      else map.set(teamId, [m]);
    }
    // Team lead first, then alphabetically by name.
    for (const bucket of map.values()) {
      bucket.sort((a, b) => {
        if (a.role !== b.role) return a.role === "LEAD" ? -1 : 1;
        return memberName(a, "").localeCompare(memberName(b, ""));
      });
    }
    return map;
  }, [members]);

  // employeeId → workload percent, for the member subtitle. Read defensively:
  // `workloadPercent` only exists on the employee query once the pensum work
  // lands — until then it is simply absent and the percent is omitted.
  const workloadByEmployee = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const e of employees) {
      const id = e.membership.employee?.id;
      const wl = (e as { workloadPercent?: number | null }).workloadPercent;
      if (id && wl != null) map.set(id, wl);
    }
    return map;
  }, [employees]);

  const teamNameById = React.useMemo(
    () => new Map(teams.map((t) => [t.id, t.name])),
    [teams],
  );

  // employeeId → the teams they belong to (for the "also in …" hint).
  const teamsByEmployee = React.useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of members) {
      const teamId = m.team?.id;
      if (!teamId) continue;
      const bucket = map.get(m.employee.id);
      if (bucket) bucket.push(teamId);
      else map.set(m.employee.id, [teamId]);
    }
    return map;
  }, [members]);

  const buildSubtitle = React.useCallback(
    (m: OrgTeamMemberItem, teamId: string) => {
      const parts: string[] = [];
      if (m.role === "LEAD") parts.push(t("teamLead"));
      const wl = workloadByEmployee.get(m.employee.id);
      if (wl != null) parts.push(`${wl}%`);
      const otherTeams = (teamsByEmployee.get(m.employee.id) ?? [])
        .filter((id) => id !== teamId)
        .map((id) => teamNameById.get(id))
        .filter((n): n is string => Boolean(n));
      if (otherTeams.length > 0) {
        parts.push(t("alsoInTeams", { teams: otherTeams.join(", ") }));
      }
      return parts.join(" · ");
    },
    [t, workloadByEmployee, teamsByEmployee, teamNameById],
  );

  const leadNameForTeam = React.useCallback(
    (teamId: string) => {
      const lead = (membersByTeam.get(teamId) ?? []).find(
        (m) => m.role === "LEAD",
      );
      return lead ? memberName(lead, t("unknownMember")) : null;
    },
    [membersByTeam, t],
  );

  const totalMembers = members.length;

  // ---- Team CRUD -----------------------------------------------------------

  const handleCreate = async (name: string, parentId: string | null) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreating(true);
    await handleAction({
      action: () => createTeamAction(trimmed, parentId),
      successMessage: t("teamCreated"),
      errorMessage: t("teamCreateError"),
      onSuccess: (data) => {
        if (data) {
          setTeams((prev) => [
            ...prev,
            {
              id: data.id,
              name: data.name,
              sortOrder: data.sortOrder,
              parentId: data.parentId,
            },
          ]);
        }
        router.refresh();
      },
    });
    setCreating(false);
  };

  const handleEdit = async (values: TeamFormType) => {
    if (!editing) return;
    await handleAction({
      action: () => updateTeamAction({ id: editing.id, name: values.name }),
      successMessage: t("teamUpdated"),
      errorMessage: t("teamUpdateError"),
      onSuccess: (data) => {
        if (data) {
          setTeams((prev) =>
            prev.map((it) =>
              it.id === data.id ? { ...it, name: data.name } : it,
            ),
          );
        }
        setEditing(null);
        router.refresh();
      },
    });
  };

  const handleDeleteTeam = async (id: string) => {
    const result = await deleteTeamAction(id);
    if (result.success) {
      // Backend lifts sub-teams to the removed team's parent; members of the
      // deleted team are removed with it.
      const removed = teams.find((it) => it.id === id);
      const liftTo = removed?.parentId ?? null;
      setTeams((prev) =>
        prev
          .filter((it) => it.id !== id)
          .map((it) =>
            (it.parentId ?? null) === id ? { ...it, parentId: liftTo } : it,
          ),
      );
      setMembers((prev) => prev.filter((m) => m.team?.id !== id));
      router.refresh();
    }
    return result;
  };

  // ---- Members -------------------------------------------------------------

  const handleRemoveMember = async (member: OrgTeamMemberItem) => {
    const teamId = member.team?.id;
    if (!teamId) return;
    const previous = members;
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    const result = await handleAction({
      action: () => removeTeamMemberAction(member.id, teamId),
      successMessage: t("memberRemoved"),
      errorMessage: t("memberRemoveError"),
      onSuccess: () => router.refresh(),
    });
    if (!result.success) setMembers(previous);
  };

  const onDragStart = (e: DragStartEvent) => {
    setActiveMemberId(String(e.active.id));
  };

  const onDragEnd = async (e: DragEndEvent) => {
    const active = e.active.data.current as MemberDragData | undefined;
    const targetTeamId = (e.over?.data.current as { teamId?: string } | undefined)
      ?.teamId;
    const copy = altRef.current;
    setActiveMemberId(null);
    setOverTeamId(null);
    if (!active || !targetTeamId || targetTeamId === active.fromTeamId) return;

    // The unique (team, employee) constraint forbids the same person twice in a
    // team — skip if they are already there.
    const alreadyThere = (membersByTeam.get(targetTeamId) ?? []).some(
      (m) => m.employee.id === active.employeeId,
    );
    if (alreadyThere) {
      handleAction({
        action: async () => ({ success: false as const }),
        errorMessage: t("memberAlreadyInTeam"),
      }).catch(() => undefined);
      return;
    }

    const previous = members;
    const dragged = members.find((m) => m.id === active.memberId);
    if (!dragged) return;

    if (copy) {
      // Optimistic placeholder; real id arrives from the mutation.
      const tempId = `temp-${active.memberId}-${targetTeamId}`;
      setMembers((prev) => [
        ...prev,
        { ...dragged, id: tempId, role: "MEMBER", team: { id: targetTeamId } },
      ]);
      const result = await handleAction({
        action: () =>
          addTeamMemberAction({
            teamId: targetTeamId,
            employeeId: active.employeeId,
            role: "MEMBER",
          }),
        successMessage: t("memberCopied"),
        errorMessage: t("memberCopyError"),
        onSuccess: (data) => {
          if (data) {
            setMembers((prev) =>
              prev.map((m) =>
                m.id === tempId ? { ...m, id: data.id, role: data.role } : m,
              ),
            );
          }
          router.refresh();
        },
      });
      if (!result.success) setMembers(previous);
    } else {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === active.memberId ? { ...m, team: { id: targetTeamId } } : m,
        ),
      );
      const result = await handleAction({
        action: () => moveTeamMemberAction(active.memberId, targetTeamId),
        successMessage: t("memberMoved"),
        errorMessage: t("memberMoveError"),
        onSuccess: () => router.refresh(),
      });
      if (!result.success) setMembers(previous);
    }
  };

  const activeMember = activeMemberId
    ? members.find((m) => m.id === activeMemberId)
    : null;

  return (
    <div>
      <PageHead
        title={t("teams")}
        subtitle={t("teamsPageSubtitle", {
          teams: teams.length,
          members: totalMembers,
        })}
        action={
          <Button className="rounded-full" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("newTeam")}
          </Button>
        }
      />

      {teams.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("noTeamsFound")}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={onDragStart}
          onDragOver={(e: DragOverEvent) =>
            setOverTeamId(
              (e.over?.data.current as { teamId?: string } | undefined)
                ?.teamId ?? null,
            )
          }
          onDragEnd={onDragEnd}
          onDragCancel={() => {
            setActiveMemberId(null);
            setOverTeamId(null);
          }}
        >
          <div className="grid grid-cols-1 items-start gap-3.5 lg:grid-cols-2">
            {teamsSorted.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                locale={locale}
                members={membersByTeam.get(team.id) ?? []}
                leadName={leadNameForTeam(team.id)}
                buildSubtitle={buildSubtitle}
                isOver={overTeamId === team.id && activeMemberId != null}
                onEdit={() => setEditing(team)}
                onAddSub={() => setAddingUnder(team)}
                onDelete={() => handleDeleteTeam(team.id)}
                onAddMember={() => setAddMemberTo(team)}
                onRemoveMember={handleRemoveMember}
              />
            ))}
          </div>

          <DragOverlay>
            {activeMember ? (
              <div className="flex items-center gap-3 rounded-ctl border bg-card px-2 py-1.5 shadow-lg">
                <EmployeeAvatar
                  firstName={activeMember.employee.membership?.user?.firstName}
                  lastName={activeMember.employee.membership?.user?.lastName}
                  className="h-[30px] w-[30px]"
                  fallbackClassName="text-[10.5px]"
                />
                <span className="text-[13.5px] font-semibold">
                  {memberName(activeMember, t("unknownMember"))}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <p className="mt-3 text-[12.5px] text-muted-foreground">
        {t.rich("dragMemberHint", {
          alt: (chunks) => (
            <b className="font-semibold text-foreground">{chunks}</b>
          ),
        })}
      </p>

      {createOpen && (
        <TeamNameDialog
          title={t("newTeam")}
          submitLabel={t("add")}
          busy={creating}
          onOpenChange={(open) => !open && setCreateOpen(false)}
          onSubmit={async (values) => {
            await handleCreate(values.name, null);
            setCreateOpen(false);
          }}
        />
      )}
      {editing && (
        <TeamNameDialog
          title={t("editTeam")}
          submitLabel={tCommon("save")}
          defaultName={editing.name}
          onOpenChange={(open) => !open && setEditing(null)}
          onSubmit={handleEdit}
        />
      )}
      {addingUnder && (
        <TeamNameDialog
          title={`${t("addSubteam")} — ${addingUnder.name}`}
          submitLabel={t("add")}
          busy={creating}
          placeholder={t("subteamNamePlaceholder")}
          onOpenChange={(open) => !open && setAddingUnder(null)}
          onSubmit={async (values) => {
            await handleCreate(values.name, addingUnder.id);
            setAddingUnder(null);
          }}
        />
      )}
      {addMemberTo && (
        <AddMemberDialog
          team={addMemberTo}
          employees={employees}
          existingEmployeeIds={
            new Set(
              (membersByTeam.get(addMemberTo.id) ?? []).map(
                (m) => m.employee.id,
              ),
            )
          }
          onOpenChange={(open) => !open && setAddMemberTo(null)}
          onAdded={(member) => {
            setMembers((prev) => [...prev, member]);
            setAddMemberTo(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team card
// ---------------------------------------------------------------------------

interface TeamCardProps {
  team: TeamItem;
  locale: string;
  members: OrgTeamMemberItem[];
  leadName: string | null;
  buildSubtitle: (m: OrgTeamMemberItem, teamId: string) => string;
  isOver: boolean;
  onEdit: () => void;
  onAddSub: () => void;
  onDelete: () => Promise<{ success: boolean; error?: unknown }>;
  onAddMember: () => void;
  onRemoveMember: (member: OrgTeamMemberItem) => void;
}

function TeamCard({
  team,
  locale,
  members,
  leadName,
  buildSubtitle,
  isOver,
  onEdit,
  onAddSub,
  onDelete,
  onAddMember,
  onRemoveMember,
}: TeamCardProps) {
  const t = useTranslations("Teams");
  const { setNodeRef } = useDroppable({
    id: `team-${team.id}`,
    data: { teamId: team.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-card border bg-card px-[22px] py-5 shadow-xs transition-colors",
        isOver && "border-primary ring-[3px] ring-primary/20",
      )}
    >
      <div className="flex items-center gap-[9px]">
        <Link
          href={ROUTES.admin.teamsDetail(locale, team.id)}
          className="text-[15px] font-[650] tracking-[-0.01em] hover:underline"
        >
          {team.name}
        </Link>
        <Badge
          variant="accent"
          className="font-mono text-[11px] font-semibold tabular-nums"
        >
          {members.length}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-7 w-7 text-muted-foreground"
              aria-label={t("teamActions")}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit()}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              {t("editTeam")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAddSub()}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              {t("addSubteam")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DeleteConfirmationDialog
              onConfirm={onDelete}
              itemName={team.name}
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  {t("deleteTeam")}
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="mt-1 text-[12.5px] text-muted-foreground">
        {leadName ? t("teamLeadLine", { name: leadName }) : t("noLeadYet")}
      </p>

      <div className="mt-3.5 flex min-h-10 flex-col gap-0.5">
        {members.length === 0 ? (
          <p className="py-2 text-[12.5px] text-muted-foreground">
            {t("noMembersYet")}
          </p>
        ) : (
          members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              teamId={team.id}
              subtitle={buildSubtitle(m, team.id)}
              onRemove={() => onRemoveMember(m)}
            />
          ))
        )}
      </div>

      <button
        type="button"
        onClick={onAddMember}
        className="mt-2.5 w-full rounded-ctl border-[1.5px] border-dashed border-border bg-transparent py-2 text-[12.5px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        + {t("addMember")}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Member row (draggable)
// ---------------------------------------------------------------------------

interface MemberRowProps {
  member: OrgTeamMemberItem;
  teamId: string;
  subtitle: string;
  onRemove: () => void;
}

function MemberRow({ member, teamId, subtitle, onRemove }: MemberRowProps) {
  const t = useTranslations("Teams");
  const user = member.employee.membership?.user;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: member.id,
    data: {
      memberId: member.id,
      fromTeamId: teamId,
      employeeId: member.employee.id,
    } satisfies MemberDragData,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group -mx-2 flex cursor-grab items-center gap-3 rounded-ctl px-2 py-1.5 hover:bg-row-hover active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
      {...attributes}
      {...listeners}
    >
      <EmployeeAvatar
        firstName={user?.firstName}
        lastName={user?.lastName}
        className="h-[30px] w-[30px]"
        fallbackClassName="text-[10.5px]"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold">
          {memberName(member, t("unknownMember"))}
        </div>
        {subtitle && (
          <div className="truncate text-[11.5px] text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
        aria-label={t("removeMember")}
        title={t("removeMember")}
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-status-rose hover:text-status-rose-foreground group-hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

interface TeamNameDialogProps {
  title: string;
  submitLabel: string;
  defaultName?: string;
  placeholder?: string;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TeamFormType) => Promise<void>;
}

function TeamNameDialog({
  title,
  submitLabel,
  defaultName = "",
  placeholder,
  busy,
  onOpenChange,
  onSubmit,
}: TeamNameDialogProps) {
  const tCommon = useTranslations("Common");
  const form = useForm<TeamFormType>({
    resolver: zodResolver(TeamFormSchema),
    defaultValues: { name: defaultName },
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            id="team-name-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <InputFormField
              name="name"
              label="name"
              namespace="Teams"
              placeholder={placeholder}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy || form.formState.isSubmitting}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            form="team-name-form"
            disabled={busy || form.formState.isSubmitting}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const AddMemberSchema = z.object({
  employeeId: z.string().uuid(),
  role: z.enum(["MEMBER", "LEAD"]),
});
type AddMemberType = z.infer<typeof AddMemberSchema>;

interface AddMemberDialogProps {
  team: TeamItem;
  employees: EmployeeListItem[];
  existingEmployeeIds: Set<string>;
  onOpenChange: (open: boolean) => void;
  onAdded: (member: OrgTeamMemberItem) => void;
}

function AddMemberDialog({
  team,
  employees,
  existingEmployeeIds,
  onOpenChange,
  onAdded,
}: AddMemberDialogProps) {
  const t = useTranslations("Teams");
  const tCommon = useTranslations("Common");

  const available = employees.filter((e) => {
    const empId = e.membership.employee?.id;
    return (
      empId &&
      !existingEmployeeIds.has(empId) &&
      e.membership.employee?.isActive
    );
  });

  const options = available
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
  const role = form.watch("role");

  const onSubmit = async (values: AddMemberType) => {
    const selected = available.find(
      (e) => e.membership.employee?.id === values.employeeId,
    );
    await handleAction({
      action: () =>
        addTeamMemberAction({
          teamId: team.id,
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
            team: { id: team.id },
            employee: {
              id: values.employeeId,
              isActive: selected.membership.employee?.isActive ?? true,
              membership: { user: selected.membership.user ?? null },
            },
          });
        }
      },
    });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("addMember")} · <span className="text-primary">{team.name}</span>
          </DialogTitle>
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
            <div className="space-y-2">
              <p className="text-[12.5px] font-semibold">
                {t("functionInTeam")}
              </p>
              <div className="flex gap-2">
                {(["MEMBER", "LEAD"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => form.setValue("role", r)}
                    className={cn(
                      "rounded-full border px-[15px] py-[7px] text-[13px] font-medium transition-colors",
                      role === r
                        ? "border-primary bg-primary font-semibold text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {r === "LEAD" ? t("roleLead") : t("roleMember")}
                  </button>
                ))}
              </div>
            </div>
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
            disabled={form.formState.isSubmitting || options.length === 0}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            {t("addMemberToTeam")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
