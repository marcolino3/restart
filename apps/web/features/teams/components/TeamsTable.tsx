"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { handleAction } from "@/lib/actions/handle-action";
import { ROUTES } from "@/constants/routes";

import {
  TeamFormSchema,
  type TeamFormType,
} from "../schemas/team-form.schema";
import type { TeamItem } from "../actions/get-teams.action";
import { createTeamAction } from "../actions/create-team.action";
import { updateTeamAction } from "../actions/update-team.action";
import { deleteTeamAction } from "../actions/delete-team.action";
import { reorderTeamsAction } from "../actions/reorder-teams.action";

interface Props {
  initialTeams: TeamItem[];
}

export function TeamsTable({ initialTeams }: Props) {
  const t = useTranslations("Teams");
  const router = useRouter();
  const locale = useLocale();

  const [items, setItems] = React.useState<TeamItem[]>(initialTeams);
  const [newName, setNewName] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<TeamItem | null>(null);

  React.useEffect(() => {
    setItems(initialTeams);
  }, [initialTeams]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setIsCreating(true);
    await handleAction({
      action: () => createTeamAction(name),
      successMessage: t("teamCreated"),
      errorMessage: t("teamCreateError"),
      onSuccess: (data) => {
        if (data) setItems((prev) => [...prev, data]);
        setNewName("");
        router.refresh();
      },
    });
    setIsCreating(false);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const nextIds = arrayMove(ids, oldIndex, newIndex);
    setItems((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      return nextIds.map((id, index) => ({
        ...byId.get(id)!,
        sortOrder: index,
      }));
    });
    void handleAction({
      action: () => reorderTeamsAction(nextIds),
      successMessage: t("teamsReordered"),
      errorMessage: t("reorderError"),
      onSuccess: () => router.refresh(),
    });
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTeamAction(id);
    if (result.success) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      router.refresh();
    }
    return result;
  };

  const handleEditSubmit = async (values: TeamFormType) => {
    if (!editing) return;
    await handleAction({
      action: () => updateTeamAction({ id: editing.id, name: values.name }),
      successMessage: t("teamUpdated"),
      errorMessage: t("teamUpdateError"),
      onSuccess: (data) => {
        if (data) {
          setItems((prev) =>
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

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder={t("teamNamePlaceholder")}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleCreate();
            }
          }}
          aria-label={t("name")}
        />
        <Button
          onClick={() => void handleCreate()}
          disabled={isCreating || !newName.trim()}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("add")}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {t("noTeamsFound")}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-1">
              {items.map((item) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  detailHref={ROUTES.admin.teamsDetail(locale, item.id)}
                  onEdit={() => setEditing(item)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {editing && (
        <EditTeamDialog
          item={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}

interface SortableRowProps {
  item: TeamItem;
  detailHref: string;
  onEdit: () => void;
  onDelete: () => Promise<{ success: boolean; error?: unknown }>;
}

function SortableRow({ item, detailHref, onEdit, onDelete }: SortableRowProps) {
  const t = useTranslations("Teams");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-50" : ""}
    >
      <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 hover:bg-muted/40">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground"
          aria-label={t("drag")}
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <Link
          href={detailHref}
          className="flex-1 truncate text-sm font-medium hover:underline"
        >
          {item.name}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
          aria-label={t("edit")}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <DeleteConfirmationDialog
          onConfirm={onDelete}
          itemName={item.name}
        />
      </div>
    </li>
  );
}

interface EditDialogProps {
  item: TeamItem;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TeamFormType) => Promise<void>;
}

function EditTeamDialog({ item, onOpenChange, onSubmit }: EditDialogProps) {
  const t = useTranslations("Teams");
  const tCommon = useTranslations("Common");

  const form = useForm<TeamFormType>({
    resolver: zodResolver(TeamFormSchema),
    defaultValues: { name: item.name },
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editTeam")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            id="edit-team-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <InputFormField name="name" label="name" namespace="Teams" />
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
            form="edit-team-form"
            disabled={form.formState.isSubmitting}
          >
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
