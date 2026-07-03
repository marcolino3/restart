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
import { GripVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";

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

export function GradeLevelsTable({ initialGradeLevels }: Props) {
  const t = useTranslations("GradeLevels");
  const router = useRouter();

  const [items, setItems] =
    React.useState<GradeLevelItem[]>(initialGradeLevels);
  const [query, setQuery] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<GradeLevelItem | null>(null);

  React.useEffect(() => {
    setItems(initialGradeLevels);
  }, [initialGradeLevels]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(normalizedQuery) ||
          (item.shortCode ?? "").toLowerCase().includes(normalizedQuery),
      )
    : items;
  // Reordering a filtered list is ambiguous — drag only on the full list.
  const dndDisabled = normalizedQuery.length > 0;

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
      action: () => reorderGradeLevelsAction(nextIds),
      successMessage: t("gradeLevelsReordered"),
      errorMessage: t("reorderError"),
      onSuccess: () => router.refresh(),
    });
  };

  const handleCreateSubmit = async (values: GradeLevelFormType) => {
    await handleAction({
      action: () =>
        createGradeLevelAction({
          name: values.name,
          color: values.color ?? null,
          shortCode: values.shortCode ?? null,
          ageMin: values.ageMin ?? null,
          ageMax: values.ageMax ?? null,
        }),
      successMessage: t("gradeLevelCreated"),
      errorMessage: t("gradeLevelCreateError"),
      onSuccess: (data) => {
        if (data) {
          setItems((prev) => [
            ...prev,
            { ...data, classCount: 0, studentCount: 0 },
          ]);
        }
        setCreating(false);
        router.refresh();
      },
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
          shortCode: values.shortCode ?? null,
          ageMin: values.ageMin ?? null,
          ageMax: values.ageMax ?? null,
        }),
      successMessage: t("gradeLevelUpdated"),
      errorMessage: t("gradeLevelUpdateError"),
      onSuccess: (data) => {
        if (data) {
          setItems((prev) =>
            prev.map((it) => (it.id === data.id ? { ...it, ...data } : it)),
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
    <div>
      <PageHead
        title={t("gradeLevels")}
        subtitle={t("countSubtitle", { count: items.length })}
        action={
          <Button onClick={() => setCreating(true)}>
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
        <SortableContext
          items={filtered.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
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
                  <TableHead className="w-24" aria-label={t("edit")} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
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
                  filtered.map((item) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      dndDisabled={dndDisabled}
                      onEdit={() => setEditing(item)}
                      onDelete={() => handleDelete(item.id)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </SortableContext>
      </DndContext>

      <p className="mt-3 text-[12.5px] text-muted-foreground">
        {t("gradeLevelsHint")}
      </p>

      {creating && (
        <GradeLevelDialog
          title={t("createGradeLevel")}
          defaultValues={{
            name: "",
            shortCode: "",
            ageMin: null,
            ageMax: null,
            color: null,
          }}
          onOpenChange={(open) => !open && setCreating(false)}
          onSubmit={handleCreateSubmit}
        />
      )}
      {editing && (
        <GradeLevelDialog
          title={t("editGradeLevel")}
          defaultValues={{
            name: editing.name,
            shortCode: editing.shortCode ?? "",
            ageMin: editing.ageMin ?? null,
            ageMax: editing.ageMax ?? null,
            color: editing.color ?? null,
          }}
          onOpenChange={(open) => !open && setEditing(null)}
          onSubmit={handleEditSubmit}
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
  onEdit: () => void;
  onDelete: () => Promise<{ success: boolean; error?: unknown }>;
}

function SortableRow({ item, dndDisabled, onEdit, onDelete }: SortableRowProps) {
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
      className={cn(isDragging && "relative z-10 bg-row-hover opacity-80")}
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
        <span className="inline-flex items-center gap-[9px]">
          {item.color && (
            <i
              className="inline-block size-[9px] shrink-0 rounded-full"
              style={{ background: item.color }}
            />
          )}
          <b className="font-semibold">{item.name}</b>
        </span>
      </TableCell>
      <TableCell className="font-mono text-[12.5px] tabular-nums">
        {item.shortCode ?? <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell>
        <AgeRange item={item} />
      </TableCell>
      <TableCell className="font-mono text-[12.5px] tabular-nums">
        {item.classCount ?? 0}
      </TableCell>
      <TableCell className="font-mono text-[12.5px] tabular-nums">
        {item.studentCount ?? 0}
      </TableCell>
      <TableCell className="w-24">
        <span className="flex items-center justify-end gap-1">
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
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GradeLevelFormType) => Promise<void>;
}

function GradeLevelDialog({
  title,
  defaultValues,
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
