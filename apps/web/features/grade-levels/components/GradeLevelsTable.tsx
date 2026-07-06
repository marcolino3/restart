"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
import {
  CornerDownRight,
  GripVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { ColorPickerFormField } from "@/components/form/form-fields/ColorPickerFormField";
import { InputFormField } from "@/components/form/form-fields/InputFormField";
import { NumberFormField } from "@/components/form/form-fields/NumberFormField";
import { SelectFormFieldWithoutTranslations } from "@/components/form/form-fields/SelectFormFieldWithoutTranslations";
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { PageHead } from "@/components/common/PageHead";
import { handleAction } from "@/lib/actions/handle-action";
import { cn } from "@/lib/utils";

import {
  GradeLevelFormSchema,
  type GradeLevelFormInput,
  type GradeLevelFormType,
} from "../schemas/grade-level-form.schema";
import type { GradeLevelItem } from "../actions/get-grade-levels.action";
import { createGradeLevelAction } from "../actions/create-grade-level.action";
import { updateGradeLevelAction } from "../actions/update-grade-level.action";
import { deleteGradeLevelAction } from "../actions/delete-grade-level.action";
import { reorderGradeLevelsAction } from "../actions/reorder-grade-levels.action";

interface Props {
  initialGradeLevels: GradeLevelItem[];
}

/** A top-level Stufe together with its (one-level-deep) subgroups. */
interface GradeLevelTreeNode extends GradeLevelItem {
  children: GradeLevelItem[];
}

type DialogState =
  | { mode: "create"; parentId: string | null }
  | { mode: "edit"; item: GradeLevelItem };

const bySortOrder = (a: GradeLevelItem, b: GradeLevelItem) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

function buildTree(items: GradeLevelItem[]): GradeLevelTreeNode[] {
  const roots = items.filter((i) => i.parentId == null).sort(bySortOrder);
  const childrenByParent = new Map<string, GradeLevelItem[]>();
  for (const item of items) {
    if (item.parentId != null) {
      const list = childrenByParent.get(item.parentId) ?? [];
      list.push(item);
      childrenByParent.set(item.parentId, list);
    }
  }
  return roots.map((root) => ({
    ...root,
    children: (childrenByParent.get(root.id) ?? []).sort(bySortOrder),
  }));
}

export function GradeLevelsTable({ initialGradeLevels }: Props) {
  const t = useTranslations("GradeLevels");
  const router = useRouter();

  const [items, setItems] =
    React.useState<GradeLevelItem[]>(initialGradeLevels);
  const [query, setQuery] = React.useState("");
  const [dialog, setDialog] = React.useState<DialogState | null>(null);

  React.useEffect(() => {
    setItems(initialGradeLevels);
  }, [initialGradeLevels]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const roots = React.useMemo(() => buildTree(items), [items]);

  const normalizedQuery = query.trim().toLowerCase();
  const matches = React.useCallback(
    (item: GradeLevelItem) =>
      item.name.toLowerCase().includes(normalizedQuery) ||
      (item.shortCode ?? "").toLowerCase().includes(normalizedQuery),
    [normalizedQuery],
  );

  // Keep a Stufe when it matches or any of its subgroups match; keep the
  // matching subgroups within it.
  const visibleRoots = React.useMemo(() => {
    if (!normalizedQuery) return roots;
    return roots
      .map((root) => {
        const matchingChildren = root.children.filter(matches);
        if (matches(root)) return root;
        if (matchingChildren.length > 0)
          return { ...root, children: matchingChildren };
        return null;
      })
      .filter((r): r is GradeLevelTreeNode => r !== null);
  }, [roots, normalizedQuery, matches]);

  // Reordering a filtered list is ambiguous — drag only on the full list.
  const dndDisabled = normalizedQuery.length > 0;

  const parentOptions = React.useMemo(
    () => roots.map((r) => ({ label: r.name, value: r.id })),
    [roots],
  );

  const rootIds = React.useMemo(() => roots.map((r) => r.id), [roots]);

  const reorderSiblings = (siblingIds: string[]) => {
    void handleAction({
      action: () => reorderGradeLevelsAction(siblingIds),
      successMessage: t("gradeLevelsReordered"),
      errorMessage: t("reorderError"),
      onSuccess: () => router.refresh(),
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    // Root-level drag: both ids are top-level Stufen.
    if (rootIds.includes(activeId) && rootIds.includes(overId)) {
      const oldIndex = rootIds.indexOf(activeId);
      const newIndex = rootIds.indexOf(overId);
      const nextIds = arrayMove(rootIds, oldIndex, newIndex);
      applyOrder(nextIds);
      reorderSiblings(nextIds);
      return;
    }

    // Subgroup drag: only within the same parent Stufe.
    const parent = roots.find((r) =>
      r.children.some((c) => c.id === activeId),
    );
    if (!parent) return;
    const childIds = parent.children.map((c) => c.id);
    if (!childIds.includes(overId)) return; // cross-parent drag → ignore
    const oldIndex = childIds.indexOf(activeId);
    const newIndex = childIds.indexOf(overId);
    const nextIds = arrayMove(childIds, oldIndex, newIndex);
    applyOrder(nextIds);
    reorderSiblings(nextIds);
  };

  const applyOrder = (orderedIds: string[]) => {
    const orderIndex = new Map(orderedIds.map((id, index) => [id, index]));
    setItems((prev) =>
      prev.map((it) =>
        orderIndex.has(it.id)
          ? { ...it, sortOrder: orderIndex.get(it.id)! }
          : it,
      ),
    );
  };

  const handleCreateSubmit = async (
    parentId: string | null,
    values: GradeLevelFormType,
  ) => {
    await handleAction({
      action: () =>
        createGradeLevelAction({
          name: values.name,
          parentId,
          color: values.color ?? null,
          shortCode: values.shortCode ?? null,
          ageMin: values.ageMin ?? null,
          ageMax: values.ageMax ?? null,
        }),
      successMessage: parentId
        ? t("subgroupCreated")
        : t("gradeLevelCreated"),
      errorMessage: parentId
        ? t("subgroupCreateError")
        : t("gradeLevelCreateError"),
      onSuccess: (data) => {
        if (data) {
          setItems((prev) => [
            ...prev,
            { ...data, classCount: 0, studentCount: 0 },
          ]);
        }
        setDialog(null);
        router.refresh();
      },
    });
  };

  const handleEditSubmit = async (
    item: GradeLevelItem,
    values: GradeLevelFormType,
  ) => {
    const isSubgroup = item.parentId != null;
    await handleAction({
      action: () =>
        updateGradeLevelAction({
          id: item.id,
          name: values.name,
          color: values.color ?? null,
          shortCode: values.shortCode ?? null,
          ageMin: values.ageMin ?? null,
          ageMax: values.ageMax ?? null,
          // Only subgroups expose the parent picker; roots keep their hierarchy.
          ...(isSubgroup ? { parentId: values.parentId ?? null } : {}),
        }),
      successMessage: isSubgroup
        ? t("subgroupUpdated")
        : t("gradeLevelUpdated"),
      errorMessage: isSubgroup
        ? t("subgroupUpdateError")
        : t("gradeLevelUpdateError"),
      onSuccess: (data) => {
        if (data) {
          setItems((prev) =>
            prev.map((it) => (it.id === data.id ? { ...it, ...data } : it)),
          );
        }
        setDialog(null);
        router.refresh();
      },
    });
  };

  const handleDelete = async (id: string) => {
    const result = await deleteGradeLevelAction(id);
    if (result.success) {
      setItems((prev) =>
        // Deleting a Stufe lifts its subgroups to top level (server-side); mirror
        // that optimistically so the UI stays consistent until the refresh.
        prev
          .filter((it) => it.id !== id)
          .map((it) => (it.parentId === id ? { ...it, parentId: null } : it)),
      );
      router.refresh();
    }
    return result;
  };

  const editingItem = dialog?.mode === "edit" ? dialog.item : null;
  const editingIsSubgroup = editingItem?.parentId != null;

  return (
    <div>
      <PageHead
        title={t("gradeLevels")}
        subtitle={t("countSubtitle", { count: roots.length })}
        action={
          <Button onClick={() => setDialog({ mode: "create", parentId: null })}>
            <Plus />
            {t("newGradeLevel")}
          </Button>
        }
      />

      <div className="relative mb-4 w-[280px]">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-9 rounded-full pl-9"
          aria-label={t("searchPlaceholder")}
        />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-hidden rounded-card border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-9" aria-label={t("drag")} />
                <TableHead>{t("gradeLevel")}</TableHead>
                <TableHead>{t("shortCode")}</TableHead>
                <TableHead>{t("ageRange")}</TableHead>
                <TableHead>{t("classes")}</TableHead>
                <TableHead>{t("students")}</TableHead>
                <TableHead className="w-32" aria-label={t("edit")} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleRoots.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {normalizedQuery
                      ? t("noSearchResults", { query: query.trim() })
                      : t("noGradeLevelsFound")}
                  </TableCell>
                </TableRow>
              ) : (
                <SortableContext
                  items={visibleRoots.map((r) => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {visibleRoots.map((root) => (
                    <React.Fragment key={root.id}>
                      <SortableRow
                        item={root}
                        dndDisabled={dndDisabled}
                        onEdit={() => setDialog({ mode: "edit", item: root })}
                        onDelete={() => handleDelete(root.id)}
                        onAddSubgroup={() =>
                          setDialog({ mode: "create", parentId: root.id })
                        }
                      />
                      <SortableContext
                        items={root.children.map((c) => c.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {root.children.map((child) => (
                          <SortableRow
                            key={child.id}
                            item={child}
                            isSubgroup
                            dndDisabled={dndDisabled}
                            onEdit={() =>
                              setDialog({ mode: "edit", item: child })
                            }
                            onDelete={() => handleDelete(child.id)}
                          />
                        ))}
                      </SortableContext>
                    </React.Fragment>
                  ))}
                </SortableContext>
              )}
            </TableBody>
          </Table>
        </div>
      </DndContext>

      <p className="mt-3 text-[12.5px] text-muted-foreground">
        {t("gradeLevelsHint")}
      </p>

      {dialog?.mode === "create" && (
        <GradeLevelDialog
          title={
            dialog.parentId ? t("createSubgroup") : t("createGradeLevel")
          }
          defaultValues={{
            name: "",
            shortCode: "",
            ageMin: null,
            ageMax: null,
            color: null,
            parentId: dialog.parentId,
          }}
          parentOptions={dialog.parentId ? parentOptions : undefined}
          onOpenChange={(open) => !open && setDialog(null)}
          onSubmit={(values) => handleCreateSubmit(dialog.parentId, values)}
        />
      )}
      {editingItem && (
        <GradeLevelDialog
          title={
            editingIsSubgroup ? t("editSubgroup") : t("editGradeLevel")
          }
          defaultValues={{
            name: editingItem.name,
            shortCode: editingItem.shortCode ?? "",
            ageMin: editingItem.ageMin ?? null,
            ageMax: editingItem.ageMax ?? null,
            color: editingItem.color ?? null,
            parentId: editingItem.parentId ?? null,
          }}
          parentOptions={
            editingIsSubgroup
              ? parentOptions.filter((o) => o.value !== editingItem.id)
              : undefined
          }
          onOpenChange={(open) => !open && setDialog(null)}
          onSubmit={(values) => handleEditSubmit(editingItem, values)}
        />
      )}
    </div>
  );
}

function AgeRange({ item }: { item: GradeLevelItem }) {
  const t = useTranslations("GradeLevels");
  if (item.ageMin != null && item.ageMax != null) {
    return <>{t("ageRangeYears", { from: item.ageMin, to: item.ageMax })}</>;
  }
  if (item.ageMin != null) {
    return <>{t("ageFromYears", { from: item.ageMin })}</>;
  }
  if (item.ageMax != null) {
    return <>{t("ageToYears", { to: item.ageMax })}</>;
  }
  return <span className="text-muted-foreground">—</span>;
}

interface SortableRowProps {
  item: GradeLevelItem;
  dndDisabled: boolean;
  isSubgroup?: boolean;
  onEdit: () => void;
  onDelete: () => Promise<{ success: boolean; error?: unknown }>;
  onAddSubgroup?: () => void;
}

function SortableRow({
  item,
  dndDisabled,
  isSubgroup = false,
  onEdit,
  onDelete,
  onAddSubgroup,
}: SortableRowProps) {
  const t = useTranslations("GradeLevels");
  const inUse = (item.classCount ?? 0) > 0;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: dndDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && "relative z-10 bg-row-hover opacity-80",
        isSubgroup && "bg-muted/30",
      )}
    >
      <TableCell className="w-9 pr-0">
        <span
          {...attributes}
          {...listeners}
          className={cn(
            "inline-flex cursor-grab p-1 text-muted-foreground active:cursor-grabbing",
            dndDisabled && "cursor-default opacity-30",
          )}
          aria-label={t("drag")}
        >
          <GripVertical className="size-4" />
        </span>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center gap-[9px]",
            isSubgroup && "pl-6",
          )}
        >
          {isSubgroup && (
            <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {item.color && (
            <i
              className="inline-block size-[9px] shrink-0 rounded-full"
              style={{ background: item.color }}
            />
          )}
          <span className={cn(isSubgroup ? "font-medium" : "font-semibold")}>
            {item.name}
          </span>
        </span>
      </TableCell>
      <TableCell className="font-mono text-[12.5px] tabular-nums">
        {item.shortCode ?? <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell>
        <AgeRange item={item} />
      </TableCell>
      <TableCell className="font-mono text-[12.5px] tabular-nums">
        {isSubgroup ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          (item.classCount ?? 0)
        )}
      </TableCell>
      <TableCell className="font-mono text-[12.5px] tabular-nums">
        {isSubgroup ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          (item.studentCount ?? 0)
        )}
      </TableCell>
      <TableCell className="w-32">
        <span className="flex items-center justify-end gap-1">
          {onAddSubgroup && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={onAddSubgroup}
                  aria-label={t("addSubgroup")}
                >
                  <Plus className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("addSubgroup")}</TooltipContent>
            </Tooltip>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onEdit}
            aria-label={t("edit")}
          >
            <Pencil className="size-3.5" />
          </Button>
          {inUse ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <DeleteConfirmationDialog
                    onConfirm={onDelete}
                    itemName={item.name}
                    disabled
                    trigger={<DeleteTriggerButton name={item.name} disabled />}
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent>{t("gradeLevelInUseTooltip")}</TooltipContent>
            </Tooltip>
          ) : (
            <DeleteConfirmationDialog
              onConfirm={onDelete}
              itemName={item.name}
              trigger={<DeleteTriggerButton name={item.name} />}
            />
          )}
        </span>
      </TableCell>
    </TableRow>
  );
}

