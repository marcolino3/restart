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
import { GripVertical, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { DeleteConfirmationDialog } from "@/components/common/DeleteConfirmationDialog";
import { handleAction } from "@/lib/actions/handle-action";

import {
  GradeLevelFormSchema,
  type GradeLevelFormType,
} from "../schemas/grade-level-form.schema";
import type { GradeLevelItem } from "../actions/get-grade-levels.action";
import { createGradeLevelAction } from "../actions/create-grade-level.action";
import { updateGradeLevelAction } from "../actions/update-grade-level.action";
import { deleteGradeLevelAction } from "../actions/delete-grade-level.action";
import { reorderGradeLevelsAction } from "../actions/reorder-grade-levels.action";

interface Props {
  initialGradeLevels: GradeLevelItem[];
  usedGradeLevelIds: string[];
}

export function GradeLevelsTable({
  initialGradeLevels,
  usedGradeLevelIds,
}: Props) {
  const t = useTranslations("GradeLevels");
  const router = useRouter();

  const [items, setItems] = React.useState<GradeLevelItem[]>(initialGradeLevels);
  const [newName, setNewName] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<GradeLevelItem | null>(null);

  React.useEffect(() => {
    setItems(initialGradeLevels);
  }, [initialGradeLevels]);

  const usedIds = React.useMemo(
    () => new Set(usedGradeLevelIds),
    [usedGradeLevelIds],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const [newColor, setNewColor] = React.useState<string | null>(null);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setIsCreating(true);
    await handleAction({
      action: () => createGradeLevelAction(name, newColor ?? undefined),
      successMessage: t("gradeLevelCreated"),
      errorMessage: t("gradeLevelCreateError"),
      onSuccess: (data) => {
        if (data) {
          setItems((prev) => [
            ...prev,
            {
              id: data.id,
              name: data.name,
              color: data.color,
              sortOrder: data.sortOrder,
            },
          ]);
        }
        setNewName("");
        setNewColor(null);
        router.refresh();
      },
    });
    setIsCreating(false);
  };

  const handleColorChange = async (id: string, color: string | null) => {
    const original = items.find((i) => i.id === id);
    if (!original || original.color === color) return;
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, color } : it)),
    );
    const result = await handleAction({
      action: () => updateGradeLevelAction({ id, color }),
      successMessage: t("gradeLevelUpdated"),
      errorMessage: t("gradeLevelUpdateError"),
      onSuccess: () => router.refresh(),
    });
    if (!result.success) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, color: original.color } : it,
        ),
      );
    }
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleCreate();
    }
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
      return nextIds.map((id, index) => ({ ...byId.get(id)!, sortOrder: index }));
    });
    void handleAction({
      action: () => reorderGradeLevelsAction(nextIds),
      successMessage: t("gradeLevelsReordered"),
      errorMessage: t("reorderError"),
      onSuccess: () => router.refresh(),
    });
  };

  const handleEditSubmit = async (values: GradeLevelFormType) => {
    if (!editing) return;
    await handleAction({
      action: () =>
        updateGradeLevelAction({
          id: editing.id,
          name: values.name,
          color: values.color ?? null,
        }),
      successMessage: t("gradeLevelUpdated"),
      errorMessage: t("gradeLevelUpdateError"),
      onSuccess: (data) => {
        if (data) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === data.id
                ? { ...it, name: data.name, color: data.color }
                : it,
            ),
          );
        }
        setEditing(null);
        router.refresh();
      },
    });
  };

  const handleDelete = async (id: string) => {
    const result = await deleteGradeLevelAction(id);
    if (result.success) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      router.refresh();
    }
    return result;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder={t("gradeLevelNamePlaceholder")}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleCreateKeyDown}
          aria-label={t("name")}
        />
        <ColorPicker
          value={newColor}
          onChange={setNewColor}
          allowClear
          ariaLabel={t("color")}
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
          {t("noGradeLevelsFound")}
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
                  inUse={usedIds.has(item.id)}
                  onEdit={() => setEditing(item)}
                  onDelete={() => handleDelete(item.id)}
                  onColorChange={(c) => void handleColorChange(item.id, c)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {editing && (
        <EditGradeLevelDialog
          item={editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}

interface SortableRowProps {
  item: GradeLevelItem;
  inUse: boolean;
  onEdit: () => void;
  onDelete: () => Promise<{ success: boolean; error?: unknown }>;
  onColorChange: (color: string | null) => void;
}

function SortableRow({
  item,
  inUse,
  onEdit,
  onDelete,
  onColorChange,
}: SortableRowProps) {
  const t = useTranslations("GradeLevels");
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
        <ColorPicker
          size="sm"
          value={item.color}
          onChange={onColorChange}
          allowClear
          ariaLabel={t("color")}
        />
        <span className="flex-1 truncate text-sm font-medium">{item.name}</span>
        {inUse && (
          <Badge variant="secondary" className="text-xs">
            {t("inUse")}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onEdit}
          aria-label={t("edit")}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        {inUse ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <DeleteConfirmationDialog
                  onConfirm={onDelete}
                  itemName={item.name}
                  disabled
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>{t("gradeLevelInUseTooltip")}</TooltipContent>
          </Tooltip>
        ) : (
          <DeleteConfirmationDialog
            onConfirm={onDelete}
            itemName={item.name}
          />
        )}
      </div>
    </li>
  );
}

interface EditDialogProps {
  item: GradeLevelItem;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GradeLevelFormType) => Promise<void>;
}

function EditGradeLevelDialog({ item, onOpenChange, onSubmit }: EditDialogProps) {
  const t = useTranslations("GradeLevels");
  const tCommon = useTranslations("Common");

  const form = useForm<GradeLevelFormType>({
    resolver: zodResolver(GradeLevelFormSchema),
    defaultValues: { name: item.name, color: item.color ?? null },
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editGradeLevel")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            id="edit-grade-level-form"
          >
            <InputFormField name="name" label="name" namespace="GradeLevels" />
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
            form="edit-grade-level-form"
            disabled={form.formState.isSubmitting}
          >
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
