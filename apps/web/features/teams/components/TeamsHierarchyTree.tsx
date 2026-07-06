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
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  GripVertical,
  Pencil,
  Plus,
} from "lucide-react";

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

type DropIntent = "before" | "after" | "inside";
type DropTarget = { overId: string; intent: DropIntent };

interface TeamTreeNode extends TeamItem {
  children: TeamTreeNode[];
}

/** Build the parent→children tree from the flat list, ordered by sortOrder. */
function buildTree(items: TeamItem[]): TeamTreeNode[] {
  const byParent = new Map<string | null, TeamItem[]>();
  for (const item of items) {
    const key = item.parentId ?? null;
    const bucket = byParent.get(key);
    if (bucket) bucket.push(item);
    else byParent.set(key, [item]);
  }
  for (const bucket of byParent.values()) {
    bucket.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }
  const build = (parentId: string | null): TeamTreeNode[] =>
    (byParent.get(parentId) ?? []).map((item) => ({
      ...item,
      children: build(item.id),
    }));
  return build(null);
}

/** Returns the id set of a team plus all of its descendants (drop-forbidden). */
function collectSubtree(items: TeamItem[], rootId: string): Set<string> {
  const childrenByParent = new Map<string | null, string[]>();
  for (const item of items) {
    const key = item.parentId ?? null;
    const bucket = childrenByParent.get(key);
    if (bucket) bucket.push(item.id);
    else childrenByParent.set(key, [item.id]);
  }
  const result = new Set<string>([rootId]);
  const stack = [rootId];
  while (stack.length) {
    const current = stack.pop()!;
    for (const child of childrenByParent.get(current) ?? []) {
      if (!result.has(child)) {
        result.add(child);
        stack.push(child);
      }
    }
  }
  return result;
}

interface Props {
  initialTeams: TeamItem[];
}