function DeleteTriggerButton({
  name,
  disabled,
  ...props
}: { name: string; disabled?: boolean } & React.ComponentProps<"button">) {
  const tCommon = useTranslations("Common");
  return (
    <Button
      {...props}
      variant="ghost"
      size="icon"
      className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
      disabled={disabled}
      aria-label={`${tCommon("delete")} ${name}`}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}

interface GradeLevelDialogProps {
  title: string;
  defaultValues: GradeLevelFormInput;
  parentOptions?: { label: string; value: string }[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GradeLevelFormType) => Promise<void>;
}

function GradeLevelDialog({
  title,
  defaultValues,
  parentOptions,
  onOpenChange,
  onSubmit,
}: GradeLevelDialogProps) {
  const t = useTranslations("GradeLevels");
  const tCommon = useTranslations("Common");

  const form = useForm<GradeLevelFormInput, unknown, GradeLevelFormType>({
    resolver: zodResolver(GradeLevelFormSchema),
    defaultValues,
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            id="grade-level-form"
          >
            {parentOptions && (
              <SelectFormFieldWithoutTranslations
                name="parentId"
                label={t("parentLevel")}
                placeholder={t("parentLevel")}
                options={parentOptions}
              />
            )}
            <InputFormField name="name" label="name" namespace="GradeLevels" />
            <InputFormField
              name="shortCode"
              label="shortCode"
              namespace="GradeLevels"
              placeholder={t("shortCodePlaceholder")}
            />
            <div className="grid grid-cols-2 gap-3">
              <NumberFormField
                name="ageMin"
                label="ageMin"
                namespace="GradeLevels"
                min={0}
                max={30}
              />
              <NumberFormField
                name="ageMax"
                label="ageMax"
                namespace="GradeLevels"
                min={0}
                max={30}
              />
            </div>
            <ColorPickerFormField
              name="color"
              label="color"
              namespace="GradeLevels"
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
            form="grade-level-form"
            disabled={form.formState.isSubmitting}
          >
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