export function TeamsHierarchyTree({ initialTeams }: Props) {
  const t = useTranslations("Teams");
  const router = useRouter();
  const locale = useLocale();

  const [items, setItems] = React.useState<TeamItem[]>(initialTeams);
  const [newName, setNewName] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<TeamItem | null>(null);
  const [addingUnder, setAddingUnder] = React.useState<TeamItem | null>(null);
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [dropTarget, setDropTarget] = React.useState<DropTarget | null>(null);
  // Ids the active drag may not be dropped onto (itself + its descendants —
  // would create a cycle). Recomputed on drag start.
  const [forbidden, setForbidden] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    setItems(initialTeams);
  }, [initialTeams]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const tree = React.useMemo(() => buildTree(items), [items]);
  const byId = React.useMemo(
    () => new Map(items.map((i) => [i.id, i])),
    [items],
  );

  const childrenOf = React.useCallback(
    (parentId: string | null) =>
      items
        .filter((i) => (i.parentId ?? null) === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [items],
  );

  const isExpanded = (id: string) => !collapsed.has(id);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allCollapsed = items.length > 0 && items.every((i) => collapsed.has(i.id));
  const toggleAll = () =>
    setCollapsed(allCollapsed ? new Set() : new Set(items.map((i) => i.id)));

  const handleCreate = async (name: string, parentId?: string | null) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsCreating(true);
    await handleAction({
      action: () => createTeamAction(trimmed, parentId ?? null),
      successMessage: t("teamCreated"),
      errorMessage: t("teamCreateError"),
      onSuccess: (data) => {
        if (data) {
          setItems((prev) => [
            ...prev,
            {
              id: data.id,
              name: data.name,
              sortOrder: data.sortOrder,
              parentId: data.parentId,
            },
          ]);
        }
        setNewName("");
        if (parentId) setCollapsed((c) => {
          const next = new Set(c);
          next.delete(parentId);
          return next;
        });
        router.refresh();
      },
    });
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteTeamAction(id);
    if (result.success) {
      // Lift children up to the removed team's parent (mirrors the backend).
      const removed = byId.get(id);
      const liftTo = removed?.parentId ?? null;
      setItems((prev) =>
        prev
          .filter((it) => it.id !== id)
          .map((it) =>
            (it.parentId ?? null) === id ? { ...it, parentId: liftTo } : it,
          ),
      );
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

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    setActiveId(id);
    setForbidden(collectSubtree(items, id));
  };

  const onDragMove = (e: DragMoveEvent) => {
    const { active, over } = e;
    if (!over || over.id === active.id || forbidden.has(String(over.id))) {
      setDropTarget(null);
      return;
    }
    const overId = String(over.id);
    const activeRect = active.rect.current.translated;
    const overRect = over.rect;
    if (!activeRect) {
      setDropTarget({ overId, intent: "inside" });
      return;
    }
    const dragCenterY = activeRect.top + activeRect.height / 2;
    const ratio = (dragCenterY - overRect.top) / overRect.height;
    const intent: DropIntent =
      ratio < 0.25 ? "before" : ratio > 0.75 ? "after" : "inside";
    setDropTarget({ overId, intent });
  };

  const resetDnd = () => {
    setActiveId(null);
    setDropTarget(null);
    setForbidden(new Set());
  };

  const onDragEnd = (_e: DragEndEvent) => {
    const draggedId = activeId;
    const target = dropTarget;
    resetDnd();
    if (!draggedId || !target) return;
    void applyMove(draggedId, target);
  };

  const applyMove = async (draggedId: string, target: DropTarget) => {
    const dragged = byId.get(draggedId);
    const overTeam = byId.get(target.overId);
    if (!dragged || !overTeam) return;

    // Defense-in-depth: never move a team into its own subtree (cycle). The
    // drag indicator already blocks this, but a stale drag-move closure could
    // otherwise slip a forbidden drop through to the (rejecting) backend.
    const subtree = collectSubtree(items, draggedId);
    if (subtree.has(overTeam.id)) return;

    let newParentId: string | null;
    let orderedSiblingIds: string[];

    if (target.intent === "inside") {
      newParentId = overTeam.id;
      const siblings = childrenOf(newParentId)
        .filter((s) => s.id !== draggedId)
        .map((s) => s.id);
      orderedSiblingIds = [...siblings, draggedId];
    } else {
      newParentId = overTeam.parentId ?? null;
      const siblings = childrenOf(newParentId).filter((s) => s.id !== draggedId);
      const overIndex = siblings.findIndex((s) => s.id === overTeam.id);
      const insertAt =
        overIndex < 0
          ? siblings.length
          : target.intent === "before"
            ? overIndex
            : overIndex + 1;
      const ids = siblings.map((s) => s.id);
      ids.splice(insertAt, 0, draggedId);
      orderedSiblingIds = ids;
    }

    const parentChanged = newParentId !== (dragged.parentId ?? null);
    const orderUnchanged =
      !parentChanged &&
      childrenOf(newParentId)
        .map((s) => s.id)
        .join() === orderedSiblingIds.join();
    if (orderUnchanged) return;

    const previous = items;
    const orderIndex = new Map(orderedSiblingIds.map((id, i) => [id, i]));
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === draggedId) {
          return {
            ...it,
            parentId: newParentId,
            sortOrder: orderIndex.get(it.id) ?? it.sortOrder,
          };
        }
        if (orderIndex.has(it.id)) {
          return { ...it, sortOrder: orderIndex.get(it.id)! };
        }
        return it;
      }),
    );
    if (newParentId) {
      setCollapsed((c) => {
        const next = new Set(c);
        next.delete(newParentId);
        return next;
      });
    }

    const result = await handleAction({
      action: () =>
        reorderTeamsAction(
          orderedSiblingIds,
          parentChanged ? newParentId : undefined,
        ),
      successMessage: t(parentChanged ? "teamMoved" : "teamsReordered"),
      errorMessage: t(parentChanged ? "moveError" : "reorderError"),
      onSuccess: () => router.refresh(),
    });
    if (!result.success) setItems(previous);
  };

  const activeTeam = activeId ? byId.get(activeId) : null;

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
              void handleCreate(newName);
            }
          }}
          aria-label={t("name")}
        />
        <Button
          onClick={() => void handleCreate(newName)}
          disabled={isCreating || !newName.trim()}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("add")}
        </Button>
        {items.length > 0 && (
          <Button variant="outline" onClick={toggleAll} className="shrink-0">
            {allCollapsed ? (
              <>
                <ChevronsUpDown className="mr-2 h-4 w-4" />
                {t("expandAll")}
              </>
            ) : (
              <>
                <ChevronsDownUp className="mr-2 h-4 w-4" />
                {t("collapseAll")}
              </>
            )}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          {t("noTeamsFound")}
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{t("dropOnRowHint")}</p>
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onDragCancel={resetDnd}
          >
            <ul className="space-y-0.5">
              {tree.map((node) => (
                <TreeRow
                  key={node.id}
                  node={node}
                  depth={0}
                  locale={locale}
                  activeId={activeId}
                  dropTarget={dropTarget}
                  forbidden={forbidden}
                  isExpanded={isExpanded}
                  onToggle={toggle}
                  onEdit={setEditing}
                  onAddSub={setAddingUnder}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
            <DragOverlay>
              {activeTeam ? (
                <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 shadow-lg text-sm font-medium">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  {activeTeam.name}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      {editing && (
        <EditTeamDialog
          item={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSubmit={handleEditSubmit}
        />
      )}
      {addingUnder && (
        <AddSubteamDialog
          parent={addingUnder}
          isCreating={isCreating}
          onOpenChange={(open) => !open && setAddingUnder(null)}
          onSubmit={async (values) => {
            await handleCreate(values.name, addingUnder.id);
            setAddingUnder(null);
          }}
        />
      )}
    </div>
  );
}

interface TreeRowProps {
  node: TeamTreeNode;
  depth: number;
  locale: string;
  activeId: string | null;
  dropTarget: DropTarget | null;
  forbidden: Set<string>;
  isExpanded: (id: string) => boolean;
  onToggle: (id: string) => void;
  onEdit: (item: TeamItem) => void;
  onAddSub: (item: TeamItem) => void;
  onDelete: (id: string) => Promise<{ success: boolean; error?: unknown }>;
}

function TreeRow({
  node,
  depth,
  locale,
  activeId,
  dropTarget,
  forbidden,
  isExpanded,
  onToggle,
  onEdit,
  onAddSub,
  onDelete,
}: TreeRowProps) {
  const t = useTranslations("Teams");
  const tCommon = useTranslations("Common");

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
  } = useDraggable({ id: node.id });
  const { setNodeRef: setDropRef } = useDroppable({ id: node.id });

  const setRowRef = (el: HTMLElement | null) => {
    setDragRef(el);
    setDropRef(el);
  };

  const hasChildren = node.children.length > 0;
  const expanded = isExpanded(node.id);
  const isActive = activeId === node.id;
  const isForbidden = activeId != null && forbidden.has(node.id);

  const showInside =
    dropTarget?.overId === node.id && dropTarget.intent === "inside";
  const showBefore =
    dropTarget?.overId === node.id && dropTarget.intent === "before";
  const showAfter =
    dropTarget?.overId === node.id && dropTarget.intent === "after";

  return (
    <li>
      <div className="relative" style={{ paddingLeft: depth * 24 }}>
        {showBefore && (
          <span className="absolute left-0 right-0 -top-0.5 h-0.5 rounded bg-primary" />
        )}
        {showAfter && (
          <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded bg-primary" />
        )}
        <div
          ref={setRowRef}
          className={`flex items-center gap-1 rounded-md border px-2 py-2 transition-colors ${
            showInside
              ? "border-primary ring-2 ring-primary/40 bg-primary/5"
              : "bg-card hover:bg-muted/40"
          } ${isActive ? "opacity-40" : ""} ${
            isForbidden && !isActive ? "opacity-50" : ""
          }`}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => onToggle(node.id)}
              aria-label={expanded ? tCommon("collapse") : tCommon("expand")}
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </Button>
          ) : (
            <span className="inline-block h-6 w-6 shrink-0" />
          )}
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground shrink-0 touch-none"
            aria-label={t("drag")}
          >
            <GripVertical className="h-4 w-4" />
          </span>
          <Link
            href={ROUTES.admin.teamsDetail(locale, node.id)}
            className="flex-1 truncate text-sm font-medium hover:underline"
          >
            {node.name}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onAddSub(node)}
            aria-label={t("addSubteam")}
            title={t("addSubteam")}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(node)}
            aria-label={t("edit")}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <DeleteConfirmationDialog onConfirm={() => onDelete(node.id)} itemName={node.name} />
        </div>
      </div>
      {hasChildren && expanded && (
        <ul className="space-y-0.5 mt-0.5">
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              locale={locale}
              activeId={activeId}
              dropTarget={dropTarget}
              forbidden={forbidden}
              isExpanded={isExpanded}
              onToggle={onToggle}
              onEdit={onEdit}
              onAddSub={onAddSub}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
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
      <DialogContent>
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

interface AddSubteamDialogProps {
  parent: TeamItem;
  isCreating: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TeamFormType) => Promise<void>;
}

function AddSubteamDialog({
  parent,
  isCreating,
  onOpenChange,
  onSubmit,
}: AddSubteamDialogProps) {
  const t = useTranslations("Teams");
  const tCommon = useTranslations("Common");

  const form = useForm<TeamFormType>({
    resolver: zodResolver(TeamFormSchema),
    defaultValues: { name: "" },
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("addSubteam")} — {parent.name}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            id="add-subteam-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <InputFormField
              name="name"
              label="name"
              namespace="Teams"
              placeholder={t("subteamNamePlaceholder")}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating || form.formState.isSubmitting}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            form="add-subteam-form"
            disabled={isCreating || form.formState.isSubmitting}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
